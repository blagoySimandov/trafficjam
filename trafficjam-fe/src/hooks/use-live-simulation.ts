import { useEffect, useState } from "react";
import { simulationApi } from "../api/trafficjam-be";
import type { Trip } from "../event-processing";

export function useLiveSimulation(scenarioId?: string, runId?: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!scenarioId || !runId) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const tripsMap = new Map<string, Trip>();

    const stream = async () => {
      try {
        for await (const event of simulationApi.streamEvents(scenarioId, runId)) {
          // We assume the event has agentId, x, y, and time
          // Using any here because the TransformedEvent from simengine 
          // might be slightly different from the complex Matsim events
          const e = event as any;
          if (!e.agentId || e.x == null || e.y == null) continue;

          let trip = tripsMap.get(e.agentId);
          if (!trip) {
            trip = {
              id: e.agentId,
              path: [],
              timestamps: [],
            };
            tripsMap.set(e.agentId, trip);
          }

          // In MATSim x is longitude and y is latitude for EPSG:4326
          // DeckGL expects [longitude, latitude]
          trip.path.push([e.x, e.y]);
          trip.timestamps.push(e.time);

          // Update trips state periodically or on every event (caution with performance)
          // For now, let's update every few events or just at the end? 
          // Actually, for a live feel, we need updates.
          if (tripsMap.size % 10 === 0) {
             setTrips(Array.from(tripsMap.values()));
          }
        }
        setTrips(Array.from(tripsMap.values()));
      } catch (err) {
        console.error("Error streaming events:", err);
      }
    };

    stream();
  }, [scenarioId, runId]);

  return { trips, isLive };
}
