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

    features.push({
      type: "Feature",
      id: route.id,
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
        coordinates: route.geometry,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
