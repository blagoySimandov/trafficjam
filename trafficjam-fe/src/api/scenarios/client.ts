import type { Scenario, Run, AgentConfig } from "./types";
import type { CityConfig } from "../../constants/cities";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8001";

function assertOk(response: Response) {
  if (!response.ok) throw new Error(`Backend error: ${response.status}`);
}

async function computeHash(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type PlanParams = { population: number; populationDensity: number } & AgentConfig;

function planParamsToAgentConfig(params: Record<string, unknown>): AgentConfig {
  return {
    populationDensity: params.populationDensity as number,
    shoppingProbability: params.shoppingProbability as number,
    maxShoppingDistanceKm: params.maxShoppingDistanceKm as number,
    healthcareChance: params.healthcareChance as number,
    elderlyAgeThreshold: params.elderlyAgeThreshold as number,
    kindergartenAge: params.kindergartenAge as number,
    minIndependentSchoolAge: params.minIndependentSchoolAge as number,
    errandMinMinutes: params.errandMinMinutes as number,
    errandMaxMinutes: params.errandMaxMinutes as number,
    childDropoffMinMinutes: params.childDropoffMinMinutes as number,
    childDropoffMaxMinutes: params.childDropoffMaxMinutes as number,
  };
}

function mapScenario(raw: Record<string, unknown>): Scenario {
  return {
    id: raw.id as string,
    name: raw.name as string,
    agentConfig: planParamsToAgentConfig(raw.plan_params as Record<string, unknown>),
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

async function listScenarios(): Promise<Scenario[]> {
  const res = await fetch(`${BASE_URL}/scenarios`);
  assertOk(res);
  const data: Record<string, unknown>[] = await res.json();
  return data.map(mapScenario);
}

async function createScenario(city: CityConfig, agentConfig: AgentConfig): Promise<Scenario> {
  const planParams: PlanParams = {
    ...agentConfig,
    population: city.population,
    populationDensity: city.populationDensity,
  };
  const sortedContent =
    city.name +
    JSON.stringify(
      Object.fromEntries(
        Object.keys(planParams)
          .sort()
          .map((k) => [k, planParams[k as keyof PlanParams]]),
      ),
    );
  const fullHash = await computeHash(sortedContent);
  const name = `${city.name} - ${fullHash.slice(0, 6)}`;

  const res = await fetch(`${BASE_URL}/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, network_config: "", plan_params: planParams }),
  });
  assertOk(res);
  return mapScenario(await res.json());
}

async function updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.agentConfig !== undefined) body.plan_params = updates.agentConfig;

  const res = await fetch(`${BASE_URL}/scenarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertOk(res);
  return mapScenario(await res.json());
}

async function deleteScenario(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/scenarios/${id}`, { method: "DELETE" });
  assertOk(res);
}

async function listRuns(): Promise<Run[]> {
  return [];
}

export const scenariosApi = {
  listScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  listRuns,
};
