import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["trafficjam.app", "localhost", "127.0.0.1"],
  },
  preview: {
    allowedHosts: ["trafficjam.app", "localhost", "127.0.0.1"],
  },
});
