import { defineConfig, devices } from "@playwright/test";
import type { ScenaristOptions } from "@scenarist/playwright-helpers";

const useCustomServer = process.env.SERVER_MODE === "custom";

/**
 * Playwright configuration for Scenarist App Router Example
 *
 * Extends Playwright config with Scenarist options (scenaristEndpoint)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig<ScenaristOptions>({
  testDir: "./tests/playwright",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3002",
    scenaristEndpoint: "/api/__scenario__",
    trace: "on-first-retry",
  },

  // Global teardown for MSW server
  // Note: MSW is auto-started in lib/scenarist.ts when Next.js imports it
  globalTeardown: "./tests/playwright/globalTeardown.ts",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Exclude custom-server-verification when not in custom server mode
      testIgnore: useCustomServer
        ? undefined
        : "**/custom-server-verification.spec.ts",
    },
  ],

  webServer: {
    command: useCustomServer ? "node server.cjs" : "pnpm dev",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
  },
});
