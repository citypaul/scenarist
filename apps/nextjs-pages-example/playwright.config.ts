import { defineConfig, devices } from '@playwright/test';
import type { ScenaristOptions } from '@scenarist/playwright-helpers';

/**
 * Playwright configuration for Scenarist E-commerce Example
 *
 * Extends Playwright config with Scenarist options (scenaristEndpoint)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig<ScenaristOptions>({
  testDir: './tests/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    scenaristEndpoint: '/api/__scenario__',
    trace: 'on-first-retry',
  },

  // Global setup/teardown for MSW server
  globalSetup: './tests/playwright/globalSetup.ts',
  globalTeardown: './tests/playwright/globalTeardown.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/*.baseline.spec.ts', // Exclude baseline tests from main suite
    },
    {
      name: 'baseline',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.baseline.spec.ts', // Only run baseline tests
      // Note: globalSetup will detect baseline project and skip MSW initialization
    },
  ],

  webServer: [
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm fake-api',
      url: 'http://localhost:3001/products',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
