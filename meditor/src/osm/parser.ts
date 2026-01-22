import type { Network, TrafficNode, TrafficLink, Building, BusRoute } from "../types";
import type { OSMElement, OSMNode, OSMRelation } from "../types/osm";

function indexNodes(elements: OSMElement[]): Map<number, OSMNode> {
  const osmNodes = new Map<number, OSMNode>();
  for (const el of elements) {
    if (el.type === "node") {
      osmNodes.set(el.id, el);
    }
  }
  return osmNodes;
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

function buildConnectedRouteGeometry(
  wayMembers: Array<{ type: "node" | "way"; ref: number; role: string }>,
  elements: OSMElement[],
  osmNodes: Map<number, OSMNode>
): L.LatLngTuple[] {
  const geometry: L.LatLngTuple[] = [];

  for (let i = 0; i < wayMembers.length; i++) {
    const member = wayMembers[i];
    const way = elements.find(
      (e) => e.type === "way" && e.id === member.ref
    );

    if (!way || way.type !== "way") continue;

    const wayGeometry = buildGeometry(way.nodes, osmNodes);
    if (wayGeometry.length === 0) continue;

    if (geometry.length === 0) {
      geometry.push(...wayGeometry);
    } else {
      const lastPoint = geometry[geometry.length - 1];
      const firstPoint = wayGeometry[0];
      const lastPointReversed = wayGeometry[wayGeometry.length - 1];

      const distanceToFirst = Math.sqrt(
        Math.pow(lastPoint[0] - firstPoint[0], 2) +
        Math.pow(lastPoint[1] - firstPoint[1], 2)
      );

      const distanceToLast = Math.sqrt(
        Math.pow(lastPoint[0] - lastPointReversed[0], 2) +
        Math.pow(lastPoint[1] - lastPointReversed[1], 2)
      );

      const maxDistance = 0.001;

      if (distanceToFirst < maxDistance) {
        geometry.push(...wayGeometry.slice(1));
      } else if (distanceToLast < maxDistance) {
        geometry.push(...wayGeometry.reverse().slice(1));
      }
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

export function parseOSMResponse(elements: OSMElement[]): Network {
  const nodes = new Map<string, TrafficNode>();
  const links = new Map<string, TrafficLink>();
  const buildings = new Map<string, Building>();
  const busRoutes = new Map<string, BusRoute>();
  const osmNodes = indexNodes(elements);
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
    } else if (el.type === "way" && el.tags?.building) {
      const geometry = buildGeometry(el.nodes, osmNodes);
      if (geometry.length < 2) continue;

      const building: Building = {
        id: `building_${el.id}`,
        osmId: el.id,
        type: "way",
        geometry,
        tags: {
          building: el.tags.building,
          amenity: el.tags.amenity,
          name: el.tags.name,
        },
      };
      buildings.set(building.id, building);
    } else if (el.type === "node" && el.tags?.amenity) {
      const building: Building = {
        id: `building_${el.id}`,
        osmId: el.id,
        type: "node",
        position: [el.lat, el.lon],
        tags: {
          amenity: el.tags.amenity,
          name: el.tags.name,
        },
      };
      buildings.set(building.id, building);
    } else if (el.type === "relation" && el.tags?.route) {
      const routeType = el.tags.route;
      if (!["bus", "tram", "subway", "train"].includes(routeType)) continue;

      const wayMembers = el.members.filter((m) => m.type === "way");
      const geometry = buildConnectedRouteGeometry(wayMembers, elements, osmNodes);

      if (geometry.length > 0) {
        const busRoute: BusRoute = {
          id: `route_${el.id}`,
          osmId: el.id,
          name: el.tags.name || `${routeType} Route`,
          ref: el.tags.ref,
          operator: el.tags.operator,
          from: el.tags.from,
          to: el.tags.to,
          routeType,
          geometry,
        };
        busRoutes.set(busRoute.id, busRoute);
      }
    }
  }

  return { nodes, links, buildings, busRoutes };
}
