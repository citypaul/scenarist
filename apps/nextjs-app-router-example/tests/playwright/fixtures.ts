/**
 * Playwright test fixtures with type-safe scenario IDs and repository seeding
 *
 * This file exports a test object that includes:
 * - Scenarist fixtures with TypeScript autocomplete for scenario names
 * - Automatic repository seeding when scenarios are switched
 *
 * The pattern: switchScenario → seeds HTTP mocks + repository data → navigate → assert
 * No direct API calls in tests!
 */

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { ScenarioIds } from '@scenarist/playwright-helpers';
import { scenarios } from '../../lib/scenarios';

type Scenarios = typeof scenarios;

/**
 * Custom switchScenario function that:
 * 1. Switches Scenarist scenario (HTTP mocks)
 * 2. Seeds repository with scenario data
 *
 * This maintains the Scenarist pattern: switch → navigate → assert
 */
type SwitchScenarioFunction = (
  page: Page,
  scenarioId: ScenarioIds<Scenarios>
) => Promise<string>;

/**
 * Test fixtures with repository-aware scenario switching
 */
export const test = base.extend<{
  switchScenario: SwitchScenarioFunction;
}>({
  switchScenario: async ({ page }, use) => {
    const switchScenarioFn: SwitchScenarioFunction = async (
      targetPage,
      scenarioId
    ) => {
      // Generate unique test ID
      const testId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // 1. Switch Scenarist scenario (HTTP mocks)
      const scenarioResponse = await targetPage.request.post(
        'http://localhost:3002/api/__scenario__',
        {
          headers: {
            'Content-Type': 'application/json',
            'x-test-id': testId,
          },
          data: { scenario: scenarioId },
        }
      );

      if (!scenarioResponse.ok()) {
        throw new Error(
          `Failed to switch scenario: ${await scenarioResponse.text()}`
        );
      }

      // 2. Seed repository with scenario data
      const seedResponse = await targetPage.request.post(
        'http://localhost:3002/api/test/seed',
        {
          headers: {
            'Content-Type': 'application/json',
            'x-test-id': testId,
          },
          data: { scenarioId },
        }
      );

      if (!seedResponse.ok()) {
        throw new Error(
          `Failed to seed repository: ${await seedResponse.text()}`
        );
      }

      const seedResult = await seedResponse.json();
      console.log('[switchScenario] testId:', testId, 'scenarioId:', scenarioId, 'seed result:', seedResult);

      // Set test ID header for subsequent page navigations
      await targetPage.setExtraHTTPHeaders({ 'x-test-id': testId });

      return testId;
    };

    await use(switchScenarioFn);
  },
});

export { expect };
