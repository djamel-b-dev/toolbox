import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@toolbox/ui", replacement: path.resolve(dirname, "../../packages/ui/src") },
      { find: "@toolbox/core", replacement: path.resolve(dirname, "../../packages/core/src") },
      { find: "@toolbox/tools", replacement: path.resolve(dirname, "../../packages/tools/src") },
    ],
  },
  server: {
    port: 5173,
  },
});
