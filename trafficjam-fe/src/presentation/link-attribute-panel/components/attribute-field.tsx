import styles from "../link-attribute-panel.module.css";

interface AttributeFieldProps {
  label: string;
  children: React.ReactNode;
}

export function AttributeField({ label, children }: AttributeFieldProps) {
  return (
    <div className={styles.attributeSection}>
      <label className={styles.attributeLabel}>{label}</label>
      {children}
    </div>
  );
}

interface AttributeValueProps {
  value: string | number;
  readonly?: boolean;
}

export function AttributeValue({
  value,
  readonly = true,
}: AttributeValueProps) {
  return (
    <div
      className={`${styles.attributeValue} ${readonly ? styles.readonly : ""}`}
    >
      {value}
    </div>
  );
}
