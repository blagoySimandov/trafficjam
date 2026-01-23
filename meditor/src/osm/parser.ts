import type { Network, TrafficNode, TrafficLink, TransportRoute, Building, BuildingType } from "../types";
import type { OSMElement, OSMNode, OSMWay } from "../types/osm";
import { BUILDING_TAG_MAPPINGS } from "../constants";

function indexNodes(elements: OSMElement[]): Map<number, OSMNode> {
  const osmNodes = new Map<number, OSMNode>();
  for (const el of elements) {
    if (el.type === "node") {
      osmNodes.set(el.id, el);
    }
  }
  return osmNodes;
}

function indexWays(elements: OSMElement[]): Map<number, OSMWay> {
  const osmWays = new Map<number, OSMWay>();
  for (const el of elements) {
    if (el.type === "way") {
      osmWays.set(el.id, el);
    }
  }
  return osmWays;
}

function countNodeUsage(elements: OSMElement[]): Map<number, number> {
  const nodeUsage = new Map<number, number>();
  for (const el of elements) {
    if (el.type === "way" && el.tags?.highway) {
      for (const nodeId of el.nodes) {
        nodeUsage.set(nodeId, (nodeUsage.get(nodeId) || 0) + 1);
      }
    }
  }
  return nodeUsage;
}

function buildGeometry(
  wayNodes: number[],
  osmNodes: Map<number, OSMNode>
): L.LatLngTuple[] {
  const geometry: L.LatLngTuple[] = [];
  for (const nodeId of wayNodes) {
    const osmNode = osmNodes.get(nodeId);
    if (osmNode) {
      geometry.push([osmNode.lat, osmNode.lon]);
    }
  }
  return geometry;
}

function createLink(
  way: { id: number; nodes: number[]; tags: Record<string, string> },
  geometry: L.LatLngTuple[]
): TrafficLink {
  const fromNodeId = `node_${way.nodes[0]}`;
  const toNodeId = `node_${way.nodes[way.nodes.length - 1]}`;

  return {
    id: `link_${way.id}`,
    osmId: way.id,
    from: fromNodeId,
    to: toNodeId,
    geometry,
    tags: {
      highway: way.tags.highway,
      lanes: way.tags.lanes ? parseInt(way.tags.lanes) : undefined,
      maxspeed: way.tags.maxspeed ? parseInt(way.tags.maxspeed) : undefined,
      oneway: way.tags.oneway === "yes",
      name: way.tags.name,
    },
  };
}

function createNode(
  osmId: number,
  osmNode: OSMNode,
  connectionCount: number
): TrafficNode {
  return {
    id: `node_${osmId}`,
    osmId,
    position: [osmNode.lat, osmNode.lon],
    connectionCount,
  };
}

function createTransportRoute(
  relationId: number,
  wayId: number,
  geometry: L.LatLngTuple[],
  tags: Record<string, string>
): TransportRoute {
  return {
    id: `transport_${relationId}_way_${wayId}`,
    osmId: relationId,
    wayId,
    geometry,
    tags: {
      route: tags.route,
      ref: tags.ref,
      name: tags.name,
      network: tags.network,
      operator: tags.operator,
      colour: tags.colour,
    },
  };
}

function determineBuildingType(tags: Record<string, string>): BuildingType | null {
  for (const mapping of BUILDING_TAG_MAPPINGS) {
    if (tags[mapping.tag] === mapping.value) {
      return mapping.type as BuildingType;
    }
  }
  return null;
}

function createBuilding(
  osmId: number,
  position: L.LatLngTuple,
  tags: Record<string, string>,
  geometry?: L.LatLngTuple[]
): Building | null {
  const type = determineBuildingType(tags);
  if (!type) return null;

  return {
    id: `building_${osmId}`,
    osmId,
    position,
    geometry,
    type,
    tags: {
      name: tags.name,
      building: tags.building,
      shop: tags.shop,
      amenity: tags.amenity,
    },
  };
}

export function parseOSMResponse(elements: OSMElement[]): Network {
  const nodes = new Map<string, TrafficNode>();
  const links = new Map<string, TrafficLink>();
  const transportRoutes = new Map<string, TransportRoute>();
  const buildings = new Map<string, Building>();
  const osmNodes = indexNodes(elements);
  const osmWays = indexWays(elements);
  const nodeUsage = countNodeUsage(elements);

  for (const el of elements) {
    if (el.type === "way" && el.tags?.highway) {
      const geometry = buildGeometry(el.nodes, osmNodes);
      if (geometry.length < 2) continue;

      const link = createLink(
        { id: el.id, nodes: el.nodes, tags: el.tags },
        geometry
      );
      links.set(link.id, link);

      const endpoints = [el.nodes[0], el.nodes[el.nodes.length - 1]];
      for (const osmId of endpoints) {
        const nodeId = `node_${osmId}`;
        if (nodes.has(nodeId)) continue;

        const osmNode = osmNodes.get(osmId);
        if (osmNode) {
          nodes.set(
            nodeId,
            createNode(osmId, osmNode, nodeUsage.get(osmId) || 1)
          );
        }
      }
    } else if (el.type === "relation" && el.tags?.route) {
      for (const member of el.members) {
        if (member.type !== "way") continue;

        const way = osmWays.get(member.ref);
        if (!way || way.nodes.length < 2) continue;

        const geometry = buildGeometry(way.nodes, osmNodes);
        if (geometry.length < 2) continue;

        const route = createTransportRoute(
          el.id,
          member.ref,
          geometry,
          el.tags
        );
        transportRoutes.set(route.id, route);
      }
    } else if (el.type === "node" && el.tags) {
      const building = createBuilding(el.id, [el.lat, el.lon], el.tags);
      if (building) {
        buildings.set(building.id, building);
      }
    } else if (el.type === "way" && el.tags && !el.tags.highway) {
      const geometry = buildGeometry(el.nodes, osmNodes);
      if (geometry.length < 3) continue;

      const centroid: L.LatLngTuple = [
        geometry.reduce((sum, p) => sum + p[0], 0) / geometry.length,
        geometry.reduce((sum, p) => sum + p[1], 0) / geometry.length,
      ];

      const building = createBuilding(el.id, centroid, el.tags, geometry);
      if (building) {
        buildings.set(building.id, building);
      }
    }
  }

  return { nodes, links, transportRoutes, buildings };
}
