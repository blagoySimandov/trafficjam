import type { ExpressionSpecification } from "mapbox-gl";
import type { LayerProps } from "react-map-gl";

export const TRANSPORT_SOURCE_ID = "transport";
export const NETWORK_LAYER_ID = "network-main";
export const TRANSPORT_LAYER_PREFIX = "transport-";

export const TRANSPORT_LAYER_IDS = {
  SUBWAY: "transport-subway",
  BUS: "transport-bus",
  TRAM: "transport-tram",
  TRAIN: "transport-train",
  LIGHT_RAIL: "transport-light_rail",
} as const;

export const TRANSPORT_COLORS: Record<string, string> = {
  subway: "#0066cc",
  tram: "#cc6600",
  bus: "#cc0000",
  train: "#009933",
  light_rail: "#9933cc",
};

export const DEFAULT_TRANSPORT_COLOR = "#666666";

function zoomScaledTransportWidth(base: number, hover: number): ExpressionSpecification {
  return [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    10, [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      hover * 0.03,
      base * 0.03,
    ],
    13, [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      hover * 0.1,
      base * 0.1,
    ],
    15, [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      hover * 0.3,
      base * 0.3,
    ],
    18, [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      hover,
      base,
    ],
  ];
}

function createTransportLayer(routeType: string, isSubway = false): LayerProps {
  const width = isSubway ? 3 : 2;
  const opacity = isSubway ? 0.8 : 0.7;

  return {
    id: `transport-${routeType}`,
    type: "line",
    filter: ["==", ["get", "route"], routeType],
    paint: {
      "line-color": ["get", "colour"],
      "line-width": zoomScaledTransportWidth(width, width + 2),
      "line-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        1,
        opacity,
      ],
      ...(isSubway ? {} : { "line-dasharray": [2, 2] as [number, number] }),
    },
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
  };
}

export const TRANSPORT_LAYERS = {
  SUBWAY: createTransportLayer("subway", true),
  BUS: createTransportLayer("bus"),
  TRAM: createTransportLayer("tram"),
  TRAIN: createTransportLayer("train"),
  LIGHT_RAIL: createTransportLayer("light_rail"),
};
