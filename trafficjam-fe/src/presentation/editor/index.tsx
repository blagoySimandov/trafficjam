import { useState, useCallback } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation/run-simulation-fab";
import { LaunchDialog } from "./components/run-simulation/launch-dialog/launch-dialog";
import { LinkAttributePanel } from "./components/link-attribute-panel";
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

  const handleLinkClick = useCallback((link: TrafficLink) => {
    setSelectedLinks([link]);
  }, []);

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
      setSelectedLinks(updatedLinks);
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

  return (
    <>
      <EditorMapView
        onStatusChange={setStatus}
        onLinkClick={handleLinkClick}
        onRegisterBulkLinkUpdater={handleRegisterBulkLinkUpdater}
        selectedLinkIds={selectedLinks.map((link) => link.id)}
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
