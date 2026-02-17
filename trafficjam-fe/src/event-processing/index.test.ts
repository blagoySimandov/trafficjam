import { describe, it, expect } from "vitest";
import {
  getVehiclePositions,
  getStoppedPositions,
  getTimeRange,
  splitTripAtStops,
  type Trip,
  type AgentStop,
} from "./index";

describe("splitTripAtStops", () => {
  it("returns the trip unchanged when there are no long gaps", () => {
    const trip: Trip = {
      id: "1",
      path: [[-8.0, 51.0], [-8.1, 51.1], [-8.2, 51.2]],
      timestamps: [0, 10, 20],
    };
    const { legs, stops } = splitTripAtStops(trip);
    expect(legs).toHaveLength(1);
    expect(legs[0].path).toEqual(trip.path);
    expect(stops).toHaveLength(0);
  });

  it("splits a trip at a long time gap and records the stop", () => {
    const trip: Trip = {
      id: "1",
      path: [[-8.0, 51.0], [-8.1, 51.1], [-8.5, 51.5], [-8.6, 51.6]],
      timestamps: [0, 10, 5000, 5010],
    };
    const { legs, stops } = splitTripAtStops(trip);
    expect(legs).toHaveLength(2);
    expect(legs[0].path).toEqual([[-8.0, 51.0], [-8.1, 51.1]]);
    expect(legs[1].path).toEqual([[-8.5, 51.5], [-8.6, 51.6]]);

    expect(stops).toHaveLength(1);
    expect(stops[0].position).toEqual([-8.1, 51.1]);
    expect(stops[0].startTime).toBe(10);
    expect(stops[0].endTime).toBe(5000);
  });

  it("assigns unique leg IDs", () => {
    const trip: Trip = {
      id: "agent42",
      path: [[-8.0, 51.0], [-8.1, 51.1], [-8.5, 51.5], [-8.6, 51.6]],
      timestamps: [0, 10, 5000, 5010],
    };
    const { legs } = splitTripAtStops(trip);
    expect(legs[0].id).toBe("agent42_leg0");
    expect(legs[1].id).toBe("agent42_leg1");
  });

  it("handles multiple stops in a single trip", () => {
    const trip: Trip = {
      id: "1",
      path: [
        [-8.0, 51.0], [-8.1, 51.1],
        [-8.2, 51.2], [-8.3, 51.3],
        [-8.4, 51.4], [-8.5, 51.5],
      ],
      timestamps: [0, 10, 5000, 5010, 10000, 10010],
    };
    const { legs, stops } = splitTripAtStops(trip);
    expect(legs).toHaveLength(3);
    expect(stops).toHaveLength(2);
  });

  it("skips single-point segments", () => {
    const trip: Trip = {
      id: "1",
      path: [[-8.0, 51.0], [-8.5, 51.5], [-8.6, 51.6]],
      timestamps: [0, 5000, 5010],
    };
    const { legs } = splitTripAtStops(trip);
    expect(legs).toHaveLength(1);
    expect(legs[0].path).toEqual([[-8.5, 51.5], [-8.6, 51.6]]);
  });

  it("returns original trip if it has fewer than 2 points", () => {
    const trip: Trip = { id: "1", path: [[-8.0, 51.0]], timestamps: [0] };
    const { legs, stops } = splitTripAtStops(trip);
    expect(legs).toEqual([trip]);
    expect(stops).toHaveLength(0);
  });
});

describe("getStoppedPositions", () => {
  it("returns positions of agents currently stopped", () => {
    const stops: AgentStop[] = [
      { position: [-8.1, 51.1], startTime: 10, endTime: 5000 },
    ];
    expect(getStoppedPositions(stops, 100)).toHaveLength(1);
    expect(getStoppedPositions(stops, 100)[0]).toEqual([-8.1, 51.1]);
  });

  it("excludes agents outside their stop window", () => {
    const stops: AgentStop[] = [
      { position: [-8.1, 51.1], startTime: 10, endTime: 5000 },
    ];
    expect(getStoppedPositions(stops, 5)).toHaveLength(0);
    expect(getStoppedPositions(stops, 6000)).toHaveLength(0);
  });

  it("handles multiple stops at the same time", () => {
    const stops: AgentStop[] = [
      { position: [-8.1, 51.1], startTime: 0, endTime: 100 },
      { position: [-8.2, 51.2], startTime: 50, endTime: 200 },
    ];
    expect(getStoppedPositions(stops, 75)).toHaveLength(2);
  });
});

describe("getVehiclePositions", () => {
  it("returns empty array when no trips are active", () => {
    const trips: Trip[] = [
      { id: "1", path: [[-8.47, 51.9], [-8.48, 51.91]], timestamps: [100, 200] },
    ];
    expect(getVehiclePositions(trips, 50)).toEqual([]);
    expect(getVehiclePositions(trips, 250)).toEqual([]);
  });

  it("interpolates position between path points", () => {
    const trips: Trip[] = [
      { id: "1", path: [[-8.0, 51.0], [-8.2, 51.2]], timestamps: [0, 100] },
    ];
    const result = getVehiclePositions(trips, 50);
    expect(result).toHaveLength(1);
    expect(result[0][0]).toBeCloseTo(-8.1);
    expect(result[0][1]).toBeCloseTo(51.1);
  });

  it("handles multiple simultaneous trips", () => {
    const trips: Trip[] = [
      { id: "a", path: [[-8.0, 51.0], [-8.1, 51.1]], timestamps: [0, 100] },
      { id: "b", path: [[-8.2, 51.2], [-8.3, 51.3]], timestamps: [0, 100] },
    ];
    expect(getVehiclePositions(trips, 50)).toHaveLength(2);
  });
});

describe("getTimeRange", () => {
  it("returns min and max timestamps across all trips", () => {
    const trips: Trip[] = [
      { id: "1", path: [[-8.0, 51.0], [-8.1, 51.1]], timestamps: [10, 200] },
      { id: "2", path: [[-8.0, 51.0], [-8.1, 51.1]], timestamps: [5, 300] },
    ];
    expect(getTimeRange(trips)).toEqual([5, 300]);
  });
});
