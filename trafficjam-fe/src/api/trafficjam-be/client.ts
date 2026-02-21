import type { Event } from "../../types/matsim-events";
import { decodeEventStream } from "./decoder";
import type {
  CreateRunResponse,
  StartRunResponse,
  StartRunParams,
} from "./types";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8000";

function buildFormData(params: StartRunParams): FormData {
  const formData = new FormData();
  formData.append("networkFile", params.networkFile);
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
