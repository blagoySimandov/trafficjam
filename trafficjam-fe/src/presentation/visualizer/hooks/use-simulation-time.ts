import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getTimeRange } from "../../../event-processing";
import type { Trip } from "../../../event-processing";

export const SPEED_OPTIONS = [1, 10, 30, 60, 120] as const;

export interface SimulationTimeState {
  time: number;
  isPlaying: boolean;
  speed: number;
  range: [number, number];
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setSpeed: (s: number) => void;
  seekTo: (t: number) => void;
}

export function useSimulationTime(trips: Trip[]): SimulationTimeState {
  const range = useMemo<[number, number]>(
    () => (trips.length ? (getTimeRange(trips) as [number, number]) : [0, 1]),
    [trips],
  );

  const [time, setTime] = useState(range[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeedState] = useState(60);

  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    setTime(range[0]);
  }, [range]);

  useEffect(() => {
    let prev = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      if (isPlayingRef.current) {
        setTime((t) => {
          const next = t + ((now - prev) / 1000) * speedRef.current;
          return next > range[1] ? range[0] : next;
        });
      }
      prev = now;
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [range]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlayback = useCallback(() => setIsPlaying((p) => !p), []);
  const setSpeed = useCallback((s: number) => setSpeedState(s), []);
  const seekTo = useCallback((t: number) => setTime(t), []);

  return { time, isPlaying, speed, range, play, pause, togglePlayback, setSpeed, seekTo };
}
