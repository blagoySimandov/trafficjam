import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Visualizer } from "./presentation/visualizer";
import { Editor } from "./presentation/editor";

const queryClient = new QueryClient();

type Mode = "editor" | "visualizer";

export default function App() {
  const [mode, setMode] = useState<Mode>("editor");
  const [runInfo, setRunInfo] = useState<{
    scenarioId: string;
    runId: string;
  } | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      {mode === "editor" ? (
        <Editor
          onRunSimulation={(info) => {
            setRunInfo(info);
            setMode("visualizer");
          }}
        />
      ) : (
        <Visualizer
          scenarioId={runInfo?.scenarioId}
          runId={runInfo?.runId}
          onBack={() => setMode("editor")}
        />
      )}
    </QueryClientProvider>
  );
}
