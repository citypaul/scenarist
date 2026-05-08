import { defineConfig } from "@playwright/test";

const docsPort = process.env.DOCS_PORT ?? "4321";
const docsBaseURL = `http://localhost:${docsPort}`;
const docsWranglerConfig = "dist/server/wrangler.json";

/**
 * Playwright configuration specifically for Lighthouse audits.
 *
 * Lighthouse requires Chrome to be launched with a remote debugging port.
 * This config is separate from the main config to avoid affecting regular tests.
 *
 * @see https://github.com/nicholasray/playwright-lighthouse
 */
export default defineConfig({
  testDir: "./tests/lighthouse",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "lighthouse-report" }]],
  timeout: 120000,
  use: {
    baseURL: docsBaseURL,
    trace: "on-first-retry",
  },

  webServer: {
    command: `pnpm exec wrangler dev --config ${docsWranglerConfig} --port ${docsPort}`,
    url: docsBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
