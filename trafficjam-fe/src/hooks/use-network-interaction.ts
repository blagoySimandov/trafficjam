import { useState, useCallback, useMemo } from "react";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import type { Network, TrafficLink } from "../types";

export const INTERACTIVE_LAYER_IDS = ["network-main"];

interface HoverInfo {
  link: TrafficLink;
  longitude: number;
  latitude: number;
}

export function useNetworkInteraction(
  network: Network | null,
  mapRef: React.RefObject<MapRef | null>,
  onLinkClick: (link: TrafficLink) => void
) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const linksById = useMemo(() => {
    if (!network) return new Map<string, TrafficLink>();
    const linkMap = new Map<string, TrafficLink>();
    for (const link of network.links.values()) {
      linkMap.set(link.id, link);
    }
    return linkMap;
  }, [network]);

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (feature && feature.properties) {
        const link = linksById.get(feature.properties.id);
        if (link) {
          onLinkClick(link);
        }
      }
    },
    [linksById, onLinkClick]
  );

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      const map = mapRef.current;
      if (map) {
        map.getCanvas().style.cursor = "pointer";
      }
      const feature = event.features?.[0];
      if (feature && feature.properties) {
        const link = linksById.get(feature.properties.id);
        if (link) {
          setHoverInfo({
            link,
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
          });
        }
      }
    },
    [linksById, mapRef]
  );

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = "";
    }
    setHoverInfo(null);
  }, [mapRef]);

  return {
    hoverInfo,
    handleClick,
    handleMouseMove,
    handleMouseLeave,
  };
}
