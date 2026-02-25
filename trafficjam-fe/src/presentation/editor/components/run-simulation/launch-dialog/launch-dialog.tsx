import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { Play, Loader2 } from "lucide-react";
import { loadTrips, getTimeRange } from "../../../../../event-processing";
import { formatSimulationTime } from "../../../../../utils/format-time";
import { networkToMatsim } from "../../../../../osm/matsim";
import { calculateBounds } from "../../../../../utils/network-bounds";
import { useSimulation } from "../../../../../api";
import type { Network } from "../../../../../types";
import styles from "./launch-dialog.module.css";

interface LaunchDialogProps {
  network: Network | null;
  onLaunch: (info: { scenarioId: string; runId: string }) => void;
  onClose: () => void;
}

function useTripStats() {
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: loadTrips,
  });

  if (trips.length === 0) return null;

  const [min, max] = getTimeRange(trips);
  return {
    count: trips.length,
    startTime: formatSimulationTime(min),
    endTime: formatSimulationTime(max),
  };
}

function StatsLine({ stats }: { stats: ReturnType<typeof useTripStats> }) {
  if (!stats) return <p className={styles.stats}>Loading trips...</p>;

  return (
    <p className={styles.stats}>
      {stats.count.toLocaleString()} vehicles &mdash; {stats.startTime} to{" "}
      {stats.endTime}
    </p>
  );
}

function prepareSimulationData(network: Network) {
  const xml = networkToMatsim(network);
  const networkFile = new File([xml], "network.xml", { type: "application/xml" });
  const buildings = network.buildings ? Array.from(network.buildings.values()) : [];
  const bounds = calculateBounds(network);
  return { networkFile, buildings, bounds };
}

export function LaunchDialog({ network, onLaunch, onClose }: LaunchDialogProps) {
  const stats = useTripStats();
  const { start } = useSimulation("default");
  const [error, setError] = useState<string | null>(null);

  useHotkeys("escape", onClose);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleLaunchClick = useCallback(() => {
    if (!network) return;
    setError(null);

    try {
      const { networkFile, buildings, bounds } = prepareSimulationData(network);
      start.mutate(
        { scenarioId: "default", networkFile, buildings, bounds, iterations: 1 },
        {
          onSuccess: (data) => onLaunch({ scenarioId: data.scenario_id, runId: data.run_id }),
          onError: (err) => setError(err instanceof Error ? err.message : "Failed to start simulation"),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to prepare simulation");
    }
  }, [network, start, onLaunch]);

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.card}>
        <h2 className={styles.title}>Run Simulation</h2>
        <StatsLine stats={stats} />
        {error && <p className={styles.stats} style={{ color: "#ff6b6b" }}>{error}</p>}
        <button
          className={styles.launchButton}
          onClick={handleLaunchClick}
          disabled={start.isPending || !network}
        >
          {start.isPending ? (
            <Loader2 size={16} className={styles.spinner} />
          ) : (
            <Play size={16} />
          )}
          {start.isPending ? "Launching..." : "Launch"}
        </button>
      </div>
    </div>
  );
}
