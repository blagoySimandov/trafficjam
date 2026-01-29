import type { Network } from "../types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export interface ExportResponse {
  status: string;
  agent_count: number;
  files_created: Record<string, string>;
  bounds: Record<string, number>;
  user_id?: string;
  try_number?: number;
}

function getUserId(): string {
  let userId = localStorage.getItem('trafficjam_user_id');

  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('trafficjam_user_id', userId);
  }

  return userId;
}

function getCountryInfoFromCRS(crs: string): { countryCode: string; countryName: string } {
  // Map CRS to country info
  const crsToCountry: Record<string, { countryCode: string; countryName: string }> = {
    'EPSG:2157': { countryCode: 'IRL', countryName: 'Ireland' },
    'EPSG:27700': { countryCode: 'GBR', countryName: 'United Kingdom' },
    'EPSG:28992': { countryCode: 'NLD', countryName: 'Netherlands' },
    'EPSG:2154': { countryCode: 'FRA', countryName: 'France' },
    'EPSG:25832': { countryCode: 'DEU', countryName: 'Germany' },
    'EPSG:25830': { countryCode: 'ESP', countryName: 'Spain' },
    'EPSG:3763': { countryCode: 'PRT', countryName: 'Portugal' },
    'EPSG:32632': { countryCode: 'ITA', countryName: 'Italy' },
  };

  // For USA, CRS is dynamic (EPSG:326XX)
  if (crs.startsWith('EPSG:326')) {
    return { countryCode: 'USA', countryName: 'United States' };
  }

  return crsToCountry[crs] || { countryCode: 'UNK', countryName: 'Unknown' };
}

export async function exportNetworkToBackend(
  network: Network,
  bounds: { north: number; south: number; east: number; west: number }
): Promise<ExportResponse> {
  const buildings = Array.from(network.buildings?.values() || []).map((b) => ({
    id: b.id,
    osmId: b.osmId,
    position: b.position,
    type: b.type,
    geometry: b.geometry,
    tags: b.tags,
  }));

  const nodes = Array.from(network.nodes.values()).map((n) => ({
    id: n.id,
    osmId: n.osmId,
    position: n.position,
    connectionCount: n.connectionCount,
  }));

  const links = Array.from(network.links.values()).map((l) => ({
    id: l.id,
    osmId: l.osmId,
    from_node: l.from,
    to_node: l.to,
    geometry: l.geometry,
    tags: l.tags,
  }));

  const transportRoutes = Array.from(network.transportRoutes?.values() || []).map((r) => ({
    id: r.id,
    osmId: r.osmId,
    wayId: r.wayId,
    geometry: r.geometry,
    tags: r.tags,
  }));

  const userId = getUserId();

  // Detect country info from CRS
  const countryInfo = getCountryInfoFromCRS(network.crs);

  const payload = {
    bounds,
    buildings,
    nodes,
    links,
    transportRoutes,
    userId,
    crs: network.crs,
    countryCode: countryInfo.countryCode,
    countryName: countryInfo.countryName,
  };

  const response = await fetch(`${BACKEND_URL}/api/network/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to export network: ${error}`);
  }

  return response.json();
}
