import { Layers } from "lucide-react";
import {
  HIGHWAY_TYPES,
  LANE_OPTIONS,
  MAXSPEED_OPTIONS,
  ONEWAY_OPTIONS,
  MIXED_VALUE,
} from "../constants";
import styles from "../link-attribute-panel.module.css";

interface NameFieldProps {
  value: string | typeof MIXED_VALUE | undefined;
  onChange: (value: string) => void;
  onSelectByName?: () => void;
  showSelectButton: boolean;
}

export function NameField({
  value,
  onChange,
  onSelectByName,
  showSelectButton,
}: NameFieldProps) {
  return (
    <div className={styles.attributeSection}>
      <label className={styles.attributeLabel}>Name</label>
      <div className={styles.nameInputContainer}>
        <input
          type="text"
          className={styles.attributeInput}
          value={value === MIXED_VALUE ? "" : value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={value === MIXED_VALUE ? "Mixed" : "Not specified"}
        />
        {value && value !== MIXED_VALUE && showSelectButton && (
          <button
            className={styles.selectByNameButton}
            onClick={onSelectByName}
            title="Select all links with this name"
          >
            <Layers size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

interface HighwayFieldProps {
  value: string | typeof MIXED_VALUE | undefined;
  onChange: (value: string) => void;
}

export function HighwayField({ value, onChange }: HighwayFieldProps) {
  return (
    <div className={styles.attributeSection}>
      <label className={styles.attributeLabel}>Highway Type</label>
      <select
        className={styles.attributeSelect}
        value={value === MIXED_VALUE ? "" : (value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {value === MIXED_VALUE && <option value="">Mixed</option>}
        {HIGHWAY_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}

interface LanesFieldProps {
  value: number | typeof MIXED_VALUE | undefined;
  onChange: (value: string) => void;
}

export function LanesField({ value, onChange }: LanesFieldProps) {
  return (
    <div className={styles.attributeSection}>
      <label className={styles.attributeLabel}>Lanes</label>
      <select
        className={styles.attributeSelect}
        value={value === MIXED_VALUE ? "" : value?.toString() || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {value === MIXED_VALUE ? (
          <option value="">Mixed</option>
        ) : (
          <option value="">Not specified</option>
        )}
        {LANE_OPTIONS.map((lanes) => (
          <option key={lanes} value={lanes.toString()}>
            {lanes}
          </option>
        ))}
      </select>
    </div>
  );
}

interface MaxspeedFieldProps {
  value: number | typeof MIXED_VALUE | undefined;
  onChange: (value: string) => void;
}

export function MaxspeedField({ value, onChange }: MaxspeedFieldProps) {
  return (
    <div className={styles.attributeSection}>
      <label className={styles.attributeLabel}>Max Speed</label>
      <select
        className={styles.attributeSelect}
        value={value === MIXED_VALUE ? "" : value?.toString() || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {value === MIXED_VALUE ? (
          <option value="">Mixed</option>
        ) : (
          <option value="">Not specified</option>
        )}
        {MAXSPEED_OPTIONS.filter((opt) => opt.value !== "").map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface OnewayFieldProps {
  value: boolean | typeof MIXED_VALUE | undefined;
  onChange: (value: string) => void;
}

export function OnewayField({ value, onChange }: OnewayFieldProps) {
  return (
    <div className={styles.attributeSection}>
      <label className={styles.attributeLabel}>One-way</label>
      <select
        className={styles.attributeSelect}
        value={value === MIXED_VALUE ? "" : value ? "true" : "false"}
        onChange={(e) => onChange(e.target.value)}
      >
        {value === MIXED_VALUE && <option value="">Mixed</option>}
        {ONEWAY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
