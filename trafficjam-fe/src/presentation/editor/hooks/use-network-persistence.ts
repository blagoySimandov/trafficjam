import { useState, useCallback, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { Network } from "../../../types";
import type { Scenario } from "../../../api/scenarios";

interface UseNetworkPersistenceOptions {
  activeScenario: Scenario | null;
  network: Network | null;
  onSave: (id: string, updates: Partial<Scenario>) => Promise<unknown>;
}

export function useNetworkPersistence({ activeScenario, network, onSave }: UseNetworkPersistenceOptions) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const save = useCallback(async () => {
    if (!activeScenario || !network || isSaving) return;
    setIsSaving(true);
    await onSave(activeScenario.id, { networkData: network });
    setIsSaving(false);
    setIsDirty(false);
    setShowSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
  }, [activeScenario, network, isSaving, onSave]);

  useHotkeys("mod+s", (e) => {
    e.preventDefault();
    save();
  }, { enableOnFormTags: true }, [save]);

  return { isDirty, isSaving, showSaved, save, markDirty };
}
