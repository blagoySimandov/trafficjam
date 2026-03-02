import type { ParsedDataset } from "./types";
import styles from "./simwrapper-dashboard.module.css";

interface CsvTableProps {
  dataset: ParsedDataset;
}

export function CsvTable({ dataset }: CsvTableProps) {
  const rows = dataset.data.slice(0, 100);

  return (
    <div className={styles.tableWrapper}>
      <table>
        <thead>
          <tr>
            {dataset.columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {dataset.columns.map((col) => (
                <td key={col}>{row[col] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
