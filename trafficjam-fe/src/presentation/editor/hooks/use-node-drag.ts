import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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

interface ConnectedLinkInfo {
  linkId: string;
  indicesToUpdate: number[];
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

  const isDraggingRef = useRef(false);
  const draggedNodeIdRef = useRef<string | null>(null);
  const tempDragPositionRef = useRef<LngLatTuple | null>(null);
  const connectedLinksRef = useRef<ConnectedLinkInfo[]>([]);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const rAFRef = useRef<number | null>(null);

  const { snapNodeToNetwork } = useNodeSnap({ network, onNetworkChange, onBeforeChange });

  useEffect(() => {
    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, []);

  const hiddenIds = useMemo(() => {
    if (!isDragging || !draggedNodeId) return [];
    return [draggedNodeId, ...connectedLinksRef.current.map(l => l.linkId)];
  }, [isDragging, draggedNodeId]);

  const draftNetwork = useMemo(() => {
    if (!isDragging || !draggedNodeId || !tempDragPosition || !network) return null;

    const nodes = new Map<string, TrafficNode>();
    const draggedNode = network.nodes.get(draggedNodeId);
    if (draggedNode) {
      nodes.set(draggedNodeId, { ...draggedNode, position: tempDragPosition });
    }

    const links = new Map<string, TrafficLink>();
    for (const { linkId, indicesToUpdate } of connectedLinksRef.current) {
      const link = network.links.get(linkId);
      if (link) {
        const geometry = [...link.geometry];
        for (const idx of indicesToUpdate) {
          geometry[idx] = tempDragPosition;
        }
        links.set(linkId, { ...link, geometry });
      }
    }

    return { ...network, nodes, links } as Network;
  }, [isDragging, draggedNodeId, tempDragPosition, network]);

  const handleMouseDown = useCallback(
    (e: MapMouseEvent): boolean => {
      if (!editorMode || !network || !mapRef.current) return false;
      const map = mapRef.current;
      const features = safeQueryRenderedFeatures(map, e.point, [NODE_LAYER_ID, `static-${NODE_LAYER_ID}`, `draft-${NODE_LAYER_ID}`]);
      if (!features?.length) return false;

      const feature = features[0];
      const nodeId = feature.properties?.id || feature.id;
      if (!nodeId) return false;

      const node = network.nodes.get(nodeId.toString());
      if (!node) return false;

      const connectedLinks: ConnectedLinkInfo[] = [];
      for (const [linkId, link] of network.links.entries()) {
        const indices: number[] = [];
        if (link.from === nodeId) indices.push(0);
        if (link.to === nodeId) indices.push(link.geometry.length - 1);

        for (let i = 0; i < link.geometry.length; i++) {
          if (indices.includes(i)) continue;
          const [lat, lng] = link.geometry[i];
          if (
            Math.abs(lat - node.position[0]) < 0.000001 &&
            Math.abs(lng - node.position[1]) < 0.000001
          ) {
            indices.push(i);
          }
        }
        if (indices.length > 0) {
          connectedLinks.push({ linkId, indicesToUpdate: indices });
        }
      }

      connectedLinksRef.current = connectedLinks;
      draggedNodeIdRef.current = nodeId.toString();
      isDraggingRef.current = true;
      dragStartPos.current = { x: e.point.x, y: e.point.y };
      hasMoved.current = false;
      tempDragPositionRef.current = null;

      setDraggedNodeId(nodeId.toString());
      setTempDragPosition(null);

      if (map.dragPan) {
        map.getMap().getCanvas().style.cursor = "grabbing";
        map.dragPan.disable();
      }
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      return true;
    },
    [editorMode, network, mapRef]
  );

  const handleMouseMove = useCallback(
    (e: MapMouseEvent): boolean => {
      if (!isDraggingRef.current || !draggedNodeIdRef.current || !network) return false;

      if (dragStartPos.current && !hasMoved.current) {
        const dx = e.point.x - dragStartPos.current.x;
        const dy = e.point.y - dragStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          hasMoved.current = true;
          setIsDragging(true);
        } else {
          return true;
        }
      }

      const newPosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
      tempDragPositionRef.current = newPosition;

      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      rAFRef.current = requestAnimationFrame(() => setTempDragPosition(newPosition));
      return true;
    },
    [network]
  );

  const handleMouseUp = useCallback((): boolean => {
    if (!isDraggingRef.current) return false;
    const map = mapRef.current;

    if (hasMoved.current && tempDragPositionRef.current && draggedNodeIdRef.current && network) {
      const nodeId = draggedNodeIdRef.current;
      const finalPos = tempDragPositionRef.current;

      const filteredNetwork = {
        ...network,
        nodes: new Map([...network.nodes.entries()].filter(([id]) => id !== nodeId)),
      };

      const snapResult = findSnapPoint(finalPos, filteredNetwork, []);
      if (snapResult?.isNode && snapResult.nodeId) {
        snapNodeToNetwork(nodeId, finalPos);
      } else {
        if (onBeforeChange) onBeforeChange(network);

        const updatedNodes = new Map(network.nodes);
        const nodeToUpdate = updatedNodes.get(nodeId);
        if (nodeToUpdate) {
          updatedNodes.set(nodeId, { ...nodeToUpdate, position: finalPos });
        }

        const updatedLinks = new Map(network.links);
        for (const { linkId, indicesToUpdate } of connectedLinksRef.current) {
          const link = updatedLinks.get(linkId);
          if (link) {
            const geometry = [...link.geometry];
            for (const idx of indicesToUpdate) {
              geometry[idx] = finalPos;
            }
            updatedLinks.set(linkId, { ...link, geometry });
          }
        }
        onNetworkChange({ ...network, nodes: updatedNodes, links: updatedLinks });
      }
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    setDraggedNodeId(null);
    setTempDragPosition(null);
    draggedNodeIdRef.current = null;
    tempDragPositionRef.current = null;
    connectedLinksRef.current = [];
    dragStartPos.current = null;
    hasMoved.current = false;

    if (map && map.dragPan) {
      map.getMap().getCanvas().style.cursor = "";
      map.dragPan.enable();
    }
    return true;
  }, [network, mapRef, onNetworkChange, onBeforeChange, snapNodeToNetwork]);

  return {
    isDragging,
    draggedNodeId,
    staticNetwork: network,
    draftNetwork,
    hiddenIds,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  };
}
