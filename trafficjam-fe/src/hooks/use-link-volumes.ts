import { api } from "../api/client";
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

function parseLineString(wktString: string): [number, number][] {
  // Extract coordinates from "LINESTRING( -8.46586 51.895348, -8.465677 51.895389 )"
  const match = wktString.match(/LINESTRING\s*\(\s*(.*)\s*\)/i);
  if (!match) return [];

  return match[1].split(",").map((coord) => {
    const [lon, lat] = coord.trim().split(/\s+/);
    return [parseFloat(lon), parseFloat(lat)] as [number, number];
  });
}

export interface LinkVolumeParsed extends LinkVolume {
  coordinates: [number, number][];
}

export function useLinkVolumes(scenarioId: string, runId: string) {
  return useQuery<LinkVolumeParsed[]>({
    queryKey: [scenarioId, runId, "output_links.csv.gz"],
    queryFn: async ({ queryKey }) => {
      const raw = await api.getSimwrapperFile<LinkVolume[]>(
        queryKey[0] as string,
        queryKey[1] as string,
        queryKey[2] as string,
      );
      console.log(raw.length);

      return raw
        .filter((l) => !!l.geometry)
        .map((l) => {
          return {
            ...l,
            coordinates: parseLineString(l.geometry!),
          };
        });
    },
    staleTime: Infinity,
  });
}
