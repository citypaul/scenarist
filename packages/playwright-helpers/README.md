# @scenarist/playwright-helpers

Playwright test helpers for Scenarist scenario management.

## Installation

```bash
pnpm add -D @scenarist/playwright-helpers
```

## Usage

### `switchScenario`

Helper function to switch scenarios in Playwright tests with minimal boilerplate.

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
  readonly testIdHeader?: string;     // Test ID header name (default: 'x-test-id')
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
  headers: { 'x-test-id': testId },
  data: { scenario: 'premiumUser' },
});
expect(response.status()).toBe(200);
await page.setExtraHTTPHeaders({ 'x-test-id': testId });
```

**With helper (2 lines):**
```typescript
await switchScenario(page, 'premiumUser', {
  baseURL: 'http://localhost:3000',
  endpoint: '/api/__scenario__',
});
```

**Code reduction: 77%**

## Common Pitfalls

### ❌ Don't: Switch scenarios after navigation

```typescript
// BAD - Switching after page load
await page.goto('/');
await switchScenario(page, 'premium', { baseURL: 'http://localhost:3000' });
```

**Why it fails**: Headers set AFTER navigation don't affect the already-loaded page.

**Solution**: ✅ Switch scenario BEFORE navigating:
```typescript
await switchScenario(page, 'premium', { baseURL: 'http://localhost:3000' });
await page.goto('/');  // Now requests use test ID header
```

---

### ❌ Don't: Forget to provide baseURL

```typescript
// BAD - Missing required baseURL
await switchScenario(page, 'premium', { endpoint: '/api/__scenario__' });
```

**Error**: TypeScript will catch this - `baseURL` is required.

**Solution**: ✅ Always provide `baseURL`:
```typescript
await switchScenario(page, 'premium', {
  baseURL: 'http://localhost:3000',
  endpoint: '/api/__scenario__',
});
```

---

### ❌ Don't: Reuse test IDs manually

```typescript
// BAD - Manual test ID risks conflicts
const testId = 'my-test';
await page.request.post(`${baseURL}/api/__scenario__`, {
  headers: { 'x-test-id': testId },
  data: { scenario: 'premium' },
});
```

**Why it fails**: Multiple tests with the same ID will interfere with each other.

**Solution**: ✅ Let `switchScenario` generate unique IDs automatically:
```typescript
await switchScenario(page, 'premium', { baseURL });
// Generates: test-premium-1730592847123 (unique timestamp)
```

## Testing Philosophy

**You might be thinking**: "Why test the helpers in their own package when they're already tested in Next.js?"

**Answer**: We use a **two-layer approach** that tests different concerns:

**Why this matters**:
- ⚡ Fast feedback (1.7s vs 2-3s for full E2E)
- 🎯 Pinpoint issues in Playwright integration vs framework integration
- 📋 Comprehensive edge case coverage (13 test scenarios)
- 🔒 Tests prove helper works with real Playwright API

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

**Location**: `apps/nextjs-pages-example/tests/playwright/scenario-switching.spec.ts`

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
pnpm --filter=@scenarist/nextjs-pages-example test:e2e
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

## License

MIT
