//TODO: create a class to manage this...
export interface Trip {
  id: string;
  path: [number, number][];
  timestamps: number[];
  activityType?: string;
}

/** Pre-built index for efficient frame-by-frame position lookup. */
export interface TripIndex {
  trips: Trip[];
  /** Start time of each trip, parallel to `trips`. Sorted ascending. */
  startTimes: Float64Array;
  /** End time of each trip, parallel to `trips`. */
  endTimes: Float64Array;
}

/**
 * Sort trips by start time and extract start/end times into typed arrays.
 * Call this once when the trips array changes, not every frame.
 */
export function buildTripIndex(trips: Trip[]): TripIndex {
  const sorted = [...trips].sort((a, b) => a.timestamps[0] - b.timestamps[0]);
  const startTimes = new Float64Array(sorted.map((t) => t.timestamps[0]));
  const endTimes = new Float64Array(
    sorted.map((t) => t.timestamps[t.timestamps.length - 1]),
  );
  return { trips: sorted, startTimes, endTimes };
}

export function getTimeRange(trips: Trip[]): [number, number] {
  let min = Infinity,
    max = -Infinity;
  for (const t of trips) {
    if (t.timestamps[0] < min) min = t.timestamps[0];
    if (t.timestamps[t.timestamps.length - 1] > max)
      max = t.timestamps[t.timestamps.length - 1];
  }
  return [min, max];
}

//binary search to make the search faster...
function findSegmentIndex(timestamps: number[], time: number): number {
  let lo = 0,
    hi = timestamps.length - 2;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (timestamps[mid + 1] < time) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

//given a time and an array of trips, return the current interpolated positions
export function getVehiclePositions(
  trips: Trip[],
  time: number,
): [number, number][] {
  const positions: [number, number][] = [];
  for (const trip of trips) {
    const { path, timestamps } = trip;
    if (time < timestamps[0] || time > timestamps[timestamps.length - 1])
      continue;
    const i = findSegmentIndex(timestamps, time);
    const t0 = timestamps[i];
    const t1 = timestamps[i + 1];
    const frac = t1 === t0 ? 0 : (time - t0) / (t1 - t0);
    positions.push([
      path[i][0] + (path[i + 1][0] - path[i][0]) * frac,
      path[i][1] + (path[i + 1][1] - path[i][1]) * frac,
    ]);
  }
  return positions;
}

/**
 * Faster variant of getVehiclePositions using a pre-built TripIndex.
 * Binary-searches to skip trips that haven't started yet, then only
 * interpolates trips that are currently active.
 */
export function getPositionsFromIndex(
  index: TripIndex,
  time: number,
): [number, number][] {
  const { trips, startTimes, endTimes } = index;
  const positions: [number, number][] = [];

  // Binary search: find the count of trips whose startTime <= time.
  // Trips after this point haven't started yet — skip them entirely.
  let lo = 0,
    hi = startTimes.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (startTimes[mid] <= time) lo = mid + 1;
    else hi = mid;
  }
  const activeCount = lo; // trips[0..activeCount-1] have all started

  for (let j = 0; j < activeCount; j++) {
    if (endTimes[j] < time) continue; // this trip has already ended
    const { path, timestamps } = trips[j];
    const i = findSegmentIndex(timestamps, time);
    const t0 = timestamps[i];
    const t1 = timestamps[i + 1];
    const frac = t1 === t0 ? 0 : (time - t0) / (t1 - t0);
    positions.push([
      path[i][0] + (path[i + 1][0] - path[i][0]) * frac,
      path[i][1] + (path[i + 1][1] - path[i][1]) * frac,
    ]);
  }
  return positions;
}
