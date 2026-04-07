import { build } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "neutral",
  outdir: "dist",
  platform: "browser",
  target: ["es2020"],
  format: "esm",
  minify: false,
  sourcemap: true,
  logLevel: "info",
  plugins: [nodeExternalsPlugin()],
}).catch(() => process.exit(1));
