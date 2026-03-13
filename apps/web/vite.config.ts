import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: "./",
    plugins: [react(), svgr()],
    server: {
      // hmr: false,
      host: "0.0.0.0",
      port: 5173,
      open: false,
      // HMR configuration for WebSocket through proxy
      hmr: true,
    },
    allowedHosts: ["dev.mooduck.shrek-labs.ru"],
    alias: {
      "@mooduck/react": path.resolve(__dirname, "../../packages/react/src"),
    },
  };
});

// {
//   protocol: "wss",
//   host: "dev.mooduck.shrek-labs.ru",
//   port: 443,
//   // Important: Use clientPort to match the public port
//   clientPort: 443,
// }
