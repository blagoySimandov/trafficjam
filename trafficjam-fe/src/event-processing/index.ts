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
const MOVING_SPEED_THRESHOLD_KMH = 5;

export interface VehiclePosition {
  position: [number, number];
  moving: boolean;
}

function isSegmentMoving(
  a: [number, number],
  b: [number, number],
  dt: number,
): boolean {
  if (dt <= 0) return false;
  const speedKmh = (haversineDistance(a, b) / dt) * 3600;
  return speedKmh > MOVING_SPEED_THRESHOLD_KMH;
}

export function getVehiclePositions(
  trips: Trip[],
  time: number,
): VehiclePosition[] {
  const result: VehiclePosition[] = [];
  for (const trip of trips) {
    const { path, timestamps } = trip;
    if (time < timestamps[0] || time > timestamps[timestamps.length - 1])
      continue;
    const i = findSegmentIndex(timestamps, time);
    const t0 = timestamps[i];
    const t1 = timestamps[i + 1];
    const frac = t1 === t0 ? 0 : (time - t0) / (t1 - t0);
    result.push({
      position: [
        path[i][0] + (path[i + 1][0] - path[i][0]) * frac,
        path[i][1] + (path[i + 1][1] - path[i][1]) * frac,
      ],
      moving: isSegmentMoving(path[i], path[i + 1], t1 - t0),
    });
  }
  return result;
}

export function getActiveVehicleCount(trips: Trip[], time: number): number {
  let count = 0;
  for (const trip of trips) {
    const { timestamps } = trip;
    if (time >= timestamps[0] && time <= timestamps[timestamps.length - 1])
      count++;
  }
  return count;
}

function haversineDistance(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function tripDistance(path: [number, number][]): number {
  let dist = 0;
  for (let i = 1; i < path.length; i++) dist += haversineDistance(path[i - 1], path[i]);
  return dist;
}

function movingSpeedKmh(trip: Trip): number {
  let dist = 0;
  let time = 0;
  for (let i = 1; i < trip.path.length; i++) {
    const dt = trip.timestamps[i] - trip.timestamps[i - 1];
    if (!isSegmentMoving(trip.path[i - 1], trip.path[i], dt)) continue;
    dist += haversineDistance(trip.path[i - 1], trip.path[i]);
    time += dt;
  }
  return time > 0 ? (dist / time) * 3600 : 0;
}

export interface TripSummaryStats {
  totalTrips: number;
  totalDistanceKm: number;
  avgDistanceKm: number;
  avgMovingSpeedKmh: number;
  peakVehicles: { count: number; time: number };
  vehicleCountTimeSeries: { time: number; count: number }[];
}

export function computeTripStats(
  trips: Trip[],
  range: [number, number],
): TripSummaryStats {
  const totalTrips = trips.length;

  const totalDistanceKm =
    trips.reduce((sum, t) => sum + tripDistance(t.path), 0);

  const avgDistanceKm = totalDistanceKm / totalTrips;

  const avgMovingSpeedKmh =
    trips.reduce((sum, t) => sum + movingSpeedKmh(t), 0) / totalTrips;

  const step = 60;
  const series: { time: number; count: number }[] = [];
  let peakCount = 0;
  let peakTime = range[0];

  for (let t = range[0]; t <= range[1]; t += step) {
    const count = getActiveVehicleCount(trips, t);
    series.push({ time: t, count });
    if (count > peakCount) {
      peakCount = count;
      peakTime = t;
    }
  }

  return {
    totalTrips,
    totalDistanceKm,
    avgDistanceKm,
    avgMovingSpeedKmh,
    peakVehicles: { count: peakCount, time: peakTime },
    vehicleCountTimeSeries: series,
  };
}
