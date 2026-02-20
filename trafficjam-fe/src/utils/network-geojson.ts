import type { FeatureCollection, Feature, LineString } from "geojson";
import type { Network } from "../types";
import { ROAD_STYLES, DEFAULT_STYLE } from "../constants";

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
  network: Network,
  selectedLinkIds?: string[],
): FeatureCollection<LineString, LinkFeatureProperties> {
  const features: Feature<LineString, LinkFeatureProperties>[] = [];
  const selectedSet = new Set(selectedLinkIds || []);

  for (const link of network.links.values()) {
    const isSelected = selectedSet.has(link.id);
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
        color: isSelected ? "#3b82f6" : style.color,
        casingColor: isSelected ? "#1e40af" : style.casingColor,
        weight: isSelected ? weight * 1.5 : weight,
        zIndex: isSelected ? 1000 : style.zIndex,
        hasGlow: isSelected ? true : (style.glow || false),
        name: link.tags.name,
        maxspeed: link.tags.maxspeed,
      },
      geometry: {
        type: "LineString",
        coordinates: link.geometry.map(([lat, lng]) => [lng, lat]),
      },
    });
  }

  features.sort((a, b) => a.properties.zIndex - b.properties.zIndex);

  return {
    type: "FeatureCollection",
    features,
  };
}
