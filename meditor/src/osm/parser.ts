import type { Network, TrafficNode, TrafficLink, TransportRoute, Building, BuildingType, ProjectedCoords } from "../types";
import type { OSMElement, OSMNode, OSMWay, OSMRelation } from "../types/osm";
import {
  BUILDING_TAG_MAPPINGS,
  ID_PREFIXES,
  OSM_TAG_VALUES,
  GEOMETRY_VALIDATION,
} from "../constants";
import { wgs84ToProjected } from "../utils/coordinates";

function indexNodes(elements: OSMElement[]): Map<number, OSMNode> {
  const osmNodes = new Map<number, OSMNode>();
  for (const el of elements) {
    if (el.type === OSM_TAG_VALUES.TYPE_NODE) {
      osmNodes.set(el.id, el as OSMNode);
    }
  }
  return osmNodes;
}

function indexWays(elements: OSMElement[]): Map<number, OSMWay> {
  const osmWays = new Map<number, OSMWay>();
  for (const el of elements) {
    if (el.type === OSM_TAG_VALUES.TYPE_WAY) {
      osmWays.set(el.id, el as OSMWay);
    }
  }
  return osmWays;
}

function countNodeUsage(elements: OSMElement[]): Map<number, number> {
  const nodeUsage = new Map<number, number>();
  for (const el of elements) {
    if (el.type === OSM_TAG_VALUES.TYPE_WAY && el.tags?.highway) {
      const way = el as OSMWay;
      for (const nodeId of way.nodes) {
        nodeUsage.set(nodeId, (nodeUsage.get(nodeId) || 0) + 1);
      }
    }
  }
  return nodeUsage;
}

function buildGeometry(
  wayNodes: number[],
  osmNodes: Map<number, OSMNode>,
  targetCRS: string
): ProjectedCoords[] {
  const geometry: ProjectedCoords[] = [];
  for (const nodeId of wayNodes) {
    const osmNode = osmNodes.get(nodeId);
    if (osmNode) {
      // Transform WGS84 → projected CRS at data entry
      const [x, y] = wgs84ToProjected(osmNode.lat, osmNode.lon, targetCRS);
      geometry.push([x, y]);
    }
  }
  return geometry;
}

function createLink(
  way: { id: number; nodes: number[]; tags: Record<string, string> },
  geometry: ProjectedCoords[]
): TrafficLink {
  const fromNodeId = `${ID_PREFIXES.NODE}${way.nodes[0]}`;
  const toNodeId = `${ID_PREFIXES.NODE}${way.nodes[way.nodes.length - 1]}`;

  return {
    id: `${ID_PREFIXES.LINK}${way.id}`,
    osmId: way.id,
    from: fromNodeId,
    to: toNodeId,
    geometry,
    tags: {
      highway: way.tags.highway,
      lanes: way.tags.lanes ? parseInt(way.tags.lanes) : undefined,
      maxspeed: way.tags.maxspeed ? parseInt(way.tags.maxspeed) : undefined,
      oneway: way.tags.oneway === OSM_TAG_VALUES.ONEWAY_YES,
      name: way.tags.name,
    },
  };
}

function createNode(
  osmId: number,
  osmNode: OSMNode,
  connectionCount: number,
  targetCRS: string
): TrafficNode {
  const [x, y] = wgs84ToProjected(osmNode.lat, osmNode.lon, targetCRS);
  return {
    id: `${ID_PREFIXES.NODE}${osmId}`,
    osmId,
    position: [x, y],
    connectionCount,
  };
}

function createTransportRoute(
  relationId: number,
  wayId: number,
  geometry: ProjectedCoords[],
  tags: Record<string, string>
): TransportRoute {
  return {
    id: `${ID_PREFIXES.TRANSPORT}${relationId}${ID_PREFIXES.TRANSPORT_WAY}${wayId}`,
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
  position: ProjectedCoords,
  tags: Record<string, string>,
  geometry?: ProjectedCoords[]
): Building | null {
  const type = determineBuildingType(tags);
  if (!type) return null;

  return {
    id: `${ID_PREFIXES.BUILDING}${osmId}`,
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

export function parseOSMResponse(elements: OSMElement[], targetCRS: string): Network {
  const nodes = new Map<string, TrafficNode>();
  const links = new Map<string, TrafficLink>();
  const transportRoutes = new Map<string, TransportRoute>();
  const buildings = new Map<string, Building>();
  const osmNodes = indexNodes(elements);
  const osmWays = indexWays(elements);
  const nodeUsage = countNodeUsage(elements);

  for (const el of elements) {
    if (el.type === OSM_TAG_VALUES.TYPE_WAY && el.tags?.highway) {
      const way = el as OSMWay;
      const geometry = buildGeometry(way.nodes, osmNodes, targetCRS);
      if (geometry.length < GEOMETRY_VALIDATION.MIN_LINK_POINTS) continue;

      const link = createLink(
        { id: way.id, nodes: way.nodes, tags: way.tags || {} },
        geometry
      );
      links.set(link.id, link);

      const endpoints = [way.nodes[0], way.nodes[way.nodes.length - 1]];
      for (const osmId of endpoints) {
        const nodeId = `${ID_PREFIXES.NODE}${osmId}`;
        if (nodes.has(nodeId)) continue;

        const osmNode = osmNodes.get(osmId);
        if (osmNode) {
          nodes.set(
            nodeId,
            createNode(osmId, osmNode, nodeUsage.get(osmId) || 1, targetCRS)
          );
        }
      }
    } else if (el.type === OSM_TAG_VALUES.TYPE_RELATION && el.tags?.route) {
      const relation = el as OSMRelation;
      for (const member of relation.members) {
        if (member.type !== OSM_TAG_VALUES.TYPE_WAY) continue;

        const way = osmWays.get(member.ref);
        if (!way || way.nodes.length < GEOMETRY_VALIDATION.MIN_ROUTE_POINTS) continue;

        const geometry = buildGeometry(way.nodes, osmNodes, targetCRS);
        if (geometry.length < GEOMETRY_VALIDATION.MIN_ROUTE_POINTS) continue;

        const route = createTransportRoute(
          relation.id,
          member.ref,
          geometry,
          relation.tags || {}
        );
        transportRoutes.set(route.id, route);
      }
    } else if (el.type === OSM_TAG_VALUES.TYPE_NODE && el.tags) {
      const node = el as OSMNode;
      const [x, y] = wgs84ToProjected(node.lat, node.lon, targetCRS);
      const building = createBuilding(node.id, [x, y], node.tags || {});
      if (building) {
        buildings.set(building.id, building);
      }
    } else if (el.type === OSM_TAG_VALUES.TYPE_WAY && el.tags && !el.tags.highway) {
      const way2 = el as OSMWay;
      const geometry = buildGeometry(way2.nodes, osmNodes, targetCRS);
      if (geometry.length < GEOMETRY_VALIDATION.MIN_BUILDING_POLYGON_POINTS) continue;

      // Calculate centroid - already in projected coordinates
      const centroid: ProjectedCoords = [
        geometry.reduce((sum, p) => sum + p[0], 0) / geometry.length,
        geometry.reduce((sum, p) => sum + p[1], 0) / geometry.length,
      ];

      const building = createBuilding(way2.id, centroid, way2.tags || {}, geometry);
      if (building) {
        buildings.set(building.id, building);
      }
    }
  }

  return { nodes, links, transportRoutes, buildings, crs: targetCRS };
}
