import { useState, useRef, useCallback } from "react";
import Map from "react-map-gl";
import type { MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Network, TrafficLink } from "../types";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE,
  MAPBOX_TOKEN,
  INTERACTIVE_LAYER_IDS,
} from "../constants";
import { useOSMImport } from "../hooks/use-osm-import";
import { useNetworkExport } from "../hooks/use-network-export";
import { useMapInteractions } from "../hooks/use-map-interactions";
import { MapControls } from "./map-controls";
import { NetworkLayer } from "./network-layer";
import { TransportLayer } from "./transport-layer";
import { BuildingLayer } from "./building-layer";
import { CombinedTooltip } from "./combined-tooltip";

interface MapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
}

export function MapView({ onStatusChange, onLinkClick }: MapViewProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const mapRef = useRef<MapRef | null>(null);
  const { exportNetwork } = useNetworkExport(network, { onStatusChange });

  const { loading, importData, clear } = useOSMImport(mapRef, {
    onStatusChange,
    onNetworkChange: setNetwork,
  });

  const { hoverInfo, handleClick, handleMouseMove, handleMouseLeave } =
    useMapInteractions({
      network,
      mapRef,
      onLinkClick,
    });

  const handleMapRef = useCallback((ref: MapRef | null) => {
    mapRef.current = ref;
  }, []);

  const toggleBuildings = useCallback(() => {
    setShowBuildings((prev) => !prev);
  }, []);

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
      <MapControls
        onImport={importData}
        onClear={clear}
        onExport={exportNetwork}
        loading={loading}
        showBuildings={showBuildings}
        onToggleBuildings={toggleBuildings}
      />
     {network && <NetworkLayer network={network} hoverInfo={null} showBuildings={showBuildings} />}
      {network?.transportRoutes && network.transportRoutes.size > 0 && (
        <TransportLayer routes={network.transportRoutes} hoverInfo={null} crs={network.crs} />
      )}
      {showBuildings && network?.buildings && network.buildings.size > 0 && (
        <BuildingLayer buildings={network.buildings} crs={network.crs} />
      )}
      {hoverInfo && (
        <CombinedTooltip
          link={hoverInfo.link}
          routes={hoverInfo.routes}
          building={hoverInfo.building}
          longitude={hoverInfo.longitude}
          latitude={hoverInfo.latitude}
        />
      )}
    </Map>
  );
}
