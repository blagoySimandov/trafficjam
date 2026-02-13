import { useState, useCallback } from "react";
import type { MapMouseEvent, MapRef } from "react-map-gl";
import type { Network, TrafficLink, CombinedHoverInfo } from "../types";
import { detectFeaturesAtPoint } from "../utils/feature-detection";
import { NETWORK_LAYER_ID, NODE_LAYER_ID } from "../constants";

interface UseMapInteractionsParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  onLinkClick?: (link: TrafficLink, coords?: { lng: number; lat: number }) => void;
  editorMode?: boolean;
}

const MIN_NODE_ZOOM = 16;

export function useMapInteractions({
  network,
  mapRef,
  onLinkClick,
  editorMode,
}: UseMapInteractionsParams) { 
  const [hoverInfo, setHoverInfo] = useState<CombinedHoverInfo | null>(null);

  const findNearbyLink = useCallback(
    (event: MapMouseEvent) => {
      if (!network) return undefined;
      const map = mapRef.current;
      if (!map) return undefined;
      if (map.getZoom() < MIN_NODE_ZOOM) return undefined;

      const { x, y } = event.point;
      const bbox: [[number, number], [number, number]] = [
        [x - 6, y - 6],
        [x + 6, y + 6],
      ];

      const features = map.queryRenderedFeatures(bbox, {
        layers: [NETWORK_LAYER_ID],
      });

      for (const feature of features) {
        const id = feature.properties?.id;
        if (typeof id === "string") {
          const link = network.links.get(id);
          if (link) return link;
        }
      }

      return undefined;
    },
    [mapRef, network]
  );

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      if (!network) return;
      const map = mapRef.current;
      const canEditAtZoom = !!(editorMode && map && map.getZoom() >= MIN_NODE_ZOOM);

      if (editorMode && !canEditAtZoom) return;

      const detected = detectFeaturesAtPoint(event, network);
      const link = detected.link || (editorMode ? findNearbyLink(event) : undefined);

      if (detected.building) {
        setHoverInfo({
          building: detected.building,
          routes: [],
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
        });
      } else if (link && onLinkClick) {
        onLinkClick(link, { lng: event.lngLat.lng, lat: event.lngLat.lat });
      }
    },
    [network, mapRef, onLinkClick, editorMode, findNearbyLink]
  );

  const handleMouseMove = useCallback(
    (event: MapMouseEvent) => {
      const map = mapRef.current;
      const features = event.features || [];
      const canEditAtZoom = !!(editorMode && map && map.getZoom() >= MIN_NODE_ZOOM);

      if (features.length === 0 && !editorMode) {
        if (map) map.getCanvas().style.cursor = "";
        return;
      }

      const detected = detectFeaturesAtPoint(event, network);
      const link = detected.link || (canEditAtZoom ? findNearbyLink(event) : undefined);

      // Check if hovering over a node
      const isHoveringNode = map?.queryRenderedFeatures(event.point, {
        layers: [NODE_LAYER_ID],
      }).length ?? 0 > 0;

      if (map) {
        if (link && canEditAtZoom && !isHoveringNode) {
          map.getCanvas().style.cursor = "crosshair";
        } else if (link || detected.routes.length > 0 || detected.building) {
          map.getCanvas().style.cursor = "pointer";
        } else {
          map.getCanvas().style.cursor = "";
        }
      }

      if (link || detected.routes.length > 0) {
        setHoverInfo({
          link,
          routes: detected.routes,
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
        });
      } else {
        setHoverInfo(null);
      }
    },
    [network, mapRef, editorMode, findNearbyLink]
  );

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = "";
    setHoverInfo(null);
  }, [mapRef]);

  return {
    hoverInfo,
    handleClick,
    handleMouseMove,
    handleMouseLeave,
  };
}
