import { build } from "esbuild";

build({
  entryPoints: ["src/index.ts"],
  bundle: false,
  platform: "neutral",
  outdir: "dist",
  format: "esm",
  minify: false,
  sourcemap: true,
  logLevel: "info",
}).catch(() => process.exit(1));

