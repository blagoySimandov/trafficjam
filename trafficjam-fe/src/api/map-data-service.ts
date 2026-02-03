import type { LngLatBounds, Network } from "../types";
import type { NetworkResponse } from "./types";
import { decodeNetworkResponse } from "./decoder";

export class MapDataClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      import.meta.env.VITE_MAP_DATA_SERVICE_URL ||
      "http://localhost:8000";
  }

  async fetchNetwork(bounds: LngLatBounds): Promise<Network> {
    const params = new URLSearchParams({
      min_lat: bounds.getSouth().toString(),
      min_lng: bounds.getWest().toString(),
      max_lat: bounds.getNorth().toString(),
      max_lng: bounds.getEast().toString(),
    });

    const response = await fetch(`${this.baseUrl}/network?${params}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Map data service error: ${response.status} - ${error}`);
    }

    const data: NetworkResponse = await response.json();
    return decodeNetworkResponse(data);
  }
}

const defaultClient = new MapDataClient();

export async function fetchNetworkData(bounds: LngLatBounds): Promise<Network> {
  return defaultClient.fetchNetwork(bounds);
}

