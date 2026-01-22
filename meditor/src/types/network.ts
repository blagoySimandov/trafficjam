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

export interface Building {
  id: string;
  osmId: number;
  type: "node" | "way";
  position?: L.LatLngTuple;
  geometry?: L.LatLngTuple[];
  tags: {
    building?: string;
    amenity?: string;
    name?: string;
  };
}

export interface BusRoute {
  id: string;
  osmId: number;
  name: string;
  ref?: string;
  operator?: string;
  from?: string;
  to?: string;
  routeType: string;
  geometry: L.LatLngTuple[];
}

export interface Network {
  nodes: Map<string, TrafficNode>;
  links: Map<string, TrafficLink>;
  buildings: Map<string, Building>;
  busRoutes: Map<string, BusRoute>;
}
