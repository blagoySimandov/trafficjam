export interface SimulationResponse {
  simulationId: string;
  status: string;
}

export interface SimulationStatusResponse {
  simulationId: string;
  status: string;
  error?: string;
}

export interface StartSimulationParams {
  networkFile: File;
  iterations?: number;
  randomSeed?: number;
}
