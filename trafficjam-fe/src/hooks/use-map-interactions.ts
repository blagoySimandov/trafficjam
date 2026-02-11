import { useState, useCallback } from "react";
import type { MapMouseEvent, MapRef } from "react-map-gl";
import type { Network, TrafficLink, CombinedHoverInfo } from "../types";
import { detectFeaturesAtPoint } from "../utils/feature-detection";

interface UseMapInteractionsParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  onLinkClick?: (link: TrafficLink, coords?: { lng: number; lat: number }) => void;
  editorMode?: boolean;
}

export function useMapInteractions({
  network,
  mapRef,
  onLinkClick,
  editorMode,
}: UseMapInteractionsParams) { 
  const [hoverInfo, setHoverInfo] = useState<CombinedHoverInfo | null>(null);

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      if (!network) return;

      const detected = detectFeaturesAtPoint(event, network);

      if (detected.building) {
        setHoverInfo({
          building: detected.building,
          routes: [],
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
        });
      } else if (detected.link && onLinkClick) {
        onLinkClick(detected.link, { lng: event.lngLat.lng, lat: event.lngLat.lat });
      }
    },
    [network, onLinkClick]
  );

  const handleMouseMove = useCallback(
    (event: MapMouseEvent) => {
      const map = mapRef.current;
      const features = event.features || [];

      if (features.length === 0) {
        if (map) map.getCanvas().style.cursor = "";
        return;
      }

      const detected = detectFeaturesAtPoint(event, network);

      if (detected.link && editorMode) {
        if (map) map.getCanvas().style.cursor = "crosshair";
      } else {
        if (map) map.getCanvas().style.cursor = "pointer";
      }

      if (detected.link || detected.routes.length > 0) {
        setHoverInfo({
          link: detected.link,
          routes: detected.routes,
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
        });
      } else {
        setHoverInfo(null);
      }
    },
    [network, mapRef, editorMode]
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
