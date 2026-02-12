import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Visualizer } from "./presentation/visualizer";
import { Editor } from "./presentation/editor";

const queryClient = new QueryClient();

type Mode = "editor" | "visualizer";

export default function App() {
  const [mode, setMode] = useState<Mode>("editor");

  return (
    <QueryClientProvider client={queryClient}>
      {mode === "editor" ? (
        <Editor onRunSimulation={() => setMode("visualizer")} />
      ) : (
        <Visualizer onBack={() => setMode("editor")} />
      )}
    </QueryClientProvider>
  );
}
