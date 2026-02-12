import type { ExpressionSpecification } from "mapbox-gl";
import type { LayerProps } from "react-map-gl";

function zoomScaledWidth(
  offset: number,
): ExpressionSpecification {
  return [
    "interpolate",
    ["exponential", 1.5],
    ["zoom"],
    10, ["*", ["+", ["get", "weight"], offset], 0.05],
    13, ["*", ["+", ["get", "weight"], offset], 0.15],
    15, ["+", ["get", "weight"], offset],
    18, ["*", ["+", ["get", "weight"], offset], 2.5],
  ];
}

export const glowLayer: LayerProps = {
  id: "network-glow",
  type: "line",
  filter: ["==", ["get", "hasGlow"], true],
  paint: {
    "line-color": ["get", "color"],
    "line-width": zoomScaledWidth(12),
    "line-opacity": 0.15,
    "line-blur": 4,
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
    "line-width": zoomScaledWidth(4),
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
    "line-width": zoomScaledWidth(0),
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
    "line-width": [
      "interpolate",
      ["exponential", 1.5],
      ["zoom"],
      10, 0.1,
      13, 0.4,
      15, 1,
      18, 2.5,
    ],
    "line-opacity": 0.5,
    "line-dasharray": [8, 12],
  },
};
