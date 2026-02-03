import { useState, useRef, useEffect } from "react";
import type { MapRef, MapMouseEvent } from "react-map-gl";
import type { Network, TrafficNode, LngLatTuple } from "../../../types";
import { NODE_LAYER_ID } from "../../../constants";
import { useNodeSnap } from "./use-node-snap";

interface UseNodeDragParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  editorMode: boolean;
  onNetworkChange: (network: Network) => void;
}

const DRAG_THRESHOLD = 5;

export function useNodeDrag({
  network,
  mapRef,
  editorMode,
  onNetworkChange,
}: UseNodeDragParams) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const currentPosition = useRef<LngLatTuple | null>(null); //to track during drag

  const { snapNodeToNetwork } = useNodeSnap({
    network,
    onNetworkChange,
  });

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !editorMode) return;

    const mapCanvas = map.getMap();

    const handleMouseDown = (e: MapMouseEvent) => {
      if (!editorMode || !network) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [NODE_LAYER_ID],
      });

      if (!features || features.length === 0) return;

      const feature = features[0];
      if (!feature || !feature.properties) return;

      const nodeId = feature.properties.id;
      setDraggedNodeId(nodeId);
      isDraggingRef.current = true;

      dragStartPos.current = { x: e.point.x, y: e.point.y };
      hasMoved.current = false;
      currentPosition.current = null;

      if (map.dragPan) {
        mapCanvas.getCanvas().style.cursor = "grabbing";
        map.dragPan.disable();
      }

      e.preventDefault();
    };

    const handleMouseMove = (e: MapMouseEvent) => {
      if (!isDraggingRef.current || !draggedNodeId || !network) return;

      if (dragStartPos.current && !hasMoved.current) {
        const dx = e.point.x - dragStartPos.current.x;
        const dy = e.point.y - dragStartPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > DRAG_THRESHOLD) {
          hasMoved.current = true;
          setIsDragging(true);
        } else {
          return;
        }
      }

      const newPosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
      currentPosition.current = newPosition;

      // only snap if found a valid snap point

      const updatedNodes = new Map(network.nodes);
      const node = updatedNodes.get(draggedNodeId);
      if (!node) return;

      const updatedNode: TrafficNode = {
        ...node,
        position: newPosition,
      };
      updatedNodes.set(draggedNodeId, updatedNode);

      const updatedLinks = new Map(network.links);
      for (const [linkId, link] of network.links.entries()) {
        let shouldUpdate = false;
        const geometry = [...link.geometry];

        if (link.from === draggedNodeId) {
          geometry[0] = newPosition;
          shouldUpdate = true;
        }
        if (link.to === draggedNodeId) {
          geometry[geometry.length - 1] = newPosition;
          shouldUpdate = true;
        }

        if (!shouldUpdate) {
          const oldPosition = node.position;

          for (let i = 0; i < geometry.length; i++) {
            const [lat, lng] = geometry[i];
            const isOldNodePosition =
              Math.abs(lat - oldPosition[0]) < 0.000001 &&
              Math.abs(lng - oldPosition[1]) < 0.000001;

            if (isOldNodePosition) {
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
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;

      if (
        hasMoved.current &&
        currentPosition.current &&
        draggedNodeId &&
        network
      ) {
        snapNodeToNetwork(
          draggedNodeId,
          currentPosition.current
        );
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      setDraggedNodeId(null);
      dragStartPos.current = null;
      hasMoved.current = false;
      currentPosition.current = null;

      if (map.dragPan) {
        mapCanvas.getCanvas().style.cursor = "";
        map.dragPan.enable();
      }
    };

    mapCanvas.on("mousedown", handleMouseDown);
    mapCanvas.on("mousemove", handleMouseMove);
    mapCanvas.on("mouseup", handleMouseUp);

    return () => {
      mapCanvas.off("mousedown", handleMouseDown);
      mapCanvas.off("mousemove", handleMouseMove);
      mapCanvas.off("mouseup", handleMouseUp);
    };
  }, [network, mapRef, editorMode, onNetworkChange, draggedNodeId]);

  return {
    isDragging,
    draggedNodeId,
  };
}
