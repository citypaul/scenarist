# Testing Strategy for Example Applications

## Purpose of This Example

This Next.js Pages example application exists to **demonstrate how Scenarist works**, not to serve as production-ready e-commerce code. The testing strategy reflects this educational purpose.

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
- `products.spec.ts` - **Request matching feature demonstration**
- `products.baseline.spec.ts` - Comparison without Scenarist

**Why E2E-focused:**
- Shows developers how their apps will behave with Scenarist
- Tests the complete integration (Next.js + Scenarist + MSW + json-server)
- Validates the helper functions work in real scenarios
- Provides executable documentation

### Layer 2: Adapter Tests (Already Covered in Packages)

The Next.js adapter package (`packages/nextjs-adapter/`) has **72 comprehensive tests** covering:
- `PagesRequestContext` extraction (12 tests)
- Scenario endpoint translation (9 tests)
- Setup and configuration (12 tests)
- **`getScenaristHeaders()` helper (6 tests)** ← Validates the helper used in this example

**Result:** The adapter itself is thoroughly tested. Example apps use the tested adapter.

### Layer 1: Core Tests (Already Covered in Core)

The core package (`packages/core/`) has **157 tests** covering:
- Request matching logic (Phase 1)
- Scenario management
- Response selection
- State management
- Sequence tracking

**Result:** The business logic is thoroughly tested. Example apps demonstrate it in action.

## Why API Routes Don't Have Unit Tests

### Example Route: `pages/api/products.ts`

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch('http://localhost:3001/products', {
    headers: {
      ...getScenaristHeaders(req, scenarist),  // ← Tested in adapter (Layer 2)
      'x-user-tier': req.headers['x-user-tier'] || 'standard',
    },
  });
  const data = await response.json();
  return res.status(200).json(data);
}
```

**Why no unit tests:**
1. **Adapter already tested** - `getScenaristHeaders()` has 6 dedicated tests
2. **E2E tests verify it works** - `products.spec.ts` proves the full flow
3. **Simple pass-through logic** - no complex business rules to unit test
4. **Example code** - demonstrates usage, not production patterns

**If this were production code:**
- Extract business logic to domain layer
- Add Layer 2 tests for request/response translation
- Mock fetch calls appropriately

## Why Scenarios Use Function Calls

### Example: `lib/scenarios.ts`

```typescript
export const premiumUserScenario: ScenarioDefinition = {
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
// Get user tier from request header (app-specific, not Scenarist infrastructure)
const userTier = (req.headers['x-user-tier'] as string) || 'standard';
```

**Why this comment exists:**
- **Educational value** - clarifies `x-user-tier` is NOT a Scenarist header
- **Prevents confusion** - distinguishes infrastructure vs application headers
- **Demonstrates pattern** - shows how to forward custom headers

**Production code:**
- Extract to well-named function: `extractUserTierFromRequest()`
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
- ✅ How to integrate Scenarist with Next.js Pages Router
- ✅ How to use `getScenaristHeaders()` helper
- ✅ How request matching works with tier-based pricing
- ✅ How to write Playwright tests with Scenarist

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
- **Remember:** Example apps have different standards than `packages/*`

## References

- [ADR-0003: Testing Strategy](../../docs/adrs/0003-testing-strategy.md) - Four-layer approach
- [CLAUDE.md](../../CLAUDE.md) - Production code standards (applies to `packages/*`)
- [Next.js Adapter Tests](../../packages/nextjs-adapter/tests/) - Layer 2 coverage
- [Core Tests](../../packages/core/tests/) - Layer 1 coverage
