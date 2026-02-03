import { useState, useCallback } from "react";
import type { MapRef } from "react-map-gl";
import type { Network } from "../types";
import { MIN_IMPORT_ZOOM } from "../constants";
import { fetchNetworkData } from "../api";

interface UseOSMImportOptions {
  onStatusChange: (status: string) => void;
  onNetworkChange: (network: Network | null) => void;
}

export function useOSMImport(
  mapRef: React.RefObject<MapRef | null>,
  options: UseOSMImportOptions,
) {
  const { onStatusChange, onNetworkChange } = options;
  const [loading, setLoading] = useState(false);

  const importData = useCallback(async () => {
    const map = mapRef.current;
    if (loading || !map) return;

    const zoom = map.getZoom();
    if (zoom < MIN_IMPORT_ZOOM) {
      alert(`Zoom in more to import (min zoom: ${MIN_IMPORT_ZOOM})`);
      return;
    }

    setLoading(true);
    onStatusChange("Loading OSM data...");

    try {
      const bounds = map.getBounds();
      if (!bounds) {
        onStatusChange("Could not get map bounds");
        return;
      }
      const data = await fetchNetworkData(bounds);
      onNetworkChange(data);
      onStatusChange(
        `Loaded: ${data.links.size} links, ${data.nodes.size} nodes`,
      );
    } catch (err) {
      console.error(err);
      onStatusChange("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [mapRef, loading, onStatusChange, onNetworkChange]);

  const clear = useCallback(() => {
    onNetworkChange(null);
    onStatusChange("Cleared");
  }, [onNetworkChange, onStatusChange]);

  return { loading, importData, clear };
}
