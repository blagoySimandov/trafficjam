import type { TrafficLink } from "../../types";
import { UI_LABELS } from "../../constants";
import styles from "./combined-tooltip.module.css";

interface LinkInfoProps {
  link: TrafficLink;
}

export function LinkInfo({ link }: LinkInfoProps) {
  return (
    <div className={styles.linkSection}>
      <strong className={styles.linkTitle}>
        {link.tags.name || link.tags.highway}
      </strong>
      <div className={styles.linkDetails}>
        {UI_LABELS.TYPE_LABEL}{link.tags.highway}
        {link.tags.lanes && `${UI_LABELS.LANES_LABEL}${link.tags.lanes}`}
        {link.tags.maxspeed && `${UI_LABELS.SPEED_LABEL}${link.tags.maxspeed}`}
      </div>
    </div>
  );
}
