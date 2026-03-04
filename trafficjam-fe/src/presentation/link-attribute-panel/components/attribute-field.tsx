import styles from "../link-attribute-panel.module.css";

interface AttributeFieldProps {
  label: string;
  labelSuffix?: React.ReactNode;
  children: React.ReactNode;
}

export function AttributeField({ label, labelSuffix, children }: AttributeFieldProps) {
  return (
    <div className={styles.attributeSection}>
      <div className={styles.attributeLabelRow}>
        <label className={styles.attributeLabel}>{label}</label>
        {labelSuffix}
      </div>
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
