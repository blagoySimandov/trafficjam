import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Visualizer } from "./presentation/visualizer";
import { Editor } from "./presentation/editor";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* disabled the next line since it makes it easuer yo chagne between the two... */}
      {/*eslint-disable-next-line*/}
      {true ? <Visualizer /> : <Editor />}
    </QueryClientProvider>
  );
}
