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
      ["get", "connectionCount"],
      1, 4,
      2, 5,
      3, 6,
      4, 7,
    ],
    "circle-color": "#3b82f6",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
    "circle-opacity": 0.9,
  },
};