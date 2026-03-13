import type { AgentType } from "./types";

export const ALL_AGENT_TYPES = [
  "employed_adult",
  "non_employed_adult",
  "elderly",
  "older_child",
] as const;

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  employed_adult: "Employed adults",
  non_employed_adult: "Non-employed adults",
  elderly: "Elderly (65+)",
  older_child: "Students (12+)",
};
