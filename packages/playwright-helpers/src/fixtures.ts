/**
 * Playwright fixtures for Scenarist
 *
 * **Recommended API**: Use these fixtures for guaranteed test isolation.
 *
 * Provides custom fixtures for scenario management with guaranteed unique test IDs
 * to prevent state collisions during parallel test execution.
 *
 * @example
 * import { test, expect } from '@scenarist/playwright-helpers';
 *
 * test('my test', async ({ page, switchScenario }) => {
 *   // switchScenario automatically uses a guaranteed unique test ID
 *   await switchScenario(page, 'myScenario', {
 *     baseURL: 'http://localhost:3000',
 *     endpoint: '/api/__scenario__',
 *   });
 *
 *   // Your test code here...
 * });
 *
 * @remarks
 * **When to use fixtures vs standalone `switchScenario`:**
 * - ✅ **Use fixtures (this API)** - For all test files (recommended)
 * - ❌ **Use standalone** - Only if you need manual test ID control
 *
 * Fixtures guarantee test isolation by generating crypto.randomUUID() test IDs,
 * preventing collisions even when tests run in parallel with 4+ workers.
 */

import { test as base, expect as baseExpect, type Page } from '@playwright/test';
import { switchScenario as baseSwitchScenario, type SwitchScenarioOptions } from './switch-scenario.js';

type ScenaristFixtures = {
  /**
   * Guaranteed unique test ID for this test.
   * Uses crypto.randomUUID() to ensure no collisions even with parallel execution.
   */
  scenaristTestId: string;

  /**
   * Switch to a scenario using this test's unique test ID.
   * This ensures proper test isolation even when tests run in parallel.
   */
  switchScenario: (
    page: Page,
    scenarioId: string,
    options: Omit<SwitchScenarioOptions, 'testId'>
  ) => Promise<void>;
};

export const test = base.extend<ScenaristFixtures>({
  // Generate a guaranteed unique test ID for each test
  scenaristTestId: async ({}, use, testInfo) => {
    // Use test info + UUID for guaranteed uniqueness
    const uniqueId = `${testInfo.testId}-${crypto.randomUUID()}`;
    await use(uniqueId);
  },

  // Provide a switchScenario helper that automatically uses this test's unique ID
  switchScenario: async ({ scenaristTestId }, use) => {
    const switchFn = async (
      page: Page,
      scenarioId: string,
      options: Omit<SwitchScenarioOptions, 'testId'>
    ) => {
      // Call the base switchScenario but inject our guaranteed unique test ID
      await baseSwitchScenario(page, scenarioId, {
        ...options,
        testId: scenaristTestId,
      });
    };

    await use(switchFn);
  },
});

export const expect = baseExpect;
