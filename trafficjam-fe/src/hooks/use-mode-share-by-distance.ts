import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

// Raw data from API
interface ModeShareByDistanceRaw {
  dist_group: string;
  main_mode: string;
  share: number;
}

// Transformed data for chart
export interface ModeShareByDistance {
  distanceBin: string;
  car: number;
  walk: number;
  bike: number;
  pt: number;
}

function transformModeShareData(
  rawData: ModeShareByDistanceRaw[],
): ModeShareByDistance[] {
  const grouped = rawData.reduce(
    (acc, item) => {
      const key = item.dist_group;
      if (!acc[key]) {
        acc[key] = { distanceBin: key, car: 0, walk: 0, bike: 0, pt: 0 };
      }
      const modeKey = item.main_mode as keyof Omit<
        ModeShareByDistance,
        "distanceBin"
      >;
      acc[key][modeKey] = item.share;
      return acc;
    },
    {} as Record<string, ModeShareByDistance>,
  );

  return Object.values(grouped);
}

export function useModeShareByDistance(scenarioId: string, runId: string) {
  return useQuery<ModeShareByDistance[]>({
    queryKey: [
      scenarioId,
      runId,
      "analysis/population/mode_share_per_dist.csv",
    ],
    queryFn: async ({ queryKey }) => {
      const rawData = await api.getSimwrapperFile<
        ModeShareByDistanceRaw[]
      >(queryKey[0] as string, queryKey[1] as string, queryKey[2] as string);
      return transformModeShareData(rawData);
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: 5000,
  });
}
