import { useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Network, TrafficLink } from "../types";
import { useOSMImport } from "../hooks/use-osm-import";
import { MapControls } from "./map-controls";
import { NetworkLayer } from "./network-layer";
import { networkToMatsim } from "../osm/matsim";

const DEFAULT_CENTER: [number, number] = [42.698, 23.322];
const DEFAULT_ZOOM = 15;
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

interface MapControllerProps {
  network: Network | null;
  onStatusChange: (status: string) => void;
  onNetworkChange: (network: Network | null) => void;
  onLinkClick: (link: TrafficLink) => void;
}

function MapController({
  network,
  onStatusChange,
  onNetworkChange,
  onLinkClick,
}: MapControllerProps) {
  const map = useMap();
  const { loading, importData, clear } = useOSMImport(map, {
    onStatusChange,
    onNetworkChange,
  });

  const exportNetwork = () => {
    if (!network) {
      onStatusChange("No network to export");
      return;
    }
    try {
      const xml = networkToMatsim(network);
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `network_${Date.now()}.xml`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onStatusChange(`Exported ${network.links.size} links, ${network.nodes.size} nodes`);
    } catch (err) {
      console.error(err);
      onStatusChange("Export failed");
    }
  };

  return (
    <>
      <MapControls
        onImport={importData}
        onClear={clear}
        onExport={exportNetwork}
        loading={loading}
      />
      {network && <NetworkLayer network={network} onLinkClick={onLinkClick} />}
    </>
  );
}

interface MapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
}

export function MapView({ onStatusChange, onLinkClick }: MapViewProps) {
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
      />
    </MapContainer>
  );
}
