export interface OSMNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface OSMWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

export type OSMElement = OSMNode | OSMWay;

export interface OSMResponse {
  elements: OSMElement[];
}
