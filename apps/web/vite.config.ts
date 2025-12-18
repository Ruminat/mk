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
      hmr: false,
      port: 3228,
      host: true, // Allow external access
      open: false, // Automatically open browser
    },
    alias: {
      "@mooduck/react": path.resolve(__dirname, "../../packages/react"),
    },
  };
});
