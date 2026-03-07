import type { Scenario, Run, AgentConfig } from "./types";
import type { Network, TrafficLink, Building } from "../../types";
import { DEFAULT_AGENT_CONFIG } from "./constants";
import {
  isNonEmptyNetworkConfig,
  computeLinksDiff,
  computeBuildingsDiff,
} from "./network-serializer";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8001";

interface BackendScenarioSummary {
  id: string;
  name: string;
  description: string | null;
  plan_params: Record<string, unknown> | string | null;
  created_at: string;
  updated_at: string;
}

interface BackendScenario extends BackendScenarioSummary {
  network_config: Record<string, unknown> | null;
  matsim_config: Record<string, unknown> | null;
}

function parseAgentConfig(planParams: Record<string, unknown> | string | null): AgentConfig {
  if (!planParams) return DEFAULT_AGENT_CONFIG;
  if (typeof planParams === "string") return JSON.parse(planParams) as AgentConfig;
  return planParams as unknown as AgentConfig;
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
    linksDiff: isNonEmptyNetworkConfig(s.network_config)
      ? (s.network_config!.links as Record<string, TrafficLink>) ?? {}
      : undefined,
    buildingsDiff: isNonEmptyNetworkConfig(s.network_config)
      ? (s.network_config!.buildings as Record<string, Building>) ?? undefined
      : undefined,
  };
}

async function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
}

/**
 * Fetches a summarized list of all user scenarios from the backend.
 * 
 * @returns A promise that resolves to an array of Scenarios without their heavy network configurations.
 * @throws {Error} If the backend request fails (e.g. 500 or network error).
 */
async function listScenarios(): Promise<Scenario[]> {
  const response = await fetch(`${BASE_URL}/scenarios`);
  await assertOk(response);
  const data: BackendScenarioSummary[] = await response.json();
  return data.map(toScenarioSummary);
}

/**
 * Retrieves the complete detail of a scenario, including the massive network configurations.
 * 
 * @param id - The UUID of the scenario to fetch.
 * @param signal - An optional AbortSignal for cancelling the request on component unmount.
 * @returns A promise resolving to the full Scenario object.
 * @throws {Error} If the backend status is not OK (e.g. 404 Not Found).
 */
async function getScenario(id: string, signal?: AbortSignal): Promise<Scenario> {
  const response = await fetch(`${BASE_URL}/scenarios/${id}`, { signal });
  await assertOk(response);
  return toFullScenario(await response.json());
}

/**
 * Creates a new blank scenario and stores it in the database.
 * 
 * @param name - The human readable name of the new scenario.
 * @param config - The initial MATSim agent generation parameters.
 * @returns The newly instantiated Scenario from the database backend.
 */
async function createScenario(
  name: string,
  config: AgentConfig,
): Promise<Scenario> {
  const response = await fetch(`${BASE_URL}/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      plan_params: config,
      network_config: null,
    }),
  });
  await assertOk(response);
  return toFullScenario(await response.json());
}

/**
 * Patches a scenario's basic metadata (name, description, or agent plan parameters).
 * Does *not* handle network map updates.
 * 
 * @param id - The UUID of the scenario to modify.
 * @param updates - A partial object containing only the fields to be updated.
 */
async function updateScenario(
  id: string,
  updates: Partial<Scenario>,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.agentConfig !== undefined)
    body.plan_params = updates.agentConfig;

  const response = await fetch(`${BASE_URL}/scenarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await assertOk(response);
}

/**
 * Calculates the difference between a base network and an edited network, 
 * then pushes *only the changed geometry/links* to the backend to conserve bandwidth.
 * 
 * @param id - The UUID of the scenario to apply the network changes to.
 * @param base - The original state of the network before the user's current session.
 * @param edited - The new state of the network after UI modifications.
 */
async function saveNetwork(id: string, base: Network, edited: Network): Promise<void> {
  const links = computeLinksDiff(base, edited);
  const buildings = computeBuildingsDiff(base, edited);
  const response = await fetch(`${BASE_URL}/scenarios/${id}/network`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      links,
      buildings: Object.keys(buildings).length > 0 ? buildings : undefined,
    }),
  });
  await assertOk(response);
}

/**
 * Fully deletes a scenario from the database, cascading deletes to all its runs
 * and purging its NATS JetStream history.
 * 
 * @param id - The UUID of the scenario to delete.
 */
async function deleteScenario(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/scenarios/${id}`, {
    method: "DELETE",
  });
  await assertOk(response);
}

/**
 * Fetches all executed MATSim simulation runs bound to a scenario.
 * 
 * @param scenarioId - The scenario UUID to query against. If omitted, returns an empty array.
 * @returns A promise resolving to an array of historical or active simulation Runs.
 */
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
  saveNetwork,
  deleteScenario,
  listRuns,
};
