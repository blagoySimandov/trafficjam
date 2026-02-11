import { fetchFromOverpass } from "./api";
import { parseOSMResponse } from "./parser";
import { buildOverpassQuery, formatBbox } from "./query-builder";

export async function fetchOSMData(bounds) {
  const bbox = formatBbox(bounds);
  const query = buildOverpassQuery(bbox);
  const data = await fetchFromOverpass(query);
  return parseOSMResponse(data.elements);
}

export { fetchFromOverpass } from "./api";
export { parseOSMResponse } from "./parser";
export { buildOverpassQuery, formatBbox } from "./query-builder";
