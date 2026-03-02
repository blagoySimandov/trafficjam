import type { ParsedDataset, AggregateConfig, PivotConfig } from "./types";

export function matchGlob(pattern: string, files: string[]): string | undefined {
  const regex = new RegExp(
    "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
  );
  return files.find((f) => regex.test(f));
}

export function resolveColumnRef(
  ref: string | string[] | undefined,
  datasets: Record<string, ParsedDataset>,
): unknown[] | undefined {
  if (typeof ref !== "string" || !ref.startsWith("$")) return undefined;
  const [dsKey, col] = ref.slice(1).split(".");
  return datasets[dsKey]?.data.map((row) => row[col]);
}

export function getUniqueValues(
  ref: string,
  datasets: Record<string, ParsedDataset>,
): string[] {
  const values = resolveColumnRef(ref, datasets);
  if (!values) return [];
  return [...new Set(values.map(String))];
}

export function filterDataByValue(
  dataset: ParsedDataset,
  column: string,
  value: string,
): ParsedDataset {
  return {
    columns: dataset.columns,
    data: dataset.data.filter((row) => String(row[column]) === value),
  };
}

export function applyAggregate(
  dataset: ParsedDataset,
  config: AggregateConfig,
): ParsedDataset {
  const groups = new Map<string, Record<string, number[]>>();
  for (const row of dataset.data) {
    const key = config.groupBy.map((col) => String(row[col])).join("||");
    if (!groups.has(key)) groups.set(key, {});
    const group = groups.get(key)!;
    for (const [col, _fn] of Object.entries(config.aggregate)) {
      if (!group[col]) group[col] = [];
      group[col].push(Number(row[col]) || 0);
    }
  }
  const data: Record<string, string | number>[] = [];
  for (const [key, aggs] of groups) {
    const row: Record<string, string | number> = {};
    const keyParts = key.split("||");
    config.groupBy.forEach((col, i) => (row[col] = keyParts[i]));
    for (const [col, fn] of Object.entries(config.aggregate)) {
      row[col] = aggregateValues(aggs[col] || [], fn);
    }
    data.push(row);
  }
  return { columns: [...config.groupBy, ...Object.keys(config.aggregate)], data };
}

function aggregateValues(values: number[], fn: string): number {
  if (values.length === 0) return 0;
  switch (fn) {
    case "sum": return values.reduce((a, b) => a + b, 0);
    case "mean": return values.reduce((a, b) => a + b, 0) / values.length;
    case "count": return values.length;
    case "min": return Math.min(...values);
    case "max": return Math.max(...values);
    default: return values.reduce((a, b) => a + b, 0);
  }
}

export function applyPivot(
  dataset: ParsedDataset,
  config: PivotConfig,
): ParsedDataset {
  const pivotValues = [...new Set(dataset.data.map((r) => String(r[config.pivotColumn])))];
  const otherCols = dataset.columns.filter(
    (c) => c !== config.pivotColumn && c !== config.valuesColumn,
  );
  const groups = new Map<string, Record<string, string | number>>();
  for (const row of dataset.data) {
    const key = otherCols.map((c) => String(row[c])).join("||");
    if (!groups.has(key)) {
      const base: Record<string, string | number> = {};
      otherCols.forEach((c) => (base[c] = row[c]));
      groups.set(key, base);
    }
    groups.get(key)![String(row[config.pivotColumn])] = row[config.valuesColumn];
  }
  return {
    columns: [...otherCols, ...pivotValues],
    data: [...groups.values()],
  };
}

export function applyConstant(
  dataset: ParsedDataset,
  constants: Record<string, string | number>,
): ParsedDataset {
  const newCols = Object.keys(constants).filter((c) => !dataset.columns.includes(c));
  return {
    columns: [...dataset.columns, ...newCols],
    data: dataset.data.map((row) => ({ ...row, ...constants })),
  };
}
