import { ALL_AGENT_TYPES, AGENT_TYPE_LABELS } from "../../constants";
import type { AgentType } from "../../types";
import shared from "../../shared.module.css";
import styles from "./agent-type-selector.module.css";

interface AgentTypeSelectorProps {
  selected: AgentType[];
  onToggle: (type: AgentType) => void;
}

export function AgentTypeSelector({
  selected,
  onToggle,
}: AgentTypeSelectorProps) {
  const allSelected = selected.length === ALL_AGENT_TYPES.length;
  return (
    <div className={shared.attributeSection}>
      <label className={shared.attributeLabel}>Interested Agents</label>
      <div className={styles.agentTypeGrid}>
        {ALL_AGENT_TYPES.map((type) => (
          <label key={type} className={styles.agentTypeCheckbox}>
            <input
              type="checkbox"
              checked={selected.includes(type)}
              onChange={() => onToggle(type)}
            />
            {AGENT_TYPE_LABELS[type]}
          </label>
        ))}
      </div>
      {allSelected && (
        <span className={shared.fieldHint}>Applies to all agent types</span>
      )}
    </div>
  );
}
