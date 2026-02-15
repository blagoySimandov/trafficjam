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
  const c = 2 * Math.atan2(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon), Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)));
  return R * c;
}

function estimateLengthMeters(link: TrafficLink) {
  const geom = link.geometry;
  if (geom.length < 2) return 100;
  const a = geom[0];
  const b = geom[geom.length - 1];
  return haversineMeters([a[0], a[1]], [b[0], b[1]]);
}

function getFreespeedMs(link: TrafficLink) {
  const kph = link.tags.maxspeed ?? 50;
  return Number(kph) / 3.6;
}

function getLanes(link: TrafficLink) {
  return link.tags.lanes ?? 1;
}

function calculateCapacity(link: TrafficLink) {
  const lanes = getLanes(link);
  const perLane = 1200;
  return Math.round(perLane * lanes);
}

export function networkToMatsim(network: Network, crs = "EPSG:4326"): string {
  const nodesArr = Array.from(network.nodes.values());
  const linksArr = Array.from(network.links.values());

  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">\n`;
  const attrs = `<network name="exported-network">\n  <attributes>\n    <attribute name="coordinateReferenceSystem" class="java.lang.String">${crs}</attribute>\n  </attributes>\n`;

  const nodesXml = ["  <nodes>"];
  for (const n of nodesArr) {
    // note: MATSim expects x=lon, y=lat commonly when using EPSG:4326
    nodesXml.push(
      `    <node id="${n.id}" x="${n.position[1].toFixed(6)}" y="${n.position[0].toFixed(6)}" />`
    );
  }
  nodesXml.push("  </nodes>");

  const linksXml = ["  <links>"];
  for (const l of linksArr) {
    const length = estimateLengthMeters(l);
    const freespeed = getFreespeedMs(l);
    const lanes = getLanes(l);
    const capacity = calculateCapacity(l);

    linksXml.push(
      `    <link id="${l.id}" from="${l.from}" to="${l.to}" length="${length.toFixed(
        2
      )}" freespeed="${freespeed.toFixed(2)}" capacity="${capacity}" permlanes="${lanes}" modes="car" />`
    );
  }
  linksXml.push("  </links>");

  const body = [attrs, ...nodesXml, ...linksXml, "</network>"].join("\n");
  return header + body;
}