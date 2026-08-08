import { defineConfig, devices } from "@playwright/test";

const PORT = 3102;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    // Poll a real page: "/" is an nginx redirect, not a Next route, so it 404s
    // under `output: export` and would never signal readiness.
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
