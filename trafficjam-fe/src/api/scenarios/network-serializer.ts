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
  return !!config && !!config.nodes && Object.keys(config.nodes as object).length > 0;
}
