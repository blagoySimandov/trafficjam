import { useState, useCallback, useEffect, useMemo } from 'react';

/**
 * Hook for handling node dragging on the map
 * Allows users to click and drag nodes to reposition them
 */
export function useNodeDrag({ network, mapRef, editorMode, onNetworkChange, snapNodeToNetwork }) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [currentDragPos, setCurrentDragPos] = useState(null);
  const [originalNodePos, setOriginalNodePos] = useState(null);
  const [dragThresholdMet, setDragThresholdMet] = useState(false);

  // Create temporary network with updated node position during drag (memoized for performance)
  const displayNetwork = useMemo(() => {
    if (!draggedNodeId || !network || !currentDragPos || !originalNodePos) return network;

    const updatedNodes = new Map(network.nodes);
    const node = updatedNodes.get(draggedNodeId);
    if (!node) return network;

    // Update dragged node position
    const updatedNode = { ...node, position: currentDragPos };
    updatedNodes.set(draggedNodeId, updatedNode);

    // Update connected link geometries
    const updatedLinks = new Map(network.links);
    for (const [linkId, link] of network.links.entries()) {
      let shouldUpdate = false;
      const geometry = [...link.geometry];

      // Update first point if this node is the start
      if (link.from === draggedNodeId) {
        geometry[0] = currentDragPos;
        shouldUpdate = true;
      }

      // Update last point if this node is the end
      if (link.to === draggedNodeId) {
        geometry[geometry.length - 1] = currentDragPos;
        shouldUpdate = true;
      }

      // Check all geometry points for matches with original node position
      // This handles cases where node appears in middle of link geometry
      if (!shouldUpdate && originalNodePos) {
        for (let i = 0; i < geometry.length; i++) {
          const [lat, lon] = geometry[i];
          const isOldNodePosition =
            Math.abs(lat - originalNodePos[0]) < 0.000001 &&
            Math.abs(lon - originalNodePos[1]) < 0.000001;

          if (isOldNodePosition) {
            geometry[i] = currentDragPos;
            shouldUpdate = true;
          }
        }
      }

      if (shouldUpdate) {
        updatedLinks.set(linkId, { ...link, geometry });
      }
    }

    return {
      nodes: updatedNodes,
      links: updatedLinks,
    };
  }, [draggedNodeId, network, currentDragPos, originalNodePos]);

  const handleMouseDown = useCallback((event) => {
    if (!editorMode || !mapRef.current || !network) return;

    const map = mapRef.current.getMap();
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['nodes-layer']
    });

    if (features.length > 0) {
      const nodeId = features[0].properties.id;
      const node = network.nodes.get(nodeId);
      if (!node) return;

      setDraggedNodeId(nodeId);
      setDragStartPos(event.point); // Store pixel coordinates for threshold check
      setOriginalNodePos(node.position); // Store original position for geometry updates
      setCurrentDragPos([event.lngLat.lat, event.lngLat.lng]);
      setIsDragging(true);
      setDragThresholdMet(false);

      // Disable map panning while dragging
      map.dragPan.disable();
      map.getCanvas().style.cursor = 'grabbing';
    }
  }, [editorMode, mapRef, network]);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging || !dragStartPos) return;

    // Check if drag threshold exceeded (5 pixels)
    const dx = event.point.x - dragStartPos.x;
    const dy = event.point.y - dragStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Update position if threshold is met OR just exceeded
    if (distance > 5 || dragThresholdMet) {
      if (!dragThresholdMet) {
        setDragThresholdMet(true);
      }
      setCurrentDragPos([event.lngLat.lat, event.lngLat.lng]);
    }
  }, [isDragging, dragStartPos, dragThresholdMet]);

  const handleMouseUp = useCallback((event) => {
    if (!isDragging || !draggedNodeId || !network || !mapRef.current) return;

    const map = mapRef.current.getMap();

    if (dragThresholdMet && currentDragPos && originalNodePos) {
      // First, try to snap to nearby node (within 3 meters)
      if (snapNodeToNetwork) {
        const didSnap = snapNodeToNetwork(draggedNodeId, currentDragPos);

        // If snapping succeeded, the network was already updated, so we're done
        if (didSnap) {
          // Reset state and return
          setIsDragging(false);
          setDraggedNodeId(null);
          setDragStartPos(null);
          setCurrentDragPos(null);
          setOriginalNodePos(null);
          setDragThresholdMet(false);
          map.dragPan.enable();
          map.getCanvas().style.cursor = editorMode ? 'crosshair' : '';
          return;
        }
      }

      // No snap occurred, do normal position update
      const updatedNodes = new Map(network.nodes);
      const node = updatedNodes.get(draggedNodeId);

      if (node) {
        // Update node position
        const updatedNode = { ...node, position: currentDragPos };
        updatedNodes.set(draggedNodeId, updatedNode);

        // Update connected link geometries
        const updatedLinks = new Map(network.links);
        for (const [linkId, link] of network.links.entries()) {
          let shouldUpdate = false;
          const geometry = [...link.geometry];

          // Update first point if this node is the start
          if (link.from === draggedNodeId) {
            geometry[0] = currentDragPos;
            shouldUpdate = true;
          }

          // Update last point if this node is the end
          if (link.to === draggedNodeId) {
            geometry[geometry.length - 1] = currentDragPos;
            shouldUpdate = true;
          }

          // Check all geometry points for matches with original node position
          if (!shouldUpdate && originalNodePos) {
            for (let i = 0; i < geometry.length; i++) {
              const [lat, lon] = geometry[i];
              const isOldNodePosition =
                Math.abs(lat - originalNodePos[0]) < 0.000001 &&
                Math.abs(lon - originalNodePos[1]) < 0.000001;

              if (isOldNodePosition) {
                geometry[i] = currentDragPos;
                shouldUpdate = true;
              }
            }
          }

          if (shouldUpdate) {
            updatedLinks.set(linkId, { ...link, geometry });
          }
        }

        onNetworkChange({
          nodes: updatedNodes,
          links: updatedLinks,
        });
      }
    }

    // Reset state
    setIsDragging(false);
    setDraggedNodeId(null);
    setDragStartPos(null);
    setCurrentDragPos(null);
    setOriginalNodePos(null);
    setDragThresholdMet(false);

    // Re-enable map panning
    map.dragPan.enable();
    map.getCanvas().style.cursor = editorMode ? 'crosshair' : '';
  }, [isDragging, draggedNodeId, dragThresholdMet, currentDragPos, originalNodePos, network, editorMode, onNetworkChange, snapNodeToNetwork, mapRef]);

  // Attach/detach event listeners
  useEffect(() => {
    if (!mapRef.current || !editorMode) return;

    const map = mapRef.current.getMap();

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
    };
  }, [editorMode, handleMouseDown, handleMouseMove, handleMouseUp, mapRef]);

  return {
    isDragging,
    draggedNodeId,
    displayNetwork,
  };
}
