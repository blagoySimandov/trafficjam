import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import App from "./app.tsx";
import "./style.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipPrimitive.Provider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TooltipPrimitive.Provider>
    </QueryClientProvider>
  </StrictMode>,
);
