export const DARK_LAYOUT: Partial<Plotly.Layout> = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { color: "#ccc", family: "JetBrains Mono, Fira Code, monospace", size: 11 },
  margin: { t: 30, r: 20, b: 40, l: 50 },
  xaxis: { gridcolor: "#333", zerolinecolor: "#444" },
  yaxis: { gridcolor: "#333", zerolinecolor: "#444" },
  legend: { bgcolor: "transparent", font: { color: "#aaa" } },
  autosize: true,
};
