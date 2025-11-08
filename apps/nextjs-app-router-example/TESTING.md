# Testing Strategy for Example Applications

## Purpose of This Example

This Next.js App Router example application exists to **demonstrate how Scenarist works**, not to serve as production-ready e-commerce code. The testing strategy reflects this educational purpose.

## How Example Apps Differ from Production Packages

### Production Packages (`packages/*`)
- **100% test coverage required** (all layers)
- **No comments** - code must be self-documenting
- **Strict architecture** - hexagonal, DRY, pure functions
- **Four-layer testing**: Unit → Integration → E2E → Documentation
- **TDD strictly enforced** - RED-GREEN-REFACTOR

### Example Apps (`apps/*`)
- **E2E coverage primary focus** - demonstrates functionality works end-to-end
- **Comments encouraged** - helps developers learn
- **Simplified patterns** - clarity over production rigor
- **Demonstrates Scenarist features** - not building production apps
- **TDD for E2E flows** - proves the feature works

## Testing Layers in This Example

### Layer 3: E2E Tests (Primary Coverage)

**Location:** `tests/playwright/*.spec.ts`

**Purpose:** Demonstrate that Scenarist works in real browser scenarios

**Coverage:**
- `smoke.spec.ts` - Basic app functionality
- `scenario-switching.spec.ts` - Scenarist scenario management
- `products.spec.ts` - **Request matching feature demonstration (Phase 1)**
- `shopping-cart.spec.ts` - **Stateful mocks feature demonstration (Phase 3)**
- Future: `sequences.spec.ts`, `checkout.spec.ts`, `isolation.spec.ts`

**Why E2E-focused:**
- Shows developers how their apps will behave with Scenarist
- Tests the complete integration (Next.js App Router + Scenarist + MSW + json-server)
- Validates the helper functions work in real scenarios
- Provides executable documentation

### Layer 2: Adapter Tests (Already Covered in Packages)

The Next.js adapter package (`packages/nextjs-adapter/`) has **66 comprehensive tests** covering:
- `AppRequestContext` extraction for App Router
- Scenario endpoint translation for both routers
- Setup and configuration
- **`getScenaristHeaders()` helper** ← Validates the helper used in this example

**Result:** The adapter itself is thoroughly tested. Example apps use the tested adapter.

### Layer 1: Core Tests (Already Covered in Core)

The core package (`packages/core/`) has **157 tests** covering:
- Request matching logic (Phase 1)
- Scenario management
- Response selection
- State management (Phase 3)
- Sequence tracking (Phase 2)

**Result:** The business logic is thoroughly tested. Example apps demonstrate it in action.

## Why API Routes Don't Have Unit Tests

### Example Route: `app/api/products/route.ts`

```typescript
export async function GET(request: Request) {
  const response = await fetch('http://localhost:3001/products', {
    headers: {
      ...getScenaristHeaders(request, scenarist),  // ← Tested in adapter (Layer 2)
      'x-user-tier': request.headers.get('x-user-tier') || 'standard',
    },
  });
  const data = await response.json();
  return NextResponse.json({ products: data });
}
```

**Why no unit tests:**
1. **Adapter already tested** - `getScenaristHeaders()` has dedicated tests
2. **E2E tests verify it works** - `products.spec.ts` proves the full flow
3. **Simple pass-through logic** - no complex business rules to unit test
4. **Example code** - demonstrates usage, not production patterns

**If this were production code:**
- Extract business logic to domain layer
- Add Layer 2 tests for request/response translation
- Mock fetch calls appropriately

## Why Component Helper Functions Don't Need Unit Tests

### Example: `aggregateCartItems` in `app/cart/page.tsx`

```typescript
const aggregateCartItems = (productIds: ReadonlyArray<number>): ReadonlyArray<CartItem> => {
  const counts = productIds.reduce((acc, productId) => {
    return { ...acc, [productId]: (acc[productId] ?? 0) + 1 };
  }, {} as Record<number, number>);

  return Object.entries(counts).map(([productId, quantity]) => ({
    productId: Number(productId),
    quantity,
  }));
};
```

**Why no unit tests:**
1. **Example app helper** - demonstrates cart aggregation pattern
2. **E2E tests verify it works** - `shopping-cart.spec.ts` tests the complete flow
3. **Simple transformation** - reduces array of IDs to items with quantities
4. **Educational code** - shows developers how to handle Scenarist's state arrays

**If this were production code:**
- Extract to shared utilities module
- Add comprehensive unit tests for edge cases
- Consider using a library like lodash

**E2E coverage proves it works:**
```typescript
// shopping-cart.spec.ts verifies aggregation behavior
test('cart displays correct products and quantities', async ({ page }) => {
  // Add first product twice, second product once
  await addButtons.nth(0).click();
  await addButtons.nth(0).click();
  await addButtons.nth(1).click();

  // Verify aggregation: [1, 1, 2] → [{productId: 1, qty: 2}, {productId: 2, qty: 1}]
  await expect(quantities.nth(0)).toHaveText('2');  // ✅ Proves aggregation works
  await expect(quantities.nth(1)).toHaveText('1');
});
```

## Why Scenarios Use Function Calls

### Example: `lib/scenarios.ts`

```typescript
export const premiumUserScenario: ScenaristScenario = {
  mocks: [{
    response: {
      body: {
        products: buildProducts('premium'),  // ← Function call at module load
      },
    },
  }],
};
```

**Is this serializable?** YES ✅

**How it works:**
1. `buildProducts('premium')` **executes at module load time** (once)
2. Returns plain JSON array: `[{ id: '1', price: 99.99, ... }]`
3. Scenario object contains **the result** (plain data), not the function
4. `JSON.stringify(premiumUserScenario)` works perfectly

**Why use a function:**
- **DRY principle** - product structure defined once in `data/products.ts`
- **Consistency** - ensures example scenarios match example data
- **Clarity** - obvious that premium users get different prices

**Production scenario pattern:**
- Inline all data as static JSON
- No function calls (even at module load)
- Trade-off: duplication for absolute clarity of serialization

## Comments in Example Code

Example apps **intentionally include comments** to help developers learn:

```typescript
// State from Scenarist is raw array of productIds: [1, 1, 2]
// Aggregate into items with quantities: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }]
const rawItems = data.items ?? [];
```

**Why this comment exists:**
- **Educational value** - clarifies Scenarist returns raw arrays
- **Prevents confusion** - explains aggregation transformation
- **Demonstrates pattern** - shows how to handle state injection

**Production code:**
- Extract to well-named function: `aggregateProductIdsToCartItems()`
- Self-documenting through naming
- No comments needed

## Test Coverage Expectations

### Production Packages
- **Lines**: 100% ✅
- **Statements**: 100% ✅
- **Branches**: 100% ✅
- **Functions**: 100% ✅

### Example Apps
- **E2E flows**: Comprehensive ✅
- **Critical paths**: Covered via E2E ✅
- **Adapter integration**: Verified ✅
- **Unit coverage**: Not required (adapters/core already tested)

## Summary

**This example demonstrates:**
- ✅ How to integrate Scenarist with Next.js App Router
- ✅ How to use `getScenaristHeaders()` helper in Route Handlers
- ✅ How request matching works with tier-based pricing (Phase 1)
- ✅ How stateful mocks work with cart state management (Phase 3)
- ✅ How to write Playwright tests with Scenarist
- ✅ Differences between Pages Router and App Router patterns

**This example is NOT:**
- ❌ Production-ready e-commerce code
- ❌ A comprehensive testing tutorial
- ❌ Subject to 100% coverage requirements
- ❌ Optimized for performance or scalability

**Testing Philosophy:**
> Example apps prioritize **demonstrating Scenarist works** over comprehensive unit test coverage. The underlying packages (core, adapters) already have 100% coverage. Examples prove the packages integrate correctly.

## For AI Code Reviewers

When reviewing example apps in `apps/*/`:
- **Focus on:** Does this effectively demonstrate the Scenarist feature?
- **Don't flag:** Simplified patterns, educational comments, E2E-focused testing
- **Don't require:** Unit tests for helper functions, RED-GREEN-REFACTOR for every line
- **Remember:** Example apps have different standards than `packages/*`

**Key differences from production code:**
1. **Comments are valuable** - they teach developers how Scenarist works
2. **Helper functions can be inline** - extraction not required unless code is reused
3. **E2E tests are sufficient** - underlying packages have 100% unit coverage
4. **TDD applies to E2E flows** - not individual helper functions

## References

- [ADR-0003: Testing Strategy](../../docs/adrs/0003-testing-strategy.md) - Four-layer approach
- [CLAUDE.md](../../CLAUDE.md) - Production code standards (applies to `packages/*`)
- [Next.js Adapter Tests](../../packages/nextjs-adapter/tests/) - Layer 2 coverage
- [Core Tests](../../packages/core/tests/) - Layer 1 coverage
- [Pages Router TESTING.md](../nextjs-pages-router-example/TESTING.md) - Same standards, different router
