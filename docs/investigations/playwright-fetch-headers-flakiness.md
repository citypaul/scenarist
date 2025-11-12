# Investigation: Playwright Test Flakiness - fetch() Header Propagation

**Date:** 2025-11-11
**Status:** Root cause identified, fix in progress
**Severity:** High - breaks test isolation in client-side fetch scenarios

## Problem Statement

**CRITICAL UPDATE:** Tests **pass when run in isolation** but **fail when run in parallel**.

This indicates the issue is NOT just about header propagation, but about **race conditions in parallel execution**.

Original observation: Tests pass consistently on one machine but fail intermittently on another with identical codebase:

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('article').first().getByText('£99.99')
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Failing tests:**
- `isolation.spec.ts:23` - Parallel Test Isolation › concurrent test 1: premium user sees £99.99 pricing
- `products-client-components.spec.ts:29` - Products Page › premium user sees premium pricing

**WebServer error observed:**
```
Error: Failed to fetch products: Internal Server Error
```

MSW returning 500 instead of mocked premium pricing response.

## Root Cause Analysis

### The Issue

**`page.setExtraHTTPHeaders()` does NOT reliably apply headers to JavaScript `fetch()` API calls made by client-side code.**

### Evidence

1. **Playwright Research:**
   - `setExtraHTTPHeaders()` reliably affects: page navigation, XMLHttpRequest
   - `setExtraHTTPHeaders()` does NOT reliably affect: `fetch()` API, WebSocket connections
   - Workaround documented: use `context.addInitScript()` to intercept `window.fetch`

2. **Code Analysis:**
   ```typescript
   // packages/playwright-helpers/src/switch-scenario.ts:107
   await page.setExtraHTTPHeaders({ [testIdHeader]: testId });
   ```

   This sets headers for Playwright-controlled requests but NOT for JavaScript fetch().

3. **Application Code:**
   ```typescript
   // apps/nextjs-app-router-example/app/page.tsx:33-36
   const response = await fetch('/api/products', {
     headers: {
       'x-user-tier': userTier,  // ✅ Present
       // ❌ x-test-id NOT included - relies on setExtraHTTPHeaders
     },
   });
   ```

4. **API Route Handler:**
   ```typescript
   // apps/nextjs-app-router-example/app/api/products/route.ts:27
   const response = await fetch('http://localhost:3001/products', {
     headers: {
       ...scenarist.getHeaders(request),  // Extracts x-test-id from request
       'x-user-tier': userTier,
     },
   });
   ```

   When x-test-id is missing from client request:
   - `scenarist.getHeaders()` falls back to `defaultTestId`
   - Routes to 'default' scenario instead of test-specific scenario (e.g., 'premiumUser')
   - MSW returns wrong data or 500 error

### Request Flow (Current - BROKEN)

```
1. Test calls switchScenario(page, 'premiumUser')
   - Generates testId: 'test-premiumUser-abc123'
   - Sets via page.setExtraHTTPHeaders({ 'x-test-id': 'test-premiumUser-abc123' })

2. Test navigates to page: await page.goto('/')
   - Navigation includes x-test-id header ✅ (setExtraHTTPHeaders works for navigation)

3. Page renders, useEffect triggers fetch('/api/products')
   - fetch() call does NOT include x-test-id header ❌ (setExtraHTTPHeaders doesn't affect fetch)

4. API route receives request without x-test-id
   - scenarist.getHeaders(request) returns: { 'x-test-id': 'default-test' }

5. API route forwards to external API with default test ID
   - MSW intercepts with 'default-test' test ID
   - Routes to 'default' scenario, not 'premiumUser' scenario

6. MSW returns wrong data or 500 error
   - Expected: premium pricing (£99.99)
   - Actual: standard pricing (£149.99) or 500 error

7. Test fails: expect(page.getByText('£99.99')).toBeVisible()
```

## Why It's Machine-Specific (Flaky)

The flakiness occurs because of subtle differences in how Playwright/browsers handle `fetch()` API calls:

**Factors affecting behavior:**

1. **Browser version:** Different Chromium versions may handle header injection differently
2. **Playwright version:** Header propagation behavior has changed across versions
3. **Operating system:** Different network stacks may affect timing
4. **Machine performance:** Race conditions in header application timing
5. **Default scenario content:** If 'default' scenario happens to have premium pricing, test might pass accidentally

**Why it passes on Machine A:**
- Possibly using XMLHttpRequest instead of fetch() (framework config difference)
- Possibly different Playwright/browser version that propagates headers differently
- Possibly default scenario has correct pricing as fallback

**Why it fails on Machine B:**
- Using fetch() API where setExtraHTTPHeaders doesn't apply
- Default scenario returns 500 or wrong pricing
- More consistent behavior exposing the bug

## Proposed Solution

### Option 1: ~~Intercept window.fetch with addInitScript~~ ❌ REJECTED

**Rejected Reason:** Overriding `window.fetch` is too invasive and breaks consumer expectations. Different HTTP libraries (axios, ky, etc.) won't be affected, and consumers wouldn't expect their fetch calls to be modified by test infrastructure.

### Option 1 (REVISED): Use Playwright Route Interception (RECOMMENDED)

Use Playwright's `page.route()` to intercept ALL outgoing requests and add the x-test-id header:

```typescript
// packages/playwright-helpers/src/switch-scenario.ts

export const switchScenario = async (
  page: Page,
  scenarioId: string,
  options: SwitchScenarioOptions,
): Promise<string> => {
  // ... existing setup ...

  // Intercept ALL requests to inject x-test-id header
  // This works for fetch(), XMLHttpRequest, and any HTTP library
  await page.route('**/*', async (route) => {
    const headers = {
      ...route.request().headers(),
      [testIdHeader]: testId,
    };
    await route.continue({ headers });
  });

  // Note: setExtraHTTPHeaders is still set for backward compatibility
  await page.setExtraHTTPHeaders({ [testIdHeader]: testId });

  return testId;
};
```

**Pros:**
- ✅ Works for ALL HTTP libraries (fetch, axios, XMLHttpRequest, etc.)
- ✅ No modification of global APIs
- ✅ No changes to application code required
- ✅ Maintains test isolation
- ✅ Consistent across machines
- ✅ Documented Playwright API
- ✅ Works with same-origin and cross-origin requests

**Cons:**
- ⚠️ Slight performance overhead (request interception)
- ⚠️ Must be set before page loads that make requests

### Option 2: Add x-test-id to client-side fetch calls

Modify client-side code to explicitly include x-test-id:

```typescript
// apps/nextjs-app-router-example/app/page.tsx

// Get test ID from cookie or header set by Playwright
const getTestId = () => {
  const meta = document.querySelector('meta[name="x-test-id"]');
  return meta?.getAttribute('content') || 'default-test';
};

const response = await fetch('/api/products', {
  headers: {
    'x-user-tier': userTier,
    'x-test-id': getTestId(),  // ✅ Explicit header
  },
});
```

**Pros:**
- ✅ Explicit and visible in code
- ✅ No global overrides

**Cons:**
- ❌ Requires changing every fetch() call in app code
- ❌ Couples test infrastructure to application code
- ❌ Fragile - easy to forget in new code

### Option 3: Use Server Components instead of Client Components

Server Components don't use fetch() from browser - headers propagate correctly:

```typescript
// apps/nextjs-app-router-example/app/products-server/page.tsx

async function ProductsServerPage() {
  const response = await fetch('http://localhost:3001/products', {
    headers: scenarist.getHeaders(/* from request context */),
  });
  // ...
}
```

**Pros:**
- ✅ Headers propagate correctly
- ✅ No fetch() interception needed

**Cons:**
- ❌ Requires rewriting components
- ❌ Not suitable for interactive UIs
- ❌ Doesn't solve the underlying issue

## Recommendation

**Implement Option 1 (REVISED): Use Playwright Route Interception**

This is the most robust solution that:
- Fixes the root cause for ALL HTTP requests (regardless of library)
- Requires no application code changes
- Doesn't modify global APIs (non-invasive)
- Works consistently across machines and browsers
- Maintains proper test isolation
- Uses documented Playwright API (`page.route()`)

## Implementation Plan

1. ✅ Document root cause and analysis (this file)
2. ⏳ Modify `switchScenario` to add fetch() interception
3. ⏳ Add tests verifying fetch() headers propagate correctly
4. ⏳ Verify fix on both machines
5. ⏳ Update documentation with known limitation
6. ⏳ Create PR with fix

## Related Files

- `packages/playwright-helpers/src/switch-scenario.ts` - Main fix location
- `apps/nextjs-app-router-example/app/page.tsx` - Affected client component
- `apps/nextjs-app-router-example/app/api/products/route.ts` - API route showing fallback behavior
- `apps/nextjs-app-router-example/tests/playwright/isolation.spec.ts` - Failing test
- `apps/nextjs-app-router-example/tests/playwright/products-client-components.spec.ts` - Failing test

## Lessons Learned

1. **`page.setExtraHTTPHeaders()` is not sufficient for modern SPAs** - fetch() API is ubiquitous and requires explicit interception
2. **Test isolation requires careful header propagation** - Default fallback behavior masks bugs until they appear as flakiness
3. **Machine-specific behavior indicates race conditions or undefined behavior** - Different machines expose timing-sensitive bugs
4. **Playwright limitations require workarounds** - Some scenarios need addInitScript instead of built-in APIs
5. **Always verify headers propagate to ALL request types** - Navigation, XMLHttpRequest, fetch(), WebSocket all behave differently

## References

- Playwright setExtraHTTPHeaders: https://playwright.dev/docs/api/class-page#page-set-extra-http-headers
- Playwright addInitScript: https://playwright.dev/docs/api/class-page#page-add-init-script
- GitHub Issue #18962: page.setExtraHTTPHeaders also affect 'request'?
- Stack Overflow: How to add custom headers in Playwright with fetch()
