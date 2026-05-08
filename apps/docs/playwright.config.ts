import { defineConfig, devices } from "@playwright/test";

const docsPort = process.env.DOCS_PORT ?? "4321";
const docsBaseURL = `http://localhost:${docsPort}`;
const docsWranglerConfig = "dist/server/wrangler.json";

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
  timeout: 120000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: docsBaseURL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `pnpm exec wrangler dev --config ${docsWranglerConfig} --port ${docsPort}`,
    url: docsBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
