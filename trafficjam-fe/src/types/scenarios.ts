import type { TrafficLink, Building } from "./network";

export interface AgentConfig {
  populationDensity: number;
  shoppingProbability: number;
  maxShoppingDistanceKm: number;
  healthcareChance: number;
  elderlyAgeThreshold: number;
  kindergartenAge: number;
  minIndependentSchoolAge: number;
  errandMinMinutes: number;
  errandMaxMinutes: number;
  childDropoffMinMinutes: number;
  childDropoffMaxMinutes: number;
}

export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface Run {
  id: string;
  scenarioId: string;
  status: RunStatus;
  iterations: number;
  randomSeed?: number;
  note?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  agentConfig: AgentConfig;
  linksDiff?: Record<string, TrafficLink>;
  buildingsDiff?: Record<string, Building>;
  createdAt: string;
  updatedAt: string;
}
