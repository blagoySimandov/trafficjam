import type { Network, TrafficNode, TrafficLink } from "../types";
import type { OSMElement, OSMNode } from "../types/osm";

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
  const osmNodes = indexNodes(elements);
  const nodeUsage = countNodeUsage(elements);

  for (const el of elements) {
    if (el.type !== "way" || !el.tags?.highway) continue;

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
  }

  return { nodes, links };
}
