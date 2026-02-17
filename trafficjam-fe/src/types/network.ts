export type LngLatTuple = [number, number];

export interface TrafficNode {
  id: string;
  position: LngLatTuple;
  connectionCount: number;
}

export interface TrafficLink {
  id: string;
  from: string;
  to: string;
  geometry: LngLatTuple[];
  tags: {
    highway: string;
    lanes?: number;
    maxspeed?: number;
    oneway?: boolean;
    name?: string;
  };
}

export interface TransportRoute {
  id: string;
  geometry: LngLatTuple[][];
  tags: {
    route: string;
    ref?: string;
    name?: string;
    network?: string;
    operator?: string;
    colour?: string;
  };
}

export type BuildingType = "retail" | "apartments" | "supermarket" | "school" | "kindergarten" | "parking";

export interface Building {
  id: string;
  position: LngLatTuple;
  geometry?: LngLatTuple[];
  type: BuildingType;
  tags: {
    name?: string;
    building?: string;
    shop?: string;
    amenity?: string;
  };
}

export interface Network {
  nodes: Map<string, TrafficNode>;
  links: Map<string, TrafficLink>;
  transportRoutes?: Map<string, TransportRoute>;
  buildings?: Map<string, Building>;
}

export interface LngLatBounds {
  getSouth(): number;
  getWest(): number;
  getNorth(): number;
  getEast(): number;
}

export interface CombinedHoverInfo {
  link?: TrafficLink;
  routes: TransportRoute[];
  building?: Building;
  longitude: number;
  latitude: number;
}
