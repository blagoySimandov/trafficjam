import { useState } from "react";
import { Dialog } from "../dialog";
import styles from "./confirm-dialog.module.css";

interface BaseProps {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  onClose: () => void;
}

interface WithoutInput extends BaseProps {
  input?: false;
  onConfirm: () => void;
}

interface WithInput extends BaseProps {
  input: { placeholder?: string; defaultValue?: string };
  onConfirm: (value: string) => void;
}

type ConfirmDialogProps = WithoutInput | WithInput;

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { title, message, confirmLabel = "Confirm", variant = "danger", onClose, input } = props;
  const [value, setValue] = useState(input ? input.defaultValue ?? "" : "");
  const isDisabled = !!input && value.trim() === "";

  const handleConfirm = () => {
    if (isDisabled) return;
    input ? (props as WithInput).onConfirm(value.trim()) : (props as WithoutInput).onConfirm();
  };

  const btnClass = variant === "danger" ? styles.dangerButton : styles.primaryButton;

  return (
    <Dialog
      title={title}
      onClose={onClose}
      maxWidth={400}
      footer={
        <>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={btnClass} onClick={handleConfirm} disabled={isDisabled}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className={styles.message}>{message}</p>
      {input && (
        <input
          className={styles.input}
          placeholder={input.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
        />
      )}
    </Dialog>
  );
}
