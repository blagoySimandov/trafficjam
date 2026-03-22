import type { Building } from "@/types";
import { ALL_AGENT_TYPES } from "./constants";
import type { HotspotFormState, FormErrors, AgentType } from "./types";

export function validateHotspot(
  state: HotspotFormState,
  otherTotal: number,
): FormErrors {
  const errors: FormErrors = {};
  const parsed = Number(state.trafficPct);

  if (!state.trafficPct || isNaN(parsed) || parsed < 1 || parsed > 100)
    errors.trafficPct = "Must be between 1 and 100";
  else if (otherTotal + parsed > 100)
    errors.trafficPct = `Total hotspot % would be ${otherTotal + parsed}% — must not exceed 100%`;

  if (!state.startTime) errors.startTime = "Required";
  if (!state.endTime) errors.endTime = "Required";
  else if (state.startTime && state.endTime <= state.startTime)
    errors.endTime = "End time must be after start time";

  return errors;
}

export function initHotspotState(building: Building): HotspotFormState {
  return {
    label: building.hotspot?.label ?? "",
    trafficPct: String(building.hotspot?.trafficPercentage ?? 10),
    startTime: building.hotspot?.startTime ?? "",
    endTime: building.hotspot?.endTime ?? "",
    agentTypes: building.hotspot?.agentTypes?.length
      ? (building.hotspot.agentTypes as AgentType[])
      : [...ALL_AGENT_TYPES],
  };
}
