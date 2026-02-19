export interface ApiTrafficNode {
  id: number;
  position: [number, number];
  connection_count: number;
}

export interface ApiTrafficLink {
  id: number;
  from_node: number;
  to_node: number;
  geometry: [number, number][];
  tags: Record<string, string>;
}

export interface ApiBuilding {
  id: number;
  position: [number, number];
  geometry: [number, number][];
  type: string | null;
  tags: Record<string, string>;
}

export interface ApiTransportRoute {
  id: number;
  geometry: [number, number][][];
  tags: Record<string, string>;
}

export interface ApiNetworkResponse {
  nodes: ApiTrafficNode[];
  links: ApiTrafficLink[];
  buildings: ApiBuilding[];
  transport_routes: ApiTransportRoute[];
}
