import Plotly from "plotly.js-basic-dist-min";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import factoryModule from "react-plotly.js/factory";

const createPlotlyComponent =
  typeof factoryModule === "function"
    ? factoryModule
    : (factoryModule as unknown as { default: typeof factoryModule }).default;

export default createPlotlyComponent(Plotly);
