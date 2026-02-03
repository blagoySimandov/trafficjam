import type {
  LngLatBounds,
  Network,
  TrafficNode,
  TrafficLink,
  Building,
  TransportRoute,
  BuildingType,
  Coordinate,
} from "../types";

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

interface NetworkResponse {
  nodes: ApiTrafficNode[];
  links: ApiTrafficLink[];
  buildings: ApiBuilding[];
  transport_routes: ApiTransportRoute[];
}

function parseNode(apiNode: ApiTrafficNode): TrafficNode {
  return {
    id: apiNode.id,
    osmId: apiNode.osm_id,
    position: apiNode.position as Coordinate,
    connectionCount: apiNode.connection_count,
  };
}

function parseLink(apiLink: ApiTrafficLink): TrafficLink {
  return {
    id: apiLink.id,
    osmId: apiLink.osm_id,
    from: apiLink.from_node,
    to: apiLink.to_node,
    geometry: apiLink.geometry as Coordinate[],
    tags: {
      highway: apiLink.tags.highway || "unclassified",
      lanes: apiLink.tags.lanes ? parseInt(apiLink.tags.lanes, 10) : undefined,
      maxspeed: apiLink.tags.maxspeed
        ? parseInt(apiLink.tags.maxspeed, 10)
        : undefined,
      oneway: apiLink.tags.oneway === "yes",
      name: apiLink.tags.name,
    },
  };
}

function parseBuilding(apiBuilding: ApiBuilding): Building | null {
  const validTypes: BuildingType[] = [
    "retail",
    "apartments",
    "supermarket",
    "school",
    "kindergarten",
    "parking",
  ];
  const buildingType = apiBuilding.type as BuildingType;

  if (!validTypes.includes(buildingType)) {
    return null;
  }

  return {
    id: apiBuilding.id,
    osmId: apiBuilding.osm_id,
    position: apiBuilding.position as Coordinate,
    geometry: apiBuilding.geometry as Coordinate[],
    type: buildingType,
    tags: {
      name: apiBuilding.tags.name,
      building: apiBuilding.tags.building,
      shop: apiBuilding.tags.shop,
      amenity: apiBuilding.tags.amenity,
    },
  };
}

function parseTransportRoute(apiRoute: ApiTransportRoute): TransportRoute {
  return {
    id: apiRoute.id,
    osmId: apiRoute.osm_id,
    wayId: apiRoute.way_id,
    geometry: apiRoute.geometry as Coordinate[],
    tags: {
      route: apiRoute.tags.route || "bus",
      ref: apiRoute.tags.ref,
      name: apiRoute.tags.name,
      network: apiRoute.tags.network,
      operator: apiRoute.tags.operator,
      colour: apiRoute.tags.colour,
    },
  };
}

function parseNetworkResponse(response: NetworkResponse): Network {
  const nodes = new Map<string, TrafficNode>();
  const links = new Map<string, TrafficLink>();
  const buildings = new Map<string, Building>();
  const transportRoutes = new Map<string, TransportRoute>();

  for (const apiNode of response.nodes) {
    const node = parseNode(apiNode);
    nodes.set(node.id, node);
  }

  for (const apiLink of response.links) {
    const link = parseLink(apiLink);
    links.set(link.id, link);
  }

  for (const apiBuilding of response.buildings) {
    const building = parseBuilding(apiBuilding);
    if (building) {
      buildings.set(building.id, building);
    }
  }

  for (const apiRoute of response.transport_routes) {
    const route = parseTransportRoute(apiRoute);
    transportRoutes.set(route.id, route);
  }

  return { nodes, links, buildings, transportRoutes };
}

export class MapDataClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      import.meta.env.VITE_MAP_DATA_SERVICE_URL ||
      "http://localhost:8000";
  }

  async fetchNetwork(bounds: LngLatBounds): Promise<Network> {
    const params = new URLSearchParams({
      min_lat: bounds.getSouth().toString(),
      min_lng: bounds.getWest().toString(),
      max_lat: bounds.getNorth().toString(),
      max_lng: bounds.getEast().toString(),
    });

    const response = await fetch(`${this.baseUrl}/network?${params}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Map data service error: ${response.status} - ${error}`);
    }

    const data: NetworkResponse = await response.json();
    return parseNetworkResponse(data);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

const defaultClient = new MapDataClient();

export async function fetchNetworkData(bounds: LngLatBounds): Promise<Network> {
  return defaultClient.fetchNetwork(bounds);
}
