import type { TrafficLink } from "../../types";
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
        Type: {link.tags.highway}
        {link.tags.lanes && ` · Lanes: ${link.tags.lanes}`}
        {link.tags.maxspeed && ` · Speed: ${link.tags.maxspeed}`}
      </div>
    </div>
  );
}
