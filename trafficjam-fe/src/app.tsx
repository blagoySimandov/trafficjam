import { useState, useCallback } from "react";
import { Visualizer } from "./presentation/visualizer";
import { Editor } from "./presentation/editor";
import { Sidebar } from "./components/sidebar/sidebar";
import { ConfirmDialog } from "./components/confirm-dialog";
import { AgentConfigModal } from "./presentation/editor/components/agent-config-modal/agent-config-modal";
import { useScenarioManager } from "./api/scenarios";
import { DEFAULT_CITY } from "./constants/cities";
import type { Run } from "./api/scenarios";

type Mode = "editor" | "visualizer";

export default function App() {
  const [mode, setMode] = useState<Mode>("editor");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const {
    scenarios,
    activeScenario,
    setActiveScenarioId,
    createScenario,
    updateScenario,
    deleteScenario,
    runs,
    isLoadingScenarios,
  } = useScenarioManager();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [runInfo, setRunInfo] = useState<{
    scenarioId: string;
    runId: string;
  } | null>(null);
  const [rerunSource, setRerunSource] = useState<Run | null>(null);

  const handleRunSimulation = useCallback((info: { scenarioId: string; runId: string }) => {
    setRunInfo(info);
    setMode("visualizer");
  }, []);

  const handleSelectRun = useCallback((run: Run) => {
    setRunInfo({ scenarioId: run.scenarioId, runId: run.id });
    setMode("visualizer");
  }, []);

  const handleBackToEditor = useCallback(() => {
    setMode("editor");
  }, []);

  const handleRerunRun = useCallback((run: Run) => {
    setRerunSource(run);
    setMode("editor");
  }, []);

  const handleRenameScenario = useCallback((id: string, newName: string) => {
    updateScenario(id, { name: newName });
  }, [updateScenario]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) deleteScenario(deleteTarget);
    setDeleteTarget(null);
  }, [deleteTarget, deleteScenario]);

  const handleCreateScenario = useCallback((name: string) => {
    createScenario(name);
    setIsCreateOpen(false);
    setMode("editor");
  }, [createScenario]);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        scenarios={scenarios}
        activeScenarioId={activeScenario?.id || null}
        isLoadingScenarios={isLoadingScenarios}
        onSelectScenario={(id) => {
          setActiveScenarioId(id);
          setMode("editor");
        }}
        onCreateScenario={() => setIsCreateOpen(true)}
        onOpenAgentConfig={() => setIsConfigOpen(true)}
        onDeleteScenario={setDeleteTarget}
        onRenameScenario={handleRenameScenario}
        runs={runs}
        onSelectRun={handleSelectRun}
        onRerunRun={handleRerunRun}
      />
      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {mode === "editor" ? (
          <Editor
            city={DEFAULT_CITY}
            activeScenario={activeScenario}
            onRunSimulation={handleRunSimulation}
            onSaveScenario={updateScenario}
            rerunSource={rerunSource}
            onClearRerun={() => setRerunSource(null)}
          />
        ) : (
          <Visualizer
            scenarioId={runInfo?.scenarioId}
            runId={runInfo?.runId}
            onBack={handleBackToEditor}
          />
        )}
      </main>

      {isCreateOpen && (
        <ConfirmDialog
          title="New Scenario"
          message="Enter a name for the new scenario."
          confirmLabel="Create"
          variant="primary"
          input={{ placeholder: "Scenario name", defaultValue: "New Scenario" }}
          onConfirm={handleCreateScenario}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Scenario"
          message="This will permanently delete this scenario and cannot be undone."
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {isConfigOpen && activeScenario && (
        <AgentConfigModal
          scenario={activeScenario}
          onClose={() => setIsConfigOpen(false)}
          onSave={(config) => {
            updateScenario(activeScenario.id, { agentConfig: config });
            setIsConfigOpen(false);
          }}
        />
      )}
    </div>
  );
}
