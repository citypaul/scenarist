import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Scenarist Documentation site
 *
 * Tests run against the built/preview version of the site.
 * Use playwright.dev.config.ts for UI mode during development.
 *
 * Tests:
 * - Landing page renders correctly
 * - Theme switching works and persists
 * - Navigation between landing page and docs
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
