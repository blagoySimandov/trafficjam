import type { Network, TrafficNode, TrafficLink, TransportRoute, Building } from "../../types";

function mapToRecord<T>(map: Map<string, T>): Record<string, T> {
  return Object.fromEntries(map);
}

function recordToMap<T>(record: Record<string, T> | undefined): Map<string, T> {
  return new Map(Object.entries(record ?? {}));
}

export function serializeNetwork(network: Network): Record<string, unknown> {
  return {
    nodes: mapToRecord(network.nodes),
    links: mapToRecord(network.links),
    transportRoutes: network.transportRoutes ? mapToRecord(network.transportRoutes) : undefined,
    buildings: network.buildings ? mapToRecord(network.buildings) : undefined,
  };
}

export function deserializeNetwork(data: Record<string, unknown>): Network {
  return {
    nodes: recordToMap(data.nodes as Record<string, TrafficNode>),
    links: recordToMap(data.links as Record<string, TrafficLink>),
    transportRoutes: data.transportRoutes
      ? recordToMap(data.transportRoutes as Record<string, TransportRoute>)
      : undefined,
    buildings: data.buildings
      ? recordToMap(data.buildings as Record<string, Building>)
      : undefined,
  };
}

export function isNonEmptyNetworkConfig(config: Record<string, unknown> | null | undefined): boolean {
  if (!config) return false;
  if (config.links && Object.keys(config.links as object).length > 0) return true;
  if (config.nodes && Object.keys(config.nodes as object).length > 0) return true;
  if (config.buildings && Object.keys(config.buildings as object).length > 0) return true;
  return false;
}

export function computeLinksDiff(
  base: Network,
  edited: Network,
): Record<string, TrafficLink> {
  const diff: Record<string, TrafficLink> = {};
  for (const [id, link] of edited.links) {
    const baseLink = base.links.get(id);
    if (!baseLink || JSON.stringify(baseLink) !== JSON.stringify(link)) {
      diff[id] = link;
    }
  }
  return diff;
}

export function applyLinksDiff(
  base: Network,
  diff: Record<string, TrafficLink>,
): Network {
  const mergedLinks = new Map(base.links);
  for (const [id, link] of Object.entries(diff)) {
    mergedLinks.set(id, link);
  }
  return { ...base, links: mergedLinks };
}

export function computeBuildingsDiff(
  base: Network,
  edited: Network,
): Record<string, Building> {
  const diff: Record<string, Building> = {};
  if (!edited.buildings) return diff;
  for (const [id, building] of edited.buildings) {
    const baseHotspot = base.buildings?.get(id)?.hotspot;
    if (JSON.stringify(baseHotspot) !== JSON.stringify(building.hotspot)) {
      diff[id] = building;
    }
  }
  return diff;
}

export function applyBuildingsDiff(
  base: Network,
  diff: Record<string, Building>,
): Network {
  if (!base.buildings) return base;
  const mergedBuildings = new Map(base.buildings);
  for (const [id, building] of Object.entries(diff)) {
    mergedBuildings.set(id, building);
  }
  return { ...base, buildings: mergedBuildings };
}
