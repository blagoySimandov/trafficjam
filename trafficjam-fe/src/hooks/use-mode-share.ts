import { api } from "../api/client";
import { useQuery } from "@tanstack/react-query";
import type { ModeUser } from "../types";

export function useModeShare(scenarioId: string, runId: string) {
  return useQuery<ModeUser[]>({
    queryKey: [scenarioId, runId, "analysis/population/mode_users.csv"],
    queryFn: ({ queryKey }) =>
      api.getSimwrapperFile<ModeUser[]>(
        queryKey[0] as string,
        queryKey[1] as string,
        queryKey[2] as string,
      ),
    staleTime: Infinity,
    retry: 2,
    retryDelay: 5000,
  });
}
