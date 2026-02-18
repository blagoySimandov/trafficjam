import { useState, useCallback } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation/run-simulation-fab";
import { LaunchDialog } from "./components/run-simulation/launch-dialog/launch-dialog";
import { LinkAttributePanel } from "../link-attribute-panel";
import { StatusBar } from "../../components/status-bar";
import { useUndoStack } from "./hooks/use-undo-stack";
import type { TrafficLink, Network } from "../../types";

interface EditorProps {
  onRunSimulation: () => void;
}

export function Editor({ onRunSimulation }: EditorProps) {
  const [status, setStatus] = useState("");
  const [network, setNetwork] = useState<Network | null>(null);
  const [selectedLink, setSelectedLink] = useState<TrafficLink | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { pushToUndoStack, undo, canUndo, clearUndoStack } = useUndoStack();

  const handleLinkClick = useCallback((link: TrafficLink) => {
    setSelectedLink(link);
  }, []);

  const handleLinkSave = useCallback(
    (updatedNetwork: Network, message: string) => {
      if (network) {
        pushToUndoStack(network);
      }
      setNetwork(updatedNetwork);
      setStatus(message);

      if (selectedLink) {
        const updatedLink = updatedNetwork.links.get(selectedLink.id);
        if (updatedLink) {
          setSelectedLink(updatedLink);
        } else {
          setSelectedLink(null);
        }
      }
    },
    [network, selectedLink, pushToUndoStack],
  );

  const handleUndo = useCallback(() => {
    const previousNetwork = undo();
    if (previousNetwork) {
      setNetwork(previousNetwork);
      setStatus("Undid last change");

      if (selectedLink) {
        const previousLink = previousNetwork.links.get(selectedLink.id);
        if (previousLink) {
          setSelectedLink(previousLink);
        } else {
          setSelectedLink(null);
        }
      }
    }
  }, [selectedLink, undo]);

  const handleClear = useCallback(() => {
    setNetwork(null);
    setSelectedLink(null);
    clearUndoStack();
  }, [clearUndoStack]);

  const handleClosePanel = useCallback(() => {
    setSelectedLink(null);
  }, []);

  const handleLaunch = useCallback(() => {
    setDialogOpen(false);
    onRunSimulation();
  }, [onRunSimulation]);

  return (
    <>
      <EditorMapView
        network={network}
        onNetworkChange={setNetwork}
        onNetworkSave={handleLinkSave}
        onStatusChange={setStatus}
        onLinkClick={handleLinkClick}
        onUndo={handleUndo}
        onClear={handleClear}
        canUndo={canUndo}
        selectedLinkId={selectedLink?.id || null}
      />
      {selectedLink && (
        <LinkAttributePanel
          link={selectedLink}
          network={network}
          onClose={handleClosePanel}
          onSave={handleLinkSave}
        />
      )}
      {status && <StatusBar message={status} />}
      <RunSimulationFab onClick={() => setDialogOpen(true)} />
      {dialogOpen && (
        <LaunchDialog
          onLaunch={handleLaunch}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}
