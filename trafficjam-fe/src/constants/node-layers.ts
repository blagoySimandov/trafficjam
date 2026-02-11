import type { LayerProps } from "react-map-gl";

export const NODE_LAYER_ID = "nodes";
export const NODE_SOURCE_ID = "nodes";

export const NODE_CIRCLE_LAYER: LayerProps = {
  id: NODE_LAYER_ID,
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      14, 0,
      15, ["interpolate", ["linear"], ["get", "connectionCount"], 1, 2, 4, 4],
      17, ["interpolate", ["linear"], ["get", "connectionCount"], 1, 4, 4, 7],
    ],
    "circle-color": "#3b82f6",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 14, 0, 16, 2],
    "circle-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15.5, 0.9],
  },
};