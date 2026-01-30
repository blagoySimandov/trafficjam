import type { FeatureCollection, Feature, Point } from "geojson";
import type { Network } from "../types";

export interface NodeFeatureProperties {
  id: string;
  connectionCount: number;
}

export function nodeToGeoJSON(
  network: Network
): FeatureCollection<Point, NodeFeatureProperties> {
  const features: Feature<Point, NodeFeatureProperties>[] = [];

  for (const node of network.nodes.values()) {
    features.push({
      type: "Feature",
      id: node.id,
      properties: {
        id: node.id,
        connectionCount: node.connectionCount,
      },
      geometry: {
        type: "Point",
        coordinates: [node.position[1], node.position[0]],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}