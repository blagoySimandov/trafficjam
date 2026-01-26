import { useState, useCallback, useRef } from "react";
import type { MapMouseEvent, MapRef } from "react-map-gl";
import type { Network, TrafficNode, LngLatTuple } from "../types";
import { NODE_LAYER_ID } from "../constants";

interface UseNodeDragParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  editorMode: boolean;
  onNetworkChange: (network: Network) => void;
}

export function useNodeDrag({
  network,
  mapRef,
  editorMode,
  onNetworkChange,
}: UseNodeDragParams) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const handleNodeMouseDown = useCallback(
    (event: MapMouseEvent) => {
      if (!editorMode || !network) return;

      const features = event.features;
      if (!features || features.length === 0) return;

      const feature = features.find((f) => f.layer?.id === NODE_LAYER_ID);
      if (!feature || !feature.properties) return;

      const nodeId = feature.properties.id;
      setDraggedNodeId(nodeId);
      isDraggingRef.current = true;
      setIsDragging(true);

      const map = mapRef.current;
      if (map) {
        map.getCanvas().style.cursor = "grabbing";
        map.dragPan.disable();
      }

      event.preventDefault();
    },
    [editorMode, network, mapRef]
  );

  const handleMouseMove = useCallback(
    (event: MapMouseEvent) => {
      if (!isDraggingRef.current || !draggedNodeId || !network) return;

      const newPosition: LngLatTuple = [event.lngLat.lat, event.lngLat.lng];
      
      // Create updated network with moved node
      const updatedNodes = new Map(network.nodes);
      const node = updatedNodes.get(draggedNodeId);
      if (!node) return;

      const updatedNode: TrafficNode = {
        ...node,
        position: newPosition,
      };
      updatedNodes.set(draggedNodeId, updatedNode);

      // Extract OSM ID from node ID (format: "node_12345")
      // const nodeOsmId = node.osmId;

      // Update all links that contain this node (at any position in geometry)
      const updatedLinks = new Map(network.links);
      for (const [linkId, link] of network.links.entries()) {
        // Get the way's node IDs by parsing the geometry
        // We need to check if this node is part of the link's geometry
        let shouldUpdate = false;
        const geometry = [...link.geometry];

        // Check if this is an endpoint
        if (link.from === draggedNodeId) {
          geometry[0] = newPosition;
          shouldUpdate = true;
        }
        if (link.to === draggedNodeId) {
          geometry[geometry.length - 1] = newPosition;
          shouldUpdate = true;
        }

        // For intermediate nodes, we need to check if the original position matches
        // and update it. We'll compare positions with a small tolerance.
        if (!shouldUpdate) {
          const oldPosition = node.position;
          for (let i = 0; i < geometry.length; i++) {
            const [lat, lng] = geometry[i];
            // Check if this geometry point matches the old node position
            if (
              Math.abs(lat - oldPosition[0]) < 0.000001 &&
              Math.abs(lng - oldPosition[1]) < 0.000001
            ) {
              geometry[i] = newPosition;
              shouldUpdate = true;
            }
          }
        }

        if (shouldUpdate) {
          updatedLinks.set(linkId, { ...link, geometry });
        }
      }

      onNetworkChange({
        ...network,
        nodes: updatedNodes,
        links: updatedLinks,
      });
    },
    [draggedNodeId, network, onNetworkChange]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);
    setDraggedNodeId(null);

    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = "";
      map.dragPan.enable();
    }
  }, [mapRef]);

  return {
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDragging,
    draggedNodeId,
  };
}