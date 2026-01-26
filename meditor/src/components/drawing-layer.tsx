import { Source, Layer } from "react-map-gl";
import type { LayerProps } from "react-map-gl";
import type { FeatureCollection, Feature } from "geojson";
import type { LngLatTuple } from "../types";

interface DrawingLayerProps {
  points: LngLatTuple[];
}

function pointsToGeoJSON(points: LngLatTuple[]): FeatureCollection {
  const features: Feature[] = [];

  // Add points
  points.forEach((point, index) => {
    features.push({
      type: "Feature",
      id: `point_${index}`,
      properties: { index },
      geometry: {
        type: "Point",
        coordinates: [point[1], point[0]],
      },
    });
  });

  // Add line if we have at least 2 points
  if (points.length >= 2) {
    features.push({
      type: "Feature",
      id: "drawing_line",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: points.map(([lat, lng]) => [lng, lat]),
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

const drawingLineLayer: LayerProps = {
  id: "drawing-line",
  type: "line",
  filter: ["==", ["geometry-type"], "LineString"],
  paint: {
    "line-color": "#2563eb",
    "line-width": 4,
    "line-dasharray": [2, 2],
  },
};

const drawingPointsLayer: LayerProps = {
  id: "drawing-points",
  type: "circle",
  filter: ["==", ["geometry-type"], "Point"],
  paint: {
    "circle-radius": 6,
    "circle-color": "#2563eb",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
  },
};

export function DrawingLayer({ points }: DrawingLayerProps) {
  if (points.length === 0) return null;

  const geojson = pointsToGeoJSON(points);

  return (
    <Source id="drawing" type="geojson" data={geojson}>
      <Layer {...drawingLineLayer} />
      <Layer {...drawingPointsLayer} />
    </Source>
  );
}