import type { LayerProps } from "react-map-gl";

export const glowLayer: LayerProps = {
  id: "network-glow",
  type: "line",
  filter: ["==", ["get", "hasGlow"], true],
  paint: {
    "line-color": ["get", "color"],
    "line-width": ["+", ["get", "weight"], 16],
    "line-opacity": 0.3,
    "line-blur": 8,
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
};

export const casingLayer: LayerProps = {
  id: "network-casing",
  type: "line",
  paint: {
    "line-color": ["get", "casingColor"],
    "line-width": ["+", ["get", "weight"], 4],
    "line-opacity": 0.9,
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
};

export const mainLayer: LayerProps = {
  id: "network-main",
  type: "line",
  paint: {
    "line-color": ["get", "color"],
    "line-width": ["get", "weight"],
    "line-opacity": 1,
  },
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
};

export const dividersLayer: LayerProps = {
  id: "network-dividers",
  type: "line",
  filter: [
    "all",
    [">=", ["get", "lanes"], 2],
    ["==", ["get", "oneway"], false],
  ],
  paint: {
    "line-color": ["get", "casingColor"],
    "line-width": 1,
    "line-opacity": 0.5,
    "line-dasharray": [8, 12],
  },
};
