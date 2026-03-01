import { useState, useCallback, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scenariosApi } from "../../../api/scenarios";
import type { Network } from "../../../types";
import type { Scenario } from "../../../api/scenarios";

interface UseNetworkPersistenceOptions {
  activeScenario: Scenario | null;
  network: Network | null;
  baseNetwork: Network | null;
}

export function useNetworkPersistence({ activeScenario, network, baseNetwork }: UseNetworkPersistenceOptions) {
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: ({ id, base, edited }: { id: string; base: Network; edited: Network }) =>
      scenariosApi.saveNetwork(id, base, edited),
    onSuccess: () => {
      if (activeScenario) {
        queryClient.invalidateQueries({ queryKey: ["scenario", activeScenario.id] });
      }
    },
  });

  const markDirty = useCallback(() => setIsDirty(true), []);

  const save = useCallback(async () => {
    if (!activeScenario || !network || !baseNetwork || isSaving) return;
    await mutateAsync({ id: activeScenario.id, base: baseNetwork, edited: network });
    setIsDirty(false);
    setShowSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
  }, [activeScenario, network, baseNetwork, isSaving, mutateAsync]);

  useHotkeys("mod+s", (e) => {
    e.preventDefault();
    save();
  }, { enableOnFormTags: true }, [save]);

  return { isDirty, isSaving, showSaved, save, markDirty };
}
