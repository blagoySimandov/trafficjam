import { useState, useCallback, useMemo } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation/run-simulation-fab";
import { LaunchDialog } from "./components/run-simulation/launch-dialog/launch-dialog";
import { LinkAttributePanel } from "../link-attribute-panel";
import { StatusBar } from "../../components/status-bar";
import type { TrafficLink, Network } from "../../types";

interface EditorProps {
  onRunSimulation: () => void;
}

export function Editor({ onRunSimulation }: EditorProps) {
  const [status, setStatus] = useState("");
  const [selectedLinks, setSelectedLinks] = useState<TrafficLink[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [network, setNetwork] = useState<Network | null>(null);

  const [updateMultipleLinksInNetwork, setUpdateMultipleLinksInNetwork] =
    useState<((links: TrafficLink[]) => void) | null>(null);

  const handleLinkClick = useCallback(
    (link: TrafficLink, shiftKey: boolean = false) => {
      if (shiftKey) {
        // Shift-click: toggle selection
        setSelectedLinks((prev) => {
          const isAlreadySelected = prev.some((l) => l.id === link.id);
          if (isAlreadySelected) {
            return prev.filter((l) => l.id !== link.id);
          } else {
            return [...prev, link];
          }
        });
      } else {
        // Normal click: single selection
        setSelectedLinks([link]);
      }
    },
    [],
  );

  const handleSelectByName = useCallback(
    (name: string) => {
      if (!network || !name) {
        setStatus("Cannot select by name: no network or name provided");
        return;
      }

      const linksWithSameName: TrafficLink[] = [];
      for (const link of network.links.values()) {
        if (link.tags.name === name) {
          linksWithSameName.push(link);
        }
      }

      if (linksWithSameName.length === 0) {
        setStatus(`No links found with name "${name}"`);
        return;
      }

      setSelectedLinks(linksWithSameName);
      setStatus(`Selected ${linksWithSameName.length} links named "${name}"`);
    },
    [network],
  );

  const handleLinkSave = useCallback(
    (updatedLinks: TrafficLink[]) => {
      if (updateMultipleLinksInNetwork) {
        updateMultipleLinksInNetwork(updatedLinks);
      }
      setSelectedLinks([]);
      const count = updatedLinks.length;
      const linkDesc =
        count === 1
          ? updatedLinks[0].tags.name || updatedLinks[0].tags.highway
          : `${count} links`;
      setStatus(`Updated ${linkDesc}`);
    },
    [updateMultipleLinksInNetwork],
  );

  const handleRegisterBulkLinkUpdater = useCallback(
    (updater: (links: TrafficLink[]) => void) => {
      setUpdateMultipleLinksInNetwork(() => updater);
    },
    [],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedLinks([]);
  }, []);

  const handleLaunch = useCallback(() => {
    setDialogOpen(false);
    onRunSimulation();
  }, [onRunSimulation]);

  const selectedLinkIds = useMemo(
    () => selectedLinks.map((link) => link.id),
    [selectedLinks],
  );

  return (
    <>
      <EditorMapView
        onStatusChange={setStatus}
        onLinkClick={handleLinkClick}
        onRegisterBulkLinkUpdater={handleRegisterBulkLinkUpdater}
        selectedLinkIds={selectedLinkIds}
        onNetworkChange={setNetwork}
      />
      {selectedLinks.length > 0 && (
        <LinkAttributePanel
          links={selectedLinks}
          onClose={handleClosePanel}
          onSave={handleLinkSave}
          onSelectByName={handleSelectByName}
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
