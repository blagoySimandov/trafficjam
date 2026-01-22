import { useState, useCallback } from "react";
import { MapView, InfoPanel, StatusBar } from "./components";
import type { TrafficLink } from "./types";

interface InfoData {
  title: string;
  data: Record<string, unknown>;
}

export default function App() {
  const [status, setStatus] = useState("");
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
