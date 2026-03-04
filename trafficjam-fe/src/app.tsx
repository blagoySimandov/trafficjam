import { useState, useCallback } from "react";
import { Visualizer } from "./presentation/visualizer";
import { Editor } from "./presentation/editor";
import { Sidebar } from "./components/sidebar/sidebar";
import { ConfirmDialog } from "./components/confirm-dialog";
import { Dialog } from "./components/dialog";
import { AgentConfigModal } from "./presentation/editor/components/agent-config-modal/agent-config-modal";
import { useScenarioManager, DEFAULT_AGENT_CONFIG } from "./api/scenarios";
import { DEFAULT_CITY } from "./constants/cities";
import type { Run, AgentConfig } from "./api/scenarios";

type Mode = "editor" | "visualizer";

export default function App() {
  const [mode, setMode] = useState<Mode>("editor");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const {
    scenarios,
    activeScenarioId,
    activeScenario,
    setActiveScenarioId,
    createScenario,
    updateScenario,
    deleteScenario,
    prefetchScenario,
    runs,
    isLoadingScenarios,
    isSwitchingScenario,
  } = useScenarioManager();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isNamingOpen, setIsNamingOpen] = useState(false);
  const [pendingScenarioName, setPendingScenarioName] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
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

  const handleConfirmScenarioName = useCallback((name: string) => {
    setIsNamingOpen(false);
    setPendingScenarioName(name);
    setIsCreateOpen(true);
  }, []);

  const handleSaveNewScenario = useCallback(async (config: AgentConfig) => {
    setIsCreateOpen(false);
    const name = pendingScenarioName!;
    setPendingScenarioName(null);
    const { created, scenario } = await createScenario(name, config);
    if (!created) {
      setDuplicateName(scenario.name);
    } else {
      setMode("editor");
    }
  }, [createScenario, pendingScenarioName]);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        isLoadingScenarios={isLoadingScenarios}
        onSelectScenario={(id) => {
          setActiveScenarioId(id);
          setMode("editor");
        }}
        onPrefetchScenario={prefetchScenario}
        onCreateScenario={() => setIsNamingOpen(true)}
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
            isSwitchingScenario={isSwitchingScenario}
            onRunSimulation={handleRunSimulation}
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

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Scenario"
          message="This will permanently delete this scenario and cannot be undone."
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {isNamingOpen && (
        <ConfirmDialog
          title="New Scenario"
          message="Enter a name for your new scenario."
          confirmLabel="Next"
          variant="primary"
          input={{ placeholder: "Scenario name" }}
          onConfirm={handleConfirmScenarioName}
          onClose={() => setIsNamingOpen(false)}
        />
      )}

      {isCreateOpen && pendingScenarioName && (
        <AgentConfigModal
          scenario={{ id: "", name: pendingScenarioName, agentConfig: DEFAULT_AGENT_CONFIG, createdAt: "", updatedAt: "" }}
          saveLabel="Create Scenario"
          onClose={() => { setIsCreateOpen(false); setPendingScenarioName(null); }}
          onSave={handleSaveNewScenario}
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

      {duplicateName && (
        <Dialog
          title="Scenario Already Exists"
          onClose={() => setDuplicateName(null)}
          maxWidth={400}
          footer={<button onClick={() => setDuplicateName(null)}>OK</button>}
        >
          <p>A scenario with this configuration already exists: <strong>{duplicateName}</strong></p>
        </Dialog>
      )}
    </div>
  );
}
