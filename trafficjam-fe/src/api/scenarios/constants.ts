import type { AgentConfig } from "./types";

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  populationDensity: 100,
  shoppingProbability: 0.40,
  maxShoppingDistanceKm: 5.0,
  healthcareChance: 0.30,
  elderlyAgeThreshold: 65,
  kindergartenAge: 6,
  minIndependentSchoolAge: 12,
  errandMinMinutes: 30,
  errandMaxMinutes: 120,
  childDropoffMinMinutes: 5,
  childDropoffMaxMinutes: 10,
};

export const AGENT_CONFIG_PLACEHOLDERS: Record<keyof AgentConfig, string> = {
  populationDensity: "100",
  shoppingProbability: "0.40",
  maxShoppingDistanceKm: "5.0",
  healthcareChance: "0.30",
  elderlyAgeThreshold: "65",
  kindergartenAge: "6",
  minIndependentSchoolAge: "12",
  errandMinMinutes: "30",
  errandMaxMinutes: "120",
  childDropoffMinMinutes: "5",
  childDropoffMaxMinutes: "10",
};
