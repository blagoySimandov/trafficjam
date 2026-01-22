import { useState, useCallback } from "react";
import type { Map } from "leaflet";
import type { Network } from "../types";
import { fetchOSMData } from "../osm";

const MIN_ZOOM = 14;

interface UseOSMImportOptions {
  onStatusChange: (status: string) => void;
  onNetworkChange: (network: Network | null) => void;
}

export function useOSMImport(map: Map, options: UseOSMImportOptions) {
  const { onStatusChange, onNetworkChange } = options;
  const [loading, setLoading] = useState(false);

  const importData = useCallback(async () => {
    if (loading) return;

    const zoom = map.getZoom();
    if (zoom < MIN_ZOOM) {
      alert(`Zoom in more to import (min zoom: ${MIN_ZOOM})`);
      return;
    }

    setLoading(true);
    onStatusChange("Loading OSM data...");

    try {
      const data = await fetchOSMData(map.getBounds());
      onNetworkChange(data);
      onStatusChange(
        `Loaded: ${data.links.size} links, ${data.nodes.size} nodes, ${data.buildings.size} buildings, ${data.busRoutes.size} bus routes`
      );
    } catch (err) {
      console.error(err);
      onStatusChange("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [map, loading, onStatusChange, onNetworkChange]);

  const clear = useCallback(() => {
    onNetworkChange(null);
    onStatusChange("Cleared");
  }, [onNetworkChange, onStatusChange]);

  return { loading, importData, clear };
}
