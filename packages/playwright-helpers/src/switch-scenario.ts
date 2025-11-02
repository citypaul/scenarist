import type { Page } from '@playwright/test';

/**
 * Options for switchScenario helper
 */
export type SwitchScenarioOptions = {
  /**
   * Base URL of the application
   * @example 'http://localhost:3000'
   */
  readonly baseURL: string;

  /**
   * Scenario endpoint path
   * @default '/__scenario__'
   */
  readonly endpoint?: string;

  /**
   * Test ID header name
   * @default 'x-test-id'
   */
  readonly testIdHeader?: string;

  /**
   * Optional variant within the scenario
   */
  readonly variant?: string;

  /**
   * Optional test ID to use instead of auto-generating one.
   * When using the fixture-based API, this is automatically provided.
   * @internal
   */
  readonly testId?: string;
};

/**
 * Switch to a different scenario in Playwright tests.
 *
 * This helper simplifies scenario switching by:
 * - Automatically generating a unique test ID
 * - Calling the scenario endpoint
 * - Setting test ID headers for subsequent requests
 *
 * @param page - Playwright Page object
 * @param scenarioId - Scenario ID to switch to
 * @param options - Configuration options
 * @returns Promise that resolves when scenario is switched
 *
 * @example
 * ```typescript
 * import { switchScenario } from '@scenarist/playwright-helpers';
 *
 * test('premium user flow', async ({ page }) => {
 *   await switchScenario(page, 'premiumUser', {
 *     baseURL: 'http://localhost:3000',
 *   });
 *
 *   await page.goto('/');
 *   // Test with premium user scenario active
 * });
 * ```
 */
export const switchScenario = async (
  page: Page,
  scenarioId: string,
  options: SwitchScenarioOptions,
): Promise<void> => {
  const {
    baseURL,
    endpoint = '/__scenario__',
    testIdHeader = 'x-test-id',
    variant,
    testId: providedTestId,
  } = options;

  // Use provided test ID (from fixture) or generate unique one
  // When using fixtures, test ID is guaranteed unique by Playwright's test context
  // Date.now() can collide when tests run in parallel within the same millisecond
  const testId = providedTestId ?? `test-${scenarioId}-${crypto.randomUUID()}`;

  // Call scenario endpoint
  const url = `${baseURL}${endpoint}`;
  const response = await page.request.post(url, {
    headers: { [testIdHeader]: testId },
    data: {
      scenario: scenarioId,
      ...(variant && { variant }),
    },
  });

  // Verify scenario switch succeeded
  if (response.status() !== 200) {
    const body = await response.text();
    throw new Error(
      `Failed to switch scenario: ${response.status()} ${response.statusText()}\n${body}`,
    );
  }

  // Set test ID header for all subsequent requests
  await page.setExtraHTTPHeaders({ [testIdHeader]: testId });
};
