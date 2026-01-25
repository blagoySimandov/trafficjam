import type { LayerProps } from "react-map-gl";

export const TRANSPORT_SOURCE_ID = "transport";
export const NETWORK_LAYER_ID = "network-main";
export const TRANSPORT_LAYER_PREFIX = "transport-";

export const TRANSPORT_LAYER_IDS = {
  SUBWAY: "transport-subway",
  BUS: "transport-bus",
  TRAM: "transport-tram",
  TRAIN: "transport-train",
  LIGHT_RAIL: "transport-light-rail",
} as const;

export const TRANSPORT_ROUTE_TYPES = {
  SUBWAY: "subway",
  BUS: "bus",
  TRAM: "tram",
  TRAIN: "train",
  LIGHT_RAIL: "light_rail",
} as const;

interface TransportLayerConfig {
  routeType: string;
  lineWidth: number;
  lineWidthHover: number;
  lineOpacity: number;
  lineOpacityHover: number;
  lineDasharray?: [number, number];
}

const TRANSPORT_LAYER_CONFIGS: Record<string, TransportLayerConfig> = {
  [TRANSPORT_ROUTE_TYPES.SUBWAY]: {
    routeType: TRANSPORT_ROUTE_TYPES.SUBWAY,
    lineWidth: 3,
    lineWidthHover: 5,
    lineOpacity: 0.8,
    lineOpacityHover: 1,
  },
  [TRANSPORT_ROUTE_TYPES.BUS]: {
    routeType: TRANSPORT_ROUTE_TYPES.BUS,
    lineWidth: 2,
    lineWidthHover: 4,
    lineOpacity: 0.7,
    lineOpacityHover: 1,
    lineDasharray: [2, 2],
  },
  [TRANSPORT_ROUTE_TYPES.TRAM]: {
    routeType: TRANSPORT_ROUTE_TYPES.TRAM,
    lineWidth: 2,
    lineWidthHover: 4,
    lineOpacity: 0.7,
    lineOpacityHover: 1,
    lineDasharray: [2, 2],
  },
  [TRANSPORT_ROUTE_TYPES.TRAIN]: {
    routeType: TRANSPORT_ROUTE_TYPES.TRAIN,
    lineWidth: 2,
    lineWidthHover: 4,
    lineOpacity: 0.7,
    lineOpacityHover: 1,
    lineDasharray: [2, 2],
  },
  [TRANSPORT_ROUTE_TYPES.LIGHT_RAIL]: {
    routeType: TRANSPORT_ROUTE_TYPES.LIGHT_RAIL,
    lineWidth: 2,
    lineWidthHover: 4,
    lineOpacity: 0.7,
    lineOpacityHover: 1,
    lineDasharray: [2, 2],
  },
};

export function createTransportLayer(
  id: string,
  config: TransportLayerConfig
): LayerProps {
  const baseLayer: LayerProps = {
    id,
    type: "line",
    filter: ["==", ["get", "route"], config.routeType],
    paint: {
      "line-color": ["get", "colour"],
      "line-width": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        config.lineWidthHover,
        config.lineWidth,
      ],
      "line-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        config.lineOpacityHover,
        config.lineOpacity,
      ],
    },
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
  };

  if (config.lineDasharray && baseLayer.paint) {
    baseLayer.paint["line-dasharray"] = config.lineDasharray;
  }

  return baseLayer;
}

export const TRANSPORT_LAYERS = {
  SUBWAY: createTransportLayer(
    TRANSPORT_LAYER_IDS.SUBWAY,
    TRANSPORT_LAYER_CONFIGS[TRANSPORT_ROUTE_TYPES.SUBWAY]
  ),
  BUS: createTransportLayer(
    TRANSPORT_LAYER_IDS.BUS,
    TRANSPORT_LAYER_CONFIGS[TRANSPORT_ROUTE_TYPES.BUS]
  ),
  TRAM: createTransportLayer(
    TRANSPORT_LAYER_IDS.TRAM,
    TRANSPORT_LAYER_CONFIGS[TRANSPORT_ROUTE_TYPES.TRAM]
  ),
  TRAIN: createTransportLayer(
    TRANSPORT_LAYER_IDS.TRAIN,
    TRANSPORT_LAYER_CONFIGS[TRANSPORT_ROUTE_TYPES.TRAIN]
  ),
  LIGHT_RAIL: createTransportLayer(
    TRANSPORT_LAYER_IDS.LIGHT_RAIL,
    TRANSPORT_LAYER_CONFIGS[TRANSPORT_ROUTE_TYPES.LIGHT_RAIL]
  ),
};
