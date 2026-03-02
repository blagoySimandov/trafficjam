import { parse } from "yaml";

const BASE_URL =
  import.meta.env.VITE_TRAFFICJAM_BE_URL || "http://localhost:8001";

export async function fetchSimWrapperJson(
  scenarioId: string,
  runId: string,
  filename: string
): Promise<any> {
  const url = `${BASE_URL}/scenarios/${scenarioId}/runs/${runId}/simwrapper/${filename}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON ${filename}: ${response.status}`);
  }
  
  return await response.json();
}

export async function fetchSimWrapperYaml(
  scenarioId: string,
  runId: string,
  filename: string
): Promise<any> {
  const url = `${BASE_URL}/scenarios/${scenarioId}/runs/${runId}/simwrapper/${filename}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch YAML ${filename}: ${response.status}`);
  }
  
  const text = await response.text();
  return parse(text);
}

export function getSimWrapperFileUrl(
  scenarioId: string,
  runId: string,
  filename: string
): string {
  return `${BASE_URL}/scenarios/${scenarioId}/runs/${runId}/simwrapper/${filename}`;
}
