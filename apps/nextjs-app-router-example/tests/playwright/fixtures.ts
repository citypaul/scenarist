/**
 * Playwright test fixtures with type-safe scenario IDs
 *
 * This file exports a test object that includes Scenarist fixtures
 * with TypeScript autocomplete for scenario names.
 */

import { withScenarios, expect } from '@scenarist/playwright-helpers';
import { scenarios } from '../../lib/scenarios';

/**
 * Test object with Scenarist fixtures and type-safe scenario IDs.
 *
 * Import this instead of '@playwright/test' to get:
 * - switchScenario fixture with automatic test ID injection
 * - TypeScript autocomplete for scenario names
 * - Configuration from playwright.config.ts
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
 */
export const test = withScenarios(scenarios);

export { expect };
