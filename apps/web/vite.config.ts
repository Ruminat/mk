import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Served by nginx at /app on the landing host; the API is proxied at /api on the
// same host (same-origin ⇒ no CORS, cookies just work). In dev, Vite proxies
// /api to the local server, so there is no API host env var at all.

/**
 * Dev-only: the Telegram Login Widget refuses to render on localhost, so local
 * testing points an HTTPS tunnel (ngrok/cloudflared) at this dev server. Vite 7
 * otherwise blocks any non-localhost Host ("This host is not allowed"), so the
 * tunnel hostname has to be allow-listed. Never ships: prod is a static build
 * served by nginx.
 *
 * Spread rather than assigned, because `exactOptionalPropertyTypes` rejects an
 * explicit `undefined` for an optional property.
 */
const devTunnelHost = process.env.VITE_DEV_TUNNEL_HOST;
const allowedHosts = devTunnelHost ? { allowedHosts: [devTunnelHost] } : {};

export default defineConfig({
  base: "/app/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@mooduck/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@mooduck/contracts": fileURLToPath(new URL("../../packages/contracts/src/index.ts", import.meta.url)),
    },
  },
  server: {
    ...allowedHosts,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  test: {
    environment: "node",
  },
});
