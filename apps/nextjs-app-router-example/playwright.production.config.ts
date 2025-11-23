import { defineConfig } from '@playwright/test';

/**
 * Playwright Configuration for Production Tests
 *
 * Verifies production build works with real json-server backend:
 * - No Scenarist (tree-shaken)
 * - No MSW (not running)
 * - Real API calls to json-server on port 3001
 *
 * globalSetup builds Next.js in production mode and starts servers
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/production',
  fullyParallel: false, // Run production tests sequentially (shared json-server state)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker (json-server has shared state)
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000', // Production server port
    trace: 'on-first-retry',
  },

  // Global setup: build + start servers
  globalSetup: './tests/production/global-setup.ts',

  projects: [
    {
      name: 'api-tests',
      testMatch: '**/*.spec.ts',
    },
  ],

  // No webServer config - globalSetup handles server lifecycle
});
