import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { Play, Loader2 } from "lucide-react";
import { loadTrips, getTimeRange } from "../../../../../event-processing";
import { formatSimulationTime } from "../../../../../utils/format-time";
import { networkToMatsim } from "../../../../../osm/matsim";
import { useSimulation } from "../../../../../api";
import type { Network } from "../../../../../types";
import styles from "./launch-dialog.module.css";

interface LaunchDialogProps {
  network: Network | null;
  onLaunch: (info: { scenarioId: string; runId: string }) => void;
  onClose: () => void;
}

function calculateBounds(network: Network) {
  let north = -90,
    south = 90,
    east = -180,
    west = 180;
  network.nodes.forEach((node) => {
    const [lat, lng] = node.position;
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  });
  return { north, south, east, west };
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

export function LaunchDialog({ network, onLaunch, onClose }: LaunchDialogProps) {
  const stats = useTripStats();
  const { start } = useSimulation("default");

  useHotkeys("escape", onClose);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleLaunchClick = useCallback(async () => {
    if (!network) return;

    try {
      const xml = networkToMatsim(network);
      const networkFile = new File([xml], "network.xml", {
        type: "application/xml",
      });

      const buildings = network.buildings
        ? Array.from(network.buildings.values())
        : [];
      const bounds = calculateBounds(network);

      start.mutate(
        {
          scenarioId: "default",
          networkFile,
          buildings,
          bounds,
          iterations: 1,
        },
        {
          onSuccess: (data) => {
            onLaunch({ scenarioId: data.scenario_id, runId: data.run_id });
          },
          onError: (error) => {
            console.error("Failed to start simulation:", error);
            alert("Failed to start simulation. Check console for details.");
          },
        },
      );
    } catch (e) {
      console.error("Failed to prepare simulation:", e);
    }
  }, [network, start, onLaunch]);

  const isLaunching = start.isPending;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.card}>
        <h2 className={styles.title}>Run Simulation</h2>
        <StatsLine stats={stats} />
        <button
          className={styles.launchButton}
          onClick={handleLaunchClick}
          disabled={isLaunching || !network}
        >
          {isLaunching ? (
            <Loader2 size={16} className={styles.spinner} />
          ) : (
            <Play size={16} />
          )}
          {isLaunching ? "Launching..." : "Launch"}
        </button>
      </div>
    </div>
  );
}
