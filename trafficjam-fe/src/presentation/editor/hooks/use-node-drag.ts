import { useState, useRef, useCallback } from "react";
import type { MapRef, MapMouseEvent } from "react-map-gl";
import type { Network, TrafficNode, TrafficLink, LngLatTuple } from "../../../types";
import { NODE_LAYER_ID } from "../../../constants";
import { useNodeSnap } from "./use-node-snap";
import { findSnapPoint } from "../../../utils/snap-to-network";
import { safeQueryRenderedFeatures } from "../../../utils/feature-detection";

interface UseNodeDragParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  editorMode: boolean;
  onNetworkChange: (network: Network) => void;
  onBeforeChange?: (network: Network) => void;
}

const DRAG_THRESHOLD = 5;

function updateNodeAndLinks(
  network: Network,
  nodeId: string,
  newPosition: LngLatTuple,
  oldPosition?: LngLatTuple
): { updatedNodes: Map<string, TrafficNode>; updatedLinks: Map<string, TrafficLink> } {
  const updatedNodes = new Map(network.nodes);
  const node = updatedNodes.get(nodeId);
  if (!node) {
    return { updatedNodes: network.nodes, updatedLinks: network.links };
  }

  const updatedNode: TrafficNode = {
    ...node,
    position: newPosition,
  };
  updatedNodes.set(nodeId, updatedNode);

  const updatedLinks = new Map(network.links);
  for (const [linkId, link] of network.links.entries()) {
    let shouldUpdate = false;
    const geometry = [...link.geometry];

    if (link.from === nodeId) {
      geometry[0] = newPosition;
      shouldUpdate = true;
    }
    if (link.to === nodeId) {
      geometry[geometry.length - 1] = newPosition;
      shouldUpdate = true;
    }

    if (!shouldUpdate && oldPosition) {
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

  return { updatedNodes, updatedLinks };
}

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
          const { updatedNodes, updatedLinks } = updateNodeAndLinks(
            network,
            draggedNodeId,
            tempDragPosition,
            originalNodePosition || undefined
          );

          return {
            ...network,
            nodes: updatedNodes,
            links: updatedLinks,
          };
        })()
      : network;

  const handleMouseDown = useCallback((e: MapMouseEvent): boolean => {
    if (!editorMode || !network) return false;

    const map = mapRef.current;
    if (!map) return false;

    const features = safeQueryRenderedFeatures(map, e.point, [NODE_LAYER_ID]);

    if (!features || features.length === 0) return false;

    const feature = features[0];
    if (!feature || !feature.properties) return false;

    const nodeId = feature.properties.id;
    const node = network.nodes.get(nodeId);
    if (!node) return false;

    setDraggedNodeId(nodeId);
    isDraggingRef.current = true;
    setOriginalNodePosition(node.position);

    dragStartPos.current = { x: e.point.x, y: e.point.y };
    hasMoved.current = false;
    setTempDragPosition(null);

    if (map.dragPan) {
      map.getMap().getCanvas().style.cursor = "grabbing";
      map.dragPan.disable();
    }

    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();

    return true;
  }, [editorMode, network, mapRef]);

  const handleMouseMove = useCallback((e: MapMouseEvent): boolean => {
    if (!isDraggingRef.current || !draggedNodeId || !network) return false;

    if (dragStartPos.current && !hasMoved.current) {
      const dx = e.point.x - dragStartPos.current.x;
      const dy = e.point.y - dragStartPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > DRAG_THRESHOLD) {
        hasMoved.current = true;
        setIsDragging(true);
      } else {
        return true;
      }
    }

    const newPosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
    setTempDragPosition(newPosition);
    return true;
  }, [draggedNodeId, network]);

  const handleMouseUp = useCallback((): boolean => {
    if (!isDraggingRef.current) return false;

    const map = mapRef.current;

    if (
      hasMoved.current &&
      tempDragPosition &&
      draggedNodeId &&
      network
    ) {
      const node = network.nodes.get(draggedNodeId);
      if (!node) return false;

      const filteredNetwork: Network = {
        ...network,
        nodes: new Map(
          [...network.nodes.entries()].filter(([id]) => id !== draggedNodeId)
        ),
      };
      
      const snapResult = findSnapPoint(tempDragPosition, filteredNetwork, []);
      
      if (snapResult?.isNode && snapResult.nodeId) {
        snapNodeToNetwork(draggedNodeId, tempDragPosition);
      } else {
        if (onBeforeChange) {
          onBeforeChange(network);
        }
        const { updatedNodes, updatedLinks } = updateNodeAndLinks(
          network,
          draggedNodeId,
          tempDragPosition,
          originalNodePosition || undefined
        );

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

    if (map && map.dragPan) {
      map.getMap().getCanvas().style.cursor = "";
      map.dragPan.enable();
    }

    return true;
  }, [network, mapRef, onNetworkChange, onBeforeChange, draggedNodeId, tempDragPosition, originalNodePosition, snapNodeToNetwork]);

  return {
    isDragging,
    draggedNodeId,
    displayNetwork,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  };
}