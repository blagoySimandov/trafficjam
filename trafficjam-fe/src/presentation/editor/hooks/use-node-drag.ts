import { useState, useRef, useEffect } from "react";
import type { MapRef, MapMouseEvent } from "react-map-gl";
import type { Network, TrafficNode, LngLatTuple } from "../../../types";
import { NODE_LAYER_ID } from "../../../constants";
import { useNodeSnap } from "./use-node-snap";
import { findSnapPoint } from "../../../utils/snap-to-network";

interface UseNodeDragParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  editorMode: boolean;
  onNetworkChange: (network: Network) => void;
  onBeforeChange?: (network: Network) => void;
}

const DRAG_THRESHOLD = 5;

export function useNodeDrag({
  network,
  mapRef,
  editorMode,
  onNetworkChange,
  onBeforeChange,
}: UseNodeDragParams) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tempDragPosition, setTempDragPosition] = useState<LngLatTuple | null>(null);
  const [originalNodePosition, setOriginalNodePosition] = useState<LngLatTuple | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  const { snapNodeToNetwork } = useNodeSnap({
    network,
    onNetworkChange,
    onBeforeChange,
  });

  // Create a temporary network with the dragged node at its temporary position
  const displayNetwork = 
    isDragging && draggedNodeId && tempDragPosition && network
      ? (() => {
          const updatedNodes = new Map(network.nodes);
          const node = updatedNodes.get(draggedNodeId);
          if (!node) return network;

          const updatedNode: TrafficNode = {
            ...node,
            position: tempDragPosition,
          };
          updatedNodes.set(draggedNodeId, updatedNode);

          const updatedLinks = new Map(network.links);
          for (const [linkId, link] of network.links.entries()) {
            let shouldUpdate = false;
            const geometry = [...link.geometry];

            if (link.from === draggedNodeId) {
              geometry[0] = tempDragPosition;
              shouldUpdate = true;
            }
            if (link.to === draggedNodeId) {
              geometry[geometry.length - 1] = tempDragPosition;
              shouldUpdate = true;
            }

            if (!shouldUpdate && originalNodePosition) {
              const oldPosition = originalNodePosition;

              for (let i = 0; i < geometry.length; i++) {
                const [lat, lng] = geometry[i];
                const isOldNodePosition =
                  Math.abs(lat - oldPosition[0]) < 0.000001 &&
                  Math.abs(lng - oldPosition[1]) < 0.000001;

                if (isOldNodePosition) {
                  geometry[i] = tempDragPosition;
                  shouldUpdate = true;
                }
              }
            }

            if (shouldUpdate) {
              updatedLinks.set(linkId, { ...link, geometry });
            }
          }

          return {
            ...network,
            nodes: updatedNodes,
            links: updatedLinks,
          };
        })()
      : network;

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
      const node = network.nodes.get(nodeId);
      if (!node) return;

      setDraggedNodeId(nodeId);
      isDraggingRef.current = true;
      setOriginalNodePosition(node.position);

      dragStartPos.current = { x: e.point.x, y: e.point.y };
      hasMoved.current = false;
      setTempDragPosition(null);

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
      setTempDragPosition(newPosition);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;

      if (
        hasMoved.current &&
        tempDragPosition &&
        draggedNodeId &&
        network
      ) {
        // First, try to snap to see if we're merging with another node
        const node = network.nodes.get(draggedNodeId);
        if (!node) return;

        // Filter out the dragged node from snap candidates
        const filteredNetwork: Network = {
          ...network,
          nodes: new Map(
            [...network.nodes.entries()].filter(([id]) => id !== draggedNodeId)
          ),
        };
        
        const snapResult = findSnapPoint(tempDragPosition, filteredNetwork, []);
        
        if (snapResult?.isNode && snapResult.nodeId) {
          // Merging with another node - use snapNodeToNetwork
          snapNodeToNetwork(draggedNodeId, tempDragPosition);
        } else {

          // Save current state for undo (before mutating)
          if (onBeforeChange) {
            onBeforeChange(network);
          }
          const updatedNodes = new Map(network.nodes);
          const updatedNode: TrafficNode = {
            ...node,
            position: tempDragPosition,
          };
          updatedNodes.set(draggedNodeId, updatedNode);

          const updatedLinks = new Map(network.links);
          for (const [linkId, link] of network.links.entries()) {
            let shouldUpdate = false;
            const geometry = [...link.geometry];

            if (link.from === draggedNodeId) {
              geometry[0] = tempDragPosition;
              shouldUpdate = true;
            }
            if (link.to === draggedNodeId) {
              geometry[geometry.length - 1] = tempDragPosition;
              shouldUpdate = true;
            }

            if (!shouldUpdate && originalNodePosition) {
              const oldPosition = originalNodePosition;

              for (let i = 0; i < geometry.length; i++) {
                const [lat, lng] = geometry[i];
                const isOldNodePosition =
                  Math.abs(lat - oldPosition[0]) < 0.000001 &&
                  Math.abs(lng - oldPosition[1]) < 0.000001;

                if (isOldNodePosition) {
                  geometry[i] = tempDragPosition;
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
        }
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      setDraggedNodeId(null);
      setTempDragPosition(null);
      dragStartPos.current = null;
      hasMoved.current = false;
      setOriginalNodePosition(null);

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
  }, [network, mapRef, editorMode, onNetworkChange, draggedNodeId, tempDragPosition, originalNodePosition, snapNodeToNetwork]);

  return {
    isDragging,
    draggedNodeId,
    displayNetwork,
  };
}