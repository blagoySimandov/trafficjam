import { useCallback, useMemo } from "react";
import type { MapMouseEvent } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import type { Network, TrafficLink } from "../types";
import { useRafState } from "./use-raf-state";

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
  const [hoverInfo, setHoverInfo] = useRafState<HoverInfo | null>(null);

  const linksById = useMemo(() => {
    if (!network) return new Map<string, TrafficLink>();
    const linkMap = new Map<string, TrafficLink>();
    for (const link of network.links.values()) {
      linkMap.set(link.id, link);
    }
    return linkMap;
  }, [network]);

  const handleClick = useCallback(
    (event: MapMouseEvent): boolean => {
      const feature = event.features?.[0];
      if (feature && feature.properties) {
        const link = linksById.get(feature.properties.id);
        if (link) {
          onLinkClick(link);
          return true;
        }
      }
      return false;
    },
    [linksById, onLinkClick]
  );

  const handleMouseMove = useCallback(
    (event: MapMouseEvent): boolean => {
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
          return true;
        }
      }
      return false;
    },
    [linksById, mapRef, setHoverInfo]
  );

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = "";
    }
    setHoverInfo(null);
  }, [mapRef, setHoverInfo]);

  return {
    hoverInfo,
    onClick: handleClick,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
