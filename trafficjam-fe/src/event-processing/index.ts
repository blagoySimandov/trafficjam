//TODO: create a class to manage this...
export interface Trip {
  id: string;
  path: [number, number][];
  timestamps: number[];
}

export async function loadTrips(): Promise<Trip[]> {
  const res = await fetch("/trips.json");
  return res.json();
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

//given a time and an ar
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
