# @scenarist/playwright-helpers

> Playwright test helpers for Scenarist - simplify scenario switching and test ID management

## Status

🚧 **Under Construction** - This package is being built as part of Phase 0 setup.

## Why This Package?

**Problem:** Playwright tests with Scenarist require manual test ID management and verbose scenario switching:

```typescript
// Without playwright-helpers (verbose, error-prone)
test('checkout flow', async ({ page }) => {
  const testId = `test-${Date.now()}-${Math.random()}`;

  await page.setExtraHTTPHeaders({ 'x-test-id': testId });

  await fetch('http://localhost:3000/__scenario__', {
    method: 'POST',
    headers: { 'x-test-id': testId },
    body: JSON.stringify({ scenarioId: 'checkout-success' }),
  });

  // Your actual test...
});
```

**Solution:** Playwright helpers automate test ID generation and scenario management:

```typescript
// With playwright-helpers (clean, automatic)
test('checkout flow', async ({ scenarist }) => {
  await scenarist.switchScenario('checkout-success');

  // Your actual test - test ID handled automatically!
});
```

**Benefits:**
- 70% less boilerplate code
- No manual test ID collisions
- Type-safe scenario switching
- Automatic cleanup between tests

## Installation

```bash
pnpm add -D @scenarist/playwright-helpers
```

## Usage

**Phase 1 Preview** (API subject to change):

```typescript
import { test } from '@scenarist/playwright-helpers';

test('user can checkout successfully', async ({ page, scenarist }) => {
  // Switch to success scenario
  await scenarist.switchScenario('checkout-success');

  // Test automatically uses unique test ID
  await page.goto('/checkout');
  await page.click('button:has-text("Complete Purchase")');

  await expect(page.getByText('Order confirmed!')).toBeVisible();
});
```

Full documentation coming in Phase 1.

## Development

```bash
# Build the package
pnpm build

# Type check
pnpm typecheck
```

## License

MIT
