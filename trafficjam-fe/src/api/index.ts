import { useQuery, useMutation } from "@tanstack/react-query";
import { simulationApi } from "./simengine";
import type { StartSimulationParams } from "./simengine";

export function useSimulation(id: string | undefined) {
  const status = useQuery({
    queryKey: ["simulation", "status", id],
    queryFn: () => simulationApi.getStatus(id!),
    enabled: !!id,
  });

  const start = useMutation({
    mutationFn: (params: StartSimulationParams) =>
      simulationApi.start(params),
  });

  const stop = useMutation({
    mutationFn: (simId: string) => simulationApi.stop(simId),
  });

  return { status, start, stop };
}
