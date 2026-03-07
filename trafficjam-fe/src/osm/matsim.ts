import type { Network, TrafficLink } from "../types";

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

/**
 * Extracts and converts the theoretical maximum speed from OSM tags.
 * Default is an assumed 50 km/h if unlabelled.
 * 
 * @param link - The map link containing the OpenStreetMap tag payload.
 * @returns The freespeed in meters per second, required by the MATSim standard.
 */
function getFreespeedMs(link: TrafficLink) {
  return (link.tags.maxspeed ?? 50) / 3.6;
}

function getLanes(link: TrafficLink) {
  return link.tags.lanes ?? 1;
}

/**
 * Approximates the flow capacity of a road link per hour based on lane count.
 * 
 * @param link - The internal traffic link representation.
 * @returns An integer capacity estimate (e.g., 1200 vehicles/hr per lane).
 */
function calculateCapacity(link: TrafficLink) {
  return Math.round(1200 * getLanes(link));
}

/**
 * Dynamically injects intermediate 'geometry' nodes onto long, curved paths.
 * 
 * MATSim only calculates physics *between* nodes. For long, curved rural or 
 * highway road links, we insert pseudo-nodes every 4th lat/lng point so MATSim 
 * agents actually follow the physical curve instead of cutting straight through it.
 * 
 * @param link - The original long OSM link containing an array of curved lat/lng vectors.
 * @returns An array of new synthetic SubNodes to inject into the XML network.
 */
function buildGeomNodes(link: TrafficLink) {
  return link.geometry.slice(1, -1).filter((_, i) => i % 4 === 0).map(([lat, lng], i) => ({
    id: `${link.id}_g${i}`,
    x: lng,
    y: lat,
  }));
}

function sampledGeom(link: TrafficLink): [number, number][] {
  const inner = link.geometry.slice(1, -1).filter((_, i) => i % 4 === 0);
  return [link.geometry[0], ...inner, link.geometry[link.geometry.length - 1]];
}

function buildSubLinks(link: TrafficLink, allIds: string[]): string[] {
  const freespeed = getFreespeedMs(link).toFixed(2);
  const capacity = calculateCapacity(link);
  const modes = link.disabled ? "walk" : "car";
  const lanes = getLanes(link);
  const geom = sampledGeom(link);
  return allIds.slice(0, -1).map((fromId, i) => {
    const length = haversineMeters(geom[i], geom[i + 1]).toFixed(2);
    const linkAttrs = `length="${length}" freespeed="${freespeed}" capacity="${capacity}" permlanes="${lanes}" oneway="1" modes="${modes}"`;
    return `    <link id="${link.id}_${i}" from="${fromId}" to="${allIds[i + 1]}" ${linkAttrs} />`;
  });
}

function buildRevSubLinks(link: TrafficLink, allIds: string[]): string[] {
  const freespeed = getFreespeedMs(link).toFixed(2);
  const capacity = calculateCapacity(link);
  const modes = link.disabled ? "walk" : "car";
  const lanes = getLanes(link);
  const reversed = [...allIds].reverse();
  const reversedGeom = [...sampledGeom(link)].reverse();
  return reversed.slice(0, -1).map((fromId, i) => {
    const length = haversineMeters(reversedGeom[i], reversedGeom[i + 1]).toFixed(2);
    const linkAttrs = `length="${length}" freespeed="${freespeed}" capacity="${capacity}" permlanes="${lanes}" oneway="1" modes="${modes}"`;
    return `    <link id="${link.id}_rev_${i}" from="${fromId}" to="${reversed[i + 1]}" ${linkAttrs} />`;
  });
}

/**
 * Mutates the string accumulators to add MATSim XML strings for a translated `TrafficLink`.
 * Handles the logic required for breaking a link via `buildGeomNodes` and creating
 * reverse traffic flows for bidirectional (non-oneway) streets.
 * 
 * @param l - The link to process.
 * @param network - The overall Network object confirming node existence.
 * @param nodesXml - A mutable array gathering all raw `<node>` XML strings.
 * @param linksXml - A mutable array gathering all raw `<link>` XML strings.
 */
function expandLink(l: TrafficLink, network: Network, nodesXml: string[], linksXml: string[]) {
  if (!network.nodes.has(l.from) || !network.nodes.has(l.to)) return;
  const geomNodes = buildGeomNodes(l);
  for (const gn of geomNodes) {
    nodesXml.push(`    <node id="${gn.id}" x="${gn.x.toFixed(6)}" y="${gn.y.toFixed(6)}" />`);
  }
  const allIds = [l.from, ...geomNodes.map((n) => n.id), l.to];
  for (const sl of buildSubLinks(l, allIds)) linksXml.push(sl);
  if (!l.tags.oneway) {
    for (const sl of buildRevSubLinks(l, allIds)) linksXml.push(sl);
  }
}

/**
 * The master translation pipeline converts the frontend's internal geographic `Network`
 * state directly into the raw XML `network.xml` required by the Java MATSim Engine.
 * 
 * Uses memory-efficient array accumulation to avoid large string concatenations 
 * impacting the main browser UI thread.
 * 
 * @param network - The frontend Network representation (derived from OpenStreetMap).
 * @param crs - Coordinate Reference System, defaulted to WebMercator (WGS84) `EPSG:4326`.
 * @returns The fully formatted, DTD-compliant raw XML string for `network.xml`.
 */
export function networkToMatsim(network: Network, crs = "EPSG:4326"): string {
  const nodesArr = Array.from(network.nodes.values());
  const linksArr = Array.from(network.links.values());

  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">\n`;
  const networkAttrs = `<network name="exported-network">\n  <attributes>\n    <attribute name="coordinateReferenceSystem" class="java.lang.String">${crs}</attribute>\n  </attributes>\n`;

  const nodesXml = ["  <nodes>"];
  for (const n of nodesArr) {
    const x = n.position[1];
    const y = n.position[0];
    nodesXml.push(`    <node id="${n.id}" x="${x.toFixed(6)}" y="${y.toFixed(6)}" />`);
  }

  const linksXml = ["  <links>"];
  for (const l of linksArr) {
    expandLink(l, network, nodesXml, linksXml);
  }

  nodesXml.push("  </nodes>");
  linksXml.push("  </links>");

  const body = [networkAttrs, ...nodesXml, ...linksXml, "</network>"].join("\n");
  return header + body;
}
