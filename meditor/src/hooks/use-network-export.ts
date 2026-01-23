import { useCallback } from "react";
import type { Network } from "../types";
import { networkToMatsim } from "../osm/matsim";

interface UseNetworkExportOptions {
  onStatusChange: (status: string) => void;
}

export function useNetworkExport(
  network: Network | null,
  { onStatusChange }: UseNetworkExportOptions
) {
  const exportNetwork = useCallback(() => {
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
      onStatusChange(
        `Exported ${network.links.size} links, ${network.nodes.size} nodes`
      );
    } catch (err) {
      console.error(err);
      onStatusChange("Export failed");
    }
  }, [network, onStatusChange]);

  return { exportNetwork };
}