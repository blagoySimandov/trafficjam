export type Coordinate = [number, number];

export interface TrafficNode {
  id: string;
  osmId: number;
  position: Coordinate;
  connectionCount: number;
}

export interface TrafficLink {
  id: string;
  osmId: number;
  from: string;
  to: string;
  geometry: Coordinate[];
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
  osmId: number;
  wayId: number;
  geometry: Coordinate[];
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
  osmId: number;
  position: Coordinate;
  geometry?: Coordinate[];
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
