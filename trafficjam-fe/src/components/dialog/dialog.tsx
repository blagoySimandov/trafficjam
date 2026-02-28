import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "./dialog.module.css";

interface DialogProps {
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  maxWidth?: number;
}

export function Dialog({ title, children, footer, onClose, maxWidth = 500 }: DialogProps) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content className={styles.card} style={{ maxWidth }}>
          <header className={styles.header}>
            <DialogPrimitive.Title asChild>
              <div className={styles.title}>{title}</div>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button className={styles.closeBtn} aria-label="Close">
                <X size={20} />
              </button>
            </DialogPrimitive.Close>
          </header>
          
          <div className={styles.content}>
            {children}
          </div>

          {footer && (
            <footer className={styles.footer}>
              {footer}
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
