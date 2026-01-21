import type { Network, TrafficNode, TrafficLink } from "./types";

interface OSMNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OSMWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

type OSMElement = OSMNode | OSMWay;

export async function fetchOSMData(bounds: L.LatLngBounds): Promise<Network> {
  const bbox = [
    bounds.getSouth(),
    bounds.getWest(),
    bounds.getNorth(),
    bounds.getEast(),
  ].join(",");

  const query = `
    [out:json][timeout:30];
    (
      way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|residential|service|unclassified)"](${bbox});
      node(w);
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();
  return parseOSMResponse(data.elements);
}

function parseOSMResponse(elements: OSMElement[]): Network {
  const nodes = new Map<string, TrafficNode>();
  const links = new Map<string, TrafficLink>();

  // Index all OSM nodes by ID
  const osmNodes = new Map<number, OSMNode>();
  for (const el of elements) {
    if (el.type === "node") {
      osmNodes.set(el.id, el);
    }
  }

  // Track which nodes are used by ways (for connection counting)
  const nodeUsage = new Map<number, number>();

  // First pass: count node usage
  for (const el of elements) {
    if (el.type === "way" && el.tags?.highway) {
      for (const nodeId of el.nodes) {
        nodeUsage.set(nodeId, (nodeUsage.get(nodeId) || 0) + 1);
      }
    }
  }

  // Second pass: create links and nodes
  for (const el of elements) {
    if (el.type !== "way" || !el.tags?.highway) continue;

    const wayNodes = el.nodes;
    const geometry: L.LatLngTuple[] = [];

    for (const nodeId of wayNodes) {
      const osmNode = osmNodes.get(nodeId);
      if (osmNode) {
        geometry.push([osmNode.lat, osmNode.lon]);
      }
    }

    if (geometry.length < 2) continue;

    // Create link
    const linkId = `link_${el.id}`;
    const fromNodeId = `node_${wayNodes[0]}`;
    const toNodeId = `node_${wayNodes[wayNodes.length - 1]}`;

    links.set(linkId, {
      id: linkId,
      osmId: el.id,
      from: fromNodeId,
      to: toNodeId,
      geometry,
      tags: {
        highway: el.tags.highway,
        lanes: el.tags.lanes ? parseInt(el.tags.lanes) : undefined,
        maxspeed: el.tags.maxspeed ? parseInt(el.tags.maxspeed) : undefined,
        oneway: el.tags.oneway === "yes",
        name: el.tags.name,
      },
    });

    // Create endpoint nodes
    const endpoints = [wayNodes[0], wayNodes[wayNodes.length - 1]];
    for (const osmId of endpoints) {
      const nodeId = `node_${osmId}`;
      if (!nodes.has(nodeId)) {
        const osmNode = osmNodes.get(osmId);
        if (osmNode) {
          nodes.set(nodeId, {
            id: nodeId,
            osmId,
            position: [osmNode.lat, osmNode.lon],
            connectionCount: nodeUsage.get(osmId) || 1,
          });
        }
      }
    }
  }

  return { nodes, links };
}
