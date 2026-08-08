import { build } from "esbuild";

// Bundle the package's own files into a single self-contained `dist/index.js`
// (so runtime consumers that keep workspace deps external can actually load it),
// but keep real dependencies like `zod` external so they aren't inlined twice.
build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  packages: "external",
  platform: "neutral",
  outfile: "dist/index.js",
  format: "esm",
  minify: false,
  sourcemap: true,
  logLevel: "info",
}).catch(() => process.exit(1));
