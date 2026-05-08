import { defineConfig, devices } from "@playwright/test";
import type { ScenaristOptions } from "@scenarist/playwright-helpers";

const useCustomServer = process.env.SERVER_MODE === "custom";
const appPort = process.env.NEXTJS_PAGES_PORT ?? "3000";
const appBaseURL = `http://localhost:${appPort}`;
const appHealthURL = `${appBaseURL}/api/health`;
const nextDevCommand = `pnpm exec next dev --webpack --port ${appPort}`;
const fakeApiPort = process.env.NEXTJS_FAKE_API_PORT ?? "3001";
const fakeApiProductsURL = `http://localhost:${fakeApiPort}/products`;

/**
 * Playwright configuration for Scenarist E-commerce Example
 *
 * Extends Playwright config with Scenarist options (scenaristEndpoint)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig<ScenaristOptions>({
  testDir: "./tests/playwright",
  timeout: 120000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: appBaseURL,
    scenaristEndpoint: "/api/__scenario__",
    scenaristStateEndpoint: "/api/__scenarist__/state",
    trace: "on-first-retry",
  },

  // Global setup/teardown for MSW server
  globalSetup: "./tests/playwright/globalSetup.ts",
  globalTeardown: "./tests/playwright/globalTeardown.ts",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Exclude comparison tests always, and custom-server-verification only when not in custom mode
      testIgnore: useCustomServer
        ? "**/*.comparison.spec.ts"
        : ["**/*.comparison.spec.ts", "**/custom-server-verification.spec.ts"],
    },
    {
      name: "comparison",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/*.comparison.spec.ts", // Only run comparison tests
      // Note: globalSetup will detect comparison project and skip MSW initialization
    },
  ],

  webServer: [
    {
      command: useCustomServer
        ? "node server.cjs"
        : process.env.SCENARIST_LOG
          ? `SCENARIST_LOG=1 ${nextDevCommand}`
          : nextDevCommand,
      url: appHealthURL,
      reuseExistingServer: !process.env.CI,
      // Show server output (including Scenarist logs) when SCENARIST_LOG is set
      stdout: process.env.SCENARIST_LOG ? "pipe" : "ignore",
      stderr: "pipe",
      timeout: 120000,
    },
    {
      command: `pnpm exec json-server fake-api/db.json --port ${fakeApiPort}`,
      url: fakeApiProductsURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
