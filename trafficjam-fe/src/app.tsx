import { useState, useCallback } from "react";
import { Visualizer } from "./presentation/visualizer";
import { Editor } from "./presentation/editor";
import { Sidebar } from "./components/sidebar/sidebar";
import { AgentConfigModal } from "./presentation/editor/components/agent-config-modal/agent-config-modal";
import { ScenarioDialog } from "./presentation/editor/components/scenario-dialog/scenario-dialog";
import { useScenarioManager } from "./api/scenarios";
import type { Run } from "./api/scenarios";

type Mode = "editor" | "visualizer";

export default function App() {
  const [mode, setMode] = useState<Mode>("editor");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isNewScenarioOpen, setIsNewScenarioOpen] = useState(false);
  const {
    scenarios,
    activeScenario,
    setActiveScenarioId,
    createScenario,
    updateScenario,
    runs,
  } = useScenarioManager();

  const [runInfo, setRunInfo] = useState<{
    scenarioId: string;
    runId: string;
  } | null>(null);

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

  const handleCreateScenario = useCallback((name: string, _description?: string) => {
    createScenario(name);
    setIsNewScenarioOpen(false);
    setMode("editor");
  }, [createScenario]);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        scenarios={scenarios}
        activeScenarioId={activeScenario?.id || null}
        onSelectScenario={(id) => {
          setActiveScenarioId(id);
          setMode("editor");
        }}
        onCreateScenario={() => setIsNewScenarioOpen(true)}
        onOpenAgentConfig={() => setIsConfigOpen(true)}
        runs={runs}
        onSelectRun={handleSelectRun}
      />
      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {mode === "editor" ? (
          <Editor
            activeScenario={activeScenario}
            onRunSimulation={handleRunSimulation}
          />
        ) : (
          <Visualizer
            scenarioId={runInfo?.scenarioId}
            runId={runInfo?.runId}
            onBack={handleBackToEditor}
          />
        )}
      </main>

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

      {isNewScenarioOpen && (
        <ScenarioDialog
          onClose={() => setIsNewScenarioOpen(false)}
          onSave={handleCreateScenario}
        />
      )}
    </div>
  );
}
