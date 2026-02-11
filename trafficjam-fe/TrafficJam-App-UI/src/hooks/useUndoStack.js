import { useState, useCallback, useEffect } from 'react';

/**
 * Simple undo/redo hook for network state management
 * Supports Ctrl+Z / Cmd+Z keyboard shortcut
 */
export function useUndoStack(initialState) {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushToHistory = useCallback((newState) => {
    if (!newState) return;

    // Deep clone the state to avoid mutations
    const clonedState = {
      nodes: new Map(newState.nodes),
      links: new Map(newState.links),
    };

    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, clonedState];
    });

    setCurrentIndex(prev => prev + 1);
    setState(newState);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const previousState = history[currentIndex - 1];
      setCurrentIndex(prev => prev - 1);
      setState(previousState);
      return previousState;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextState = history[currentIndex + 1];
      setCurrentIndex(prev => prev + 1);
      setState(nextState);
      return nextState;
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Keyboard shortcut for undo/redo
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    setState: pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
