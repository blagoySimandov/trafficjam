import { useState, useCallback, useMemo } from "react";
import type { MapLayerMouseEvent } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import type { TransportRoute } from "../types";

interface HoverInfo {
  route: TransportRoute;
  longitude: number;
  latitude: number;
}

export function useTransportInteraction(
  routes: Map<string, TransportRoute> | undefined,
  mapRef: React.RefObject<MapRef | null>
) {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const routesById = useMemo(() => {
    if (!routes) return new Map<string, TransportRoute>();
    return routes;
  }, [routes]);

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (feature && feature.properties) {
        const route = routesById.get(feature.properties.id);
        if (route) {
          setHoverInfo({
            route,
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
          });
        }
      }
    },
    [routesById]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  return {
    hoverInfo,
    handleMouseMove,
    handleMouseLeave,
  };
}
