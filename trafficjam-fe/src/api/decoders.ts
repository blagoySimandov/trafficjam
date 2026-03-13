import type {
  ApiTrafficNode,
  ApiTrafficLink,
  ApiBuilding,
  ApiTransportRoute,
  ApiNetworkResponse,
  ApiScenario,
  ApiStartRunResponse,
  ApiCreateRunResponse,
  StreamedEvent,
  StartRunResult,
  CreateRunResult,
} from "./raw-types"
import type {
  Network,
  TrafficNode,
  TrafficLink,
  Building,
  BuildingType,
  TransportRoute,
  LngLatTuple,
} from "../types"
import type { Scenario, AgentConfig } from "../types"
import { DEFAULT_AGENT_CONFIG } from "./constants"
import { isNonEmptyNetworkConfig } from "./network-serializer"

function swapCoord([lon, lat]: [number, number]): LngLatTuple {
  return [lat, lon]
}

function swapCoords(coords: [number, number][]): LngLatTuple[] {
  return coords.map(swapCoord)
}

function mapNode(api: ApiTrafficNode): TrafficNode {
  return {
    id: String(api.id),
    position: swapCoord(api.position),
    connectionCount: api.connection_count,
  }
}

function mapLink(api: ApiTrafficLink): TrafficLink {
  return {
    id: String(api.id),
    from: String(api.from_node),
    to: String(api.to_node),
    geometry: swapCoords(api.geometry),
    tags: {
      highway: api.tags.highway ?? "",
      lanes: api.tags.lanes ? parseInt(api.tags.lanes) : undefined,
      maxspeed: api.tags.maxspeed ? parseInt(api.tags.maxspeed) : undefined,
      oneway: api.tags.oneway === "yes",
      name: api.tags.name,
    },
  }
}

function mapBuilding(api: ApiBuilding): Building | null {
  if (!api.type) return null
  return {
    id: String(api.id),
    position: swapCoord(api.position),
    geometry: api.geometry.length > 0 ? swapCoords(api.geometry) : undefined,
    type: api.type as BuildingType,
    tags: {
      name: api.tags.name,
      building: api.tags.building,
      shop: api.tags.shop,
      amenity: api.tags.amenity,
    },
  }
}

function mapTransportRoute(api: ApiTransportRoute): TransportRoute {
  return {
    id: String(api.id),
    geometry: api.geometry.map((line) => swapCoords(line)),
    tags: {
      route: api.tags.route ?? "",
      ref: api.tags.ref,
      name: api.tags.name,
      network: api.tags.network,
      operator: api.tags.operator,
      colour: api.tags.colour,
    },
  }
}

function buildNodeMap(nodes: ApiTrafficNode[]): Map<string, TrafficNode> {
  return new Map(nodes.map((n) => { const m = mapNode(n); return [m.id, m] }))
}

function buildLinkMap(links: ApiTrafficLink[]): Map<string, TrafficLink> {
  return new Map(links.map((l) => { const m = mapLink(l); return [m.id, m] }))
}

function buildBuildingMap(buildings: ApiBuilding[]): Map<string, Building> {
  const map = new Map<string, Building>()
  for (const b of buildings) {
    const m = mapBuilding(b)
    if (m) map.set(m.id, m)
  }
  return map
}

function buildRouteMap(routes: ApiTransportRoute[]): Map<string, TransportRoute> {
  return new Map(routes.map((r) => { const m = mapTransportRoute(r); return [m.id, m] }))
}

export function mapNetworkResponse(api: ApiNetworkResponse): Network {
  return {
    nodes: buildNodeMap(api.nodes),
    links: buildLinkMap(api.links),
    buildings: buildBuildingMap(api.buildings),
    transportRoutes: buildRouteMap(api.transport_routes),
  }
}

function parseAgentConfig(planParams: Record<string, unknown> | string | null): AgentConfig {
  if (!planParams) return DEFAULT_AGENT_CONFIG
  if (typeof planParams === "string") return JSON.parse(planParams) as AgentConfig
  return planParams as unknown as AgentConfig
}

function toScenarioSummary(s: ApiScenario): Scenario {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? undefined,
    agentConfig: parseAgentConfig(s.plan_params),
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }
}

export function toFullScenario(s: ApiScenario): Scenario {
  return {
    ...toScenarioSummary(s),
    linksDiff: isNonEmptyNetworkConfig(s.network_config ?? null)
      ? (s.network_config!.links as Record<string, TrafficLink>) ?? {}
      : undefined,
    buildingsDiff: isNonEmptyNetworkConfig(s.network_config ?? null)
      ? (s.network_config!.buildings as Record<string, Building>) ?? undefined
      : undefined,
  }
}

export function toScenarioList(raw: ApiScenario[]): Scenario[] {
  return raw.map(toScenarioSummary)
}

export function decodeStartRun(raw: ApiStartRunResponse): StartRunResult {
  return {
    scenarioId: raw.scenario_id,
    runId: raw.run_id,
    simulationId: raw.simulation_id,
    status: raw.status,
  }
}

export function decodeCreateRun(raw: ApiCreateRunResponse): CreateRunResult {
  return {
    scenarioId: raw.scenario_id,
    runId: raw.run_id,
    status: raw.status,
  }
}

function getStreamReader(response: Response) {
  if (!response.body) throw new Error("Response body is null")
  return response.body.pipeThrough(new TextDecoderStream()).getReader()
}

function parseSSELine(line: string): StreamedEvent | null {
  if (!line.startsWith("data:")) return null
  const json = line.slice("data:".length).trim()
  if (!json) return null
  return JSON.parse(json) as StreamedEvent
}

export async function* decodeEventStream(response: Response): AsyncGenerator<StreamedEvent> {
  const reader = getStreamReader(response)
  let buffer = ""
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += value
      const lines = buffer.split("\n")
      buffer = lines.pop()!
      for (const line of lines) {
        const event = parseSSELine(line)
        if (event) yield event
      }
    }
  } finally {
    reader.releaseLock()
  }
}
