import { useState, useCallback } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation/run-simulation-fab";
import { LaunchDialog } from "./components/run-simulation/launch-dialog/launch-dialog";
import { LinkAttributePanel } from "../link-attribute-panel";
import { StatusBar } from "../../components/status-bar";
import { useUndoStack } from "./hooks/use-undo-stack";
import { useMultiSelect } from "../link-attribute-panel/hooks/use-multi-select";
import { remapSelectedLinks } from "../../utils";
import type { TrafficLink, Network } from "../../types";
import type { Scenario } from "../../api/scenarios";

interface EditorProps {
  activeScenario: Scenario | null;
  onRunSimulation: (info: { scenarioId: string; runId: string }) => void;
}

export function Editor({ activeScenario, onRunSimulation }: EditorProps) {
  const [status, setStatus] = useState("");
  const [network, setNetwork] = useState<Network | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<TrafficLink[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { pushToUndoStack, undo, canUndo, clearUndoStack } = useUndoStack();
  const { handleLinkClick: resolveSelection } = useMultiSelect(selectedLinks);

  const handleLinkClick = useCallback(
    (link: TrafficLink) => {
      setSelectedLinks(resolveSelection(link));
    },
    [resolveSelection],
  );

  const handleLinkSave = useCallback(
    (updatedNetwork: Network, message: string) => {
      if (network) {
        pushToUndoStack(network);
      }
      setNetwork(updatedNetwork);
      setStatus(message);

      if (selectedLinks.length > 0) {
        setSelectedLinks(remapSelectedLinks(selectedLinks, updatedNetwork));
      }
    },
    [network, selectedLinks, pushToUndoStack],
  );

  const handleUndo = useCallback(() => {
    const previousNetwork = undo();
    if (previousNetwork) {
      setNetwork(previousNetwork);
      setStatus("Undid last change");

      if (selectedLinks.length > 0) {
        setSelectedLinks(remapSelectedLinks(selectedLinks, previousNetwork));
      }
    }
  }, [selectedLinks, undo]);

  const handleClear = useCallback(() => {
    setNetwork(null);
    setSelectedLinks([]);
    clearUndoStack();
  }, [clearUndoStack]);

  const handleClosePanel = useCallback(() => {
    setSelectedLinks([]);
  }, []);

  const handleLaunch = useCallback(
    (info: { scenarioId: string; runId: string }) => {
      setDialogOpen(false);
      onRunSimulation(info);
    },
    [onRunSimulation],
  );

  const handleSelectAllWithSameName = useCallback(
    (streetName: string) => {
      if (!network) return;
      const matchingLinks = Array.from(network.links.values()).filter(
        (link) => link.tags.name === streetName,
      );
      setSelectedLinks(matchingLinks);
      setStatus(`Selected ${matchingLinks.length} links on ${streetName}`);
    },
    [network],
  );

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
        selectedLinkId={selectedLinks.map((link) => link.id)}
      />
      {selectedLinks.length > 0 && (
        <LinkAttributePanel
          links={selectedLinks}
          network={network}
          onClose={handleClosePanel}
          onSave={handleLinkSave}
          onSelectAllWithSameName={handleSelectAllWithSameName}
        />
      )}
      {status && <StatusBar message={status} />}
      <RunSimulationFab onClick={() => setDialogOpen(true)} />
      {dialogOpen && (
        <LaunchDialog
          activeScenario={activeScenario}
          network={network}
          onLaunch={handleLaunch}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}
