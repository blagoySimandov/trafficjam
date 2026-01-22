import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { LayerProps } from "react-map-gl";
import type { TransportRoute } from "../types";
import { transportRoutesToGeoJSON } from "../utils";

interface TransportLayerProps {
  routes: Map<string, TransportRoute>;
  hoverInfo: null;
}

const subwayLayer: LayerProps = {
  id: "transport-subway",
  type: "line",
  filter: ["==", ["get", "route"], "subway"],
  paint: {
    "line-color": ["get", "colour"],
    "line-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      5,
      3
    ],
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      1,
      0.8
    ],
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

const busLayer: LayerProps = {
  id: "transport-bus",
  type: "line",
  filter: ["==", ["get", "route"], "bus"],
  paint: {
    "line-color": ["get", "colour"],
    "line-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      4,
      2
    ],
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      1,
      0.7
    ],
    "line-dasharray": [2, 2],
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

const tramLayer: LayerProps = {
  id: "transport-tram",
  type: "line",
  filter: ["==", ["get", "route"], "tram"],
  paint: {
    "line-color": ["get", "colour"],
    "line-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      4,
      2
    ],
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      1,
      0.7
    ],
    "line-dasharray": [2, 2],
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

const trainLayer: LayerProps = {
  id: "transport-train",
  type: "line",
  filter: ["==", ["get", "route"], "train"],
  paint: {
    "line-color": ["get", "colour"],
    "line-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      4,
      2
    ],
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      1,
      0.7
    ],
    "line-dasharray": [2, 2],
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

const lightRailLayer: LayerProps = {
  id: "transport-light-rail",
  type: "line",
  filter: ["==", ["get", "route"], "light_rail"],
  paint: {
    "line-color": ["get", "colour"],
    "line-width": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      4,
      2
    ],
    "line-opacity": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      1,
      0.7
    ],
    "line-dasharray": [2, 2],
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

export function TransportLayer({ routes }: TransportLayerProps) {
  const geojson = useMemo(() => transportRoutesToGeoJSON(routes), [routes]);

  return (
    <Source id="transport" type="geojson" data={geojson}>
      <Layer {...subwayLayer} />
      <Layer {...busLayer} />
      <Layer {...tramLayer} />
      <Layer {...trainLayer} />
      <Layer {...lightRailLayer} />
    </Source>
  );
}
