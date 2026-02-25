import { useState, useCallback } from "react";

export interface SimulationParams {
  iterations: number;
  randomSeed?: number;
  note: string;
}

export function useSimulationParams() {
  const [params, setParams] = useState<SimulationParams>({
    iterations: 1,
    randomSeed: undefined,
    note: "",
  });

  const setIterations = useCallback((iterations: number) => {
    setParams((prev) => ({ ...prev, iterations }));
  }, []);

  const setRandomSeed = useCallback((randomSeed: number | undefined) => {
    setParams((prev) => ({ ...prev, randomSeed }));
  }, []);

  const setNote = useCallback((note: string) => {
    setParams((prev) => ({ ...prev, note }));
  }, []);

  const resetParams = useCallback(() => {
    setParams({
      iterations: 1,
      randomSeed: undefined,
      note: "",
    });
  }, []);

  return {
    params,
    setIterations,
    setRandomSeed,
    setNote,
    resetParams,
  };
}
