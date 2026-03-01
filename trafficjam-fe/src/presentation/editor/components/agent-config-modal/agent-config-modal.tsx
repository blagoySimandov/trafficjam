import { useForm, useWatch } from "react-hook-form";
import { Save, Undo2 } from "lucide-react";
import { Tooltip } from "../../../../components/tooltip";
import { Dialog } from "../../../../components/dialog";
import {
  DEFAULT_AGENT_CONFIG,
  AGENT_CONFIG_PLACEHOLDERS,
} from "../../../../api/scenarios";
import type { AgentConfig, Scenario } from "../../../../api/scenarios";
import styles from "./agent-config-modal.module.css";

interface AgentConfigModalProps {
  scenario: Scenario;
  saveLabel?: string;
  onSave: (config: AgentConfig) => void;
  onClose: () => void;
}

export function AgentConfigModal({
  scenario,
  saveLabel = "Save Changes",
  onSave,
  onClose,
}: AgentConfigModalProps) {
  const { register, handleSubmit, reset, control } = useForm<AgentConfig>({
    defaultValues: { ...scenario.agentConfig },
  });

  const shoppingProbability = useWatch({ control, name: "shoppingProbability" });
  const healthcareChance = useWatch({ control, name: "healthcareChance" });

  const handleReset = () => {
    if (confirm("Reset to defaults?")) {
      reset({ ...DEFAULT_AGENT_CONFIG });
    }
  };

  const dialogTitle = (
    <div className={styles.titleInfo}>
      <h2 className={styles.title}>Agent Planner Config</h2>
      {scenario.name && <span className={styles.subtitle}>{scenario.name}</span>}
    </div>
  );

  const dialogFooter = (
    <>
      <button type="button" className={styles.resetBtn} onClick={handleReset}>
        <Undo2 size={16} /> Reset
      </button>
      <div className={styles.rightActions}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSubmit(onSave)}
        >
          <Save size={16} /> {saveLabel}
        </button>
      </div>
    </>
  );

  return (
    <Dialog
      title={dialogTitle}
      footer={dialogFooter}
      onClose={onClose}
      maxWidth={650}
    >
      <form onSubmit={handleSubmit(onSave)} className={styles.form}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Population & Distance
            <Tooltip text="Controls the number of agents generated and how far they are willing to travel for non-work activities." />
          </h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Population Density (per km²)</label>
              <input
                type="number"
                placeholder={AGENT_CONFIG_PLACEHOLDERS.populationDensity}
                {...register("populationDensity", { valueAsNumber: true })}
              />
            </div>
            <div className={styles.field}>
              <label>Max Shopping Distance (km)</label>
              <input
                type="number"
                step="0.1"
                placeholder={AGENT_CONFIG_PLACEHOLDERS.maxShoppingDistanceKm}
                {...register("maxShoppingDistanceKm", { valueAsNumber: true })}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Probabilities
            <Tooltip text="Determines the likelihood of agents choosing specific activities like shopping or healthcare during their day." />
          </h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Shopping Probability (0-1)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                {...register("shoppingProbability", { valueAsNumber: true })}
              />
              <span className={styles.valueLabel}>
                {(shoppingProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className={styles.field}>
              <label>Healthcare Chance (0-1)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                {...register("healthcareChance", { valueAsNumber: true })}
              />
              <span className={styles.valueLabel}>
                {(healthcareChance * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Ages & Thresholds
            <Tooltip text="Defines demographic boundaries that affect agent mobility, school assignments, and work status." />
          </h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Elderly Age Threshold</label>
              <input
                type="number"
                placeholder={AGENT_CONFIG_PLACEHOLDERS.elderlyAgeThreshold}
                {...register("elderlyAgeThreshold", { valueAsNumber: true })}
              />
            </div>
            <div className={styles.field}>
              <label>Kindergarten Age</label>
              <input
                type="number"
                placeholder={AGENT_CONFIG_PLACEHOLDERS.kindergartenAge}
                {...register("kindergartenAge", { valueAsNumber: true })}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Activity Duration (mins)
            <Tooltip text="Sets the minimum and maximum time agents spend at various activity locations, affecting overall traffic flow." />
          </h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Errand Duration</label>
              <div className={styles.rangeInput}>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputLabel}>Min</span>
                  <input
                    type="number"
                    placeholder={AGENT_CONFIG_PLACEHOLDERS.errandMinMinutes}
                    {...register("errandMinMinutes", { valueAsNumber: true })}
                  />
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputLabel}>Max</span>
                  <input
                    type="number"
                    placeholder={AGENT_CONFIG_PLACEHOLDERS.errandMaxMinutes}
                    {...register("errandMaxMinutes", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
            <div className={styles.field}>
              <label>School Dropoff</label>
              <div className={styles.rangeInput}>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputLabel}>Min</span>
                  <input
                    type="number"
                    placeholder={
                      AGENT_CONFIG_PLACEHOLDERS.childDropoffMinMinutes
                    }
                    {...register("childDropoffMinMinutes", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputLabel}>Max</span>
                  <input
                    type="number"
                    placeholder={
                      AGENT_CONFIG_PLACEHOLDERS.childDropoffMaxMinutes
                    }
                    {...register("childDropoffMaxMinutes", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>
    </Dialog>
  );
}
