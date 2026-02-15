import type { Event } from "../../types/matsim-events";
import { decodeEventStream } from "./decoder";
import type {
  SimulationResponse,
  SimulationStatusResponse,
  StartSimulationParams,
} from "./types";

const BASE_URL =
  import.meta.env.VITE_SIM_ENGINE_URL || "http://localhost:8080";

function buildFormData(params: StartSimulationParams): FormData {
  const formData = new FormData();
  formData.append("networkFile", params.networkFile);
  if (params.iterations !== undefined)
    formData.append("iterations", params.iterations.toString());
  if (params.randomSeed !== undefined)
    formData.append("randomSeed", params.randomSeed.toString());
  return formData;
}

async function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Simulation engine error: ${response.status}`);
  }
}

async function start(
  params: StartSimulationParams,
): Promise<SimulationResponse> {
  const response = await fetch(`${BASE_URL}/simulation`, {
    method: "POST",
    body: buildFormData(params),
  });
  await assertOk(response);
  return response.json();
}

async function getStatus(id: string): Promise<SimulationStatusResponse> {
  const response = await fetch(`${BASE_URL}/simulation/${id}`);
  await assertOk(response);
  return response.json();
}

async function* streamEvents(id: string): AsyncGenerator<Event> {
  const response = await fetch(`${BASE_URL}/simulation/${id}/events`, {
    headers: { Accept: "text/event-stream" },
  });
  await assertOk(response);
  yield* decodeEventStream(response);
}

async function stop(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/simulation/${id}`, {
    method: "DELETE",
  });
  await assertOk(response);
}

export const simulationApi = { start, getStatus, streamEvents, stop };
