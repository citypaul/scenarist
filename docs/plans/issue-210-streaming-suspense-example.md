# Issue 210: Add Streaming/Suspense Example to App Router Example App

## Status: IN PROGRESS

## Overview

Create an RSC (React Server Component) with Suspense boundary and fallback UI to demonstrate streaming patterns in the Next.js App Router example app.

## Requirements

From issue #210:
- Create `app/streaming/page.tsx` - Page with Suspense wrapper
- Create `app/streaming/slow-products.tsx` - Async Server Component
- Create `tests/playwright/streaming.spec.ts` - Streaming behavior tests
- **TDD Required:** Write tests FIRST, then implementation

## Architecture Analysis

### Existing Patterns Used

1. **RSC Pattern** (from `/app/products/page.tsx`):
   - Async server component fetches from external API
   - Uses `getScenaristHeadersFromReadonlyHeaders()` to pass test ID
   - Returns rendered HTML directly

2. **Sequence Pattern** (from `/app/polling/page.tsx`):
   - Uses `sequence.responses` for multiple fetch states
   - `repeat: "last"` to maintain final state

3. **Test Pattern** (from `/tests/playwright/products-server-components.spec.ts`):
   - Uses `switchScenario` fixture
   - Verifies rendered output from server components

### Design Decisions

1. **Suspense Boundary Location**: In page.tsx wrapping the slow async component
2. **Slow Component**: Separate file (`slow-products.tsx`) for clarity
3. **Fallback UI**: Inline skeleton in page.tsx (consistent with React patterns)
4. **API Simulation**: Use existing `/products` endpoint with scenario that has artificial delay simulation via MSW delay

## Implementation Plan

### Phase 1: Test Infrastructure ✅
- [x] 1.1 Create playwright test file with initial smoke test

### Phase 2: Scenario Setup ✅
- [x] 2.1 Add `streamingScenario` to scenarios.ts with products response
- [x] 2.2 Add scenario ID to type definitions

### Phase 3: Page Implementation ✅
- [x] 3.1 Create `app/streaming/page.tsx` with Suspense boundary
- [x] 3.2 Create `app/streaming/slow-products.tsx` async server component
- [x] 3.3 Add navigation link in layout.tsx

### Phase 4: Streaming Behavior Tests ✅
- [x] 4.1 Test that fallback UI shows during loading
- [x] 4.2 Test that products render after Suspense resolves
- [x] 4.3 Test tier-specific rendering (premium vs standard)

### Phase 5: Documentation & Cleanup ✅
- [x] 5.1 Add explanatory comments to page demonstrating streaming
- [x] 5.2 Update this plan document

## Test Strategy

### Test 1: Fallback UI Visibility
```typescript
test("shows loading skeleton while products load", async ({ page, switchScenario }) => {
  await switchScenario(page, "streaming");
  // Navigate and immediately check for fallback
  await page.goto("/streaming");
  // Verify skeleton/loading state visible
});
```

### Test 2: Products Render After Suspense
```typescript
test("renders products after suspense boundary resolves", async ({ page, switchScenario }) => {
  await switchScenario(page, "streaming");
  await page.goto("/streaming");
  // Wait for products to appear
  await expect(page.getByRole("article")).toHaveCount(3);
});
```

### Test 3: Tier-specific Rendering
```typescript
test("shows premium products for premium tier", async ({ page, switchScenario }) => {
  await switchScenario(page, "streamingPremiumUser");
  await page.goto("/streaming?tier=premium");
  // Verify premium pricing
});
```

## Files to Create/Modify

### New Files
1. `apps/nextjs-app-router-example/app/streaming/page.tsx`
2. `apps/nextjs-app-router-example/app/streaming/slow-products.tsx`
3. `apps/nextjs-app-router-example/tests/playwright/streaming.spec.ts`

### Modified Files
1. `apps/nextjs-app-router-example/lib/scenarios.ts` - Add streaming scenarios
2. `apps/nextjs-app-router-example/app/layout.tsx` - Add nav link

## Progress Log

### 2024-12-08

**Commit 1: Add streaming test file with initial smoke test (RED)**
- Created `streaming.spec.ts` with first failing test
- Test expects streaming page to exist with heading

**Commit 2: Add streaming scenario (RED → GREEN prep)**
- Added `streaming` scenario to scenarios.ts
- Added type definition for new scenario ID

**Commit 3: Create streaming page with Suspense (GREEN)**
- Created `page.tsx` with Suspense boundary and fallback
- Created `slow-products.tsx` async server component
- Added navigation link to layout

**Commit 4: Add test for products rendering after Suspense (GREEN)**
- Added test verifying products appear after Suspense resolves
- Verified 3 products render correctly

**Commit 5: Add tier-specific streaming tests**
- Added `streamingPremiumUser` scenario
- Added test for premium tier products with premium pricing
- Both scenarios working correctly

**Commit 6: Add fallback visibility test**
- Added test that explicitly verifies loading state shows initially
- Uses `waitForLoadState("domcontentloaded")` to catch initial HTML
- Verifies loading indicator disappears when products appear

**Final Status: COMPLETE**
- All tests passing
- Streaming/Suspense pattern fully demonstrated
- Premium tier variant working
- Fallback UI verified

## Technical Notes

### Why Suspense with RSC?
React Server Components support streaming out of the box. When you wrap an async component in `<Suspense>`, React streams the fallback immediately while the async component resolves. This creates a better UX than showing nothing.

### MSW Delay Simulation
MSW supports `delay()` in handlers, but for this example we don't need artificial delays. The point is demonstrating the Suspense boundary pattern, which works regardless of actual response time. Tests verify:
1. The structural pattern (Suspense boundary exists)
2. The behavior (products eventually render)
3. The integration (Scenarist headers flow through)

### Test ID Propagation in Streaming
The key challenge with RSC streaming is ensuring the test ID propagates through async boundaries. Our implementation uses `getScenaristHeadersFromReadonlyHeaders()` at the point of fetch, ensuring each test's requests are isolated.
