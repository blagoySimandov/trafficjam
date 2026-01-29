/**
 * Coordinate tuple in projected CRS (dynamically determined based on region)
 * Format: [x, y] where x=easting (meters), y=northing (meters)
 *
 * For Ireland: EPSG:2157 (Irish Transverse Mercator)
 * For UK: EPSG:27700 (British National Grid)
 * For other regions: Appropriate projected CRS or WGS84 fallback
 *
 * Transform to WGS84 for MapBox display using projectedToWGS84()
 */
export type ProjectedCoords = [number, number];

// Legacy alias for backwards compatibility
export type LngLatTuple = ProjectedCoords;

export interface TrafficNode {
  id: string;
  osmId: number;
  position: ProjectedCoords;
  connectionCount: number;
}

export interface TrafficLink {
  id: string;
  osmId: number;
  from: string;
  to: string;
  geometry: ProjectedCoords[];
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
  geometry: ProjectedCoords[];
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
  position: ProjectedCoords;
  geometry?: ProjectedCoords[];
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
  /**
   * The coordinate reference system used for all coordinates in this network
   * e.g., "EPSG:2157" for Irish Transverse Mercator
   */
  crs: string;
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
