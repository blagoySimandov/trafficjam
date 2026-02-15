import { useState, useRef, useEffect, useCallback} from "react";
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
  const [tempNodeId] = useState<string>("temp-new-node");
  const isAddingRef = useRef(false);

  // Create a temporary network with the new node and connecting link
  const displayNetwork = 
    isAddingNode && tempNodePosition && network
      ? (() => {
          const updatedNodes = new Map(network.nodes);
          
          // Add temporary node
          const tempNode: TrafficNode = {
            id: tempNodeId,
            osmId: -1,
            position: tempNodePosition,
            connectionCount: 0,
          };
          updatedNodes.set(tempNodeId, tempNode);

          const updatedLinks = new Map(network.links);
          
          // Add temporary link if dragging
          if (tempLinkEndPosition) {
            const tempLink: TrafficLink = {
              id: "temp-new-link",
              osmId: -1,
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

  const handleMouseDown = useCallback((e: MapMouseEvent) => {
    if (!editorMode || !network) return;

    const map = mapRef.current;
    if (!map || !editorMode) return;

    const zoom = map.getZoom();
    if (zoom < minZoom) return;

     // Check if clicking on an existing node - if so, don't add a new one
      const features = map.queryRenderedFeatures(e.point, {
        layers: [NODE_LAYER_ID],
      });
      if (features && features.length > 0) return;

    const newPosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
    setTempNodePosition(newPosition);
    setTempLinkEndPosition(newPosition);
    setIsAddingNode(true);
    isAddingRef.current = true;

    map.getMap().getCanvas().style.cursor = "crosshair";
    map.dragPan.disable();

    e.preventDefault();
  }, [editorMode, network, mapRef, minZoom]);

  const handleMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (!isAddingRef.current || !tempNodePosition) return;

      const currentPosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
      setTempLinkEndPosition(currentPosition);
    },
    [tempNodePosition],
  );
   
  const handleMouseUp = useCallback((e: MapMouseEvent) => {
    if (!isAddingRef.current || !tempNodePosition || !network) return;
    
    const map = mapRef.current;
    if (!map) return;

      const releasePosition: LngLatTuple = [e.lngLat.lat, e.lngLat.lng];
      const snapResult = findSnapPoint(releasePosition, network, []);

      if (snapResult?.isNode && snapResult.nodeId) {
        if (onBeforeChange) {
          onBeforeChange(network);
        }
        const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newLinkId = `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newNode: TrafficNode = {
          id: newNodeId,
          osmId: -1,
          position: tempNodePosition,
          connectionCount: 1,
        };

        const newLink: TrafficLink = {
          id: newLinkId,
          osmId: -1,
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
  }, [network, onBeforeChange, onNetworkChange, tempNodePosition, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !editorMode) return;
    
    const mapCanvas = map.getMap();

    

    mapCanvas.on("mousedown", handleMouseDown);
    mapCanvas.on("mousemove", handleMouseMove);
    mapCanvas.on("mouseup", handleMouseUp);

    return () => {
      mapCanvas.off("mousedown", handleMouseDown);
      mapCanvas.off("mousemove", handleMouseMove);
      mapCanvas.off("mouseup", handleMouseUp);
    };
  }, [mapRef, editorMode, handleMouseDown, handleMouseUp, handleMouseMove]);

  return {
    isAddingNode,
    displayNetwork,
    tempNodeId,
  };
}
