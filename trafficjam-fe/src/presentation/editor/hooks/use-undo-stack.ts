import { useState, useCallback } from 'react';
import type { Network } from '../../../types';

interface UseUndoStackResult {
  pushToUndoStack: (network: Network) => void;
  undo: () => Network | null;
  canUndo: boolean;
  clearUndoStack: () => void;
  undoStackSize: number;
}

const MAX_UNDO_STACK_SIZE = 50;

export function useUndoStack(): UseUndoStackResult {
  const [undoStack, setUndoStack] = useState<Network[]>([]);

  const pushToUndoStack = useCallback((network: Network) => {
    setUndoStack((prev) => {
      // Create a deep copy of the network to store in the stack
      const networkCopy: Network = {
        nodes: new Map(network.nodes),
        links: new Map(network.links),
        transportRoutes: network.transportRoutes ? new Map(network.transportRoutes) : new Map(),
        buildings: network.buildings ? new Map(network.buildings) : new Map(),
      };
      
      const newStack = [...prev, networkCopy];
      
      // Limit stack size to prevent memory issues
      if (newStack.length > MAX_UNDO_STACK_SIZE) {
        return newStack.slice(1);
      }
      
      return newStack;
    });
  }, []);

  const undo = useCallback((): Network | null => {
    let poppedNetwork: Network | null = null;
    
    setUndoStack((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const newStack = [...prev];
      poppedNetwork = newStack.pop() || null;
      
      return newStack;
    });
    
    return poppedNetwork;
  }, []);

  const clearUndoStack = useCallback(() => {
    setUndoStack([]);
  }, []);

  const canUndo = undoStack.length > 0;
  const undoStackSize = undoStack.length;

  return {
    pushToUndoStack,
    undo,
    canUndo,
    clearUndoStack,
    undoStackSize,
  };
}
