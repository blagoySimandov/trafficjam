import type { LngLatBounds } from "../types";
import {
  HIGHWAY_TYPES,
  TRANSPORT_TYPES,
  BUILDING_QUERIES,
  OSM_ELEMENT_TYPES,
  OVERPASS_TIMEOUT,
  OVERPASS_OUTPUT_FORMAT,
} from "../constants";

function generateBuildingQueries(bbox: string): string {
  const queries: string[] = [];

  for (const elementType of OSM_ELEMENT_TYPES) {
    for (const { tag, value } of BUILDING_QUERIES) {
      queries.push(`${elementType}["${tag}"="${value}"](${bbox});`);
    }
  }

  return queries.join("\n      ");
}

export function buildOverpassQuery(bbox: string): string {
  const highwayFilter = HIGHWAY_TYPES.join("|");
  const transportFilter = TRANSPORT_TYPES.join("|");
  const buildingQueries = generateBuildingQueries(bbox);

  return `
    [out:${OVERPASS_OUTPUT_FORMAT}][timeout:${OVERPASS_TIMEOUT}];
    (
      way["highway"~"^(${highwayFilter})"](${bbox});
      relation["type"="route"]["route"~"^(${transportFilter})"](${bbox});
      ${buildingQueries}
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
