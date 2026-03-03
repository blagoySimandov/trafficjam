import { useState, useCallback, useMemo, useRef } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation/run-simulation-fab";
import { LaunchDialog } from "./components/run-simulation/launch-dialog/launch-dialog";
import { LinkAttributePanel } from "../link-attribute-panel";
import { BuildingAttributePanel } from "../building-attribute-panel";
import { StatusBar } from "../../components/status-bar";
import { SaveIndicator } from "../../components/save-indicator/save-indicator";
import { LoadingScreen } from "../../components/loading-screen";
import { useUndoStack } from "./hooks/use-undo-stack";
import { useNetworkPersistence } from "./hooks/use-network-persistence";
import { useMultiSelect } from "../link-attribute-panel/hooks/use-multi-select";
import { useAutoLoadMap } from "../../hooks/use-auto-load-map";
import { applyLinksDiff, applyBuildingsDiff } from "../../api/scenarios/network-serializer";
import type { TrafficLink, Network, Building } from "../../types";
import type { Scenario, Run } from "../../api/scenarios";
import type { CityConfig } from "../../constants/cities";

interface EditorProps {
  city: CityConfig;
  activeScenario: Scenario | null;
  isSwitchingScenario?: boolean;
  onRunSimulation: (info: { scenarioId: string; runId: string }) => void;
  rerunSource?: Run | null;
  onClearRerun?: () => void;
}

export function Editor({
  city,
  activeScenario,
  isSwitchingScenario,
  onRunSimulation,
  rerunSource,
  onClearRerun,
}: EditorProps) {
  function remapSelectedLinks(
    selectedLinks: TrafficLink[],
    network: Network,
  ): TrafficLink[] {
    return selectedLinks
      .map((link) => network.links.get(link.id))
      .filter((link): link is TrafficLink => link !== undefined);
  }

  const { data: autoNetwork, isLoading } = useAutoLoadMap(city);
  const prevScenarioIdRef = useRef(activeScenario?.id);

  const [status, setStatus] = useState("");
  const [network, setNetwork] = useState<Network | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<TrafficLink[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (prevScenarioIdRef.current !== activeScenario?.id) {
    prevScenarioIdRef.current = activeScenario?.id;
    setNetwork(null);
    setSelectedLinks([]);
    setSelectedBuilding(null);
  }

  const rerunInitialValues = useMemo(() => {
    if (!rerunSource) return undefined;
    return {
      iterations: rerunSource.iterations,
      randomSeed: rerunSource.randomSeed,
      note: rerunSource.note,
    };
  }, [rerunSource]);

  const scenarioNetwork = useMemo(() => {
    if (!autoNetwork) return null;
    const { linksDiff, buildingsDiff } = activeScenario ?? {};
    if (!linksDiff && !buildingsDiff) return null;
    let net = linksDiff ? applyLinksDiff(autoNetwork, linksDiff) : autoNetwork;
    if (buildingsDiff) net = applyBuildingsDiff(net, buildingsDiff);
    return net;
  }, [autoNetwork, activeScenario]);

  const activeNetwork = useMemo(
    () => network ?? scenarioNetwork ?? autoNetwork ?? null,
    [network, scenarioNetwork, autoNetwork],
  );

  const { pushToUndoStack, undo, canUndo, clearUndoStack } = useUndoStack();

  const { isDirty, isSaving, showSaved, markDirty } = useNetworkPersistence({
    activeScenario,
    network: activeNetwork,
    baseNetwork: autoNetwork ?? null,
  });
  const { handleLinkClick: resolveSelection } = useMultiSelect(selectedLinks);

  const handleLinkClick = useCallback(
    (link: TrafficLink, modKey: boolean) => {
      setSelectedLinks(resolveSelection(link, modKey));
    },
    [resolveSelection],
  );

  const handleLinkSave = useCallback(
    (updatedNetwork: Network, message: string) => {
      if (activeNetwork) {
        pushToUndoStack(activeNetwork);
      }
      setNetwork(updatedNetwork);
      setStatus(message);
      markDirty();

      if (selectedLinks.length > 0) {
        setSelectedLinks(remapSelectedLinks(selectedLinks, updatedNetwork));
      }
    },
    [activeNetwork, selectedLinks, pushToUndoStack, markDirty],
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

  const handleBuildingClick = useCallback((building: Building) => {
    setSelectedBuilding(building);
    setSelectedLinks([]);
  }, []);

  const handleBuildingSave = useCallback(
    (updatedNetwork: Network, message: string) => {
      if (activeNetwork) {
        pushToUndoStack(activeNetwork);
      }
      setNetwork(updatedNetwork);
      setStatus(message);
      markDirty();
    },
    [activeNetwork, pushToUndoStack, markDirty],
  );

  const handleBuildingClose = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const handleLaunch = useCallback(
    (info: { scenarioId: string; runId: string }) => {
      setDialogOpen(false);
      onClearRerun?.();
      onRunSimulation(info);
    },
    [onRunSimulation, onClearRerun],
  );

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    onClearRerun?.();
  }, [onClearRerun]);

  const showDialog = dialogOpen || !!rerunSource;

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

  if (isSwitchingScenario) {
    return <LoadingScreen message="Loading scenario..." />;
  }

  return (
    <>
      <EditorMapView
        network={activeNetwork}
        city={city}
        onNetworkSave={handleLinkSave}
        onStatusChange={setStatus}
        onLinkClick={handleLinkClick}
        onBuildingClick={handleBuildingClick}
        onUndo={handleUndo}
        onClear={handleClear}
        canUndo={canUndo}
        selectedLinkId={selectedLinks.map((link) => link.id)}
      />
      {selectedLinks.length > 0 && (
        <LinkAttributePanel
          key={selectedLinks.map((l) => l.id).join(",")}
          links={selectedLinks}
          network={activeNetwork}
          onClose={handleClosePanel}
          onSave={handleLinkSave}
          onSelectAllWithSameName={handleSelectAllWithSameName}
        />
      )}
      {
        selectedBuilding && (
          <BuildingAttributePanel
            key={selectedBuilding.id}
            building={selectedBuilding}
            network={activeNetwork}
            onClose={handleBuildingClose}
            onSave={handleBuildingSave}
          />
        )
      }
      <SaveIndicator isDirty={isDirty} isSaving={isSaving} showSaved={showSaved} />
      <SaveIndicator
        isDirty={isDirty}
        isSaving={isSaving}
        showSaved={showSaved}
      />
      {
        status && !isDirty && !isSaving && !showSaved && (
          <StatusBar message={status} />
        )
      }
      <RunSimulationFab onClick={() => setDialogOpen(true)} />
      {
        showDialog && (
          <LaunchDialog
            activeScenario={activeScenario}
            network={activeNetwork}
            onLaunch={handleLaunch}
            onClose={handleCloseDialog}
            initialValues={rerunInitialValues}
          />
        )
      }
    </>
  );
}
