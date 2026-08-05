import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fundingApiPlugin } from "./server/api.mjs";

export default defineConfig(({ command, mode }) => ({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: command === "serve"
    ? [fundingApiPlugin({ exposeDevCode: mode === "development" }), react()]
    : [react()],
}));
