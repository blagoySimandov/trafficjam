import type { ParsedDataset, DashboardElement } from "./types";
import styles from "./simwrapper-dashboard.module.css";

interface TileCardProps {
  element: DashboardElement;
  dataset: ParsedDataset | undefined;
}

export function TileCard({ element, dataset }: TileCardProps) {
  if (!dataset || dataset.data.length === 0) return null;

  const lastRow = dataset.data[dataset.data.length - 1];
  const columns = element.columns ?? dataset.columns;
  const entries = columns.map((col) => ({ label: col, value: lastRow[col] }));

  return (
    <div className={styles.tileGrid}>
      {entries.map(({ label, value }) => (
        <div key={label} className={styles.tile}>
          <span className={styles.tileValue}>{formatValue(value)}</span>
          <span className={styles.tileLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function formatValue(value: string | number | undefined): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }
  return String(value);
}
