import { useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchOSMData } from "../osm";
import { NetworkLayer } from "./network-layer.tsx";
import type { Network, TrafficLink } from "../types";

interface MapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
}

function MapControls({
  onImport,
  onClear,
  loading,
}: {
  onImport: () => void;
  onClear: () => void;
  loading: boolean;
}) {
  return (
    <div className="map-controls">
      <div className="leaflet-control leaflet-bar">
        <a
          href="#"
          title="Import OSM data"
          onClick={(e) => {
            e.preventDefault();
            if (!loading) onImport();
          }}
          className="map-control-btn"
        >
          📥
        </a>
      </div>
      <div className="leaflet-control leaflet-bar">
        <a
          href="#"
          title="Clear network"
          onClick={(e) => {
            e.preventDefault();
            onClear();
          }}
          className="map-control-btn"
        >
          🗑️
        </a>
      </div>
    </div>
  );
}

function MapController({
  network,
  loading,
  onStatusChange,
  onNetworkChange,
  onLinkClick,
}: {
  network: Network | null;
  loading: boolean;
  onStatusChange: (status: string) => void;
  onNetworkChange: (network: Network | null) => void;
  onLinkClick: (link: TrafficLink) => void;
}) {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = useCallback(async () => {
    if (isLoading || loading) return;

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    if (zoom < 14) {
      alert("Zoom in more to import (min zoom: 14)");
      return;
    }

    setIsLoading(true);
    onStatusChange("Loading OSM data...");

    try {
      const data = await fetchOSMData(bounds);
      onNetworkChange(data);
      onStatusChange(
        `Loaded: ${data.links.size} links, ${data.nodes.size} nodes`,
      );
    } catch (err) {
      console.error(err);
      onStatusChange("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [map, isLoading, loading, onStatusChange, onNetworkChange]);

  const handleClear = useCallback(() => {
    onNetworkChange(null);
    onStatusChange("Cleared");
  }, [onNetworkChange, onStatusChange]);

  return (
    <>
      <MapControls
        onImport={handleImport}
        onClear={handleClear}
        loading={isLoading || loading}
      />
      {network && (
        <NetworkLayer
          network={network}
          onLinkClick={onLinkClick}
        />
      )}
    </>
  );
}

export function MapView({
  onStatusChange,
  onLinkClick,
}: MapViewProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <MapContainer
      center={[42.698, 23.322]}
      zoom={15}
      className="map-container"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />
      <MapController
        network={network}
        loading={loading}
        onStatusChange={onStatusChange}
        onNetworkChange={(n) => {
          setLoading(true);
          setNetwork(n);
          setLoading(false);
        }}
        onLinkClick={onLinkClick}
      />
    </MapContainer>
  );
}
