import type { HotspotFormState, FormErrors, AgentType } from "../../types";
import { AgentTypeSelector } from "../agent-type-selector";
import { TimeWindow } from "../time-window";
import shared from "../../shared.module.css";
import styles from "./hotspot-fields.module.css";

interface HotspotFieldsProps {
  state: HotspotFormState;
  errors: FormErrors;
  onChange: (patch: Partial<HotspotFormState>) => void;
}

function toggleAgentType(current: AgentType[], type: AgentType): AgentType[] {
  return current.includes(type)
    ? current.filter((t) => t !== type)
    : [...current, type];
}

export function HotspotFields({ state, errors, onChange }: HotspotFieldsProps) {
  const toggleAgent = (type: AgentType) =>
    onChange({ agentTypes: toggleAgentType(state.agentTypes, type) });

  return (
    <div className={styles.hotspotFields}>
      <div className={shared.attributeSection}>
        <label className={shared.attributeLabel}>Label</label>
        <input
          type="text"
          className={shared.attributeInput}
          value={state.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="e.g. Concert, Shopping Event"
        />
      </div>

      <TimeWindow
        startTime={state.startTime}
        endTime={state.endTime}
        errors={errors}
        onChange={(field, value) => onChange({ [field]: value })}
      />

      <AgentTypeSelector selected={state.agentTypes} onToggle={toggleAgent} />

      <div className={shared.attributeSection}>
        <label className={shared.attributeLabel}>Traffic % (1–100)</label>
        <input
          type="text"
          inputMode="numeric"
          className={shared.attributeInput}
          value={state.trafficPct}
          onChange={(e) =>
            onChange({ trafficPct: e.target.value.replace(/[^0-9]/g, "") })
          }
        />
        {errors.trafficPct && (
          <span className={shared.fieldError}>{errors.trafficPct}</span>
        )}
      </div>
    </div>
  );
}
