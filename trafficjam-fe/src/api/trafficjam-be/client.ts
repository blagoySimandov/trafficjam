import type { Event } from "../../types/matsim-events";
import { decodeEventStream } from "./decoder";
import type {
  CreateRunResponse,
  StartRunResponse,
  StartRunParams,
} from "./types";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8001";

function buildFormData(params: StartRunParams): FormData {
  const formData = new FormData();
  formData.append("networkFile", params.networkFile);
  if (params.buildings) {
    // We map buildings to the format expected by the backend AgentBuilding model
    const buildingsData = params.buildings.map((b) => ({
      id: b.id,
      osm_id: 0, // Placeholder
      position: b.position,
      geometry: b.geometry || [b.position],
      type: b.type,
      tags: b.tags,
    }));
    formData.append("buildings", JSON.stringify(buildingsData));
  }
  if (params.bounds) {
    formData.append("bounds", JSON.stringify(params.bounds));
  }
  if (params.iterations !== undefined)
    formData.append("iterations", params.iterations.toString());
  if (params.randomSeed !== undefined)
    formData.append("randomSeed", params.randomSeed.toString());
  return formData;
}

function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
}

async function createRun(scenarioId: string): Promise<CreateRunResponse> {
  const response = await fetch(
    `${BASE_URL}/scenarios/${scenarioId}/runs`,
    { method: "POST" },
  );
  assertOk(response);
  return await response.json();
}

async function startRun(params: StartRunParams): Promise<StartRunResponse> {
  const response = await fetch(
    `${BASE_URL}/scenarios/${params.scenarioId}/runs/start`,
    { method: "POST", body: buildFormData(params) },
  );
  assertOk(response);
  return await response.json();
}

async function* streamEvents(
  scenarioId: string,
  runId: string,
): AsyncGenerator<Event> {
  const response = await fetch(
    `${BASE_URL}/scenarios/${scenarioId}/runs/${runId}/events/stream`,
    { headers: { Accept: "text/event-stream" } },
  );
  assertOk(response);
  yield* decodeEventStream(response);
}

export const simulationApi = { createRun, startRun, streamEvents };
