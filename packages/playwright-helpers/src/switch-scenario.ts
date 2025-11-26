import type { Page } from '@playwright/test';
import { SCENARIST_TEST_ID_HEADER } from '@scenarist/core';

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
   * Optional test ID to use instead of auto-generating one.
   * When using the fixture-based API, this is automatically provided.
   * @internal
   */
  readonly testId?: string;
};

/**
 * Establish route interception and header injection for test ID propagation.
 *
 * CRITICAL: Must be called BEFORE navigation to prevent race conditions.
 * Client Components may fire API calls immediately on mount, and if route
 * interception isn't established first, those requests bypass MSW.
 *
 * @param page - Playwright Page object
 * @param testId - Test ID to inject into all requests
 */
const establishTestIdInterception = async (
  page: Page,
  testId: string,
): Promise<void> => {
  // Clear any existing handlers to prevent accumulation
  await page.unroute('**/*');

  // Intercept all routes to inject test ID header
  await page.route('**/*', async (route) => {
    const headers = route.request().headers();
    headers[SCENARIST_TEST_ID_HEADER] = testId;
    await route.continue({ headers });
  });

  // Set test ID header for navigation requests (belt and suspenders)
  await page.setExtraHTTPHeaders({ [SCENARIST_TEST_ID_HEADER]: testId });
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
 * @returns Promise that resolves with the test ID used for this scenario
 *
 * @example
 * ```typescript
 * import { switchScenario } from '@scenarist/playwright-helpers';
 *
 * test('premium user flow', async ({ page }) => {
 *   const testId = await switchScenario(page, 'premiumUser', {
 *     baseURL: 'http://localhost:3000',
 *   });
 *
 *   // Use testId for explicit API requests
 *   await page.request.post('/api/action', {
 *     headers: { 'x-scenarist-test-id': testId },
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
): Promise<string> => {
  const {
    baseURL,
    endpoint = '/__scenario__',
    testId: providedTestId,
  } = options;

  // Use provided test ID (from fixture) or generate unique one
  // When using fixtures, test ID is guaranteed unique by Playwright's test context
  // Date.now() can collide when tests run in parallel within the same millisecond
  const testId = providedTestId ?? `test-${scenarioId}-${crypto.randomUUID()}`;

  // Establish test ID interception BEFORE scenario switch to prevent race conditions
  // Client Components may fire API calls immediately on mount/navigation
  await establishTestIdInterception(page, testId);

  // Call scenario endpoint
  const url = `${baseURL}${endpoint}`;
  const response = await page.request.post(url, {
    headers: { [SCENARIST_TEST_ID_HEADER]: testId },
    data: {
      scenario: scenarioId,
    },
  });

  // Verify scenario switch succeeded
  if (response.status() !== 200) {
    const body = await response.text();
    throw new Error(
      `Failed to switch scenario: ${response.status()} ${response.statusText()}\n${body}`,
    );
  }

  // Return test ID for explicit use in page.request calls
  return testId;
};
