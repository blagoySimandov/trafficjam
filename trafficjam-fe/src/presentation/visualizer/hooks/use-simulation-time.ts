import { useState, useEffect, useMemo } from "react";
import { getTimeRange } from "../../../event-processing";
import type { Trip } from "../../../event-processing";

const SIMULATION_SPEED = 60;

export function useSimulationTime(trips: Trip[]) {
  const range = useMemo(
    () => (trips.length ? getTimeRange(trips) : [0, 1]),
    [trips],
  );
  const [time, setTime] = useState(range[0]);

  useEffect(() => {
    setTime(range[0]);
    let prev = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      setTime((t) => {
        const next = t + ((now - prev) / 1000) * SIMULATION_SPEED;
        return next > range[1] ? range[0] : next;
      });
      prev = now;
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [range]);

  return time;
}
