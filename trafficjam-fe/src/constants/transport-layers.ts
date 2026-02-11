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

function createTransportLayer(routeType: string, isSubway = false): LayerProps {
  const width = isSubway ? 3 : 2;
  const opacity = isSubway ? 0.8 : 0.7;

  return {
    id: `transport-${routeType}`,
    type: "line",
    filter: ["==", ["get", "route"], routeType],
    paint: {
      "line-color": ["get", "colour"],
      "line-width": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        width + 2,
        width,
      ],
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
