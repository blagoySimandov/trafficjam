import { useState, useCallback } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation/run-simulation-fab";
import { LaunchDialog } from "./components/run-simulation/launch-dialog/launch-dialog";
import { LinkAttributePanel } from "./components/link-attribute-panel";
import { StatusBar } from "../../components/status-bar";
import type { TrafficLink } from "../../types";

interface EditorProps {
  onRunSimulation: () => void;
}

export function Editor({ onRunSimulation }: EditorProps) {
  const [status, setStatus] = useState("");
  const [selectedLink, setSelectedLink] = useState<TrafficLink | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [updateLinkInNetwork, setUpdateLinkInNetwork] = useState<
    ((link: TrafficLink) => void) | null
  >(null);

  const handleLinkClick = useCallback((link: TrafficLink) => {
    setSelectedLink(link);
  }, []);

  const handleLinkSave = useCallback(
    (updatedLink: TrafficLink) => {
      if (updateLinkInNetwork) {
        updateLinkInNetwork(updatedLink);
      }
      setSelectedLink(updatedLink);
      setStatus(
        `Updated link: ${updatedLink.tags.name || updatedLink.tags.highway}`,
      );
    },
    [updateLinkInNetwork],
  );

  const handleRegisterLinkUpdater = useCallback(
    (updater: (link: TrafficLink) => void) => {
      setUpdateLinkInNetwork(() => updater);
    },
    [],
  );

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
        onStatusChange={setStatus}
        onLinkClick={handleLinkClick}
        onRegisterLinkUpdater={handleRegisterLinkUpdater}
        selectedLinkId={selectedLink?.id || null}
      />
      {selectedLink && (
        <LinkAttributePanel
          link={selectedLink}
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
