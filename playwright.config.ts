import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Load .env (KEY=value lines) into process.env without adding a dotenv dependency.
// Values already present in the environment (e.g. CI secrets) win.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    process.env[key] ??= raw.replace(/^["']|["']$/g, "");
  }
}

// E2E tests (test-plan R-04, R-05). Run with `npm run test:e2e`.
// E2E_EMAIL / E2E_PASSWORD (from .env locally, GitHub secrets in CI) enable the
// signed-in scenarios; without them those specs skip themselves.
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4321",
    locale: "pl-PL",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
