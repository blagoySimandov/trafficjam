import { useState } from "react";
import { Save, Undo2 } from "lucide-react";
import { Tooltip } from "../../../../components/tooltip";
import { Dialog } from "../../../../components/dialog";
import { DEFAULT_AGENT_CONFIG } from "../../../../api/scenarios";
import type { AgentConfig, Scenario } from "../../../../api/scenarios";
import styles from "./agent-config-modal.module.css";

interface AgentConfigModalProps {
  scenario: Scenario;
  onSave: (config: AgentConfig) => void;
  onClose: () => void;
}

export function AgentConfigModal({ scenario, onSave, onClose }: AgentConfigModalProps) {
  const [config, setConfig] = useState<AgentConfig>({ ...scenario.agentConfig });

  const handleChange = (field: keyof AgentConfig, value: number) => {
    setConfig((prev: AgentConfig) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (confirm("Reset to defaults?")) {
      setConfig({ ...DEFAULT_AGENT_CONFIG });
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(config);
  };

  const dialogTitle = (
    <div className={styles.titleInfo}>
      <h2 className={styles.title}>Agent Planner Config</h2>
      <span className={styles.subtitle}>{scenario.name}</span>
    </div>
  );

  const dialogFooter = (
    <>
      <button type="button" className={styles.resetBtn} onClick={handleReset}>
        <Undo2 size={16} /> Reset
      </button>
      <div className={styles.rightActions}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.saveBtn} onClick={() => handleSubmit()}>
          <Save size={16} /> Save Changes
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
      <form onSubmit={handleSubmit} className={styles.form}>
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
                value={config.populationDensity} 
                onChange={e => handleChange("populationDensity", parseInt(e.target.value) || 0)} 
              />
            </div>
            <div className={styles.field}>
              <label>Max Shopping Distance (km)</label>
              <input 
                type="number" 
                step="0.1"
                value={config.maxShoppingDistanceKm} 
                onChange={e => handleChange("maxShoppingDistanceKm", parseFloat(e.target.value) || 0)} 
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
                type="range" min="0" max="1" step="0.05"
                value={config.shoppingProbability} 
                onChange={e => handleChange("shoppingProbability", parseFloat(e.target.value))} 
              />
              <span className={styles.valueLabel}>{(config.shoppingProbability * 100).toFixed(0)}%</span>
            </div>
            <div className={styles.field}>
              <label>Healthcare Chance (0-1)</label>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={config.healthcareChance} 
                onChange={e => handleChange("healthcareChance", parseFloat(e.target.value))} 
              />
              <span className={styles.valueLabel}>{(config.healthcareChance * 100).toFixed(0)}%</span>
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
                value={config.elderlyAgeThreshold} 
                onChange={e => handleChange("elderlyAgeThreshold", parseInt(e.target.value) || 0)} 
              />
            </div>
            <div className={styles.field}>
              <label>Kindergarten Age</label>
              <input 
                type="number" 
                value={config.kindergartenAge} 
                onChange={e => handleChange("kindergartenAge", parseInt(e.target.value) || 0)} 
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
                  <input type="number" value={config.errandMinMinutes} onChange={e => handleChange("errandMinMinutes", parseInt(e.target.value) || 0)} />
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputLabel}>Max</span>
                  <input type="number" value={config.errandMaxMinutes} onChange={e => handleChange("errandMaxMinutes", parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>
            <div className={styles.field}>
              <label>School Dropoff</label>
              <div className={styles.rangeInput}>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputLabel}>Min</span>
                  <input type="number" value={config.childDropoffMinMinutes} onChange={e => handleChange("childDropoffMinMinutes", parseInt(e.target.value) || 0)} />
                </div>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputLabel}>Max</span>
                  <input type="number" value={config.childDropoffMaxMinutes} onChange={e => handleChange("childDropoffMaxMinutes", parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>
    </Dialog>
  );
}
