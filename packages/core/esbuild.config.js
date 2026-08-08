import { build } from "esbuild";

// Bundle the whole package into a single self-contained `dist/index.js`.
// With `bundle: false` esbuild emitted only `index.js`, whose `export * from
// "./Locale"` (etc.) pointed at sibling folders it never wrote — so any runtime
// consumer that `require`d the built package (the server keeps workspace deps
// external) crashed with "Directory import is not supported". Bundling inlines
// the siblings, so the built package actually loads.
build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "neutral",
  outfile: "dist/index.js",
  format: "esm",
  minify: false,
  sourcemap: true,
  logLevel: "info",
}).catch(() => process.exit(1));

