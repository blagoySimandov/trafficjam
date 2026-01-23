import type { MapLayerMouseEvent } from "react-map-gl";
import type { Network, TrafficLink, TransportRoute } from "../types";
import { NETWORK_LAYER_ID, TRANSPORT_LAYER_PREFIX } from "../constants";

interface DetectedFeatures {
  link?: TrafficLink;
  routes: TransportRoute[];
}

export function detectFeaturesAtPoint(
  event: MapLayerMouseEvent,
  network: Network | null
): DetectedFeatures {
  if (!network) {
    return { routes: [] };
  }

  const features = event.features || [];
  let link: TrafficLink | undefined;
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
    }
  }

  return { link, routes };
}
