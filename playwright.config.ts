import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.E2E_PORT ?? "5000";
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Reuse the dev server running on PORT (the Replit "Start application"
  // workflow keeps it up). When running in CI / a clean environment, set
  // E2E_START_SERVER=1 to have Playwright boot it.
  webServer: process.env.E2E_START_SERVER
    ? {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
