import { useQuery, useMutation } from "@tanstack/react-query";
import { simulationApi } from "./trafficjam-be";
import type { StartRunParams } from "./trafficjam-be";

export function useSimulation(scenarioId: string | undefined) {
  const start = useMutation({
    mutationFn: (params: StartRunParams) => simulationApi.startRun(params),
  });

  const createRun = useMutation({
    mutationFn: (id: string) => simulationApi.createRun(id),
  });

  return { start, createRun };
}
