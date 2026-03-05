import { simulationApi } from "../api/trafficjam-be";
import { useQuery } from "@tanstack/react-query";
import type { ScoreStatRow } from "../types";

export function useScoreStats(scenarioId: string, runId: string) {
  return useQuery<ScoreStatRow[]>({
    queryKey: [scenarioId, runId, "scorestats.csv"],
    queryFn: ({ queryKey }) =>
      simulationApi.getSimwrapperFile<ScoreStatRow[]>(
        queryKey[0] as string,
        queryKey[1] as string,
        queryKey[2] as string,
      ),
    staleTime: Infinity,
    retry: 2,
    retryDelay: 5000,
  });
}
