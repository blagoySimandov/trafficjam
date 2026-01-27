import type { LayerProps } from "react-map-gl";

export const TRANSPORT_SOURCE_ID = "transport";
export const NETWORK_LAYER_ID = "network-main";
export const TRANSPORT_LAYER_PREFIX = "transport-";

const ROUTE_TYPES = ["subway", "bus", "tram", "train", "light_rail"] as const;

export const TRANSPORT_LAYER_IDS = Object.fromEntries(
  ROUTE_TYPES.map((type) => [type.toUpperCase().replace("_", "_"), `transport-${type}`])
) as Record<Uppercase<(typeof ROUTE_TYPES)[number]>, string>;

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
