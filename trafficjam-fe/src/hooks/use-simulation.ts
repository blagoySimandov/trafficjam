import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import type { StartRunParams } from "../api/raw-types";

export function useSimulation() {
  return useMutation({
    mutationFn: (params: StartRunParams) => api.startRun(params),
  });
}
