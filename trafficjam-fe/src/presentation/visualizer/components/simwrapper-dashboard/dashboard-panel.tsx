import { Loader2 } from "lucide-react";
import type { DashboardConfig, DashboardElement, DatasetConfig } from "./types";
import { useMultipleDatasets } from "./use-dataset";
import { PlotlyChart } from "./plotly-chart";
import { SimWrapperChart } from "./simwrapper-chart";
import { CsvTable } from "./csv-table";
import { TextBlock } from "./text-block";
import { TileCard } from "./tile-card";
import styles from "./simwrapper-dashboard.module.css";

interface DashboardPanelProps {
  config: DashboardConfig;
  scenarioId: string;
  runId: string;
  files: string[];
}

const NATIVE_CHART_TYPES = new Set(["line", "area", "bar", "pie"]);

function collectDatasets(config: DashboardConfig): Record<string, DatasetConfig> {
  const result: Record<string, DatasetConfig> = { ...(config.datasets ?? {}) };
  if (!config.layout) return result;
  for (const rowValue of Object.values(config.layout)) {
    const elements = Array.isArray(rowValue) ? rowValue : [rowValue];
    for (const el of elements) {
      if (el.datasets) Object.assign(result, el.datasets);
      if (el.dataset && !result[el.dataset]) result[el.dataset] = el.dataset;
    }
  }
  return result;
}

function resolveElementDatasetKey(el: DashboardElement): string | undefined {
  if (el.dataset) return el.dataset;
  const dsKeys = Object.keys(el.datasets ?? {});
  return dsKeys[0];
}

export function DashboardPanel({ config, scenarioId, runId, files }: DashboardPanelProps) {
  const allDatasets = collectDatasets(config);
  const resolved = useMultipleDatasets(scenarioId, runId, allDatasets, files);

  if (!config.layout) return null;

  return (
    <div>
      {config.header?.title && <h1 className={styles.dashboardTitle}>{config.header.title}</h1>}
      {config.header?.description && (
        <p className={styles.dashboardDescription}>{config.header.description}</p>
      )}
      {Object.entries(config.layout).map(([rowKey, rowValue]) => (
        <DashboardRow
          key={rowKey}
          elements={Array.isArray(rowValue) ? rowValue : [rowValue]}
          datasets={resolved}
          scenarioId={scenarioId}
          runId={runId}
        />
      ))}
    </div>
  );
}

interface DashboardRowProps {
  elements: DashboardElement[];
  datasets: Record<string, import("./types").ParsedDataset> | undefined;
  scenarioId: string;
  runId: string;
}

function DashboardRow({ elements, datasets, scenarioId, runId }: DashboardRowProps) {
  return (
    <div className={styles.row}>
      {elements.map((el, idx) => (
        <div key={idx} className={styles.chartContainer}>
          {el.title && <h3 className={styles.chartTitle}>{el.title}</h3>}
          <ElementRenderer
            element={el}
            datasets={datasets}
            scenarioId={scenarioId}
            runId={runId}
          />
        </div>
      ))}
    </div>
  );
}

interface ElementRendererProps {
  element: DashboardElement;
  datasets: Record<string, import("./types").ParsedDataset> | undefined;
  scenarioId: string;
  runId: string;
}

function ElementRenderer({ element, datasets, scenarioId, runId }: ElementRendererProps) {
  if (!datasets) return <Loader2 size={20} className="animate-spin" />;

  const dsKey = resolveElementDatasetKey(element);
  const ds = dsKey ? datasets[dsKey] : undefined;

  if (element.type === "plotly") {
    return <PlotlyChart element={element} datasets={datasets} />;
  }
  if (NATIVE_CHART_TYPES.has(element.type) && ds) {
    return <SimWrapperChart element={element} dataset={ds} />;
  }
  if (element.type === "csv" && ds) {
    return <CsvTable dataset={ds} />;
  }
  if (element.type === "text") {
    return <TextBlock element={element} scenarioId={scenarioId} runId={runId} />;
  }
  if (element.type === "tile") {
    return <TileCard element={element} dataset={ds} />;
  }

  return <span className={styles.unsupported}>Unsupported: {element.type}</span>;
}
