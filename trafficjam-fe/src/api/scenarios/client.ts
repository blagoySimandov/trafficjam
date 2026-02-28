import type { Scenario, Run, AgentConfig } from "./types";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8001";

function assertOk(response: Response) {
  if (!response.ok) throw new Error(`Backend error: ${response.status}`);
}

function toScenario(raw: Record<string, unknown>): Scenario {
  let agentConfig: AgentConfig | undefined;
  try {
    agentConfig = JSON.parse(raw.plan_params as string);
  } catch {
    agentConfig = undefined as unknown as AgentConfig;
  }
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string | undefined,
    agentConfig,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

async function listScenarios(): Promise<Scenario[]> {
  const res = await fetch(`${BASE_URL}/scenarios`);
  assertOk(res);
  const data = await res.json();
  return data.map(toScenario);
}

async function createScenario(name: string, config: AgentConfig): Promise<Scenario> {
  const res = await fetch(`${BASE_URL}/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, network_config: "{}", plan_params: JSON.stringify(config) }),
  });
  assertOk(res);
  return toScenario(await res.json());
}

async function updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario> {
  const body: Record<string, unknown> = {};
  if (updates.name) body.name = updates.name;
  if (updates.description) body.description = updates.description;
  if (updates.agentConfig) body.plan_params = JSON.stringify(updates.agentConfig);
  const res = await fetch(`${BASE_URL}/scenarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertOk(res);
  return toScenario(await res.json());
}

async function deleteScenario(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/scenarios/${id}`, { method: "DELETE" });
  assertOk(res);
}

async function listRuns(_scenarioId?: string): Promise<Run[]> {
  return [];
}

export const scenariosApi = {
  listScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  listRuns,
};
