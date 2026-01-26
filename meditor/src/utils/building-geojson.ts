import type { FeatureCollection, Feature, Point } from "geojson";
import type { Building } from "../types";
import { projectedToWGS84 } from "./coordinates";

export interface BuildingFeatureProperties {
  id: string;
  type: string;
  name?: string;
}

export function buildingToGeoJSON(
  buildings: Map<string, Building>,
  crs: string
): FeatureCollection<Point, BuildingFeatureProperties> {
  const features: Feature<Point, BuildingFeatureProperties>[] = [];

  for (const building of buildings.values()) {
    const [lat, lon] = projectedToWGS84(building.position[0], building.position[1], crs);

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
        coordinates: [lon, lat], // in GeoJSON format: [lon, lat]
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
