import * as ScrollArea from "@radix-ui/react-scroll-area";
import { CheckCircle2, XCircle, Loader2, Plus, Settings2, History, Trash2 } from "lucide-react";
import type { Scenario, Run } from "../../api/scenarios";
import styles from "./sidebar.module.css";

interface SidebarProps {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onSelectScenario: (id: string) => void;
  onCreateScenario: () => void;
  onOpenAgentConfig: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  runs: Run[];
  onSelectRun: (run: Run) => void;
}

export function Sidebar({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onCreateScenario,
  onOpenAgentConfig,
  onDeleteScenario,
  runs,
  onSelectRun,
}: SidebarProps) {
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const activeRuns = runs.filter((r) => r.scenarioId === activeScenarioId);

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <h1 className={styles.logo}>TrafficJam</h1>
        <button className={styles.newScenarioBtn} onClick={onCreateScenario} title="New Scenario">
          <Plus size={18} />
        </button>
      </header>

      <ScrollArea.Root className={styles.scrollRoot}>
        <ScrollArea.Viewport className={styles.scrollViewport}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Scenarios</h2>
            <ul className={styles.list}>
              {scenarios.map((s) => (
                <li
                  key={s.id}
                  className={`${styles.listItem} ${s.id === activeScenarioId ? styles.active : ""}`}
                  onClick={() => onSelectScenario(s.id)}
                >
                  <div className={styles.scenarioName}>{s.name}</div>
                  {s.id === activeScenarioId && (
                    <div className={styles.scenarioActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAgentConfig(s.id);
                        }}
                        title="Configure Agent Planner"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteScenario(s.id);
                        }}
                        title="Delete Scenario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {activeScenario && (
            <section className={styles.section}>
              <div className={styles.sectionTitleContainer}>
                <h2 className={styles.sectionTitle}>
                  <History size={14} className={styles.titleIcon} />
                  Run History
                </h2>
              </div>
              <ul className={styles.list}>
                {activeRuns.length === 0 ? (
                  <li className={styles.emptyMsg}>No runs yet</li>
                ) : (
                  activeRuns.map((r) => (
                    <li key={r.id} className={styles.runItem} onClick={() => onSelectRun(r)}>
                      <div className={styles.runStatus}>
                        {r.status === "running" && <Loader2 size={14} className={styles.spinner} />}
                        {r.status === "completed" && <CheckCircle2 size={14} className={styles.success} />}
                        {r.status === "failed" && <XCircle size={14} className={styles.error} />}
                      </div>
                      <div className={styles.runInfo}>
                        <div className={styles.runNote}>{r.note || `Run ${r.id.slice(0, 4)}`}</div>
                        <div className={styles.runMeta}>
                          {new Date(r.createdAt).toLocaleTimeString()} • {r.iterations} iter
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className={styles.scrollbar} orientation="vertical">
          <ScrollArea.Thumb className={styles.thumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </aside>
  );
}
