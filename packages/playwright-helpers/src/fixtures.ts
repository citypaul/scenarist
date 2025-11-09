/**
 * Playwright fixtures for Scenarist
 *
 * **Recommended API**: Use `withScenarios()` for type-safe scenario IDs with autocomplete.
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
 * import type { ScenaristOptions } from '@scenarist/playwright-helpers';
 *
 * export default defineConfig<ScenaristOptions>({
 *   use: {
 *     baseURL: 'http://localhost:3000',
 *     scenaristEndpoint: '/api/__scenario__',
 *   },
 * });
 * ```
 *
 * Define scenarios and create typed test object:
 *
 * @example
 * ```typescript
 * // tests/fixtures.ts
 * import { withScenarios, expect } from '@scenarist/playwright-helpers';
 * import { type ScenaristScenarios } from '@scenarist/core';
 *
 * const scenarios = {
 *   cartWithState: { id: 'cartWithState', name: 'Cart with State', ... },
 *   premiumUser: { id: 'premiumUser', name: 'Premium User', ... },
 * } as const satisfies ScenaristScenarios;
 *
 * export const test = withScenarios(scenarios);
 * export { expect };
 * ```
 *
 * Then use in tests with type-safe scenario IDs:
 *
 * @example
 * ```typescript
 * import { test, expect } from './fixtures';
 *
 * test('my test', async ({ page, switchScenario }) => {
 *   await switchScenario(page, 'cartWithState'); // ✅ Autocomplete works!
 *   await switchScenario(page, 'invalid'); // ❌ TypeScript error
 * });
 * ```
 *
 * ## Composing with Existing Fixtures
 *
 * If your team already has custom fixtures, extend the test object:
 *
 * @example
 * ```typescript
 * // tests/fixtures.ts
 * import { withScenarios, expect } from '@scenarist/playwright-helpers';
 * import { scenarios } from '../lib/scenarios';
 *
 * type MyFixtures = {
 *   myCustomFixture: string;
 * };
 *
 * export const test = withScenarios(scenarios).extend<MyFixtures>({
 *   myCustomFixture: async ({}, use) => {
 *     await use('my custom value');
 *   },
 * });
 *
 * export { expect };
 * ```
 *
 * ## Advanced: Per-Test Overrides
 *
 * Override configuration for specific tests:
 *
 * @example
 * ```typescript
 * test('staging test', async ({ page, switchScenario }) => {
 *   await switchScenario(page, 'cartWithState', {
 *     baseURL: 'https://staging.example.com',
 *     endpoint: '/api/custom-endpoint',
 *   });
 * });
 * ```
 *
 * For complete documentation, see the README at:
 * https://github.com/citypaul/scenarist/tree/main/packages/playwright-helpers
 */

import { test as base, expect as baseExpect, type Page } from '@playwright/test';
import { switchScenario as baseSwitchScenario, type SwitchScenarioOptions } from './switch-scenario.js';
import type { ScenaristScenarios, ScenarioIds } from '@scenarist/core';

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
 *
 * Generic type parameter S allows constraining scenario IDs for type safety.
 */
export type ScenaristFixtures<S extends string = string> = {
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
   * @param scenarioId - The scenario ID to switch to (constrained to S if createTest<S> was used)
   * @param options - Optional overrides for endpoint and baseURL
   * @returns The test ID used for this scenario (for explicit page.request calls)
   *
   * @example Basic usage (reads from config)
   * ```typescript
   * test('my test', async ({ page, switchScenario }) => {
   *   const testId = await switchScenario(page, 'myScenario');
   *   // Use testId for explicit API requests if needed
   * });
   * ```
   *
   * @example Override for specific test
   * ```typescript
   * test('staging test', async ({ page, switchScenario }) => {
   *   const testId = await switchScenario(page, 'myScenario', {
   *     baseURL: 'https://staging.example.com'
   *   });
   * });
   * ```
   */
  switchScenario: (
    page: Page,
    scenarioId: S,
    options?: Partial<Pick<SwitchScenarioOptions, 'endpoint' | 'baseURL'>>
  ) => Promise<string>;
};

/**
 * Create a type-safe Playwright test object with Scenarist fixtures.
 *
 * Accepts a scenarios object and automatically infers scenario IDs for type safety.
 * This is the ONLY way to create test objects with Scenarist - ensures consistency.
 *
 * @template T - Scenarios object type
 *
 * @example
 * ```typescript
 * // tests/fixtures.ts
 * import { withScenarios, expect } from '@scenarist/playwright-helpers';
 * import { type ScenaristScenarios } from '@scenarist/core';
 *
 * const scenarios = {
 *   cartWithState: { id: 'cartWithState', ... },
 *   premiumUser: { id: 'premiumUser', ... },
 * } as const satisfies ScenaristScenarios;
 *
 * export const test = withScenarios(scenarios);
 * export { expect };
 *
 * // tests/my-test.spec.ts
 * import { test, expect } from './fixtures';
 *
 * test('my test', async ({ page, switchScenario }) => {
 *   await switchScenario(page, 'cartWithState'); // ✅ Autocomplete works!
 *   await switchScenario(page, 'invalid'); // ❌ TypeScript error
 * });
 * ```
 */
export function withScenarios<T extends ScenaristScenarios>(scenarios: T) {
  void scenarios; // Parameter needed for type inference only
  type ScenarioId = ScenarioIds<T>;

  return base.extend<ScenaristOptions & ScenaristFixtures<ScenarioId>>({
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
        scenarioId: ScenarioId,
        options?: Partial<Pick<SwitchScenarioOptions, 'endpoint' | 'baseURL'>>
      ): Promise<string> => {
        // Read from config, allow per-test override, fallback to defaults
        const finalEndpoint = options?.endpoint ?? scenaristEndpoint;
        const finalBaseURL = options?.baseURL ?? baseURL ?? 'http://localhost:3000';

        // Call the base switchScenario with all config and return test ID
        return await baseSwitchScenario(page, scenarioId, {
          endpoint: finalEndpoint,
          baseURL: finalBaseURL,
          testId: scenaristTestId,
        });
      };

      await use(switchFn);
    },
  });
}

export const expect = baseExpect;
