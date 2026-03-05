import { simulationApi } from "../api/trafficjam-be";
import { useQuery } from "@tanstack/react-query";
import type { TripStat, PopulationTripStat } from "../types";

export function useTripStats(scenarioId: string, runId: string) {
  const tripStats = useQuery<TripStat[]>({
    queryKey: [scenarioId, runId, "analysis/population/trip_stats.csv"],
    queryFn: ({ queryKey }) =>
      simulationApi.getSimwrapperFile<TripStat[]>(
        queryKey[0] as string,
        queryKey[1] as string,
        queryKey[2] as string,
      ),
    staleTime: Infinity,
    retry: 2,
    retryDelay: 5000,
  });

  const populationTripStats = useQuery<PopulationTripStat[]>({
    queryKey: [
      scenarioId,
      runId,
      "analysis/population/population_trip_stats.csv",
    ],
    queryFn: ({ queryKey }) =>
      simulationApi.getSimwrapperFile<PopulationTripStat[]>(
        queryKey[0] as string,
        queryKey[1] as string,
        queryKey[2] as string,
      ),
    staleTime: Infinity,
    retry: 2,
    retryDelay: 5000,
  });

  return { tripStats, populationTripStats };
}
