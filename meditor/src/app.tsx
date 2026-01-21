import { useState, useCallback } from "react";
import { MapView } from "./components/map-view.tsx";
import { InfoPanel } from "./components/info-panel.tsx";
import { StatusBar } from "./components/status-bar.tsx";
import type { TrafficLink } from "./types";

export interface InfoData {
  title: string;
  data: Record<string, unknown>;
}

export default function App() {
  const [status, setStatus] = useState<string>("");
  const [info, setInfo] = useState<InfoData | null>(null);

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

  return (
    <>
      <MapView onStatusChange={setStatus} onLinkClick={handleLinkClick} />
      {info && <InfoPanel title={info.title} data={info.data} />}
      {status && <StatusBar message={status} />}
    </>
  );
}
