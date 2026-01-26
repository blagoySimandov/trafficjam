import type { FeatureCollection, Feature, LineString } from "geojson";
import type { Network } from "../types";
import { ROAD_STYLES, DEFAULT_STYLE } from "../constants";
import { projectedToWGS84 } from "./coordinates";

export interface LinkFeatureProperties {
  id: string;
  highway: string;
  lanes: number;
  oneway: boolean;
  color: string;
  casingColor: string;
  weight: number;
  zIndex: number;
  hasGlow: boolean;
  name?: string;
  maxspeed?: number;
}

function calculateWeight(baseWeight: number, lanes: number): number {
  const laneMultiplier = 1 + (lanes - 1) * 0.3;
  return baseWeight * laneMultiplier;
}

export function networkToGeoJSON(
  network: Network
): FeatureCollection<LineString, LinkFeatureProperties> {
  const features: Feature<LineString, LinkFeatureProperties>[] = [];

  for (const link of network.links.values()) {
    const style = ROAD_STYLES[link.tags.highway] || DEFAULT_STYLE;
    const lanes = link.tags.lanes || 1;
    const weight = calculateWeight(style.baseWeight, lanes);

    features.push({
      type: "Feature",
      id: link.id,
      properties: {
        id: link.id,
        highway: link.tags.highway,
        lanes,
        oneway: link.tags.oneway || false,
        color: style.color,
        casingColor: style.casingColor,
        weight,
        zIndex: style.zIndex,
        hasGlow: style.glow || false,
        name: link.tags.name,
        maxspeed: link.tags.maxspeed,
      },
      geometry: {
        type: "LineString",
        coordinates: link.geometry.map(([x, y]) => {
          // Transform projected coordinates → WGS84, then swap for GeoJSON
          const [lat, lon] = projectedToWGS84(x, y, network.crs);
          return [lon, lat]; // GeoJSON format: [lon, lat]
        }),
      },
    });
  }

  features.sort((a, b) => a.properties.zIndex - b.properties.zIndex);

  return {
    type: "FeatureCollection",
    features,
  };
}
