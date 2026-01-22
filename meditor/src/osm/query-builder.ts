import type { LngLatBounds } from "../types";

const HIGHWAY_TYPES = [
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "service",
  "unclassified",
] as const;

const TRANSPORT_TYPES = ["bus", "tram", "subway", "train", "light_rail"] as const;

export function buildOverpassQuery(bbox: string): string {
  const highwayFilter = HIGHWAY_TYPES.join("|");
  const transportFilter = TRANSPORT_TYPES.join("|");

  return `
    [out:json][timeout:30];
    (
      way["highway"~"^(${highwayFilter})"](${bbox});
      relation["type"="route"]["route"~"^(${transportFilter})"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;
}

export function formatBbox(bounds: LngLatBounds): string {
  return [
    bounds.getSouth(),
    bounds.getWest(),
    bounds.getNorth(),
    bounds.getEast(),
  ].join(",");
}
