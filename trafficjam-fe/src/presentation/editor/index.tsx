import { useState, useCallback, useMemo } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation/run-simulation-fab";
import { LaunchDialog } from "./components/run-simulation/launch-dialog/launch-dialog";
import { LinkAttributePanel } from "../link-attribute-panel";
import { StatusBar } from "../../components/status-bar";
import { LoadingScreen } from "../../components/loading-screen";
import { useUndoStack } from "./hooks/use-undo-stack";
import { useMultiSelect } from "../link-attribute-panel/hooks/use-multi-select";
import { useAutoLoadMap } from "../../hooks/use-auto-load-map";
import type { TrafficLink, Network } from "../../types";
import type { Scenario } from "../../api/scenarios";
import type { CityConfig } from "../../constants/cities";

interface EditorProps {
  city: CityConfig;
  activeScenario: Scenario | null;
  onRunSimulation: (info: { scenarioId: string; runId: string }) => void;
}

function remapSelectedLinks(
  selectedLinks: TrafficLink[],
  network: Network,
): TrafficLink[] {
  return selectedLinks
    .map((link) => network.links.get(link.id))
    .filter((link): link is TrafficLink => link !== undefined);
}

export function Editor({ city, activeScenario, onRunSimulation }: EditorProps) {
  const { data: autoNetwork, isLoading } = useAutoLoadMap(city);

  const [status, setStatus] = useState("");
  const [network, setNetwork] = useState<Network | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<TrafficLink[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeNetwork = useMemo(() => network ?? autoNetwork ?? null, [network, autoNetwork]);

  const { pushToUndoStack, undo, canUndo, clearUndoStack } = useUndoStack();
  const { handleLinkClick: resolveSelection } = useMultiSelect(selectedLinks);

  const handleLinkClick = useCallback((link: TrafficLink, modKey: boolean) => {
    setSelectedLinks(resolveSelection(link, modKey));
  }, [resolveSelection]);

  const handleLinkSave = useCallback(
    (updatedNetwork: Network, message: string) => {
      if (activeNetwork) {
        pushToUndoStack(activeNetwork);
      }
      setNetwork(updatedNetwork);
      setStatus(message);

      if (selectedLinks.length > 0) {
        setSelectedLinks(remapSelectedLinks(selectedLinks, updatedNetwork));
      }
    },
    [activeNetwork, selectedLinks, pushToUndoStack],
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
      if (!activeNetwork) return;
      const matchingLinks = Array.from(activeNetwork.links.values()).filter(
        (link) => link.tags.name === streetName,
      );
      setSelectedLinks(matchingLinks);
      setStatus(`Selected ${matchingLinks.length} links on ${streetName}`);
    },
    [activeNetwork],
  );

  if (isLoading) {
    return <LoadingScreen cityName={city.name} />;
  }

  return (
    <>
      <EditorMapView
        network={activeNetwork}
        city={city}
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
        key={selectedLinks.map(l => l.id).join(",")}
          links={selectedLinks}
          network={activeNetwork}
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
          network={activeNetwork}
          onLaunch={handleLaunch}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}
