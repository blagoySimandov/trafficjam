import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import { simulationApi } from "../../../../api/trafficjam-be";
import type { ParsedDataset, DatasetConfig } from "./types";
import {
  matchGlob,
  applyAggregate,
  applyPivot,
  applyConstant,
} from "./dataset-utils";

function parseCsv(text: string): ParsedDataset {
  const result = Papa.parse(text.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
  return {
    columns: result.meta.fields ?? [],
    data: result.data as Record<string, string | number>[],
  };
}

function resolveFilename(config: DatasetConfig, files: string[]): string | undefined {
  const pattern = typeof config === "string" ? config : config.file;
  if (pattern.includes("*") || pattern.includes("?")) {
    return matchGlob(pattern, files);
  }
  return files.includes(pattern) ? pattern : undefined;
}

function applyTransforms(dataset: ParsedDataset, config: DatasetConfig): ParsedDataset {
  if (typeof config === "string") return dataset;
  let result = dataset;
  if (config.constant) result = applyConstant(result, config.constant);
  if (config.aggregate) result = applyAggregate(result, config.aggregate);
  if (config.pivot) result = applyPivot(result, config.pivot);
  return result;
}

async function fetchDataset(
  scenarioId: string,
  runId: string,
  config: DatasetConfig,
  files: string[],
): Promise<ParsedDataset> {
  const filename = resolveFilename(config, files);
  if (!filename) throw new Error("Could not resolve dataset file");
  const text = await simulationApi.getSimwrapperFile<string>(scenarioId, runId, filename);
  const dataset = parseCsv(text);
  return applyTransforms(dataset, config);
}

export function useDataset(
  scenarioId: string,
  runId: string,
  config: DatasetConfig | undefined,
  files: string[],
) {
  const key = typeof config === "string" ? config : config?.file;
  return useQuery({
    queryKey: ["dataset", scenarioId, runId, key],
    queryFn: () => fetchDataset(scenarioId, runId, config!, files),
    enabled: !!config && files.length > 0,
    staleTime: Infinity,
  });
}

export function useMultipleDatasets(
  scenarioId: string,
  runId: string,
  datasets: Record<string, DatasetConfig> | undefined,
  files: string[],
): Record<string, ParsedDataset> | undefined {
  const entries = Object.entries(datasets ?? {});
  const keys = entries.map(([k, v]) => {
    const file = typeof v === "string" ? v : v.file;
    return `${k}:${file}`;
  });

  const { data } = useQuery({
    queryKey: ["datasets-multi", scenarioId, runId, ...keys],
    queryFn: async () => {
      const settled = await Promise.allSettled(
        entries.map(([, config]) => fetchDataset(scenarioId, runId, config, files)),
      );
      const result: Record<string, ParsedDataset> = {};
      entries.forEach(([key], i) => {
        if (settled[i].status === "fulfilled") {
          result[key] = (settled[i] as PromiseFulfilledResult<ParsedDataset>).value;
        }
      });
      return result;
    },
    enabled: entries.length > 0 && files.length > 0,
    staleTime: Infinity,
  });

  return data;
}
