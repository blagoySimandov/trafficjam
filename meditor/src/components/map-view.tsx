import { useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Network, TrafficLink, BusRoute } from "../types";
import { useOSMImport } from "../hooks/use-osm-import";
import { MapControls } from "./map-controls";
import { NetworkLayer } from "./network-layer";

const DEFAULT_CENTER: [number, number] = [42.698, 23.322];
const DEFAULT_ZOOM = 15;
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

interface MapControllerProps {
  network: Network | null;
  onStatusChange: (status: string) => void;
  onNetworkChange: (network: Network | null) => void;
  onLinkClick: (link: TrafficLink) => void;
  onRouteClick: (route: BusRoute) => void;
}

function MapController({
  network,
  onStatusChange,
  onNetworkChange,
  onLinkClick,
  onRouteClick,
}: MapControllerProps) {
  const map = useMap();
  const { loading, importData, clear } = useOSMImport(map, {
    onStatusChange,
    onNetworkChange,
  });

  return (
    <>
      <MapControls onImport={importData} onClear={clear} loading={loading} />
      {network && <NetworkLayer network={network} onLinkClick={onLinkClick} onRouteClick={onRouteClick} />}
    </>
  );
}

interface MapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
  onRouteClick: (route: BusRoute) => void;
}

export function MapView({ onStatusChange, onLinkClick, onRouteClick }: MapViewProps) {
  const [network, setNetwork] = useState<Network | null>(null);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="map-container"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url={TILE_URL}
      />
      <MapController
        network={network}
        onStatusChange={onStatusChange}
        onNetworkChange={setNetwork}
        onLinkClick={onLinkClick}
        onRouteClick={onRouteClick}
      />
    </MapContainer>
  );
}
