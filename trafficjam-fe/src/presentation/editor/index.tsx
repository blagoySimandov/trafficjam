import { useState, useCallback } from "react";
import { EditorMapView } from "./components/editor-map-view";
import { RunSimulationFab } from "./components/run-simulation-fab";
import { LaunchDialog } from "./components/launch-dialog";
import { InfoPanel } from "../../components/info-panel";
import { StatusBar } from "../../components/status-bar";
import type { TrafficLink } from "../../types";

interface InfoData {
  title: string;
  data: Record<string, unknown>;
}

interface EditorProps {
  onRunSimulation: () => void;
}

export function Editor({ onRunSimulation }: EditorProps) {
  const [status, setStatus] = useState("");
  const [info, setInfo] = useState<InfoData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLinkClick = useCallback((link: TrafficLink) => {
    setInfo({
      title: `Link: ${link.tags.name || link.tags.highway}`,
      data: {
        id: link.id,
        type: link.tags.highway,
        lanes: link.tags.lanes,
        maxspeed: link.tags.maxspeed,
        oneway: link.tags.oneway,
      },
    });
  }, []);

  const handleLaunch = useCallback(() => {
    setDialogOpen(false);
    onRunSimulation();
  }, [onRunSimulation]);

  return (
    <>
      <EditorMapView onStatusChange={setStatus} onLinkClick={handleLinkClick} />
      {info && <InfoPanel title={info.title} data={info.data} />}
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
