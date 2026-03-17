import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getTimeRange } from "../../../event-processing";
import type { Trip } from "../../../event-processing";
import { useRafState } from "../../../hooks/use-raf-state";

export const SPEED_OPTIONS = [30, 60, 120, 300, 600] as const;
export const DEFAULT_SPEED = 60;

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

  const [time, setTime] = useRafState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeedState] = useState(DEFAULT_SPEED);

  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);

  const play = useCallback(() => {
    isPlayingRef.current = true;
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    isPlayingRef.current = !isPlayingRef.current;
    setIsPlaying(isPlayingRef.current);
  }, []);

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  const seekTo = useCallback((t: number) => setTime(t), [setTime]);

  useEffect(() => {
    const FRAME_MS = 1000 / 45; // cap at 30fps
    let prev = performance.now();
    let lastFrame = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      if (isPlayingRef.current && now - lastFrame >= FRAME_MS) {
        const delta = (now - prev) / 1000;
        setTime((t) => {
          if (t < range[0]) return range[0];
          const next = t + delta * speedRef.current;
          return next > range[1] ? range[0] : next;
        });
        lastFrame = now;
      }
      prev = now;
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [range, setTime]);

  return {
    time,
    isPlaying,
    speed,
    range,
    play,
    pause,
    togglePlayback,
    setSpeed,
    seekTo,
  };
}
