import type { OSMResponse } from "../types/osm";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

export async function fetchFromOverpass(query: string): Promise<OSMResponse> {
  const response = await fetch(OVERPASS_API_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  return response.json();
}
