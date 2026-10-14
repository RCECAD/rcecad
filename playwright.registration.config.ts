import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig({
  ...config,
  testDir: "./tests/live",
  outputDir: "./playwright-report/registration-artifacts",
  reporter: [
    ["list"],
    ["json", { outputFile: "playwright-report/registration.json" }],
  ],
});
