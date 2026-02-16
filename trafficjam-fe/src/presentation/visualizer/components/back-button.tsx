import { ArrowLeft } from "lucide-react";
import styles from "./back-button.module.css";

interface BackToEditorButtonProps {
  onClick: () => void;
}

export function BackToEditorButton({ onClick }: BackToEditorButtonProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      <ArrowLeft size={16} />
      Back to Editor
    </button>
  );
}
