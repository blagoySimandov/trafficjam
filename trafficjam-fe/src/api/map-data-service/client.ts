import type { Network, LngLatBounds } from "../../types";
import { mapNetworkResponse } from "./decoder";
import type { ApiNetworkResponse } from "./types";

const BASE_URL =
  import.meta.env.VITE_MAP_DATA_SERVICE_URL || "http://localhost:8000";

function buildQueryParams(bounds: LngLatBounds): string {
  const params = new URLSearchParams({
    min_lat: bounds.getSouth().toString(),
    min_lng: bounds.getWest().toString(),
    max_lat: bounds.getNorth().toString(),
    max_lng: bounds.getEast().toString(),
  });
  return params.toString();
}

function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Map data service error: ${response.status}`);
  }
}

async function fetchNetworkData(bounds: LngLatBounds): Promise<Network> {
  const query = buildQueryParams(bounds);
  const response = await fetch(`${BASE_URL}/network?${query}`);
  assertOk(response);
  const data: ApiNetworkResponse = await response.json();
  return mapNetworkResponse(data);
}

export { fetchNetworkData };
export const mapDataApi = { fetchNetworkData };
