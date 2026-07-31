import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  test: {
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 80,
        branches: 65,
        functions: 80,
        lines: 85
      }
    }
  }
});
