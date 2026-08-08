import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // `@mooduck/core` is resolved to its TypeScript source (tsconfig `paths`), so
  // Next has to run it through its own compiler rather than treating it as a
  // prebuilt dependency.
  transpilePackages: ["@mooduck/core"],

  // Fully static marketing site: emit plain HTML/CSS/JS into `out/` so nginx can
  // serve it directly (no Node runtime, no `next start`, no sharp on the box).
  output: "export",

  // Static export can't run the on-demand image optimizer, and we don't need it
  // for a handful of small local assets. This also drops the `sharp` dependency
  // from the build/runtime path.
  images: { unoptimized: true },

  // Lint and type-check are enforced in CI (`pnpm codecheck`). Skipping them
  // during `next build` keeps peak memory low enough to build on the VPS.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
