import { useMutation } from "@tanstack/react-query";
import type { Network } from "../../../types";
import { networkToMatsim } from "../../../osm/matsim";
import { simulationApi } from "../../../api/simengine";

interface UseNetworkExportOptions {
  onStatusChange: (status: string) => void;
}

function networkToFile(network: Network): File {
  const xml = networkToMatsim(network);
  return new File([xml], `network_${Date.now()}.xml`, {
    type: "application/xml",
  });
}

export function useNetworkExport(
  network: Network | null,
  { onStatusChange }: UseNetworkExportOptions
) {
  const mutation = useMutation({
    mutationFn: () => {
      if (!network) throw new Error("No network to export");
      return simulationApi.start({ networkFile: networkToFile(network) });
    },
    onMutate: () => onStatusChange("Sending network to simulation..."),
    onSuccess: (data) =>
      onStatusChange(`Simulation started: ${data.simulationId}`),
    onError: (err) => {
      console.error(err);
      onStatusChange("Export failed");
    },
  });

  const exportNetwork = () => mutation.mutate();

  return { exportNetwork };
}
