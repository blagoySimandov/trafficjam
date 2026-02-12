import { useMemo } from "react";
import {
  computeTripStats,
  getActiveVehicleCount,
  type Trip,
  type TripSummaryStats,
} from "../../../event-processing";

export interface TripStats extends TripSummaryStats {
  activeVehicles: number;
}

export function useTripStats(
  trips: Trip[],
  time: number,
  range: [number, number],
): TripStats {
  const summary = useMemo(
    () => (trips.length ? computeTripStats(trips, range) : null),
    [trips, range],
  );

  const activeVehicles = getActiveVehicleCount(trips, time);

  return {
    totalTrips: summary?.totalTrips ?? 0,
    totalDistanceKm: summary?.totalDistanceKm ?? 0,
    avgMovingSpeedKmh: summary?.avgMovingSpeedKmh ?? 0,
    avgDistanceKm: summary?.avgDistanceKm ?? 0,
    peakVehicles: summary?.peakVehicles ?? { count: 0, time: 0 },
    vehicleCountTimeSeries: summary?.vehicleCountTimeSeries ?? [],
    activeVehicles,
  };
}
