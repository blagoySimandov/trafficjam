import type { MapMouseEvent, MapRef } from "react-map-gl";
import type { Network, TrafficLink, TransportRoute, Building } from "../types";
import { NETWORK_LAYER_ID, TRANSPORT_LAYER_PREFIX, BUILDING_LAYER_ID } from "../constants";

interface DetectedFeatures {
  link?: TrafficLink;
  routes: TransportRoute[];
  building?: Building;
}

export function safeQueryRenderedFeatures(
  map: MapRef | null,
  point: any,
  layers: string[]
) {
  if (!map) return [];
  
  const mapInstance = map.getMap();
  const allLayersExist = layers.every(layerId => mapInstance.getLayer(layerId));
  
  if (!allLayersExist) return [];
  
  return mapInstance.queryRenderedFeatures(point, { layers });
}

export function detectFeaturesAtPoint(
  event: MapMouseEvent,
  network: Network | null
): DetectedFeatures {
  if (!network) {
    return { routes: [] };
  }

  const features = event.features || [];
  let link: TrafficLink | undefined;
  let building: Building | undefined;
  const routes: TransportRoute[] = [];

  for (const feature of features) {
    if (feature.layer?.id === NETWORK_LAYER_ID && feature.properties) {
      link = network.links.get(feature.properties.id);
    } else if (
      feature.layer?.id?.startsWith(TRANSPORT_LAYER_PREFIX) &&
      feature.properties &&
      network.transportRoutes
    ) {
      const route = network.transportRoutes.get(feature.properties.id);
      if (route) {
        routes.push(route);
      }
    } else if (
      feature.layer?.id === BUILDING_LAYER_ID &&
      feature.properties &&
      network.buildings
    ) {
      building = network.buildings.get(feature.properties.id);
    }
  }

  return { link, routes, building };
}
