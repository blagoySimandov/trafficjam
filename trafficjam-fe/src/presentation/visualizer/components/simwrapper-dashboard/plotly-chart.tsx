import Plot from "./plot";
import type { DashboardElement, ParsedDataset } from "./types";
import { resolveColumnRef, getUniqueValues, filterDataByValue } from "./dataset-utils";
import { DARK_LAYOUT } from "./plotly-theme";

interface PlotlyChartProps {
  element: DashboardElement;
  datasets: Record<string, ParsedDataset>;
}

function resolveTrace(
  trace: Record<string, unknown>,
  datasets: Record<string, ParsedDataset>,
): Plotly.Data[] {
  const nameRef = trace.name;
  if (typeof nameRef === "string" && nameRef.startsWith("$")) {
    return buildGroupedTraces(trace, nameRef, datasets);
  }
  return [buildSingleTrace(trace, datasets)];
}

function buildSingleTrace(
  trace: Record<string, unknown>,
  datasets: Record<string, ParsedDataset>,
): Plotly.Data {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(trace)) {
    const col = resolveColumnRef(value as string, datasets);
    resolved[key] = col ?? value;
  }
  return resolved as Plotly.Data;
}

function buildGroupedTraces(
  trace: Record<string, unknown>,
  nameRef: string,
  datasets: Record<string, ParsedDataset>,
): Plotly.Data[] {
  const [dsKey, col] = nameRef.slice(1).split(".");
  const ds = datasets[dsKey];
  if (!ds) return [buildSingleTrace(trace, datasets)];
  const uniqueVals = getUniqueValues(nameRef, datasets);
  return uniqueVals.map((val) => {
    const filtered = filterDataByValue(ds, col, val);
    const filteredDs = { ...datasets, [dsKey]: filtered };
    const resolved = buildSingleTrace({ ...trace, name: val }, filteredDs);
    return resolved;
  });
}

export function PlotlyChart({ element, datasets }: PlotlyChartProps) {
  const traces = (element.traces ?? []).flatMap((t) => resolveTrace(t as Record<string, unknown>, datasets));
  const layout: Partial<Plotly.Layout> = {
    ...DARK_LAYOUT,
    ...(element.layout as Partial<Plotly.Layout>),
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      useResizeHandler
      style={{ width: "100%", height: element.height ? element.height * 40 : 300 }}
    />
  );
}
