import { defineConfig, devices } from '@playwright/test';
import type { ScenaristOptions } from '@scenarist/playwright-helpers';

const useCustomServer = process.env.SERVER_MODE === 'custom';

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
  reporter: 'list',
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
      testIgnore: '**/*.comparison.spec.ts', // Exclude comparison tests from main suite
    },
    {
      name: 'comparison',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.comparison.spec.ts', // Only run comparison tests
      // Note: globalSetup will detect comparison project and skip MSW initialization
    },
  ],

  webServer: [
    {
      command: useCustomServer ? 'node server.cjs' : 'pnpm dev',
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
