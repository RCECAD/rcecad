import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: process.env.E2E_APP_URL ?? "http://localhost:3001",
    channel: process.env.E2E_BROWSER_CHANNEL ?? "chrome",
    screenshot: "only-on-failure",
    // Traces and HARs would retain authentication headers and cookies.
    trace: "off",
  },
});
