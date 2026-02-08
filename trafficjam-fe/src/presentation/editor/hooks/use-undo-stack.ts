import { useCallback } from "react";
import type { Network } from "../../../types";
import { useHistoryState } from "@uidotdev/usehooks";

interface UseUndoStackResult {
  pushToUndoStack: (network: Network) => void;
  undo: () => Network | null;
  canUndo: boolean;
  clearUndoStack: () => void;
  undoStackSize: number;
}

function deepCopyNetwork(network: Network): Network {
  return {
    nodes: new Map(network.nodes),
    links: new Map(network.links),
    transportRoutes: network.transportRoutes ? new Map(network.transportRoutes) : new Map(),
    buildings: network.buildings ? new Map(network.buildings) : new Map(),
  };
}

export function useUndoStack(): UseUndoStackResult {
  const {
    state: present,
    set: setPresent,
    undo: historyUndo,
    clear: clearHistory,
    canUndo,
  } = useHistoryState<Network | null>(null);

  const pushToUndoStack = useCallback(
    (network: Network) => {
      const copy = deepCopyNetwork(network);
      setPresent(copy);
    },
    [setPresent]
  );

  const undo = useCallback((): Network | null => {
    // call the underlying undo; if it returns a value, return that, otherwise return present as a fallback
    const result = (historyUndo as unknown as (() => Network | undefined))?.();
    if (result) return result;
    return present ?? null;
  }, [historyUndo, present]);

  const clearUndoStack = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  // We cannot reliably expose the full history length from the API, so expose 0 when unknown
  const undoStackSize = canUndo ? 1 : 0;

  return {
    pushToUndoStack,
    undo,
    canUndo: !!canUndo,
    clearUndoStack,
    undoStackSize,
  };
}
