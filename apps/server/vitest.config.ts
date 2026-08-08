import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Resolve `@mooduck/core` to its TypeScript source, not the built `dist`.
 * The package's `exports` point at `dist/index.js`, which esbuild emits as a
 * single entry that re-exports sibling folders it never bundles — fine for the
 * server's own bundling and for dev (which uses the tsconfig path), but vitest
 * would otherwise load the broken dist. Mirrors the tsconfig `paths` mapping.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@mooduck/contracts": fileURLToPath(new URL("../../packages/contracts/src/index.ts", import.meta.url)),
      "@mooduck/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
    },
  },
});
