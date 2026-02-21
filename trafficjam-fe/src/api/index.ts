import { useMutation } from "@tanstack/react-query";
import { simulationApi } from "./trafficjam-be";
import type { StartRunParams } from "./trafficjam-be";

//_scenarioId is not used yet but will be in the future when we implement the concept of scenarios
// eslint-disable-next-line
export function useSimulation(_scenarioId: string | undefined) {
  const start = useMutation({
    mutationFn: (params: StartRunParams) => simulationApi.startRun(params),
  });

  const createRun = useMutation({
    mutationFn: (id: string) => simulationApi.createRun(id),
  });

  return { start, createRun };
}
