export interface DashboardConfig {
  header?: {
    tab?: string;
    title?: string;
    description?: string;
  };
  layout?: Record<string, DashboardElement | DashboardElement[]>;
  datasets?: Record<string, DatasetConfig>;
}

export type DatasetConfig = string | { file: string; aggregate?: AggregateConfig; pivot?: PivotConfig; constant?: Record<string, string | number> };

export interface AggregateConfig {
  groupBy: string[];
  aggregate: Record<string, string>;
}

export interface PivotConfig {
  pivotColumn: string;
  valuesColumn: string;
}

export interface DashboardElement {
  type: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  dataset?: string;
  datasets?: Record<string, string>;
  config?: string;
  traces?: PlotlyTrace[];
  layout?: Record<string, unknown>;
  x?: string;
  columns?: string[];
  stacked?: boolean;
  xAxisName?: string;
  yAxisName?: string;
  legendTitles?: string[];
  useLastRow?: boolean;
  file?: string;
  text?: string;
}

export interface PlotlyTrace {
  type?: string;
  x?: string | string[];
  y?: string | string[];
  name?: string;
  mode?: string;
  fill?: string;
  labels?: string | string[];
  values?: string | string[];
  marker?: Record<string, unknown>;
  line?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ParsedDataset {
  columns: string[];
  data: Record<string, string | number>[];
}

export interface DashboardInfo {
  filename: string;
  config: DashboardConfig;
}
