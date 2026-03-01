import { useState, useRef, useCallback } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { CheckCircle2, XCircle, Loader2, Plus, Settings2, History, Trash2, RotateCcw, Clock, Pencil } from "lucide-react";
import type { Scenario, Run } from "../../api/scenarios";
import styles from "./sidebar.module.css";

interface SidebarProps {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onSelectScenario: (id: string) => void;
  onCreateScenario: () => void;
  onOpenAgentConfig: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onRenameScenario: (id: string, newName: string) => void;
  runs: Run[];
  onSelectRun: (run: Run) => void;
  onRerunRun: (run: Run) => void;
}

function InlineRenameInput({ defaultName, onConfirm, onCancel }: {
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") onConfirm(value.trim() || defaultName);
    if (e.key === "Escape") onCancel();
  }, [value, defaultName, onConfirm, onCancel]);

  return (
    <input
      ref={inputRef}
      className={styles.renameInput}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onConfirm(value.trim() || defaultName)}
      autoFocus
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function ScenarioActions({ isActive, onEdit, onConfigure, onDelete }: {
  isActive: boolean;
  onEdit: () => void;
  onConfigure: () => void;
  onDelete: () => void;
}) {
  if (!isActive) return null;
  return (
    <div className={styles.scenarioActions}>
      <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Rename">
        <Pencil size={16} />
      </button>
      <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); onConfigure(); }} title="Configure Agent Planner">
        <Settings2 size={16} />
      </button>
      <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete Scenario">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function RunStatusIcon({ status }: { status: string }) {
  if (status === "pending") return <Clock size={14} className={styles.pending} />;
  if (status === "running") return <Loader2 size={14} className={styles.spinner} />;
  if (status === "completed") return <CheckCircle2 size={14} className={styles.success} />;
  if (status === "failed") return <XCircle size={14} className={styles.error} />;
  return null;
}

export function Sidebar({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onCreateScenario,
  onOpenAgentConfig,
  onDeleteScenario,
  onRenameScenario,
  runs,
  onSelectRun,
  onRerunRun,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);
  const activeRuns = runs.filter((r) => r.scenarioId === activeScenarioId);

  const handleRenameConfirm = useCallback((id: string, newName: string) => {
    onRenameScenario(id, newName);
    setEditingId(null);
  }, [onRenameScenario]);

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
                  {editingId === s.id ? (
                    <InlineRenameInput
                      defaultName={s.name}
                      onConfirm={(name) => handleRenameConfirm(s.id, name)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className={styles.scenarioName}>{s.name}</div>
                  )}
                  <ScenarioActions
                    isActive={s.id === activeScenarioId}
                    onEdit={() => setEditingId(s.id)}
                    onConfigure={() => onOpenAgentConfig(s.id)}
                    onDelete={() => onDeleteScenario(s.id)}
                  />
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
                        <RunStatusIcon status={r.status} />
                      </div>
                      <div className={styles.runInfo}>
                        <div className={styles.runNote}>{r.note || `Run ${r.id.slice(0, 4)}`}</div>
                        <div className={styles.runMeta}>
                          {new Date(r.createdAt).toLocaleTimeString()} • {r.iterations} iter
                        </div>
                      </div>
                      {(r.status === "completed" || r.status === "failed") && (
                        <button
                          className={styles.iconBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRerunRun(r);
                          }}
                          title="Re-run"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
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
