import { simulationApi } from "../api/trafficjam-be";
import { useQuery } from "@tanstack/react-query";
import type { LegHistogramRow } from "../types";

interface RawLegHistogramRow {
  [key: string]: number;
}

function normalizeKey(key: string): string {
  return key.replace(/-/g, "_");
}

function normalizeRow(raw: RawLegHistogramRow): LegHistogramRow {
  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[normalizeKey(key)] = value;
  }
  return normalized as unknown as LegHistogramRow;
}

function filterEveryNth(rows: LegHistogramRow[], n: number): LegHistogramRow[] {
  return rows.filter((_, i) => i % n === 0);
}

export function useLegHistogram(scenarioId: string, runId: string) {
  return useQuery<LegHistogramRow[]>({
    queryKey: [scenarioId, runId, "ITERS/it.1/1.legHistogram.txt"],
    queryFn: async ({ queryKey }) => {
      const raw = await simulationApi.getSimwrapperFile<RawLegHistogramRow[]>(
        queryKey[0] as string,
        queryKey[1] as string,
        queryKey[2] as string,
      );
      const normalized = raw.map(normalizeRow);
      return filterEveryNth(normalized, 6);
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: 5000,
  });
}
