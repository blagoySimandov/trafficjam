import { Play } from "lucide-react";
import styles from "./run-simulation-fab.module.css";

interface RunSimulationFabProps {
  onClick: () => void;
}

export function RunSimulationFab({ onClick }: RunSimulationFabProps) {
  return (
    <button className={styles.fab} onClick={onClick}>
      <Play size={18} />
      Run Simulation
    </button>
  );
}
