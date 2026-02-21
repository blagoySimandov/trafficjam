export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface StartRunResponse {
  scenario_id: string;
  run_id: string;
  simulation_id: string;
  status: RunStatus;
}

export interface CreateRunResponse {
  scenario_id: string;
  run_id: string;
  status: RunStatus;
}

export interface StartRunParams {
  scenarioId: string;
  networkFile: File;
  iterations?: number;
  randomSeed?: number;
}
