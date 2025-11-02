/**
 * Playwright fixtures for Scenarist
 *
 * **Recommended API**: Use these fixtures for guaranteed test isolation.
 *
 * Provides custom fixtures for scenario management with guaranteed unique test IDs
 * to prevent state collisions during parallel test execution.
 *
 * ## Basic Usage
 *
 * Configure once in playwright.config.ts:
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   use: {
 *     baseURL: 'http://localhost:3000',
 *     scenaristEndpoint: '/api/__scenario__',
 *   },
 * });
 * ```
 *
 * Then use in tests without repetition:
 *
 * @example
 * ```typescript
 * import { test, expect } from '@scenarist/playwright-helpers';
 *
 * test('my test', async ({ page, switchScenario }) => {
 *   // Configuration read from playwright.config.ts
 *   await switchScenario(page, 'myScenario');
 *
 *   // Your test code here...
 * });
 * ```
 *
 * ## Composing with Existing Fixtures
 *
 * If your team already has custom fixtures, extend the Scenarist test object:
 *
 * @example
 * ```typescript
 * // tests/fixtures.ts
 * import { test as scenaristTest } from '@scenarist/playwright-helpers';
 *
 * type MyFixtures = {
 *   myCustomFixture: string;
 * };
 *
 * export const test = scenaristTest.extend<MyFixtures>({
 *   myCustomFixture: async ({}, use) => {
 *     await use('my custom value');
 *   },
 * });
 *
 * export { expect } from '@scenarist/playwright-helpers';
 * ```
 *
 * ## Advanced: Per-Test Overrides
 *
 * Override configuration for specific tests:
 *
 * @example
 * ```typescript
 * test('staging test', async ({ page, switchScenario }) => {
 *   await switchScenario(page, 'myScenario', {
 *     baseURL: 'https://staging.example.com',
 *     endpoint: '/api/custom-endpoint',
 *   });
 * });
 * ```
 *
 * @remarks
 * **When to use fixtures vs standalone `switchScenario`:**
 * - ✅ **Use fixtures (this API)** - For all test files (recommended)
 * - ❌ **Use standalone** - Only if you need manual test ID control
 *
 * Fixtures guarantee test isolation by generating crypto.randomUUID() test IDs,
 * preventing collisions even when tests run in parallel with 4+ workers.
 *
 * For complete documentation, see the README at:
 * https://github.com/citypaul/scenarist/tree/main/packages/playwright-helpers
 */

import { test as base, expect as baseExpect, type Page } from '@playwright/test';
import { switchScenario as baseSwitchScenario, type SwitchScenarioOptions } from './switch-scenario.js';

/**
 * Configuration options for Scenarist.
 *
 * Set these in your playwright.config.ts `use` object.
 */
export type ScenaristOptions = {
  /**
   * The endpoint where Scenarist listens for scenario switching requests.
   *
   * @default '/api/__scenario__'
   *
   * @example
   * ```typescript
   * export default defineConfig({
   *   use: {
   *     scenaristEndpoint: '/api/__scenario__',
   *   },
   * });
   * ```
   */
  scenaristEndpoint: string;
};

/**
 * Fixtures provided by Scenarist for Playwright tests.
 */
export type ScenaristFixtures = {
  /**
   * Guaranteed unique test ID for this test.
   * Uses crypto.randomUUID() to ensure no collisions even with parallel execution.
   *
   * @remarks
   * You typically don't need to use this directly - the `switchScenario` fixture
   * automatically injects it for you.
   */
  scenaristTestId: string;

  /**
   * Switch to a scenario using this test's unique test ID.
   *
   * Reads `baseURL` (standard Playwright) and `scenaristEndpoint` from config.
   * Can be overridden per-test if needed.
   *
   * @param page - Playwright Page object
   * @param scenarioId - The scenario ID to switch to
   * @param options - Optional overrides for endpoint and baseURL
   *
   * @example Basic usage (reads from config)
   * ```typescript
   * test('my test', async ({ page, switchScenario }) => {
   *   await switchScenario(page, 'myScenario');
   *   // ...
   * });
   * ```
   *
   * @example Override for specific test
   * ```typescript
   * test('staging test', async ({ page, switchScenario }) => {
   *   await switchScenario(page, 'myScenario', {
   *     baseURL: 'https://staging.example.com'
   *   });
   * });
   * ```
   */
  switchScenario: (
    page: Page,
    scenarioId: string,
    options?: Partial<Pick<SwitchScenarioOptions, 'endpoint' | 'baseURL'>>
  ) => Promise<void>;
};

/**
 * Playwright test object extended with Scenarist fixtures.
 *
 * Import this instead of '@playwright/test' to get Scenarist capabilities.
 */
export const test = base.extend<ScenaristOptions & ScenaristFixtures>({
  // Configuration option with default value
  scenaristEndpoint: ['/api/__scenario__', { option: true }],

  // Generate a guaranteed unique test ID for each test
  scenaristTestId: async ({}, use, testInfo) => {
    // Use test info + UUID for guaranteed uniqueness
    const uniqueId = `${testInfo.testId}-${crypto.randomUUID()}`;
    await use(uniqueId);
  },

  // Provide a switchScenario helper that reads config and auto-injects test ID
  switchScenario: async ({ scenaristTestId, scenaristEndpoint, baseURL }, use) => {
    const switchFn = async (
      page: Page,
      scenarioId: string,
      options?: Partial<Pick<SwitchScenarioOptions, 'endpoint' | 'baseURL'>>
    ) => {
      // Read from config, allow per-test override, fallback to defaults
      const finalEndpoint = options?.endpoint ?? scenaristEndpoint;
      const finalBaseURL = options?.baseURL ?? baseURL ?? 'http://localhost:3000';

      // Call the base switchScenario with all config
      await baseSwitchScenario(page, scenarioId, {
        endpoint: finalEndpoint,
        baseURL: finalBaseURL,
        testId: scenaristTestId,
      });
    };

    await use(switchFn);
  },
});

export const expect = baseExpect;
