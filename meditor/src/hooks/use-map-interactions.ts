import { useState, useCallback } from "react";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl";
import type { Network, TrafficLink, CombinedHoverInfo } from "../types";
import { detectFeaturesAtPoint } from "../utils/feature-detection";
import { NETWORK_LAYER_ID, BUILDING_LAYER_ID } from "../constants";

interface UseMapInteractionsParams {
  network: Network | null;
  mapRef: React.RefObject<MapRef | null>;
  onLinkClick?: (link: TrafficLink) => void;
}

export function useMapInteractions({
  network,
  mapRef,
  onLinkClick,
}: UseMapInteractionsParams) {
  const [hoverInfo, setHoverInfo] = useState<CombinedHoverInfo | null>(null);

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
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
        onLinkClick(detected.link);
      }
    },
    [network, onLinkClick]
  );

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      const map = mapRef.current;
      const features = event.features || [];

      if (features.length === 0) {
        if (map) map.getCanvas().style.cursor = "";
        return;
      }

      if (map) map.getCanvas().style.cursor = "pointer";

      const detected = detectFeaturesAtPoint(event, network);

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
    [network, mapRef]
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
