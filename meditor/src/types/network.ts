import type * as L from "leaflet";

export interface TrafficNode {
  id: string;
  osmId: number;
  position: L.LatLngTuple;
  connectionCount: number;
}

export interface TrafficLink {
  id: string;
  osmId: number;
  from: string;
  to: string;
  geometry: L.LatLngTuple[];
  tags: {
    highway: string;
    lanes?: number;
    maxspeed?: number;
    oneway?: boolean;
    name?: string;
  };
}

export interface Network {
  nodes: Map<string, TrafficNode>;
  links: Map<string, TrafficLink>;
}
