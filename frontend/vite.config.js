import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standard Vite + React config. No TypeScript, no extra plugins —
// keep this minimal so future modules can extend it without conflicts.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
