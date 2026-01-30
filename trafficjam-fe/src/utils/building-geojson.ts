import type { FeatureCollection, Feature, Point } from "geojson";
import type { Building } from "../types";

export interface BuildingFeatureProperties {
  id: string;
  type: string;
  name?: string;
}

export function buildingToGeoJSON(
  buildings: Map<string, Building>
): FeatureCollection<Point, BuildingFeatureProperties> {
  const features: Feature<Point, BuildingFeatureProperties>[] = [];

  for (const building of buildings.values()) {
    features.push({
      type: "Feature",
      id: building.id,
      properties: {
        id: building.id,
        type: building.type,
        name: building.tags.name,
      },
      geometry: {
        type: "Point",
        coordinates: [building.position[1], building.position[0]],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
