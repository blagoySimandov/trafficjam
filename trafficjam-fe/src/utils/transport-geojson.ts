import type { FeatureCollection, Feature, LineString } from "geojson";
import type { TransportRoute } from "../types";
import { TRANSPORT_COLORS, DEFAULT_TRANSPORT_COLOR } from "../constants";

export interface TransportFeatureProperties {
  id: string;
  route: string;
  ref?: string;
  name?: string;
  network?: string;
  operator?: string;
  colour?: string;
}

export function transportRoutesToGeoJSON(
  routes: Map<string, TransportRoute>
): FeatureCollection<LineString, TransportFeatureProperties> {
  const features: Feature<LineString, TransportFeatureProperties>[] = [];

  for (const route of routes.values()) {
    const color = route.tags.colour || TRANSPORT_COLORS[route.tags.route] || DEFAULT_TRANSPORT_COLOR;

    for (const line of route.geometry) {
      if (line.length < 2) continue;
      features.push({
        type: "Feature",
        properties: {
          id: route.id,
          route: route.tags.route,
          ref: route.tags.ref,
          name: route.tags.name,
          network: route.tags.network,
          operator: route.tags.operator,
          colour: color,
        },
        geometry: {
          type: "LineString",
          coordinates: line.map(([lat, lng]) => [lng, lat]),
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
