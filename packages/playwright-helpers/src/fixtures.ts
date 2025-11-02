/**
 * Playwright fixtures for Scenarist
 *
 * Provides custom fixtures for scenario management with guaranteed test isolation.
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
