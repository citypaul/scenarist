/**
 * Playwright Test Fixtures - Extending Scenarist for Database Apps
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This file demonstrates ONE WAY to extend `@scenarist/playwright-helpers` for
 * applications that have DIRECT DATABASE ACCESS alongside HTTP APIs.
 *
 * **KEY INSIGHT**: Scenarist mocks HTTP responses. If your app also queries
 * databases or other data sources directly, you need SOME strategy to ensure
 * that data matches your test scenarios. This file shows ONE such strategy:
 * **repository seeding via an API endpoint**.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALTERNATIVE APPROACHES (This is NOT the only way!)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * There are several valid strategies for handling direct database access in tests:
 *
 * 1. **Repository Seeding (this example)** - POST to a seed endpoint that
 *    initializes scenario-specific data keyed by test ID
 *
 * 2. **In-Memory Repositories** - Use test ID to partition an in-memory store;
 *    no seeding needed if your repository returns empty state by default
 *
 * 3. **Scenario-Aware Repositories** - Repository checks active scenario and
 *    returns appropriate mock data without explicit seeding
 *
 * 4. **Transactional Rollback** - Each test runs in a database transaction
 *    that's rolled back after the test completes
 *
 * 5. **Database Snapshots** - Reset database to a known snapshot before each test
 *
 * Choose the approach that fits your architecture. This example uses repository
 * seeding because it's explicit and works well with the Repository Pattern.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DO YOU NEED ANY OF THESE PATTERNS?
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * **NO - Most applications don't need this!** If your app ONLY communicates
 * via HTTP APIs (the common case), just use `withScenarios()` directly:
 *
 * ```typescript
 * // tests/fixtures.ts - Simple version for HTTP-only apps
 * import { withScenarios, expect } from "@scenarist/playwright-helpers";
 * import { scenarios } from "../../lib/scenarios";
 *
 * export const test = withScenarios(scenarios);
 * export { expect };
 * ```
 *
 * That's it! You get:
 * - ✅ Type-safe scenario IDs with autocomplete
 * - ✅ Automatic unique test ID generation
 * - ✅ `switchScenario(page, scenarioId)` fixture
 * - ✅ Configuration via playwright.config.ts
 *
 * **YES - You MAY need one of these patterns when:**
 * - Your app queries databases directly (not just via HTTP APIs)
 * - Tests need consistent state at BOTH HTTP and database layers
 * - You're using the Repository Pattern with test ID isolation
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE: HOW THIS SPECIFIC EXTENSION WORKS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This example uses the "Repository Seeding" approach. Here's how it works:
 *
 * 1. We start with `withScenarios(scenarios)` as our base - the recommended API
 *
 * 2. We use Playwright's `.extend()` to override `switchScenario` with a version
 *    that ALSO seeds the repository
 *
 * 3. We access base fixtures (scenaristTestId, scenaristEndpoint, baseURL) so
 *    the extension integrates cleanly with Scenarist's configuration
 *
 * 4. The extended switchScenario does TWO things:
 *    a. Switches HTTP mocks (same as base)
 *    b. POSTs to a seed endpoint to initialize database state (our extension)
 *
 * **Note**: When overriding a fixture in Playwright, we can't "wrap" the original
 * fixture with the same name. We can only access OTHER fixtures as dependencies.
 * That's why we reimplement the HTTP switching logic here. See:
 * https://playwright.dev/docs/test-fixtures#overriding-fixtures
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * LEARN MORE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * - Playwright Integration: https://scenarist.io/testing/playwright-integration
 * - Test Isolation: https://scenarist.io/concepts/test-isolation
 * - Repository Pattern: https://scenarist.io/guides/repository-pattern
 *
 * @module fixtures
 */

import { withScenarios, expect } from "@scenarist/playwright-helpers";
import type { Page } from "@playwright/test";
import { scenarios } from "../../lib/scenarios";

// ═══════════════════════════════════════════════════════════════════════════════
// BASE SCENARIST SETUP
// ═══════════════════════════════════════════════════════════════════════════════
//
// `withScenarios(scenarios)` is the recommended starting point. It provides:
//
// - `switchScenario(page, scenarioId)` - Switch HTTP mocks with type-safe IDs
// - `scenaristTestId` - Guaranteed unique test ID (UUID-based)
// - `scenaristEndpoint` - Configurable scenario endpoint (from playwright.config.ts)
//
// For HTTP-only apps, you would export this directly without any extension.
// ═══════════════════════════════════════════════════════════════════════════════

const baseTest = withScenarios(scenarios);

// Type-safe scenario IDs derived from your scenarios object
type ScenarioId = keyof typeof scenarios;

// ═══════════════════════════════════════════════════════════════════════════════
// EXTENDED FIXTURES FOR DATABASE APPS
// ═══════════════════════════════════════════════════════════════════════════════
//
// This section is ONLY needed if your app has direct database access.
// We override `switchScenario` to add repository seeding.
//
// The pattern:
// 1. Access base fixtures (scenaristTestId, scenaristEndpoint, baseURL)
// 2. Reimplement HTTP mock switching (because we're overriding, not wrapping)
// 3. Add our extension: repository seeding
//
// If your app doesn't need database seeding, DELETE THIS SECTION and just use:
//   export const test = baseTest;
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extended fixtures that add repository seeding to switchScenario.
 *
 * We override the base switchScenario to:
 * 1. Switch Scenarist scenarios (HTTP mocks)
 * 2. Seed the repository with scenario-specific data
 *
 * NOTE: `debugState` and `waitForDebugState` are already provided by
 * `withScenarios()` - we inherit them automatically from baseTest.
 * This demonstrates that Scenarist's Playwright helpers work out of the box!
 *
 * This maintains test isolation at BOTH the HTTP and database layers.
 */
type ExtendedFixtures = {
  switchScenario: (page: Page, scenarioId: ScenarioId) => Promise<string>;
};

export const test = baseTest.extend<ExtendedFixtures>({
  /**
   * Extended switchScenario that handles HTTP mocks AND database seeding.
   *
   * We depend on base fixtures from `withScenarios()`:
   * - scenaristTestId: Unique test ID generated per-test
   * - scenaristEndpoint: Scenario endpoint path (default: '/api/__scenario__')
   * - baseURL: Application base URL from playwright.config.ts
   *
   * @example
   * ```typescript
   * test('premium user sees premium products', async ({ page, switchScenario }) => {
   *   await switchScenario(page, 'premiumUser'); // Switches mocks AND seeds DB
   *   await page.goto('/products');
   *   // Assert on premium products...
   * });
   * ```
   */
  switchScenario: async (
    { scenaristTestId, scenaristEndpoint, baseURL },
    use,
  ) => {
    const switchFn = async (
      page: Page,
      scenarioId: ScenarioId,
    ): Promise<string> => {
      const testId = scenaristTestId;
      const endpoint = scenaristEndpoint ?? "/api/__scenario__";
      const finalBaseURL = baseURL ?? "http://localhost:3000";

      // ─────────────────────────────────────────────────────────────────────
      // STEP 1: Switch Scenarist scenario (HTTP mocks)
      // ─────────────────────────────────────────────────────────────────────
      // This is what the base `withScenarios()` switchScenario does.
      // We reimplement it here because Playwright doesn't allow wrapping
      // a fixture you're overriding (only accessing other fixtures).
      //
      // The POST request tells Scenarist to activate this scenario's mocks
      // for requests with the matching test ID header.
      // ─────────────────────────────────────────────────────────────────────
      const scenarioResponse = await page.request.post(
        `${finalBaseURL}${endpoint}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-scenarist-test-id": testId,
          },
          data: { scenario: scenarioId },
        },
      );

      if (!scenarioResponse.ok()) {
        throw new Error(
          `Failed to switch scenario: ${await scenarioResponse.text()}`,
        );
      }

      // ─────────────────────────────────────────────────────────────────────
      // STEP 2: Seed repository with scenario data (OUR EXTENSION)
      // ─────────────────────────────────────────────────────────────────────
      // This is the DATABASE SEEDING extension. Remove this entire section
      // if your app doesn't have direct database access!
      //
      // The seed endpoint should:
      // - Use the testId to isolate database state per test
      // - Initialize scenario-specific data (users, products, orders, etc.)
      // - Return quickly (ideally < 100ms)
      //
      // Implementation example: See /api/test/seed route in this project
      // Learn more: https://scenarist.io/guides/repository-pattern
      // ─────────────────────────────────────────────────────────────────────
      const seedResponse = await page.request.post(
        `${finalBaseURL}/api/test/seed`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-scenarist-test-id": testId,
          },
          data: { scenarioId },
        },
      );

      if (!seedResponse.ok()) {
        throw new Error(
          `Failed to seed repository: ${await seedResponse.text()}`,
        );
      }

      // ─────────────────────────────────────────────────────────────────────
      // STEP 3: Set test ID header for subsequent page navigations
      // ─────────────────────────────────────────────────────────────────────
      // All requests from the page will now include the test ID header.
      // This ensures:
      // - HTTP mocks are applied correctly (Scenarist)
      // - Database queries are isolated to this test's state (Repository)
      // ─────────────────────────────────────────────────────────────────────
      await page.setExtraHTTPHeaders({ "x-scenarist-test-id": testId });

      return testId;
    };

    await use(switchFn);
  },
});

export { expect };
