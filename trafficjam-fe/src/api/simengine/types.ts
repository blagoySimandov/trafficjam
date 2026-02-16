export type SimulationStatus =
  | "starting"
  | "running"
  | "completed"
  | "failed";

export interface SimulationResponse {
  simulationId: string;
  status: SimulationStatus;
}

export interface SimulationStatusResponse {
  simulationId: string;
  status: SimulationStatus;
  error?: string;
}

export interface StartSimulationParams {
  networkFile: File;
  iterations?: number;
  randomSeed?: number;
}
