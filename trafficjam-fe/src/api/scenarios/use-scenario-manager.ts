import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const { data: runs = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: ["runs", activeScenarioId],
    queryFn: () => scenariosApi.listRuns(activeScenarioId!),
    enabled: !!activeScenarioId,
    staleTime: 5000,
    refetchInterval: 5000,
  });

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

  const activeScenario =
    scenarios.find((s) => s.id === (activeScenarioId || scenarios[0]?.id)) ||
    null;

  const createScenario = useCallback(
    async (city: CityConfig, config: AgentConfig = DEFAULT_AGENT_CONFIG) => {
      const planParams = {
        ...config,
        population: city.population,
        populationDensity: city.populationDensity,
      };
      const sortedContent =
        city.name +
        JSON.stringify(
          Object.fromEntries(
            Object.keys(planParams)
              .sort()
              .map((k) => [k, planParams[k as keyof typeof planParams]]),
          ),
        );
      const data = new TextEncoder().encode(sortedContent);
      const buffer = await crypto.subtle.digest("SHA-256", data);
      const hash = Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 6);
      const expectedName = `${city.name} - ${hash}`;

      const existing = scenarios.find((s) => s.name === expectedName);
      if (existing) {
        setActiveScenarioId(existing.id);
        return { scenario: existing, created: false };
      }

      const scenario = await createScenarioMutation.mutateAsync({ name: expectedName, config });
      return { scenario, created: true };
    },
    [createScenarioMutation, scenarios],
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
    activeScenario,
    setActiveScenarioId: (id: string | null) => setActiveScenarioId(id),
    createScenario,
    updateScenario,
    deleteScenario,
    runs,
    isLoading: isLoadingScenarios || isLoadingRuns,
  };
}
