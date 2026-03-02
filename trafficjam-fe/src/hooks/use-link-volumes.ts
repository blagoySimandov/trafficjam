import { simulationApi } from "../api/trafficjam-be";
import { useQuery } from "@tanstack/react-query";
import type { MatsimMode } from "../types";

export interface LinkVolume {
  link: number;
  from_node: number;
  to_node: number;
  length: number;
  freespeed: number;
  capacity: number;
  lanes: number;
  modes: MatsimMode[];
  vol_car: number;
  geometry: string; // WKT LINESTRING format
}

export function useLinkVolumes(scenarioId: string, runId: string) {
  return useQuery({
    queryKey: [scenarioId, runId, "output_links.csv.gz"],
    queryFn: ({ queryKey }) =>
      simulationApi.getSimwrapperFile<LinkVolume[]>(
        queryKey[0],
        queryKey[1],
        queryKey[2],
      ),
    staleTime: Infinity,
  });
}
