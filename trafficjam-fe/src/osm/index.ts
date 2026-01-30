import type { Network, LngLatBounds } from "../types";
import { fetchFromOverpass } from "./api";
import { parseOSMResponse } from "./parser";
import { buildOverpassQuery, formatBbox } from "./query-builder";
import { detectProjectedCRS, getCRSName } from "../utils/coordinates";

export async function fetchOSMData(bounds: LngLatBounds): Promise<Network> {
  // Convert bounds to coordinate bounds format for CRS detection
  const coordBounds = {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };

  // Auto-detect the best projected CRS for this region
  const targetCRS = detectProjectedCRS(coordBounds);
  console.log(`Detected CRS: ${targetCRS} (${getCRSName(targetCRS)})`);

  const bbox = formatBbox(bounds);
  const query = buildOverpassQuery(bbox);
  const data = await fetchFromOverpass(query);
  return parseOSMResponse(data.elements, targetCRS);
}

export { fetchFromOverpass } from "./api";
export { parseOSMResponse } from "./parser";
export { buildOverpassQuery, formatBbox } from "./query-builder";
export { networkToMatsim } from "./matsim";
