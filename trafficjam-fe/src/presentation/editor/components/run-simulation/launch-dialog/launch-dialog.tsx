import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Loader2 } from "lucide-react";
import { networkToMatsim } from "../../../../../osm/matsim";
import { calculateBounds } from "../../../../../utils/network-bounds";
import { useSimulation } from "../../../../../api";
import { Dialog } from "../../../../../components/dialog";
import type { Network } from "../../../../../types";
import type { Scenario } from "../../../../../api/scenarios";
import styles from "./launch-dialog.module.css";

interface LaunchDialogProps {
  activeScenario: Scenario | null;
  network: Network | null;
  onLaunch: (info: { scenarioId: string; runId: string }) => void;
  onClose: () => void;
}

interface LaunchForm {
  iterations: number;
  randomSeed?: number;
  note: string;
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
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit } = useForm<LaunchForm>({
    defaultValues: {
      iterations: 1,
      note: ""
    }
  });

  const onSubmit = useCallback((data: LaunchForm) => {
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
          iterations: data.iterations, 
          randomSeed: data.randomSeed 
        },
        {
          onSuccess: (responseData) => {
            queryClient.invalidateQueries({ queryKey: ["runs"] });
            onLaunch({ scenarioId: responseData.scenario_id, runId: responseData.run_id });
          },
          onError: (err) => setError(err instanceof Error ? err.message : "Failed to start simulation"),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to prepare simulation");
    }
  }, [network, activeScenario, start, onLaunch, queryClient]);

  const dialogTitle = (
    <>
      Run Simulation
      <div className={styles.scenarioBadge}>{activeScenario?.name}</div>
    </>
  );

  const dialogFooter = (
    <>
      <button className={styles.cancelButton} onClick={onClose} type="button">Cancel</button>
      <button
        className={styles.launchButton}
        onClick={handleSubmit(onSubmit)}
        disabled={start.isPending || !network || !activeScenario}
        type="button"
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Run Note (optional)</label>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="e.g. Closed bridge experiment"
            {...register("note")}
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
              {...register("iterations", { valueAsNumber: true })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Random Seed</label>
            <input 
              type="number" 
              className={styles.input} 
              placeholder="Random"
              {...register("randomSeed", { valueAsNumber: true })}
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </form>
    </Dialog>
  );
}
