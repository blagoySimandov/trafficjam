import { useQuery, useQueryClient } from "@tanstack/react-query";
import { simulationApi } from "../api/trafficjam-be";
import type { Trip } from "../event-processing";
import type { StreamedEvent } from "../api/trafficjam-be/types";

const BATCH_SIZE = 50;

const VEHICLE_LINK_EVENTS = new Set(["entered link", "left link", "vehicle enters traffic", "vehicle leaves traffic"]);

function processEvent(
  event: StreamedEvent,
  tripsMap: Map<string, Trip>,
  vehicleToPersonMap: Map<string, string>,
) {
  if (!event.agentId) return;

  if (event.type === "PersonEntersVehicle" && event.linkId) {
    vehicleToPersonMap.set(event.linkId, event.agentId);
    return;
  }

  if (event.x == null || event.y == null) return;

  const personId = VEHICLE_LINK_EVENTS.has(event.type)
    ? (vehicleToPersonMap.get(event.agentId) ?? event.agentId)
    : event.agentId;

  let trip = tripsMap.get(personId);
  if (!trip) {
    trip = { id: personId, path: [], timestamps: [] };
    tripsMap.set(personId, trip);
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
      const vehicleToPersonMap = new Map<string, string>();
      let eventCount = 0;

      for await (const event of simulationApi.streamEvents(
        scenarioId!,
        runId!,
        signal,
      )) {
        processEvent(event, tripsMap, vehicleToPersonMap);

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
