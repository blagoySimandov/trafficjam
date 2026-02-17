import { useState, useRef, useCallback, useMemo } from "react";
import type { MapRef, MapMouseEvent } from "react-map-gl";
import type { Network, TrafficNode, TrafficLink, LngLatTuple } from "../../../types";
import { NODE_LAYER_ID } from "../../../constants";
import { findSnapPoint } from "../../../utils/snap-to-network";

interface UseNodeAddParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  editorMode: boolean;
  minZoom: number;
  onNetworkChange: (network: Network) => void;
  onBeforeChange?: (network: Network) => void;
}

export function useNodeAdd({
  network,
  mapRef,
  editorMode,
  minZoom,
  onNetworkChange,
  onBeforeChange,
}: UseNodeAddParams) {
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [tempNodePosition, setTempNodePosition] = useState<LngLatTuple | null>(null);
  const [tempLinkEndPosition, setTempLinkEndPosition] = useState<LngLatTuple | null>(null);
  const tempNodeId = "temp-new-node";
  const isAddingRef = useRef(false);

  // Create a temporary network with the new node and connecting link
  const displayNetwork = useMemo(() => {
    return isAddingNode && tempNodePosition && network
      ? (() => {
          const updatedNodes = new Map(network.nodes);
          
          // Add temporary node
          const tempNode: TrafficNode = {
            id: tempNodeId,
            position: tempNodePosition,
            connectionCount: 0,
          };
          updatedNodes.set(tempNodeId, tempNode);

          const updatedLinks = new Map(network.links);
          
          // Add temporary link if dragging
          if (tempLinkEndPosition) {
            const tempLink: TrafficLink = {
              id: "temp-new-link",
              from: tempNodeId,
              to: "temp",
              geometry: [tempNodePosition, tempLinkEndPosition],
              tags: {
                highway: "unclassified",
              },
            };
            updatedLinks.set("temp-new-link", tempLink);
          }

          return {
            ...network,
            nodes: updatedNodes,
            links: updatedLinks,
          };
        })()
      : network;
  }, [isAddingNode, tempNodePosition, tempLinkEndPosition, network]);


  const handleMouseDown = useCallback((e: MapMouseEvent): boolean => {
    if (!editorMode || !network) return false;

    const map = mapRef.current;
    if (!map) return false;

    const zoom = map.getZoom();
    if (zoom < minZoom) return false;

    // Check if clicking on an existing node - if so, don't add a new one
    const features = map.queryRenderedFeatures(e.point, {
      layers: [NODE_LAYER_ID],
    });
    if (features && features.length > 0) return false;

    const newPosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
    setTempNodePosition(newPosition);
    setTempLinkEndPosition(newPosition);
    setIsAddingNode(true);
    isAddingRef.current = true;

    map.getMap().getCanvas().style.cursor = "crosshair";
    map.dragPan.disable();

    return true; // Event consumed
  }, [editorMode, network, mapRef, minZoom]);

  const handleMouseMove = useCallback(
    (e: MapMouseEvent): boolean => {
      if (!isAddingRef.current || !tempNodePosition) return false;

      const currentPosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
      setTempLinkEndPosition(currentPosition);
      
      return true; // Event consumed
    },
    [tempNodePosition],
  );
   
  const handleMouseUp = useCallback((e: MapMouseEvent): boolean => {
    if (!isAddingRef.current || !tempNodePosition || !network) return false;
    
    const map = mapRef.current;
    if (!map) return false;

      const releasePosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
      const snapResult = findSnapPoint(releasePosition, network, []);

      if (snapResult?.isNode && snapResult.nodeId) {
        if (onBeforeChange) {
          onBeforeChange(network);
        }
        const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newLinkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const newNode: TrafficNode = {
          id: newNodeId,
          position: tempNodePosition,
          connectionCount: 1,
        };

        const newLink: TrafficLink = {
          id: newLinkId,
          from: newNodeId,
          to: snapResult.nodeId,
          geometry: [tempNodePosition, snapResult.point],
          tags: {
            highway: "unclassified",
          },
        };
        
        const updatedNodes = new Map(network.nodes);
        updatedNodes.set(newNodeId, newNode);

        const targetNode = updatedNodes.get(snapResult.nodeId);
        if (targetNode) {
          updatedNodes.set(snapResult.nodeId, {
            ...targetNode,
            connectionCount: targetNode.connectionCount + 1,
          });
        }

        const updatedLinks = new Map(network.links);
        updatedLinks.set(newLinkId, newLink);

        onNetworkChange({
          ...network,
          nodes: updatedNodes,
          links: updatedLinks,
        });
      }
      
    isAddingRef.current = false;
    setIsAddingNode(false);
    setTempNodePosition(null);
    setTempLinkEndPosition(null);

    map.getMap().getCanvas().style.cursor = "";
    map.dragPan.enable();
    
    return true; // Event consumed
  }, [network, onBeforeChange, onNetworkChange, tempNodePosition, mapRef]);

  return {
    isAddingNode,
    displayNetwork,
    tempNodeId,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  };
}
