export type LngLatTuple = [number, number];

export interface TrafficNode {
  id: string;
  osmId: number;
  position: LngLatTuple;
  connectionCount: number;
}

export interface TrafficLink {
  id: string;
  osmId: number;
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

export interface Network {
  nodes: Map<string, TrafficNode>;
  links: Map<string, TrafficLink>;
}

export interface LngLatBounds {
  getSouth(): number;
  getWest(): number;
  getNorth(): number;
  getEast(): number;
}
