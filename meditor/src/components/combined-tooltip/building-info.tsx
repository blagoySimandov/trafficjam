import type { Building } from "../../types";
import { BUILDING_TYPE_LABELS, UI_LABELS } from "../../constants";
import styles from "./combined-tooltip.module.css";

interface BuildingInfoProps {
  building: Building;
}

export function BuildingInfo({ building }: BuildingInfoProps) {
  const typeLabel = BUILDING_TYPE_LABELS[building.type] || building.type;

  return (
    <div className={styles.linkSection}>
      <strong className={styles.linkTitle}>
        {building.tags.name || typeLabel}
      </strong>
      <div className={styles.linkDetails}>
        {UI_LABELS.TYPE_LABEL}{typeLabel}
      </div>
    </div>
  );
}
