import { defineConfig, devices } from "@playwright/test";

const docsPort = process.env.DOCS_PORT ?? "4321";
const docsBaseURL = `http://localhost:${docsPort}`;

/**
 * Playwright configuration for development/UI mode
 *
 * Runs against the dev server for faster iteration during test development.
 * Use `pnpm pw:ui` to run tests with the Playwright UI.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  workers: undefined,
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
    command: `pnpm exec astro dev --port ${docsPort}`,
    url: docsBaseURL,
    reuseExistingServer: true,
  },
});
