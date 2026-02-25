import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Loader2 } from "lucide-react";
import { networkToMatsim } from "../../../../../osm/matsim";
import { calculateBounds } from "../../../../../utils/network-bounds";
import { useSimulation } from "../../../../../api";
import { Dialog } from "../../../../../components/dialog";
import type { Network } from "../../../../../types";
import type { Scenario } from "../../../../../api/scenarios";
import { useSimulationParams } from "./use-simulation-params";
import styles from "./launch-dialog.module.css";

interface LaunchDialogProps {
  activeScenario: Scenario | null;
  network: Network | null;
  onLaunch: (info: { scenarioId: string; runId: string }) => void;
  onClose: () => void;
}

function prepareSimulationData(network: Network) {
  const xml = networkToMatsim(network);
  const networkFile = new File([xml], "network.xml", { type: "application/xml" });
  const buildings = network.buildings ? Array.from(network.buildings.values()) : [];
  const bounds = calculateBounds(network);
  return { networkFile, buildings, bounds };
}

export function LaunchDialog({ activeScenario, network, onLaunch, onClose }: LaunchDialogProps) {
  const queryClient = useQueryClient();
  const { start } = useSimulation(activeScenario?.id || "default");
  const { params, setIterations, setRandomSeed, setNote } = useSimulationParams();
  const [error, setError] = useState<string | null>(null);

  const handleLaunchClick = useCallback(() => {
    if (!network || !activeScenario) return;
    setError(null);

    try {
      const { networkFile, buildings, bounds } = prepareSimulationData(network);
      
      start.mutate(
        { 
          scenarioId: activeScenario.id, 
          networkFile, 
          buildings, 
          bounds, 
          iterations: params.iterations, 
          randomSeed: params.randomSeed 
        },
        {
          onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["runs"] });
            onLaunch({ scenarioId: data.scenario_id, runId: data.run_id });
          },
          onError: (err) => setError(err instanceof Error ? err.message : "Failed to start simulation"),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to prepare simulation");
    }
  }, [network, activeScenario, params, start, onLaunch, queryClient]);

  const dialogTitle = (
    <>
      Run Simulation
      <div className={styles.scenarioBadge}>{activeScenario?.name}</div>
    </>
  );

  const dialogFooter = (
    <>
      <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
      <button
        className={styles.launchButton}
        onClick={handleLaunchClick}
        disabled={start.isPending || !network || !activeScenario}
      >
        {start.isPending ? (
          <Loader2 size={16} className={styles.spinner} />
        ) : (
          <Play size={16} />
        )}
        {start.isPending ? "Launching..." : "Launch"}
      </button>
    </>
  );

  return (
    <Dialog 
      title={dialogTitle} 
      footer={dialogFooter} 
      onClose={onClose}
      maxWidth={480}
    >
      <div className={styles.formGroup}>
        <label className={styles.label}>Run Note (optional)</label>
        <input 
          type="text" 
          className={styles.input} 
          placeholder="e.g. Closed bridge experiment"
          value={params.note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Iterations</label>
          <input 
            type="number" 
            className={styles.input} 
            min={1} 
            max={100}
            value={params.iterations}
            onChange={e => setIterations(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Random Seed</label>
          <input 
            type="number" 
            className={styles.input} 
            placeholder="Random"
            value={params.randomSeed ?? ""}
            onChange={e => setRandomSeed(e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      
      {!network && (
        <p className={styles.warning}>
          No network data found. Please download or edit a network in the map view before running a simulation.
        </p>
      )}
    </Dialog>
  );
}
