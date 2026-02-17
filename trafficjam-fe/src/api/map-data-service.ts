//TODO: refactor into the decoder/client pattern used int the simengine
import type {
  Network,
  TrafficNode,
  TrafficLink,
  TransportRoute,
  Building,
  BuildingType,
  LngLatTuple,
  LngLatBounds,
} from "../types";

const BASE_URL =
  import.meta.env.VITE_MAP_DATA_SERVICE_URL || "http://localhost:8000";

interface ApiTrafficNode {
  id: string;
  osm_id: number;
  position: [number, number];
  connection_count: number;
}

interface ApiTrafficLink {
  id: string;
  osm_id: number;
  from_node: string;
  to_node: string;
  geometry: [number, number][];
  tags: Record<string, string>;
}

interface ApiBuilding {
  id: string;
  osm_id: number;
  position: [number, number];
  geometry: [number, number][];
  type: string | null;
  tags: Record<string, string>;
}

interface ApiTransportRoute {
  id: string;
  osm_id: number;
  way_id: number;
  geometry: [number, number][];
  tags: Record<string, string>;
}

interface ApiNetworkResponse {
  nodes: ApiTrafficNode[];
  links: ApiTrafficLink[];
  buildings: ApiBuilding[];
  transport_routes: ApiTransportRoute[];
}

function swapCoord([lon, lat]: [number, number]): LngLatTuple {
  return [lat, lon];
}

function swapCoords(coords: [number, number][]): LngLatTuple[] {
  return coords.map(swapCoord);
}

function mapNode(api: ApiTrafficNode): TrafficNode {
  return {
    id: api.id,
    osmId: api.osm_id,
    position: swapCoord(api.position),
    connectionCount: api.connection_count,
  };
}

function mapLink(api: ApiTrafficLink): TrafficLink {
  return {
    id: api.id,
    osmId: api.osm_id,
    from: api.from_node,
    to: api.to_node,
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
    id: api.id,
    osmId: api.osm_id,
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
    id: api.id,
    osmId: api.osm_id,
    wayId: api.way_id,
    geometry: swapCoords(api.geometry),
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

function mapNetworkResponse(api: ApiNetworkResponse): Network {
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

function buildQueryParams(bounds: LngLatBounds): string {
  const params = new URLSearchParams({
    min_lat: bounds.getSouth().toString(),
    min_lng: bounds.getWest().toString(),
    max_lat: bounds.getNorth().toString(),
    max_lng: bounds.getEast().toString(),
  });
  return params.toString();
}

export async function fetchNetworkData(bounds: LngLatBounds): Promise<Network> {
  const query = buildQueryParams(bounds);
  const response = await fetch(`${BASE_URL}/network?${query}`);

  if (!response.ok) {
    throw new Error(`Map data service error: ${response.status}`);
  }

  const data: ApiNetworkResponse = await response.json();
  return mapNetworkResponse(data);
}
