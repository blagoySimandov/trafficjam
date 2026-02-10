import type { FeatureCollection, Feature, Polygon, Position } from "geojson";
import type { Building } from "../types";

export interface BuildingFeatureProperties {
  id: string;
  type: string;
  name?: string;
}

const BBOX_SIZE_DEGREES = 0.0001;

function createBboxFromPoint(lng: number, lat: number): Position[] {
  const halfSize = BBOX_SIZE_DEGREES / 2;
  return [
    [lng - halfSize, lat - halfSize],
    [lng + halfSize, lat - halfSize],
    [lng + halfSize, lat + halfSize],
    [lng - halfSize, lat + halfSize],
    [lng - halfSize, lat - halfSize],
  ];
}

function buildingGeometryToCoordinates(building: Building): Position[][] {
  if (building.geometry && building.geometry.length >= 3) {
    const coords = building.geometry.map(([lat, lng]) => [lng, lat] as Position);
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push(coords[0]);
    }
    return [coords];
  }
  const [lat, lng] = building.position;
  return [createBboxFromPoint(lng, lat)];
}

function createBuildingFeature(building: Building): Feature<Polygon, BuildingFeatureProperties> {
  return {
    type: "Feature",
    id: building.id,
    properties: {
      id: building.id,
      type: building.type,
      name: building.tags.name,
    },
    geometry: {
      type: "Polygon",
      coordinates: buildingGeometryToCoordinates(building),
    },
  };
}

export function buildingToGeoJSON(
  buildings: Map<string, Building>
): FeatureCollection<Polygon, BuildingFeatureProperties> {
  const features: Feature<Polygon, BuildingFeatureProperties>[] = [];
  for (const building of buildings.values()) {
    features.push(createBuildingFeature(building));
  }
  return {
    type: "FeatureCollection",
    features,
  };
}
