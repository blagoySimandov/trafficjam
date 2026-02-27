import { useQuery, useQueryClient } from "@tanstack/react-query";
import { simulationApi } from "../api/trafficjam-be";
import type { Trip } from "../event-processing";
import type { StreamedEvent } from "../api/trafficjam-be/types";

const BATCH_SIZE = 50;

function processEvent(event: StreamedEvent, tripsMap: Map<string, Trip>) {
  if (!event.agentId || event.x == null || event.y == null) return;

  let trip = tripsMap.get(event.agentId);
  if (!trip) {
    trip = { id: event.agentId, path: [], timestamps: [] };
    tripsMap.set(event.agentId, trip);
  }

  trip.path.push([event.x, event.y]);
  trip.timestamps.push(event.time);
  trip.activityType = event.activityType || undefined;
}

export function useLiveSimulation(scenarioId?: string, runId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["live-simulation", scenarioId, runId];

  const { data: trips = [], isFetching } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const tripsMap = new Map<string, Trip>();
      let eventCount = 0;

      for await (const event of simulationApi.streamEvents(
        scenarioId!,
        runId!,
        signal,
      )) {
        processEvent(event, tripsMap);
        eventCount++;

        if (eventCount % BATCH_SIZE === 0) {
          queryClient.setQueryData(queryKey, Array.from(tripsMap.values()));
        }
      }

      return Array.from(tripsMap.values());
    },
    enabled: !!scenarioId && !!runId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return { trips, isLive: isFetching };
}
