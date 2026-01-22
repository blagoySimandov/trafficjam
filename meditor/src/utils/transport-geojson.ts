import type { FeatureCollection, Feature, LineString } from "geojson";
import type { TransportRoute } from "../types";

export interface TransportFeatureProperties {
  id: string;
  route: string;
  ref?: string;
  name?: string;
  network?: string;
  operator?: string;
  colour?: string;
}

const TRANSPORT_COLORS: Record<string, string> = {
  subway: "#0066cc",
  tram: "#cc6600",
  bus: "#cc0000",
  train: "#009933",
  light_rail: "#9933cc",
};

export function transportRoutesToGeoJSON(
  routes: Map<string, TransportRoute>
): FeatureCollection<LineString, TransportFeatureProperties> {
  const features: Feature<LineString, TransportFeatureProperties>[] = [];

  for (const route of routes.values()) {
    const color = route.tags.colour || TRANSPORT_COLORS[route.tags.route] || "#666666";

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
        coordinates: route.geometry.map(([lat, lng]) => [lng, lat]),
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
