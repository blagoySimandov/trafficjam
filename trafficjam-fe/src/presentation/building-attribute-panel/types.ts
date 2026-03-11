import type { ALL_AGENT_TYPES } from "./constants";

export type AgentType = (typeof ALL_AGENT_TYPES)[number];

export interface HotspotFormState {
  label: string;
  trafficPct: string;
  startTime: string;
  endTime: string;
  agentTypes: AgentType[];
}

export type FormErrors = Partial<
  Record<"trafficPct" | "startTime" | "endTime", string>
>;
