import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scenariosApi } from "./client";
import { DEFAULT_AGENT_CONFIG } from "./constants";
import type { Scenario, AgentConfig } from "./types";

export function useScenarioManager() {
  const queryClient = useQueryClient();
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Queries
  const { data: scenarios = [], isLoading: isLoadingScenarios } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => scenariosApi.listScenarios(),
    staleTime: 5000,
  });

  const { data: runs = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: ["runs", activeScenarioId],
    queryFn: () => scenariosApi.listRuns(activeScenarioId!),
    enabled: !!activeScenarioId,
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // Mutations
  const createScenarioMutation = useMutation({
    mutationFn: ({ name, config }: { name: string; config: AgentConfig }) => 
      scenariosApi.createScenario(name, config),
    onSuccess: (newScenario) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      setActiveScenarioId(newScenario.id);
    },
  });

  const updateScenarioMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Scenario> }) => 
      scenariosApi.updateScenario(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: (id: string) => scenariosApi.deleteScenario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  const activeScenario = scenarios.find(s => s.id === (activeScenarioId || scenarios[0]?.id)) || null;

  const createScenario = useCallback((name: string, config: AgentConfig = DEFAULT_AGENT_CONFIG) => {
    return createScenarioMutation.mutateAsync({ name, config });
  }, [createScenarioMutation]);

  const updateScenario = useCallback((id: string, updates: Partial<Scenario>) => {
    return updateScenarioMutation.mutateAsync({ id, updates });
  }, [updateScenarioMutation]);

  const deleteScenario = useCallback((id: string) => {
    if (activeScenarioId === id) setActiveScenarioId(null);
    return deleteScenarioMutation.mutateAsync(id);
  }, [deleteScenarioMutation, activeScenarioId]);

  return {
    scenarios,
    activeScenario,
    setActiveScenarioId: (id: string | null) => setActiveScenarioId(id),
    createScenario,
    updateScenario,
    deleteScenario,
    runs,
    isLoading: isLoadingScenarios || isLoadingRuns
  };
}
