import React from "react";
import { X } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import styles from "./dialog.module.css";

interface DialogProps {
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  maxWidth?: number;
}

export function Dialog({ title, children, footer, onClose, maxWidth = 500 }: DialogProps) {
  useHotkeys("escape", onClose);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.card} style={{ maxWidth }}>
        <header className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </header>
        
        <div className={styles.content}>
          {children}
        </div>

        {footer && (
          <footer className={styles.footer}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
