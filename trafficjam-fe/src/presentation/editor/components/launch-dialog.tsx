import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { loadTrips, getTimeRange } from "../../../event-processing";
import { formatSimulationTime } from "../../../utils/format-time";
import styles from "./launch-dialog.module.css";

interface LaunchDialogProps {
  onLaunch: () => void;
  onClose: () => void;
}

function useEscapeKey(handler: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handler]);
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

export function LaunchDialog({ onLaunch, onClose }: LaunchDialogProps) {
  const stats = useTripStats();

  useEscapeKey(onClose);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.card}>
        <h2 className={styles.title}>Run Simulation</h2>
        <StatsLine stats={stats} />
        <button className={styles.launchButton} onClick={onLaunch}>
          <Play size={16} />
          Launch
        </button>
      </div>
    </div>
  );
}
