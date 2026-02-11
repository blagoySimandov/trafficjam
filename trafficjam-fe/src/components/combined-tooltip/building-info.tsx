import type { Building } from "../../types";
import { BUILDING_TYPE_LABELS, BUILDING_COLORS } from "../../constants";
import styles from "./combined-tooltip.module.css";

interface BuildingInfoProps {
  building: Building;
}

export function BuildingInfo({ building }: BuildingInfoProps) {
  const typeLabel = BUILDING_TYPE_LABELS[building.type] || building.type;
  const color = BUILDING_COLORS[building.type] || "#34495E";

  return (
    <div className={styles.linkSection}>
      <strong className={styles.linkTitle}>
        {building.tags.name || typeLabel}
      </strong>
      <div className={styles.linkDetails}>
        <span className={styles.colorSwatch} style={{ backgroundColor: color }} />
        Type: {typeLabel}
      </div>
    </div>
  );
}
