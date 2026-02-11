import { useCallback, useEffect } from 'react';

/**
 * Hook for creating nodes by clicking on links
 * Splits the clicked link into two new links
 */
export function useNodeCreate({ network, mapRef, editorMode, onNetworkChange }) {

  const handleMapClick = useCallback((event) => {
    if (!editorMode || !mapRef.current || !network) return;

    const map = mapRef.current.getMap();

    // Don't create nodes if we clicked on an existing node (let drag handle it)
    const nodeFeatures = map.queryRenderedFeatures(event.point, {
      layers: ['nodes-layer']
    });

    if (nodeFeatures.length > 0) return;

    // Check if we clicked on a link
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['links-layer']
    });

    if (features.length === 0) return;

    // Get the clicked link
    const linkId = features[0].properties.id;
    const link = network.links.get(linkId);
    if (!link) return;

    // Get click position
    const clickPos = [event.lngLat.lat, event.lngLat.lng];

    // Create new node ID
    const newNodeId = `node_created_${Date.now()}`;

    // Create new node
    const newNode = {
      id: newNodeId,
      position: clickPos,
      tags: {},
      connectionCount: 2, // Will connect to 2 links
    };

    // Create updated network
    const updatedNodes = new Map(network.nodes);
    updatedNodes.set(newNodeId, newNode);

    const updatedLinks = new Map(network.links);

    // Remove old link
    updatedLinks.delete(linkId);

    // Find the closest point on the link geometry to split at
    let splitIndex = 0;
    let minDist = Infinity;

    for (let i = 0; i < link.geometry.length - 1; i++) {
      const segStart = link.geometry[i];
      const segEnd = link.geometry[i + 1];

      // Simple distance check (could use point-to-segment distance)
      const midLat = (segStart[0] + segEnd[0]) / 2;
      const midLon = (segStart[1] + segEnd[1]) / 2;
      const dist = Math.abs(clickPos[0] - midLat) + Math.abs(clickPos[1] - midLon);

      if (dist < minDist) {
        minDist = dist;
        splitIndex = i;
      }
    }

    // Create first half of split link (from -> new node)
    const link1Geometry = [
      ...link.geometry.slice(0, splitIndex + 1),
      clickPos
    ];

    const link1 = {
      ...link,
      id: `${linkId}_1`,
      to: newNodeId,
      geometry: link1Geometry,
    };

    // Create second half of split link (new node -> to)
    const link2Geometry = [
      clickPos,
      ...link.geometry.slice(splitIndex + 1)
    ];

    const link2 = {
      ...link,
      id: `${linkId}_2`,
      from: newNodeId,
      geometry: link2Geometry,
    };

    updatedLinks.set(link1.id, link1);
    updatedLinks.set(link2.id, link2);

    // Update connection counts for existing nodes
    const fromNode = updatedNodes.get(link.from);
    const toNode = updatedNodes.get(link.to);

    if (fromNode) {
      // Connection count stays the same (still has same number of connections)
      updatedNodes.set(link.from, { ...fromNode });
    }

    if (toNode) {
      // Connection count stays the same
      updatedNodes.set(link.to, { ...toNode });
    }

    console.log(`Created node ${newNodeId} on link ${linkId}`);

    onNetworkChange({
      nodes: updatedNodes,
      links: updatedLinks,
    });
  }, [network, mapRef, editorMode, onNetworkChange]);

  // Attach event listener
  useEffect(() => {
    if (!mapRef.current || !editorMode) return;

    const map = mapRef.current.getMap();
    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [editorMode, handleMapClick, mapRef]);

  return {};
}
