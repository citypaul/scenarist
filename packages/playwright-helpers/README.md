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

## Testing Strategy

This package follows behavior-driven testing principles. The helpers are **tested through E2E tests in consuming applications**, not through isolated unit tests.

### Why No Unit Tests?

1. **Helpers are thin wrappers** around Playwright's Page API
2. **Real value is integration** - helpers must work with actual Playwright browsers, real HTTP requests, and real scenario endpoints
3. **Behavior-driven testing** - We test through the public API (how users will actually use the helpers)
4. **No business logic** - Helpers are pure plumbing with no complex logic requiring isolated testing

### Where Are They Tested?

The helpers are validated through comprehensive E2E tests in:

**Location**: `apps/nextjs-pages-example/tests/playwright/scenario-switching.spec.ts`

**Test Coverage**:
- ✅ Scenario switching with helper (successful switch, headers set, navigation works)
- ✅ Error handling (helper throws on non-200 responses)
- ✅ Side-by-side comparison (manual verbose approach vs helper approach)
- ✅ Real browser automation (tests run in actual Chromium/Firefox/WebKit)
- ✅ Real scenario endpoints (Next.js API routes)
- ✅ Real test ID isolation (concurrent test execution)

**Example Test**:
```typescript
test('can switch to premium scenario using helper', async ({ page }) => {
  await switchScenario(page, 'premiumUser', {
    baseURL: 'http://localhost:3000',
    endpoint: '/api/__scenario__',
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/Scenarist E-commerce Example/);
  await expect(page.locator('h1')).toBeVisible();
});
```

### TDD Compliance

This testing approach is fully compliant with strict TDD principles:

1. **RED phase**: E2E test written first, fails with "switchScenario is not a function"
2. **GREEN phase**: Helper implementation added, test passes
3. **Refactoring**: Helper API refined based on test usage
4. **100% behavior coverage**: All helper code paths exercised through E2E tests
5. **Public API testing**: Tests use helpers exactly as end users will

### Running Tests

From the repository root:

```bash
# Run all E2E tests (includes helper validation)
pnpm --filter=@scenarist/nextjs-pages-example test:e2e

# Run scenario switching tests specifically
pnpm --filter=@scenarist/nextjs-pages-example test:e2e scenario-switching.spec.ts
```

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
