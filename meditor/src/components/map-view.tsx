import { useState, useRef, useCallback } from "react";
import Map from "react-map-gl";
import type { MapRef, MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Network, TrafficLink, TransportRoute } from "../types";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE,
  MAPBOX_TOKEN,
  INTERACTIVE_LAYER_IDS,
} from "../constants";
import { useOSMImport } from "../hooks/use-osm-import";
import { MapControls } from "./map-controls";
import { NetworkLayer } from "./network-layer";
import { TransportLayer } from "./transport-layer";
import { CombinedTooltip } from "./combined-tooltip";

interface MapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
}

interface CombinedHoverInfo {
  link?: TrafficLink;
  routes: TransportRoute[];
  longitude: number;
  latitude: number;
}

export function MapView({ onStatusChange, onLinkClick }: MapViewProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [hoverInfo, setHoverInfo] = useState<CombinedHoverInfo | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const { loading, importData, clear } = useOSMImport(mapRef, {
    onStatusChange,
    onNetworkChange: setNetwork,
  });

  const handleMapRef = useCallback((ref: MapRef | null) => {
    mapRef.current = ref;
  }, []);

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!network) return;
      const feature = event.features?.[0];
      if (feature?.layer?.id === "network-main" && feature.properties) {
        const link = network.links.get(feature.properties.id);
        if (link) {
          onLinkClick(link);
        }
      }
    },
    [network, onLinkClick]
  );

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!network) return;

      const map = mapRef.current;
      const features = event.features || [];

      if (features.length === 0) {
        if (map) map.getCanvas().style.cursor = "";
        setHoverInfo(null);
        return;
      }

      if (map) map.getCanvas().style.cursor = "pointer";

      let link: TrafficLink | undefined;
      const routes: TransportRoute[] = [];

      for (const feature of features) {
        if (feature.layer?.id === "network-main" && feature.properties) {
          link = network.links.get(feature.properties.id);
        } else if (
          feature.layer?.id?.startsWith("transport-") &&
          feature.properties &&
          network.transportRoutes
        ) {
          const route = network.transportRoutes.get(feature.properties.id);
          if (route) {
            routes.push(route);
          }
        }
      }

      if (link || routes.length > 0) {
        setHoverInfo({
          link,
          routes,
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

  return (
    <Map
      ref={handleMapRef}
      initialViewState={{
        longitude: DEFAULT_CENTER[0],
        latitude: DEFAULT_CENTER[1],
        zoom: DEFAULT_ZOOM,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      mapboxAccessToken={MAPBOX_TOKEN}
      interactiveLayerIds={network ? INTERACTIVE_LAYER_IDS : []}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <MapControls onImport={importData} onClear={clear} loading={loading} />
      {network && <NetworkLayer network={network} hoverInfo={null} />}
      {network?.transportRoutes && network.transportRoutes.size > 0 && (
        <TransportLayer routes={network.transportRoutes} hoverInfo={null} />
      )}
      {hoverInfo && (
        <CombinedTooltip
          link={hoverInfo.link}
          routes={hoverInfo.routes}
          longitude={hoverInfo.longitude}
          latitude={hoverInfo.latitude}
        />
      )}
    </Map>
  );
}
