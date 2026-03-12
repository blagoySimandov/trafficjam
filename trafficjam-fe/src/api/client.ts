import Papa from "papaparse";
import { ungzip } from "pako";
import { ENDPOINTS, type EndpointKey } from "./endpoints";
import {
  mapNetworkResponse,
  toFullScenario,
  toScenarioList,
  decodeStartRun,
  decodeCreateRun,
  decodeEventStream,
} from "./decoders";
import { computeLinksDiff, computeBuildingsDiff } from "./network-serializer";
import type {
  ApiNetworkResponse,
  ApiScenario,
  ApiStartRunResponse,
  ApiCreateRunResponse,
  StreamedEvent,
  StartRunParams,
  StartRunResult,
  CreateRunResult,
} from "./raw-types";
import type { Scenario, AgentConfig, Run } from "../types";
import type { Network, LngLatBounds } from "../types";

const MAP_DATA_URL =
  import.meta.env.VITE_MAP_DATA_SERVICE_URL ?? "http://localhost:8000";
const BACKEND_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL ?? "http://localhost:8001";

// Routes endpoints across two services.
// If the endpoint requested is in the this set then the request is routed to the map data service.
// currently only "network" is in the set.
// This logic will most likey get replaced in the future with a singular proxy that will
// handle all routing
const MAP_DATA_KEYS = new Set<EndpointKey>(["network"]);

function getBaseUrl(key: EndpointKey): string {
  return MAP_DATA_KEYS.has(key) ? MAP_DATA_URL : BACKEND_URL;
}

function resolveUrl(key: EndpointKey, params?: Record<string, string>): string {
  const path = params
    ? Object.entries(params).reduce(
        (p, [k, v]) => p.replace(`:${k}`, v),
        ENDPOINTS[key],
      )
    : ENDPOINTS[key];
  return `${getBaseUrl(key)}${path}`;
}

function assertOk(res: Response): void {
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  assertOk(res);
  return res.json();
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertOk(res);
  return res.json();
}

async function postForm<T>(url: string, body: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body });
  assertOk(res);
  return res.json();
}

async function putJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertOk(res);
}

async function deleteReq(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  assertOk(res);
}

function buildNetworkQuery(bounds: LngLatBounds): string {
  return new URLSearchParams({
    min_lat: bounds.getSouth().toString(),
    min_lng: bounds.getWest().toString(),
    max_lat: bounds.getNorth().toString(),
    max_lng: bounds.getEast().toString(),
  }).toString();
}

function buildStartRunForm(params: StartRunParams): FormData {
  const form = new FormData();
  form.append("networkFile", params.networkFile);
  if (params.buildings) {
    const buildings = params.buildings.map((b) => ({
      id: b.id,
      osm_id: 0,
      position: b.position,
      geometry: b.geometry || [b.position],
      type: b.type,
      tags: b.tags,
      hotspot: b.hotspot,
    }));
    form.append("buildings", JSON.stringify(buildings));
  }
  if (params.bounds) form.append("bounds", JSON.stringify(params.bounds));
  if (params.iterations !== undefined)
    form.append("iterations", params.iterations.toString());
  if (params.randomSeed !== undefined)
    form.append("randomSeed", params.randomSeed.toString());
  if (params.note) form.append("note", params.note);
  return form;
}

function parseCsv<T>(text: string): T {
  return Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  }).data as T;
}

function parseTsv<T>(text: string): T {
  return Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "\t",
  }).data as T;
}

async function parseCsvGz<T>(res: Response): Promise<T> {
  const buffer = await res.arrayBuffer();
  const decompressed = ungzip(new Uint8Array(buffer), { to: "string" });
  return parseCsv<T>(decompressed);
}

async function parseSimwrapperResponse<T>(
  res: Response,
  filename: string,
): Promise<T> {
  if (filename.endsWith(".json") || filename.endsWith(".vega.json"))
    return res.json();
  if (filename.endsWith(".csv.gz")) return parseCsvGz<T>(res);
  if (filename.endsWith(".csv")) return parseCsv<T>(await res.text());
  if (filename.endsWith(".txt")) return parseTsv<T>(await res.text());
  return (await res.text()) as unknown as T;
}

async function fetchNetwork(bounds: LngLatBounds): Promise<Network> {
  const url = `${resolveUrl("network")}?${buildNetworkQuery(bounds)}`;
  const raw = await getJson<ApiNetworkResponse>(url);
  return mapNetworkResponse(raw);
}

async function listScenarios(): Promise<Scenario[]> {
  const raw = await getJson<ApiScenario[]>(resolveUrl("listScenarios"));
  return toScenarioList(raw);
}

async function getScenario(
  id: string,
  signal?: AbortSignal,
): Promise<Scenario> {
  const raw = await getJson<ApiScenario>(resolveUrl("getScenario", { id }), {
    signal,
  });
  return toFullScenario(raw);
}

async function createScenario(
  name: string,
  config: AgentConfig,
): Promise<Scenario> {
  const raw = await postJson<ApiScenario>(resolveUrl("createScenario"), {
    name,
    plan_params: config,
    network_config: null,
  });
  return toFullScenario(raw);
}

async function updateScenario(
  id: string,
  updates: Partial<Scenario>,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.agentConfig !== undefined) body.plan_params = updates.agentConfig;
  await putJson(resolveUrl("updateScenario", { id }), body);
}

async function saveNetwork(
  id: string,
  base: Network,
  edited: Network,
): Promise<void> {
  const links = computeLinksDiff(base, edited);
  const buildings = computeBuildingsDiff(base, edited);
  await putJson(resolveUrl("saveNetwork", { id }), {
    links,
    buildings: Object.keys(buildings).length > 0 ? buildings : undefined,
  });
}

async function deleteScenario(id: string): Promise<void> {
  await deleteReq(resolveUrl("deleteScenario", { id }));
}

async function listRuns(scenarioId?: string): Promise<Run[]> {
  if (!scenarioId) return [];
  const res = await fetch(resolveUrl("listRuns", { id: scenarioId }));
  if (!res.ok) return [];
  return res.json();
}

async function createRun(scenarioId: string): Promise<CreateRunResult> {
  const raw = await postJson<ApiCreateRunResponse>(
    resolveUrl("createRun", { id: scenarioId }),
    {},
  );
  return decodeCreateRun(raw);
}

async function startRun(params: StartRunParams): Promise<StartRunResult> {
  const raw = await postForm<ApiStartRunResponse>(
    resolveUrl("startRun", { id: params.scenarioId }),
    buildStartRunForm(params),
  );
  return decodeStartRun(raw);
}

async function* streamEvents(
  scenarioId: string,
  runId: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamedEvent> {
  const res = await fetch(
    resolveUrl("streamEvents", { id: scenarioId, runId }),
    { headers: { Accept: "text/event-stream" }, signal },
  );
  assertOk(res);
  yield* decodeEventStream(res);
}

async function getSimwrapperFile<T>(
  scenarioId: string,
  runId: string,
  filename: string,
): Promise<T> {
  const url = resolveUrl("simwrapperFile", {
    id: scenarioId,
    runId,
    filename,
  });
  const res = await fetch(url);
  assertOk(res);
  return parseSimwrapperResponse<T>(res, filename);
}

export const api = {
  fetchNetwork,
  listScenarios,
  getScenario,
  createScenario,
  updateScenario,
  saveNetwork,
  deleteScenario,
  listRuns,
  createRun,
  startRun,
  streamEvents,
  getSimwrapperFile,
};
