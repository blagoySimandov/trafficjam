import { HelpCircle } from "lucide-react";
import styles from "./tooltip.module.css";

interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  return (
    <div className={styles.container}>
      <HelpCircle size={14} className={styles.helpIcon} />
      <div className={styles.content}>
        {text}
      </div>
    </div>
  );
}
