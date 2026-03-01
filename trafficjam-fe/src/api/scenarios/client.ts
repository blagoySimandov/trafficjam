import type { Scenario, Run, AgentConfig } from "./types";
import { DEFAULT_AGENT_CONFIG } from "./constants";
import {
  serializeNetwork,
  deserializeNetwork,
  isNonEmptyNetworkConfig,
} from "./network-serializer";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8001";

interface BackendScenarioSummary {
  id: string;
  name: string;
  description: string | null;
  plan_params: string;
  created_at: string;
  updated_at: string;
}

interface BackendScenario extends BackendScenarioSummary {
  network_config: Record<string, unknown> | null;
  matsim_config: Record<string, unknown> | null;
}

function parseAgentConfig(planParams: string): AgentConfig {
  return planParams
    ? (JSON.parse(planParams) as AgentConfig)
    : DEFAULT_AGENT_CONFIG;
}

function toScenarioSummary(s: BackendScenarioSummary): Scenario {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? undefined,
    agentConfig: parseAgentConfig(s.plan_params),
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function toFullScenario(s: BackendScenario): Scenario {
  return {
    ...toScenarioSummary(s),
    networkData: isNonEmptyNetworkConfig(s.network_config)
      ? deserializeNetwork(s.network_config!)
      : undefined,
  };
}

async function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
}

async function listScenarios(): Promise<Scenario[]> {
  const response = await fetch(`${BASE_URL}/scenarios`);
  await assertOk(response);
  const data: BackendScenarioSummary[] = await response.json();
  return data.map(toScenarioSummary);
}

async function getScenario(id: string): Promise<Scenario> {
  const response = await fetch(`${BASE_URL}/scenarios/${id}`);
  await assertOk(response);
  return toFullScenario(await response.json());
}

async function createScenario(
  name: string,
  config: AgentConfig,
): Promise<Scenario> {
  const response = await fetch(`${BASE_URL}/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      plan_params: JSON.stringify(config),
      network_config: {},
    }),
  });
  await assertOk(response);
  return toFullScenario(await response.json());
}

async function updateScenario(
  id: string,
  updates: Partial<Scenario>,
): Promise<Scenario> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.agentConfig !== undefined)
    body.plan_params = JSON.stringify(updates.agentConfig);
  if (updates.networkData !== undefined)
    body.network_config = serializeNetwork(updates.networkData);

  const response = await fetch(`${BASE_URL}/scenarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await assertOk(response);
  return toFullScenario(await response.json());
}

async function deleteScenario(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/scenarios/${id}`, {
    method: "DELETE",
  });
  await assertOk(response);
}

async function listRuns(scenarioId?: string): Promise<Run[]> {
  if (!scenarioId) return [];
  const response = await fetch(`${BASE_URL}/scenarios/${scenarioId}/runs`);
  if (!response.ok) return [];
  return await response.json();
}

export const scenariosApi = {
  listScenarios,
  getScenario,
  createScenario,
  updateScenario,
  deleteScenario,
  listRuns,
};
