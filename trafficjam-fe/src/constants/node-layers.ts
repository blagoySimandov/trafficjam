import type { LayerProps } from "react-map-gl";

export const NODE_LAYER_ID = "nodes";
export const NODE_SOURCE_ID = "nodes";

export const NODE_CIRCLE_LAYER: LayerProps = {
  id: NODE_LAYER_ID,
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      14, ["case", [">=", ["get", "connectionCount"], 3], 0, 0],
      15, ["case", [">=", ["get", "connectionCount"], 3], 5, 0],
      16.5, ["case", [">=", ["get", "connectionCount"], 3], 6, 0],
      17, ["case", [">=", ["get", "connectionCount"], 3], 7, 3],
      18, 6,
    ],
    "circle-color": "#3b82f6",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": [
      "interpolate", ["linear"], ["zoom"],
      14, 0,
      15, ["case", [">=", ["get", "connectionCount"], 3], 2, 0],
      16.5, ["case", [">=", ["get", "connectionCount"], 3], 2, 0],
      17, 2,
    ],
    "circle-opacity": [
      "interpolate", ["linear"], ["zoom"],
      14, 0,
      15, ["case", [">=", ["get", "connectionCount"], 3], 0.9, 0],
      16.5, ["case", [">=", ["get", "connectionCount"], 3], 0.9, 0],
      17, 0.9,
    ],
  },
};
