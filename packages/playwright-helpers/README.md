# @scenarist/playwright-helpers

[![npm version](https://img.shields.io/npm/v/@scenarist/playwright-helpers.svg)](https://www.npmjs.com/package/@scenarist/playwright-helpers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Playwright test helpers for [Scenarist](https://scenarist.io) scenario management with guaranteed test isolation.

## 📖 Documentation

**Full documentation at [scenarist.io](https://scenarist.io)**

| Topic | Link |
|-------|------|
| **Why Scenarist?** | [scenarist.io/introduction/why-scenarist](https://scenarist.io/introduction/why-scenarist) |
| **Playwright Integration** | [scenarist.io/testing/playwright-integration](https://scenarist.io/testing/playwright-integration) |
| **Parallel Testing** | [scenarist.io/testing/parallel-testing](https://scenarist.io/testing/parallel-testing) |
| **Testing Philosophy** | [scenarist.io/concepts/philosophy](https://scenarist.io/concepts/philosophy) |

## Installation

```bash
# npm
npm install -D @scenarist/playwright-helpers

# pnpm
pnpm add -D @scenarist/playwright-helpers

# yarn
yarn add -D @scenarist/playwright-helpers
```

## Quick Start (Recommended: Fixtures API)

The **fixtures API** is the recommended way to use Scenarist with Playwright. It provides:
- ✅ Guaranteed unique test IDs (no collisions, even with parallel execution)
- ✅ Configuration in one place (no repetition across tests)
- ✅ Clean composition with your existing fixtures
- ✅ Type-safe with full TypeScript support

### 1. Configure in `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';
import type { ScenaristOptions } from '@scenarist/playwright-helpers';

export default defineConfig<ScenaristOptions>({
  use: {
    baseURL: 'http://localhost:3000',      // Standard Playwright config
    scenaristEndpoint: '/api/__scenario__', // Scenarist-specific config
  },
});
```

**Note:** The `<ScenaristOptions>` type parameter enables TypeScript to recognize `scenaristEndpoint` as a valid configuration option.

### 2. Use in Tests

```typescript
import { test, expect } from '@scenarist/playwright-helpers';

test('premium user sees premium pricing', async ({ page, switchScenario }) => {
  // Configuration read from playwright.config.ts - no repetition!
  await switchScenario(page, 'premiumUser');

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Premium' })).toBeVisible();
});
```

That's it! No manual test ID generation, no repeating baseURL/endpoint, guaranteed test isolation.

## Composing with Your Existing Fixtures

If your team already has custom Playwright fixtures, you can easily compose them with Scenarist fixtures:

```typescript
// tests/fixtures.ts
import { test as scenaristTest } from '@scenarist/playwright-helpers';

type MyFixtures = {
  authenticatedPage: Page;
  database: Database;
};

export const test = scenaristTest.extend<MyFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Your custom fixture logic
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    await use(page);
  },

  database: async ({}, use) => {
    const db = await connectToTestDatabase();
    await use(db);
    await db.close();
  },
});

export { expect } from '@scenarist/playwright-helpers';
```

Now use your extended test object:

```typescript
// tests/my-test.spec.ts
import { test, expect } from './fixtures';

test('authenticated premium user flow', async ({ authenticatedPage, switchScenario, database }) => {
  // All fixtures available: yours + Scenarist's
  await switchScenario(authenticatedPage, 'premiumUser');
  await authenticatedPage.goto('/dashboard');

  const user = await database.getUser('test@example.com');
  expect(user.tier).toBe('premium');
});
```

## Type-Safe Scenario IDs (Optional but Recommended)

Get autocomplete and type checking for scenario names:

### 1. Define Scenarios with Type Export

```typescript
// lib/scenarios.ts
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/core';

export const scenarios = {
  cartWithState: { id: 'cartWithState', name: 'Cart with State', ... },
  premiumUser: { id: 'premiumUser', name: 'Premium User', ... },
  standardUser: { id: 'standardUser', name: 'Standard User', ... },
} as const satisfies ScenaristScenarios;

// Derive type from actual scenarios (or use ScenarioIds<typeof scenarios>)
export type ScenarioId = keyof typeof scenarios;
```

### 2. Create Typed Test Object

```typescript
// tests/fixtures.ts
import { createTest, expect } from '@scenarist/playwright-helpers';
import type { ScenarioId } from '../lib/scenarios';

// Create typed test object with your scenario IDs
export const test = createTest<ScenarioId>();
export { expect };
```

### 3. Use with Full Autocomplete

```typescript
// tests/my-test.spec.ts
import { test, expect } from './fixtures';

test('my test', async ({ page, switchScenario }) => {
  await switchScenario(page, 'cart');          // ❌ TypeScript error: not a valid scenario
  await switchScenario(page, 'cartWithState'); // ✅ Autocomplete works!
  //                            ^
  //                            Autocomplete shows all valid scenario IDs
});
```

**Benefits:**
- ✅ Autocomplete shows all valid scenario names
- ✅ TypeScript errors for typos or invalid scenarios
- ✅ Type stays in sync with actual scenarios (single source of truth)
- ✅ Works seamlessly with fixture composition

## Advanced: Per-Test Configuration Overrides

Most tests use the global config, but you can override for specific tests:

```typescript
test('staging environment test', async ({ page, switchScenario }) => {
  await switchScenario(page, 'myScenario', {
    baseURL: 'https://staging.example.com',  // Override for this test only
    endpoint: '/api/custom-endpoint',
  });

  await page.goto('/');
  // Test against staging environment
});
```

## Advanced: Standalone `switchScenario` Function

For cases where you need manual control over test IDs or can't use fixtures:

```typescript
import { test, expect } from '@playwright/test';
import { switchScenario } from '@scenarist/playwright-helpers';

test('premium user scenario', async ({ page }) => {
  // Switch to premium scenario (generates unique test ID, sets headers automatically)
  await switchScenario(page, 'premiumUser', {
    baseURL: 'http://localhost:3000',
    endpoint: '/api/__scenario__',
  });

  // Navigate and test as premium user
  await page.goto('/');
  await expect(page.locator('.premium-badge')).toBeVisible();
});
```

> **Note on testing**: This package has comprehensive behavior-driven tests at the package level. This is NOT unit testing - we test observable behavior through the public API only. See [Testing Philosophy](#testing-philosophy) below for full rationale.

#### Options

```typescript
type SwitchScenarioOptions = {
  readonly baseURL: string;           // Base URL of your application
  readonly endpoint?: string;         // Scenario endpoint path (default: '/__scenario__')
  readonly testIdHeader?: string;     // Test ID header name (default: 'x-scenarist-test-id')
  readonly variant?: string;          // Optional scenario variant
};
```

#### What it does

The `switchScenario` helper:
1. Generates a unique test ID (`test-{scenarioId}-{timestamp}`)
2. POSTs to the scenario endpoint with the test ID header
3. Verifies the scenario switch succeeded (200 response)
4. Sets the test ID header for all subsequent requests in the test

This reduces scenario switching from 9 lines of boilerplate to 2 lines:

**Without helper (9 lines):**
```typescript
const testId = `test-premium-${Date.now()}`;
const response = await page.request.post('http://localhost:3000/api/__scenario__', {
  headers: { 'x-scenarist-test-id': testId },
  data: { scenario: 'premiumUser' },
});
expect(response.status()).toBe(200);
await page.setExtraHTTPHeaders({ 'x-scenarist-test-id': testId });
```

**With helper (2 lines):**
```typescript
await switchScenario(page, 'premiumUser', {
  baseURL: 'http://localhost:3000',
  endpoint: '/api/__scenario__',
});
```

**Code reduction: 77%**

## API Reference

### Fixtures API (Recommended)

#### `test`

Extended Playwright test object with Scenarist fixtures.

```typescript
import { test } from '@scenarist/playwright-helpers';

test('my test', async ({ page, switchScenario, scenaristTestId }) => {
  // Your test code
});
```

**Fixtures provided:**

- `switchScenario(page, scenarioId, options?)` - Switch to a scenario (auto-injects test ID)
- `scenaristTestId` - Unique test ID for this test (usually don't need to access directly)

#### `expect`

Re-exported from `@playwright/test` for convenience:

```typescript
import { test, expect } from '@scenarist/playwright-helpers';
```

#### Configuration Options

Set in `playwright.config.ts`:

```typescript
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',       // Standard Playwright (used by switchScenario)
    scenaristEndpoint: '/api/__scenario__', // Scenarist endpoint path (default: '/api/__scenario__')
  },
});
```

**Available options:**

- `scenaristEndpoint?: string` - The endpoint path for scenario switching (default: `'/api/__scenario__'`)

#### `switchScenario` (Fixture)

Switch to a scenario using the automatically generated test ID.

```typescript
await switchScenario(page, scenarioId, options?)
```

**Parameters:**

- `page: Page` - Playwright Page object
- `scenarioId: string` - The scenario to switch to
- `options?: { baseURL?: string; endpoint?: string }` - Optional overrides (rarely needed)

**What it does:**

1. Reads `baseURL` from Playwright config (or uses override)
2. Reads `scenaristEndpoint` from Playwright config (or uses override)
3. Generates unique test ID automatically (via `scenaristTestId` fixture)
4. POSTs to scenario endpoint with test ID header
5. Verifies scenario switch succeeded
6. Sets test ID header for all subsequent requests

### Standalone API (Advanced)

#### `switchScenario` (Function)

For manual test ID control:

```typescript
import { switchScenario } from '@scenarist/playwright-helpers';

await switchScenario(page, scenarioId, {
  baseURL: 'http://localhost:3000',
  endpoint: '/api/__scenario__',
  testId: 'my-custom-test-id', // Manual test ID
});
```

**Use this only when:**
- You need to share test IDs across multiple tests
- You're integrating with existing test infrastructure that provides test IDs
- You can't use Playwright fixtures for some reason

**⚠️ Warning:** Manual test IDs can cause collisions in parallel execution. The fixture API is safer.

## Common Pitfalls

### ❌ Don't: Switch scenarios after navigation

```typescript
import { test } from '@scenarist/playwright-helpers';

test('bad example', async ({ page, switchScenario }) => {
  await page.goto('/');  // BAD - Navigating first
  await switchScenario(page, 'premium');  // Headers set too late!
});
```

**Why it fails**: Headers set AFTER navigation don't affect the already-loaded page.

**Solution**: ✅ Switch scenario BEFORE navigating:
```typescript
test('good example', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premium');  // Set headers first
  await page.goto('/');  // Now requests use test ID header
});
```

---

### ❌ Don't: Forget to configure in playwright.config.ts

```typescript
// playwright.config.ts - Missing configuration!
export default defineConfig({
  use: {
    // Missing: baseURL and scenaristEndpoint
  },
});
```

**Error**: `switchScenario` won't know where to send requests.

**Solution**: ✅ Configure in `playwright.config.ts`:
```typescript
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
    scenaristEndpoint: '/api/__scenario__',
  },
});
```

---

### ❌ Don't: Use standalone `switchScenario` with manual test IDs

```typescript
import { switchScenario } from '@scenarist/playwright-helpers';

test('bad example', async ({ page }) => {
  // BAD - Manual test ID risks conflicts
  await switchScenario(page, 'premium', {
    baseURL: 'http://localhost:3000',
    endpoint: '/api/__scenario__',
    testId: 'my-test',  // Same ID across parallel tests = collision!
  });
});
```

**Why it fails**: Multiple tests with the same ID will interfere with each other in parallel execution.

**Solution**: ✅ Use the fixture API (auto-generates unique IDs):
```typescript
import { test } from '@scenarist/playwright-helpers';

test('good example', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premium');
  // Generates unique ID automatically: test-abc123-{uuid}
});
```

## Testing Philosophy

**You might be thinking**: "Why test the helpers in their own package when they're already tested in Next.js?"

**Answer**: We use a **two-layer approach** that tests different concerns:

**Why this matters**:
- ⚡ Fast feedback (1.7s vs 2-3s for full E2E)
- 🎯 Pinpoint issues in Playwright integration vs framework integration
- 📋 Comprehensive edge case coverage (13 test scenarios)
- 🔒 Tests prove helper works with real Playwright API

### Testing Strategy: Real Playwright Integration (Exception to Layer 2 Rule)

This package uses **real Playwright integration** in tests, which is an **exception** to the general adapter testing rule (ADR-0003 Layer 2 prescribes mocking external dependencies).

**⚠️ This is NOT the standard approach.** Most adapters (Express, Next.js, etc.) should mock external dependencies for fast, focused tests.

**Why this package qualifies for exception** (per [ADR-0006](../../docs/adrs/0006-thin-adapters-real-integration-tests.md)):
- ✅ Extremely thin (~40 lines)
- ✅ Direct API wrappers only (no transformation)
- ✅ Stable API (Playwright)
- ✅ Fast tests (1.7s)
- ✅ Real integration provides significantly higher confidence

See [ADR-0006](../../docs/adrs/0006-thin-adapters-real-integration-tests.md) for full decision criteria and when to use real dependencies vs. mocks.

This package uses a **two-layer testing approach**:

### Layer 1: Playwright Integration Tests (This Package)

**Location**: `packages/playwright-helpers/tests/`

These tests validate the helper works correctly with **real Playwright** using MSW Node server. They prove the helper integrates with Playwright's Page API correctly.

**Testing Stack**:
- ✅ **Real Playwright** - Uses actual `@playwright/test` with real Page objects
- ✅ **MSW Node Server** - Real HTTP server responding to requests
- ✅ **No framework dependencies** - Tests helper + Playwright only

**What We Test**:
- ✅ Scenario switching succeeds with correct inputs
- ✅ Test ID generation format and uniqueness
- ✅ Endpoint URL construction (baseURL + endpoint)
- ✅ Request body structure (scenario, variant)
- ✅ Custom header support (testIdHeader)
- ✅ Error handling (404, 400, 500 responses)
- ✅ Multiple concurrent scenarios work independently
- ✅ Default values for optional parameters

**Value**: Tests helper's integration with Playwright in isolation. No Next.js, no MSW client, no complex stack - just helper + Playwright + HTTP server.

**Example Test**:
```typescript
test('should throw error when scenario switch fails with 404', async ({ page }) => {
  await expect(
    switchScenario(page, 'error-404', {
      baseURL: 'http://localhost:9876',
    })
  ).rejects.toThrow(/Failed to switch scenario: 404/);
});
```

**Run Package Tests**:
```bash
cd packages/playwright-helpers
pnpm test          # Run all tests
pnpm test:watch    # Interactive UI mode
```

### Layer 2: Integration Tests (Next.js App)

**Location**: `apps/nextjs-pages-router-example/tests/playwright/scenario-switching.spec.ts`

These tests validate the **complete integration** of helpers with real frameworks, real browsers, and real scenario endpoints.

**What Integration Tests Cover**:
- ✅ Helper works with real Playwright browsers (Chromium/Firefox/WebKit)
- ✅ Helper works with real Next.js API routes
- ✅ Helper works with real Scenarist scenario switching
- ✅ Full user journey (switch → navigate → verify)
- ✅ Next.js-specific behavior (Pages Router conventions)

**Why Both Layers Matter**:

| Concern | Package Tests ✅ | Integration Tests ✅ |
|---------|------------------|----------------------|
| **Speed** | ⚡ Fast (1.7s) | 🐌 Slower (2-3s) |
| **Scope** | Helper + Playwright only | Full stack (Next.js + MSW + Scenarist) |
| **Debugging** | 🎯 Pinpoint Playwright integration issues | 🔍 Find framework integration issues |
| **Coverage** | Edge cases + error handling | Happy paths + real scenarios |
| **Dependencies** | Minimal (Playwright, MSW) | Many (Next.js, MSW client, Scenarist) |
| **What it proves** | Helper works with Playwright API | Helper works with real frameworks |

**Takeaway**: Package tests prove Playwright integration. Integration tests prove framework integration.

**Run Integration Tests**:
```bash
# From repository root
pnpm --filter=@scenarist/nextjs-pages-router-example test:e2e
```

### TDD Compliance

**Critical Question**: "If these aren't unit tests, why were they written AFTER the E2E tests?"

**Answer**: This follows strict TDD with **deliberate refactoring**:

**Phase 1a (RED)**: E2E test written first
- ❌ Test fails: "switchScenario is not a function"
- **This is the failing test that drove development**

**Phase 1b (GREEN)**: Minimum implementation
- ✅ Helper implementation created
- ✅ E2E test passes
- **Working code, ready to commit**

**Phase 1c (REFACTOR)**: Edge case coverage added
- 🔧 17 behavior tests added (error handling, edge cases, defaults)
- ✅ All tests green, 100% coverage achieved
- **Refactoring step per RED-GREEN-REFACTOR cycle**

**Key Insight**: Package tests are NOT "test-first" - they're REFACTORING tests added after green to ensure edge case coverage. The E2E test was the failing test that drove implementation.

This is textbook TDD: **RED** (E2E fails) → **GREEN** (implementation) → **REFACTOR** (add package tests for completeness).

### How This Aligns With Testing Guidelines

Our testing guidelines (from `docs/testing-guidelines.md`) require:

| Guideline | How Package Tests Comply |
|-----------|--------------------------|
| **"Test through public API exclusively"** | ✅ Tests call `switchScenario()` only - internals invisible |
| **"No 1:1 mapping between test/implementation files"** | ✅ Single test file, single public function, multiple behaviors |
| **"Tests must document expected business behaviour"** | ✅ Each test describes observable behavior (error, headers, defaults) |
| **"Behavior-driven - treat as black box"** | ✅ Tests verify inputs → outputs, implementation is opaque |

**Key Distinction**:
- ❌ **Unit testing** = Testing internal functions, mocking own code, coupling to implementation
- ✅ **Behavior testing** = Testing public API, mocking external dependencies, verifying outcomes

We mock Playwright's `Page` (external dependency we don't own), not our own code.

## Development

```bash
# Build the package
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Clean build artifacts
pnpm clean
```

## Why This Package Exists

Before this helper, switching scenarios in Playwright tests required significant boilerplate:

1. Generate unique test ID
2. Construct scenario endpoint URL
3. Send POST request with test ID header
4. Verify response status
5. Set test ID header for all subsequent requests

This 9-line pattern was repeated in every test, making tests verbose and error-prone. The `switchScenario` helper encapsulates this pattern into a single function call, reducing code by 77% while improving readability and maintainability.

## Documentation

📖 **[Full Documentation](https://scenarist.io)** - Complete guides, API reference, and examples.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
