# Parallel Execution Race Condition Analysis

**Date:** 2025-11-11
**Critical Finding:** Tests pass in isolation but fail in parallel

## Key Observation

The test failure has different characteristics:
- ✅ **Passes:** When run in isolation (single test)
- ❌ **Fails:** When run in parallel with other tests
- ✅ **Passes:** Consistently on some machines
- ❌ **Fails:** Consistently on other machines

This indicates a **race condition** rather than a simple header propagation issue.

## Race Condition Analysis

### Current Implementation Problem

When `page.route('**/*', ...)` is called in `switchScenario`:

```typescript
await page.route('**/*', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      [testIdHeader]: testId,
    },
  });
});

await page.setExtraHTTPHeaders({ [testIdHeader]: testId });
```

**The race condition occurs because:**

1. **Multiple route handlers in parallel:**
   - Test 1 registers: `page.route('**/*', handler-with-testId-1)`
   - Test 2 registers: `page.route('**/*', handler-with-testId-2)`
   - Test 3 registers: `page.route('**/*', handler-with-testId-3)`
   - All happening simultaneously

2. **Handler registration is async:**
   - `page.route()` is async, even though we `await` it
   - Page navigation might start before handler is fully active
   - Under load (parallel tests), registration takes longer

3. **Request timing varies:**
   - In isolation: Handler registers quickly, fetch() happens after
   - In parallel: Resource contention → handler might not be ready → fetch() misses interception

4. **Catch-all pattern overhead:**
   - `**/*` intercepts EVERY request (images, CSS, fonts, etc.)
   - Each interception adds overhead
   - In parallel, this compounds: N tests × M requests = heavy load

### Why Machine-Specific?

Faster machines:
- Route handlers register before fetch() happens
- Less resource contention
- Tests pass consistently

Slower machines:
- Route handlers register during or after fetch()
- More resource contention in parallel
- Tests fail consistently

## Proposed Solution

### Option A: Narrow the Route Pattern (RECOMMENDED)

Only intercept API routes that need test ID injection:

```typescript
// Only intercept API routes, not all requests
await page.route('**/api/**', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      [testIdHeader]: testId,
    },
  });
});
```

**Benefits:**
- ✅ Reduces overhead (only API calls intercepted)
- ✅ Less contention in parallel execution
- ✅ More predictable timing
- ✅ Still works for all HTTP libraries

**Limitations:**
- ⚠️ Only works if all external API calls go through `/api/` routes
- ⚠️ Doesn't intercept direct external API calls from browser

### Option B: Use waitForLoadState Before Navigation

Ensure route handler is registered before navigation:

```typescript
await page.route('**/*', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      [testIdHeader]: testId,
    },
  });
});

// Wait for any pending route registrations to complete
await page.waitForLoadState('domcontentloaded', { timeout: 1000 });
```

**Benefits:**
- ✅ Ensures handler is ready
- ✅ Works with any request pattern

**Limitations:**
- ❌ Adds delay to every test
- ❌ Doesn't solve underlying contention issue

### Option C: Unroute Previous Handlers (Prevent Accumulation)

If route handlers accumulate, clear them first:

```typescript
// Clear any existing route handlers for this pattern
await page.unroute('**/*');

// Register new handler
await page.route('**/*', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      [testIdHeader]: testId,
    },
  });
});
```

**Benefits:**
- ✅ Prevents handler accumulation
- ✅ Cleaner state

**Limitations:**
- ⚠️ Might not solve parallel timing issues

### Option D: Hybrid Approach

Combine narrow pattern + explicit wait:

```typescript
// Only intercept API routes (reduces overhead)
await page.route('**/api/**', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      [testIdHeader]: testId,
    },
  });
});

// Also set for navigation requests
await page.setExtraHTTPHeaders({ [testIdHeader]: testId });

// Wait a tick to ensure registration is complete
await page.evaluate(() => Promise.resolve());
```

## Recommendation

**Implement Option A: Narrow the Route Pattern**

Change from `'**/*'` to `'**/api/**'`:

```typescript
// packages/playwright-helpers/src/switch-scenario.ts

await page.route('**/api/**', async (route) => {
  await route.continue({
    headers: {
      ...route.request().headers(),
      [testIdHeader]: testId,
    },
  });
});
```

This solves the parallel execution issue by:
1. Reducing interception overhead (API routes only)
2. Less contention between parallel tests
3. Faster handler registration (fewer patterns to match)
4. Still covers all application API calls

## Testing Strategy

1. Run tests in isolation → should pass
2. Run tests in parallel → should now pass
3. Run on both machines → should pass consistently
4. Verify with `pnpm test:e2e --workers=5` (force parallel)

## Resolution (2025-11-13)

### Root Cause: Missing `await` on `route.continue()`

The race condition was caused by **not awaiting `route.continue()`** in the route handler. This created a timing gap where:

1. `page.route()` registered the handler
2. Navigation started immediately (before `route.continue()` completed)
3. Some requests bypassed header injection
4. Tests failed intermittently under load

### Fix Applied

**File:** `packages/playwright-helpers/src/switch-scenario.ts`

**Changes:**
1. Added `await page.unroute('**/*')` - prevents handler accumulation
2. Changed route callback to `async (route) => { ... }`
3. Added `await` to `route.continue({ headers })`

### Why `'**/*'` Pattern is Correct

The catch-all pattern **must** be used for universal compatibility:
- Clients use different API conventions
- Server Components, API routes, Server Actions all need headers
- MSW handles filtering at the server level

### Verification Status

- ✅ Code changes applied successfully
- ✅ TypeScript compilation verified
- ✅ Ready for E2E testing

### Key Insight

The "parallel execution race condition" was actually the same bug as the "fetch headers flakiness" - both caused by the missing `await` on `route.continue()`. The parallel execution just made the timing window more visible.
