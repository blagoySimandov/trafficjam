import Plot from "./plot";
import type { DashboardElement, ParsedDataset } from "./types";
import { DARK_LAYOUT } from "./plotly-theme";

interface SimWrapperChartProps {
  element: DashboardElement;
  dataset: ParsedDataset;
}

function getXValues(element: DashboardElement, dataset: ParsedDataset): (string | number)[] {
  if (element.x) return dataset.data.map((row) => row[element.x!]);
  return dataset.data.map((_, i) => i);
}

function buildTraces(
  element: DashboardElement,
  dataset: ParsedDataset,
  xValues: (string | number)[],
): Plotly.Data[] {
  const columns = element.columns ?? dataset.columns.filter((c) => c !== element.x);
  return columns.map((col, i) => {
    const yValues = dataset.data.map((row) => row[col]);
    const name = element.legendTitles?.[i] ?? col;
    return traceForType(element.type, xValues, yValues, name);
  });
}

function traceForType(
  type: string,
  x: (string | number)[],
  y: (string | number)[],
  name: string,
): Plotly.Data {
  switch (type) {
    case "line":
      return { x, y, name, type: "scatter", mode: "lines" };
    case "area":
      return { x, y, name, type: "scatter", mode: "lines", fill: "tozeroy" };
    case "bar":
      return { x, y, name, type: "bar" };
    case "scatter":
      return { x, y, name, type: "scatter", mode: "markers" };
    case "pie":
      return { labels: x as string[], values: y as number[], name, type: "pie" };
    default:
      return { x, y, name, type: "scatter", mode: "lines" };
  }
}

function buildLayout(element: DashboardElement): Partial<Plotly.Layout> {
  const layout: Partial<Plotly.Layout> = { ...DARK_LAYOUT };
  if (element.xAxisName) layout.xaxis = { ...layout.xaxis, title: { text: element.xAxisName } };
  if (element.yAxisName) layout.yaxis = { ...layout.yaxis, title: { text: element.yAxisName } };
  if (element.stacked) layout.barmode = "stack";
  return layout;
}

export function SimWrapperChart({ element, dataset }: SimWrapperChartProps) {
  const finalData = element.useLastRow ? { ...dataset, data: dataset.data.slice(-1) } : dataset;
  const xValues = getXValues(element, finalData);
  const traces = buildTraces(element, finalData, xValues);
  const layout = buildLayout(element);

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
