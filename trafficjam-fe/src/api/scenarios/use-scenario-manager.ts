import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { scenariosApi } from "./client";
import { DEFAULT_AGENT_CONFIG } from "./constants";
import type { Scenario, AgentConfig } from "./types";
import type { CityConfig } from "../../constants/cities";

export function useScenarioManager() {
  const queryClient = useQueryClient();
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const { data: scenarios = [], isLoading: isLoadingScenarios } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => scenariosApi.listScenarios(),
    staleTime: 5000,
  });

  const resolvedActiveId = activeScenarioId || scenarios[0]?.id || null;

  const { data: activeScenario = null, isLoading: isLoadingActive, isFetching: isFetchingActive } = useQuery({
    queryKey: ["scenario", resolvedActiveId],
    queryFn: ({ signal }) => scenariosApi.getScenario(resolvedActiveId!, signal),
    enabled: !!resolvedActiveId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const prefetchScenario = useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: ["scenario", id],
        queryFn: ({ signal }) => scenariosApi.getScenario(id, signal),
        staleTime: Infinity,
      });
    },
    [queryClient],
  );

  const { data: runs = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: ["runs", resolvedActiveId],
    queryFn: () => scenariosApi.listRuns(resolvedActiveId!),
    enabled: !!resolvedActiveId,
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const createScenarioMutation = useMutation({
    mutationFn: ({ name, config }: { name: string; config: AgentConfig }) =>
      scenariosApi.createScenario(name, config),
    onSuccess: (newScenario) => {
      queryClient.setQueryData<Scenario[]>(["scenarios"], (old) => [...(old ?? []), newScenario]);
      queryClient.setQueryData(["scenario", newScenario.id], newScenario);
      setActiveScenarioId(newScenario.id);
    },
  });

  const updateScenarioMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Scenario> }) =>
      scenariosApi.updateScenario(id, updates),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["scenario", variables.id] });
      const previous = queryClient.getQueryData<Scenario>(["scenario", variables.id]);
      queryClient.setQueryData<Scenario | null>(
        ["scenario", variables.id],
        (old) => (old ? { ...old, ...variables.updates } : old),
      );
      queryClient.setQueryData<Scenario[]>(
        ["scenarios"],
        (old) => old?.map((s) => (s.id === variables.id ? { ...s, ...variables.updates } : s)),
      );
      return { previous };
    },
    onError: (_error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["scenario", variables.id], context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenario", variables.id] });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: (id: string) => scenariosApi.deleteScenario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  const createScenario = useCallback(
    async (city: CityConfig, config: AgentConfig = DEFAULT_AGENT_CONFIG) => {
      const scenario = await createScenarioMutation.mutateAsync({ name: city.name, config });
      return { scenario, created: true };
    },
    [createScenarioMutation],
  );

  const updateScenario = useCallback(
    (id: string, updates: Partial<Scenario>) => {
      return updateScenarioMutation.mutateAsync({ id, updates });
    },
    [updateScenarioMutation],
  );

  const deleteScenario = useCallback(
    (id: string) => {
      if (activeScenarioId === id) setActiveScenarioId(null);
      return deleteScenarioMutation.mutateAsync(id);
    },
    [deleteScenarioMutation, activeScenarioId],
  );

  return {
    scenarios,
    activeScenarioId: resolvedActiveId,
    activeScenario,
    setActiveScenarioId: (id: string | null) => setActiveScenarioId(id),
    createScenario,
    updateScenario,
    deleteScenario,
    prefetchScenario,
    runs,
    isLoadingScenarios,
    isSwitchingScenario: isFetchingActive && !isLoadingActive,
    isLoading: isLoadingScenarios || isLoadingActive || isLoadingRuns,
  };
}
