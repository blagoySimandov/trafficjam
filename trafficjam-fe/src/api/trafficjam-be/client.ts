import { decodeEventStream } from "./decoder";
import Papa from "papaparse";
import { ungzip } from "pako";

import type {
  CreateRunResponse,
  StartRunResponse,
  StartRunParams,
  StreamedEvent,
} from "./types";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8001";

function buildFormData(params: StartRunParams): FormData {
  const formData = new FormData();
  formData.append("networkFile", params.networkFile);
  if (params.buildings) {
    const buildingsData = params.buildings.map((b) => ({
      id: b.id,
      osm_id: 0,
      position: b.position,
      geometry: b.geometry || [b.position],
      type: b.type,
      tags: b.tags,
      hotspot: b.hotspot,
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
  if (params.note) formData.append("note", params.note);
  return formData;
}

function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
}

async function createRun(scenarioId: string): Promise<CreateRunResponse> {
  const response = await fetch(`${BASE_URL}/scenarios/${scenarioId}/runs`, {
    method: "POST",
  });
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
  signal?: AbortSignal,
): AsyncGenerator<StreamedEvent> {
  const response = await fetch(
    `${BASE_URL}/scenarios/${scenarioId}/runs/${runId}/events/stream`,
    { headers: { Accept: "text/event-stream" }, signal },
  );
  assertOk(response);
  yield* decodeEventStream(response);
}

async function getSimwrapperFile<T>(
  scenarioId: string,
  runId: string,
  filename: string,
): Promise<T> {
  const url = `${BASE_URL}/scenarios/${scenarioId}/runs/${runId}/simwrapper/${filename}`;
  const response = await fetch(url);
  assertOk(response);

  if (filename.endsWith(".json") || filename.endsWith(".vega.json")) {
    return await response.json();
  }

  if (filename.endsWith(".csv")) {
    const text = await response.text();
    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    return result.data as T;
  }

  if (filename.endsWith(".csv.gz")) {
    const buffer = await response.arrayBuffer();
    const decompressed = ungzip(new Uint8Array(buffer), { to: "string" });

    const result = Papa.parse(decompressed, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    return result.data as T;
  }

  if (filename.endsWith(".txt")) {
    const text = await response.text();
    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimiter: "\t",
    });
    return result.data as T;
  }

  return (await response.text()) as unknown as T;
}

async function syncUser(email: string): Promise<{ id: string; email: string; role: string }> {
  const response = await fetch(`${BASE_URL}/users/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  assertOk(response);
  return await response.json();
}

export const simulationApi = {
  createRun,
  startRun,
  streamEvents,
  getSimwrapperFile,
  syncUser,
};
