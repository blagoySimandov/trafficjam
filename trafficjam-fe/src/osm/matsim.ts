import type { Network, TrafficLink } from "../types";

const METERS_PER_DEGREE = 111319.49;

function haversineMeters(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon),
      Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)),
    );
  return R * c;
}

function projectToLocal(lat: number, lng: number, centerLat: number, centerLng: number) {
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  return {
    x: (lng - centerLng) * METERS_PER_DEGREE * cosLat,
    y: (lat - centerLat) * METERS_PER_DEGREE,
  };
}

function getFreespeedMs(link: TrafficLink) {
  return (link.tags.maxspeed ?? 50) / 3.6;
}

function getLanes(link: TrafficLink) {
  return link.tags.lanes ?? 1;
}

function calculateCapacity(link: TrafficLink) {
  return Math.round(1200 * getLanes(link));
}

function buildGeomNodes(link: TrafficLink, centerLat: number, centerLng: number) {
  return link.geometry.slice(1, -1).map(([lat, lng], i) => {
    const { x, y } = projectToLocal(lat, lng, centerLat, centerLng);
    return { id: `${link.id}_g${i}`, x, y };
  });
}

function buildSubLinks(link: TrafficLink, geomNodeIds: string[]): string[] {
  const allIds = [link.from, ...geomNodeIds, link.to];
  const freespeed = getFreespeedMs(link).toFixed(2);
  const capacity = calculateCapacity(link);
  const modes = link.disabled ? "walk" : "car";
  const oneway = link.tags.oneway ? "1" : "2";
  const lanes = getLanes(link);
  return allIds.slice(0, -1).map((fromId, i) => {
    const length = haversineMeters(link.geometry[i], link.geometry[i + 1]).toFixed(2);
    return `    <link id="${link.id}_${i}" from="${fromId}" to="${allIds[i + 1]}" length="${length}" freespeed="${freespeed}" capacity="${capacity}" permlanes="${lanes}" oneway="${oneway}" modes="${modes}" />`;
  });
}

function largestWeaklyConnectedComponent(network: Network): Set<string> {
  const adj = new Map<string, Set<string>>();
  for (const id of network.nodes.keys()) adj.set(id, new Set());
  for (const l of network.links.values()) {
    adj.get(l.from)?.add(l.to);
    adj.get(l.to)?.add(l.from);
  }
  const visited = new Set<string>();
  const components: Set<string>[] = [];
  for (const id of network.nodes.keys()) {
    if (visited.has(id)) continue;
    const component = new Set<string>();
    const stack = [id];
    while (stack.length) {
      const node = stack.pop()!;
      if (visited.has(node)) continue;
      visited.add(node);
      component.add(node);
      for (const neighbor of adj.get(node) ?? []) stack.push(neighbor);
    }
    components.push(component);
  }
  return components.reduce((a, b) => (a.size > b.size ? a : b), new Set());
}

function expandLink(
  l: TrafficLink,
  network: Network,
  nodesXml: string[],
  linksXml: string[],
  centerLat: number,
  centerLng: number,
) {
  if (!network.nodes.has(l.from) || !network.nodes.has(l.to)) return;
  const geomNodes = buildGeomNodes(l, centerLat, centerLng);
  for (const gn of geomNodes) {
    nodesXml.push(`    <node id="${gn.id}" x="${gn.x.toFixed(2)}" y="${gn.y.toFixed(2)}" />`);
  }
  for (const sl of buildSubLinks(l, geomNodes.map((n) => n.id))) {
    linksXml.push(sl);
  }
}

export function networkToMatsim(network: Network, crs = "EPSG:4326"): string {
  const keepNodes = largestWeaklyConnectedComponent(network);
  const nodesArr = Array.from(network.nodes.values()).filter((n) => keepNodes.has(n.id));
  const linksArr = Array.from(network.links.values()).filter((l) => keepNodes.has(l.from) && keepNodes.has(l.to));
  const centerLat = nodesArr.reduce((s, n) => s + n.position[0], 0) / nodesArr.length;
  const centerLng = nodesArr.reduce((s, n) => s + n.position[1], 0) / nodesArr.length;

  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">\n`;
  const attrs = `<network name="exported-network">\n  <attributes>\n    <attribute name="coordinateReferenceSystem" class="java.lang.String">${crs}</attribute>\n  </attributes>\n`;

  const nodesXml = ["  <nodes>"];
  for (const n of nodesArr) {
    const { x, y } = projectToLocal(n.position[0], n.position[1], centerLat, centerLng);
    nodesXml.push(`    <node id="${n.id}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" />`);
  }

  const linksXml = ["  <links>"];
  for (const l of linksArr) {
    expandLink(l, network, nodesXml, linksXml, centerLat, centerLng);
  }

  nodesXml.push("  </nodes>");
  linksXml.push("  </links>");

  const body = [attrs, ...nodesXml, ...linksXml, "</network>"].join("\n");
  return header + body;
}
