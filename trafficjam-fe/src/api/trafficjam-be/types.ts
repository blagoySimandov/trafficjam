import type { Building } from "../../types";

export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface StreamedEvent {
  type: string;
  time: number;
  agentId: string | null;
  linkId: string | null;
  activityType: string | null;
  x: number | null;
  y: number | null;
}

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
  buildings?: Building[];
  bounds?: { north: number; south: number; east: number; west: number };
  iterations?: number;
  randomSeed?: number;
}
