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
