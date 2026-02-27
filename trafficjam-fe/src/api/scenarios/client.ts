import { v4 as uuidv4 } from "uuid";
import type { Scenario, Run, AgentConfig } from "./types";
import { DEFAULT_AGENT_CONFIG } from "./constants";

// Simple in-memory storage that resets on reload
const mockScenarios: Scenario[] = [
  {
    id: "default-scenario",
    name: "Default Scenario",
    agentConfig: DEFAULT_AGENT_CONFIG,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockRuns: Run[] = [];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function listScenarios(): Promise<Scenario[]> {
  await delay(100);
  return [...mockScenarios];
}

async function createScenario(
  name: string,
  config: AgentConfig,
): Promise<Scenario> {
  await delay(100);
  const newScenario: Scenario = {
    id: uuidv4(),
    name,
    agentConfig: config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockScenarios.push(newScenario);
  return newScenario;
}

async function updateScenario(
  id: string,
  updates: Partial<Scenario>,
): Promise<Scenario> {
  await delay(100);
  const index = mockScenarios.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Scenario not found");

  mockScenarios[index] = {
    ...mockScenarios[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return mockScenarios[index];
}

async function deleteScenario(id: string): Promise<void> {
  await delay(100);
  const index = mockScenarios.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Scenario not found");
  mockScenarios.splice(index, 1);
}

async function listRuns(scenarioId?: string): Promise<Run[]> {
  await delay(100);
  return scenarioId
    ? mockRuns.filter((r) => r.scenarioId === scenarioId)
    : [...mockRuns];
}

export const scenariosApi = {
  listScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  listRuns,
};
