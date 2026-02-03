export interface Trip {
  id: string;
  path: [number, number][];
  timestamps: number[];
}

let trips: Trip[] = [];

export async function loadTrips(): Promise<Trip[]> {
  if (trips.length) return trips;
  const res = await fetch("/trips.json");
  trips = await res.json();
  return trips;
}

export function getVehiclePositions(time: number): Map<string, [number, number]> {
  const positions = new Map<string, [number, number]>();

  for (const trip of trips) {
    const { path, timestamps } = trip;
    if (time < timestamps[0] || time > timestamps[timestamps.length - 1]) continue;

    let i = 0;
    while (i < timestamps.length - 1 && timestamps[i + 1] < time) i++;

    const t0 = timestamps[i];
    const t1 = timestamps[i + 1];
    const frac = t1 === t0 ? 0 : (time - t0) / (t1 - t0);

    positions.set(trip.id, [
      path[i][0] + (path[i + 1][0] - path[i][0]) * frac,
      path[i][1] + (path[i + 1][1] - path[i][1]) * frac,
    ]);
  }

  return positions;
}
