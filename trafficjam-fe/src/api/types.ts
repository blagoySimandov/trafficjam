export interface ApiTrafficNode {
  id: string;
  osm_id: number;
  position: [number, number];
  connection_count: number;
}

export interface ApiTrafficLink {
  id: string;
  osm_id: number;
  from_node: string;
  to_node: string;
  geometry: [number, number][];
  tags: Record<string, string>;
}

export interface ApiBuilding {
  id: string;
  osm_id: number;
  position: [number, number];
  geometry: [number, number][];
  type: string | null;
  tags: Record<string, string>;
}

export interface ApiTransportRoute {
  id: string;
  osm_id: number;
  way_id: number;
  geometry: [number, number][];
  tags: Record<string, string>;
}

export interface NetworkResponse {
  nodes: ApiTrafficNode[];
  links: ApiTrafficLink[];
  buildings: ApiBuilding[];
  transport_routes: ApiTransportRoute[];
}
