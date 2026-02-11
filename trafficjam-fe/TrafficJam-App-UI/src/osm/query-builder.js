import {
  HIGHWAY_TYPES,
  TRANSPORT_TYPES,
  BUILDING_QUERIES,
  OSM_ELEMENT_TYPES,
  OVERPASS_TIMEOUT,
  OVERPASS_OUTPUT_FORMAT,
} from "./constants";

function generateBuildingQueries(bbox) {
  const queries = [];

  for (const elementType of OSM_ELEMENT_TYPES) {
    for (const { tag, value } of BUILDING_QUERIES) {
      queries.push(`${elementType}["${tag}"="${value}"](${bbox});`);
    }
  }

  return queries.join("\n      ");
}

export function buildOverpassQuery(bbox) {
  const highwayFilter = HIGHWAY_TYPES.join("|");

  // Simplified query - ONLY roads, no buildings or transport routes to reduce server load
  return `
    [out:${OVERPASS_OUTPUT_FORMAT}][timeout:${OVERPASS_TIMEOUT}];
    (
      way["highway"~"^(${highwayFilter})"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;
}

export function formatBbox(bounds) {
  return [
    bounds.getSouth(),
    bounds.getWest(),
    bounds.getNorth(),
    bounds.getEast(),
  ].join(",");
}
