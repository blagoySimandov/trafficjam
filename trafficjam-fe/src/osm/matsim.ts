import type { Network, TrafficLink } from "../types";
import { euclideanDistance } from "../utils/coordinates";

function estimateLengthMeters(link: TrafficLink): number {
  const geom = link.geometry;
  if (geom.length < 2) return 100;

  let totalLength = 0;
  for (let i = 0; i < geom.length - 1; i++) {
    totalLength += euclideanDistance(geom[i], geom[i + 1]);
  }
  return totalLength;
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

export function networkToMatsim(network: Network): string {
  const nodesArr = Array.from(network.nodes.values());
  const linksArr = Array.from(network.links.values());

  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE network SYSTEM "http://www.matsim.org/files/dtd/network_v2.dtd">\n`;
  const attrs = `<network name="exported-network">\n  <attributes>\n    <attribute name="coordinateReferenceSystem" class="java.lang.String">${network.crs}</attribute>\n  </attributes>\n`;

  const nodesXml = ["  <nodes>"];
  for (const n of nodesArr) {
    nodesXml.push(
      `    <node id="${n.id}" x="${n.position[0].toFixed(2)}" y="${n.position[1].toFixed(2)}" />`
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
      )}" freespeed="${freespeed.toFixed(2)}" capacity="${capacity}" permlanes="${lanes}" allowedModes="car" />`
    );
  }
  linksXml.push("  </links>");

  const body = [attrs, ...nodesXml, ...linksXml, "</network>"].join("\n");
  return header + body;
}
