import type {
  Network,
  TrafficNode,
  TrafficLink,
  TransportRoute,
  Building,
  BuildingType,
  LngLatTuple,
} from "../../types";
import type {
  ApiTrafficNode,
  ApiTrafficLink,
  ApiBuilding,
  ApiTransportRoute,
  ApiNetworkResponse,
} from "./types";

function swapCoord([lon, lat]: [number, number]): LngLatTuple {
  return [lat, lon];
}

function swapCoords(coords: [number, number][]): LngLatTuple[] {
  return coords.map(swapCoord);
}

function mapNode(api: ApiTrafficNode): TrafficNode {
  return {
    id: String(api.id),
    position: swapCoord(api.position),
    connectionCount: api.connection_count,
  };
}

function mapLink(api: ApiTrafficLink): TrafficLink {
  return {
    id: String(api.id),
    from: String(api.from_node),
    to: String(api.to_node),
    geometry: swapCoords(api.geometry),
    tags: {
      highway: api.tags.highway ?? "",
      lanes: api.tags.lanes ? parseInt(api.tags.lanes) : undefined,
      maxspeed: api.tags.maxspeed ? parseInt(api.tags.maxspeed) : undefined,
      oneway: api.tags.oneway === "yes",
      name: api.tags.name,
    },
  };
}

function mapBuilding(api: ApiBuilding): Building | null {
  if (!api.type) return null;
  return {
    id: String(api.id),
    position: swapCoord(api.position),
    geometry: api.geometry.length > 0 ? swapCoords(api.geometry) : undefined,
    type: api.type as BuildingType,
    tags: {
      name: api.tags.name,
      building: api.tags.building,
      shop: api.tags.shop,
      amenity: api.tags.amenity,
    },
  };
}

function mapTransportRoute(api: ApiTransportRoute): TransportRoute {
  return {
    id: String(api.id),
    geometry: api.geometry.map((line) => swapCoords(line)),
    tags: {
      route: api.tags.route ?? "",
      ref: api.tags.ref,
      name: api.tags.name,
      network: api.tags.network,
      operator: api.tags.operator,
      colour: api.tags.colour,
    },
  };
}

export function mapNetworkResponse(api: ApiNetworkResponse): Network {
  const nodes = new Map<string, TrafficNode>();
  for (const n of api.nodes) {
    const mapped = mapNode(n);
    nodes.set(mapped.id, mapped);
  }

  const links = new Map<string, TrafficLink>();
  for (const l of api.links) {
    const mapped = mapLink(l);
    links.set(mapped.id, mapped);
  }

  const buildings = new Map<string, Building>();
  for (const b of api.buildings) {
    const mapped = mapBuilding(b);
    if (mapped) buildings.set(mapped.id, mapped);
  }

  const transportRoutes = new Map<string, TransportRoute>();
  for (const r of api.transport_routes) {
    const mapped = mapTransportRoute(r);
    transportRoutes.set(mapped.id, mapped);
  }

  return { nodes, links, buildings, transportRoutes };
}
