/**
 * Playwright test fixtures with type-safe scenario IDs and repository seeding
 *
 * This file demonstrates how to extend Scenarist's switchScenario to also seed
 * database state, keeping the same test ID isolation for both HTTP mocks and
 * direct database queries.
 *
 * NOTE: Repository seeding is NOT a Scenarist feature - it's a complementary
 * pattern you implement in your app for handling direct database access.
 *
 * Learn more: https://scenarist.io/docs/patterns/repository-testing
 */

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { scenarios } from '../../lib/scenarios';

/**
 * Custom switchScenario function that:
 * 1. Switches Scenarist scenario (HTTP mocks)
 * 2. Seeds repository with scenario data
 *
 * This maintains the Scenarist pattern: switch → navigate → assert
 */
type SwitchScenarioFunction = (
  page: Page,
  scenarioId: keyof typeof scenarios
) => Promise<string>;

/**
 * Test fixtures with repository-aware scenario switching
 */
export const test = base.extend<{
  switchScenario: SwitchScenarioFunction;
}>({
  switchScenario: async ({}, use) => {
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
