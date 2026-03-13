import Papa from "papaparse";
import { ungzip } from "pako";
import { ENDPOINTS, type EndpointKey } from "./endpoints";
import type { StartRunParams } from "./raw-types";
import type { LngLatBounds } from "../types";

const MAP_DATA_URL =
  import.meta.env.VITE_MAP_DATA_SERVICE_URL ?? "http://localhost:8000";
const BACKEND_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL ?? "http://localhost:8001";

// Routes endpoints across two services
// Any endpoint that is in  the set will be routed to the map data service
// In the future we will likely have a singular proxy that will handle all routing
// So this logic will not be needed.
const MAP_DATA_KEYS = new Set<EndpointKey>(["network"]);

function getBaseUrl(key: EndpointKey): string {
  return MAP_DATA_KEYS.has(key) ? MAP_DATA_URL : BACKEND_URL;
}

export function resolveUrl(
  key: EndpointKey,
  params?: Record<string, string>,
): string {
  const path = params
    ? Object.entries(params).reduce(
        (p, [k, v]) => p.replace(`:${k}`, v),
        ENDPOINTS[key],
      )
    : ENDPOINTS[key];
  return `${getBaseUrl(key)}${path}`;
}

export function assertOk(res: Response): void {
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  assertOk(res);
  return res.json();
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertOk(res);
  return res.json();
}

export async function postForm<T>(url: string, body: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body });
  assertOk(res);
  return res.json();
}

export async function putJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertOk(res);
}

export async function deleteReq(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  assertOk(res);
}

export function buildNetworkQuery(bounds: LngLatBounds): string {
  return new URLSearchParams({
    min_lat: bounds.getSouth().toString(),
    min_lng: bounds.getWest().toString(),
    max_lat: bounds.getNorth().toString(),
    max_lng: bounds.getEast().toString(),
  }).toString();
}

export function buildStartRunForm(params: StartRunParams): FormData {
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

export async function parseSimwrapperResponse<T>(
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
