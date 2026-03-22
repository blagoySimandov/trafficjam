import { useState, useCallback, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import type { Scenario, Network } from "@/types";
import {
  computeLinksDiff,
  computeBuildingsDiff,
} from "@/api/network-serializer";

interface UseNetworkPersistenceOptions {
  activeScenario: Scenario | null;
  network: Network | null;
  baseNetwork: Network | null;
}

export function useNetworkPersistence({
  activeScenario,
  network,
  baseNetwork,
}: UseNetworkPersistenceOptions) {
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: ({
      id,
      base,
      edited,
    }: {
      id: string;
      base: Network;
      edited: Network;
    }) => api.saveNetwork(id, base, edited),
  });

  const markDirty = useCallback(() => setIsDirty(true), []);

  const save = useCallback(async () => {
    if (!activeScenario || !network || !baseNetwork || isSaving) return;
    await mutateAsync({
      id: activeScenario.id,
      base: baseNetwork,
      edited: network,
    });
    const linksDiff = computeLinksDiff(baseNetwork, network);
    const buildingsDiff = computeBuildingsDiff(baseNetwork, network);
    queryClient.setQueryData(["scenario", activeScenario.id], {
      ...activeScenario,
      linksDiff: Object.keys(linksDiff).length > 0 ? linksDiff : undefined,
      buildingsDiff:
        Object.keys(buildingsDiff).length > 0 ? buildingsDiff : undefined,
    });
    setIsDirty(false);
    setShowSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
  }, [
    activeScenario,
    network,
    baseNetwork,
    isSaving,
    mutateAsync,
    queryClient,
  ]);

  useHotkeys(
    "mod+s",
    (e) => {
      e.preventDefault();
      save();
    },
    { enableOnFormTags: true },
    [save],
  );

  return { isDirty, isSaving, showSaved, save, markDirty };
}
