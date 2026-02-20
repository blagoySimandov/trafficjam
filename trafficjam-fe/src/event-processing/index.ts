/**
 * ## Agent Fadeout / Visibility Logic
 *
 * Vehicles in the simulation alternate between driving and being stationary
 * (at home, work, school, etc.). The raw trip data encodes stops as large
 * time gaps (often thousands of seconds) between consecutive timestamps
 * whose path coordinates are far apart. Without handling, this causes
 * vehicles to slowly interpolate across the map in a straight line during
 * stops — producing visual artefacts.
 *
 * ### How it works
 *
 * 1. **Trip splitting (`splitTripAtStops`)** — On load, each raw trip is
 *    split into separate "legs" wherever the time gap between consecutive
 *    timestamps exceeds `STOP_GAP_THRESHOLD` (default 60 seconds). This
 *    eliminates the straight-line teleportation artefact.
 *
 * 2. **Stop collection** — Each gap also produces an `AgentStop` record
 *    storing the position where the agent waits and the time window
 *    (startTime → endTime). These are used to render stopped agents as
 *    dark-blue, low-opacity dots via a separate ScatterplotLayer.
 *
 * 3. **Active vehicle rendering (`getVehiclePositions`)** — Only returns
 *    positions for vehicles whose current time falls within one of their
 *    driving legs. Vehicles outside all legs are simply absent from the
 *    array, making them invisible.
 *
 * 4. **Stopped vehicle rendering (`getStoppedPositions`)** — Returns
 *    positions for agents whose current time falls within a stop window.
 *    These are rendered as semi-transparent dark-blue dots so the user
 *    can see agents that are waiting but still have future plans.
 *
 * ### Rendering layers (in visualizer/index.tsx)
 *
 * - **TripsLayer ("trails")** — Fading trail lines along each driving leg.
 *   `trailLength: 180` (3 min of sim time), `fadeTrail: true`.
 * - **ScatterplotLayer ("cars")** — Yellow dots for actively moving vehicles.
 * - **ScatterplotLayer ("stopped")** — Dark-blue dots (alpha 100/255) for
 *   agents at a stop with future legs remaining.
 *
 * ### Tuning
 *
 * - `STOP_GAP_THRESHOLD` — Increase to treat shorter pauses as part of
 *   the drive (fewer splits); decrease for finer-grained stop detection.
 * - Trail length and colours are configured in `visualizer/index.tsx`.
 */

//TODO: create a class to manage this...
export interface Trip {
  id: string;
  path: [number, number][];
  timestamps: number[];
}

/** An agent stopped between legs but with future plans. */
export interface AgentStop {
  position: [number, number];
  startTime: number;
  endTime: number;
}

export interface LoadedSimulation {
  trips: Trip[];
  stops: AgentStop[];
}

/** Max gap (seconds) between timestamps before a trip is split into separate legs. */
export const STOP_GAP_THRESHOLD = 60;

export async function loadTrips(): Promise<LoadedSimulation> {
  const res = await fetch("/trips.json");
  const raw: Trip[] = await res.json();

  const allTrips: Trip[] = [];
  const allStops: AgentStop[] = [];

  for (const trip of raw) {
    const { legs, stops } = splitTripAtStops(trip);
    allTrips.push(...legs);
    allStops.push(...stops);
  }

  return { trips: allTrips, stops: allStops };
}

/**
 * Splits a trip into separate legs wherever there is a time gap
 * exceeding STOP_GAP_THRESHOLD. Also collects stop periods where
 * the agent is waiting between legs (e.g. at work, dropping off kids).
 */
export function splitTripAtStops(trip: Trip): { legs: Trip[]; stops: AgentStop[] } {
  const { path, timestamps, id } = trip;
  if (path.length < 2) return { legs: [trip], stops: [] };

  const legs: Trip[] = [];
  const stops: AgentStop[] = [];
  let start = 0;

  for (let i = 0; i < timestamps.length - 1; i++) {
    if (timestamps[i + 1] - timestamps[i] > STOP_GAP_THRESHOLD) {
      if (i - start + 1 >= 2) {
        legs.push({
          id: `${id}_leg${legs.length}`,
          path: path.slice(start, i + 1),
          timestamps: timestamps.slice(start, i + 1),
        });
      }
      // Record the stop: agent waits at path[i] until the next leg starts
      stops.push({
        position: path[i],
        startTime: timestamps[i],
        endTime: timestamps[i + 1],
      });
      start = i + 1;
    }
  }

  // Final leg
  if (timestamps.length - start >= 2) {
    legs.push({
      id: `${id}_leg${legs.length}`,
      path: path.slice(start),
      timestamps: timestamps.slice(start),
    });
  }

  return { legs: legs.length > 0 ? legs : [trip], stops };
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

// Returns positions of agents currently stopped but with future plans
export function getStoppedPositions(
  stops: AgentStop[],
  time: number,
): [number, number][] {
  const positions: [number, number][] = [];
  for (const stop of stops) {
    if (time >= stop.startTime && time <= stop.endTime) {
      positions.push(stop.position);
    }
  }
  return positions;
}

//given a time and an array of trips, return the positions of actively moving vehicles
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
