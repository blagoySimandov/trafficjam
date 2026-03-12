import type { Building } from "../types"

export interface ApiTrafficNode {
  id: number
  position: [number, number]
  connection_count: number
}

export interface ApiTrafficLink {
  id: number
  from_node: number
  to_node: number
  geometry: [number, number][]
  tags: Record<string, string>
}

export interface ApiBuilding {
  id: number
  position: [number, number]
  geometry: [number, number][]
  type: string | null
  tags: Record<string, string>
}

export interface ApiTransportRoute {
  id: number
  geometry: [number, number][][]
  tags: Record<string, string>
}

export interface ApiNetworkResponse {
  nodes: ApiTrafficNode[]
  links: ApiTrafficLink[]
  buildings: ApiBuilding[]
  transport_routes: ApiTransportRoute[]
}

export interface ApiScenario {
  id: string
  name: string
  description: string | null
  plan_params: Record<string, unknown> | string | null
  created_at: string
  updated_at: string
  network_config?: Record<string, unknown> | null
  matsim_config?: Record<string, unknown> | null
}

export interface ApiStartRunResponse {
  scenario_id: string
  run_id: string
  simulation_id: string
  status: string
}

export interface ApiCreateRunResponse {
  scenario_id: string
  run_id: string
  status: string
}

export interface StreamedEvent {
  type: string
  time: number
  agentId: string | null
  linkId: string | null
  activityType: string | null
  x: number | null
  y: number | null
}

export interface StartRunParams {
  scenarioId: string
  networkFile: File
  buildings?: Building[]
  bounds?: { north: number; south: number; east: number; west: number }
  iterations?: number
  randomSeed?: number
  note?: string
}

export interface StartRunResult {
  scenarioId: string
  runId: string
  simulationId: string
  status: string
}

export interface CreateRunResult {
  scenarioId: string
  runId: string
  status: string
}
