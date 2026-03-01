import { useState, useCallback, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useMutation } from "@tanstack/react-query";
import { scenariosApi } from "../../../api/scenarios";
import type { Network } from "../../../types";
import type { Scenario } from "../../../api/scenarios";

interface UseNetworkPersistenceOptions {
  activeScenario: Scenario | null;
  network: Network | null;
}

export function useNetworkPersistence({ activeScenario, network }: UseNetworkPersistenceOptions) {
  const [isDirty, setIsDirty] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: ({ id, net }: { id: string; net: Network }) =>
      scenariosApi.saveNetwork(id, net),
  });

  const markDirty = useCallback(() => setIsDirty(true), []);

  const save = useCallback(async () => {
    if (!activeScenario || !network || isSaving) return;
    await mutateAsync({ id: activeScenario.id, net: network });
    setIsDirty(false);
    setShowSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
  }, [activeScenario, network, isSaving, mutateAsync]);

  useHotkeys("mod+s", (e) => {
    e.preventDefault();
    save();
  }, { enableOnFormTags: true }, [save]);

  return { isDirty, isSaving, showSaved, save, markDirty };
}
