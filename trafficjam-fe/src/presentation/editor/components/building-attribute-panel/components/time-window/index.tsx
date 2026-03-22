import type { FormErrors } from "../../types";
import { computeDuration } from "./compute-duration";
import shared from "../../shared.module.css";
import styles from "./time-window.module.css";

export interface TimeWindowProps {
  startTime: string;
  endTime: string;
  errors: FormErrors;
  onChange: (field: "startTime" | "endTime", value: string) => void;
}

export function TimeWindow({
  startTime,
  endTime,
  errors,
  onChange,
}: TimeWindowProps) {
  const duration = computeDuration(startTime, endTime);
  return (
    <div className={shared.attributeSection}>
      <label className={shared.attributeLabel}>Time Window</label>
      <div className={styles.timeRow}>
        {(["startTime", "endTime"] as const).map((field) => (
          <div key={field}>
            <label className={shared.attributeLabel}>
              {field === "startTime" ? "Start Time" : "End Time"}
            </label>
            <input
              type="time"
              className={shared.attributeInput}
              value={field === "startTime" ? startTime : endTime}
              onChange={(e) => onChange(field, e.target.value)}
            />
            {errors[field] && (
              <span className={shared.fieldError}>{errors[field]}</span>
            )}
          </div>
        ))}
      </div>
      {duration && <span className={styles.computedDuration}>{duration}</span>}
    </div>
  );
}
