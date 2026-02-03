import type {
  Network,
  TrafficNode,
  TrafficLink,
  Building,
  TransportRoute,
  BuildingType,
  Coordinate,
} from "../types";
import type {
  ApiTrafficNode,
  ApiTrafficLink,
  ApiBuilding,
  ApiTransportRoute,
  NetworkResponse,
} from "./types";

function decodeNode(apiNode: ApiTrafficNode): TrafficNode {
  return {
    id: apiNode.id,
    osmId: apiNode.osm_id,
    position: apiNode.position as Coordinate,
    connectionCount: apiNode.connection_count,
  };
}

function decodeLink(apiLink: ApiTrafficLink): TrafficLink {
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

function decodeBuilding(apiBuilding: ApiBuilding): Building {
  return {
    id: apiBuilding.id,
    osmId: apiBuilding.osm_id,
    position: apiBuilding.position as Coordinate,
    geometry: apiBuilding.geometry as Coordinate[],
    type: apiBuilding.type as BuildingType,
    tags: {
      name: apiBuilding.tags.name,
      building: apiBuilding.tags.building,
      shop: apiBuilding.tags.shop,
      amenity: apiBuilding.tags.amenity,
    },
  };
}

function decodeTransportRoute(apiRoute: ApiTransportRoute): TransportRoute {
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

export function decodeNetworkResponse(response: NetworkResponse): Network {
  const nodes = new Map<string, TrafficNode>();
  const links = new Map<string, TrafficLink>();
  const buildings = new Map<string, Building>();
  const transportRoutes = new Map<string, TransportRoute>();

  for (const apiNode of response.nodes) {
    const node = decodeNode(apiNode);
    nodes.set(node.id, node);
  }

  for (const apiLink of response.links) {
    const link = decodeLink(apiLink);
    links.set(link.id, link);
  }

  for (const apiBuilding of response.buildings) {
    const building = decodeBuilding(apiBuilding);
    buildings.set(building.id, building);
  }

  for (const apiRoute of response.transport_routes) {
    const route = decodeTransportRoute(apiRoute);
    transportRoutes.set(route.id, route);
  }

  return { nodes, links, buildings, transportRoutes };
}
