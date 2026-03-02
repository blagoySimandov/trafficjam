import { useQuery } from "@tanstack/react-query";
import yaml from "js-yaml";
import { simulationApi } from "../../../../api/trafficjam-be";
import type { DashboardConfig } from "./types";

async function fetchDashboard(
  scenarioId: string,
  runId: string,
  filename: string,
): Promise<DashboardConfig> {
  const raw = await simulationApi.getSimwrapperFile<string>(scenarioId, runId, filename);
  return yaml.load(raw) as DashboardConfig;
}

export function useDashboard(scenarioId: string, runId: string, filename: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", scenarioId, runId, filename],
    queryFn: () => fetchDashboard(scenarioId, runId, filename!),
    enabled: !!filename,
    staleTime: Infinity,
  });
}
