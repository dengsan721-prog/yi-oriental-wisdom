import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const siteRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL("./github", import.meta.url)),
  base: "/yi-oriental-wisdom/",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../docs", import.meta.url)),
    emptyOutDir: false,
    sourcemap: true,
  },
  resolve: { alias: { "@site": siteRoot } },
});
