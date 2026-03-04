import { useQuery, useQueryClient } from "@tanstack/react-query";
import { simulationApi } from "../api/trafficjam-be";
import type { Trip } from "../event-processing";
import type { StreamedEvent } from "../api/trafficjam-be/types";

const BATCH_SIZE = 50;

const VEHICLE_LINK_EVENTS = new Set(["entered link", "left link", "vehicle enters traffic", "vehicle leaves traffic"]);

// Max allowed distance (in degrees) between consecutive trip points.
// ~2km threshold: filters PT stop-to-stop jumps while keeping road network events.
const MAX_SEGMENT_DEG = 0.018;

function segmentTooLong(path: [number, number][], x: number, y: number): boolean {
  if (path.length === 0) return false;
  const [px, py] = path[path.length - 1];
  const dx = x - px;
  const dy = y - py;
  return Math.sqrt(dx * dx + dy * dy) > MAX_SEGMENT_DEG;
}

// --- ALTERNATIVE APPROACH (ptAgents set) ---
// Tracks agents currently riding a PT vehicle by ID comparison.
// Assumes car vehicle IDs match the person ID (MATSim default).
// NOTE: This broke car rendering when vehicle IDs differed from person IDs.
// Kept here for reference in case vehicle ID format is ever standardised.
//
// function processEvent(event, tripsMap, vehicleToPersonMap, ptAgents) {
//   if (event.type === "PersonEntersVehicle" && event.linkId) {
//     vehicleToPersonMap.set(event.linkId, event.agentId);
//     const isPtVehicle = event.linkId !== event.agentId;
//     if (isPtVehicle) ptAgents.add(event.agentId);
//     return;
//   }
//   if (event.type === "PersonLeavesVehicle") {
//     ptAgents.delete(event.agentId);
//     return;
//   }
//   ...
//   if (ptAgents.has(personId)) return; // skip PT position events
// }

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

  // Skip points that would create an unrealistically long segment (PT jumps)
  if (segmentTooLong(trip.path, event.x, event.y)) return;

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
