## Next.js Pages Router: MSW with getServerSideProps - Complete Investigation

**Date:** 2025-11-12
**Status:** Under Investigation - Root Cause Identified
**Context:** Implementing Playwright tests for Next.js Pages Router with getServerSideProps calling external APIs directly

### Background

The goal is to prove MSW can intercept external API calls made from getServerSideProps in Next.js Pages Router, similar to how it works with App Router (React Server Components). The test should verify that tier-based pricing works when getServerSideProps fetches directly from `http://localhost:3001/products`.

### Expected Behavior

**What should happen:**
1. Playwright test navigates to `/?tier=premium`
2. Next.js runs getServerSideProps on the server
3. getServerSideProps extracts `tier` query param and adds `'x-user-tier': 'premium'` header
4. Fetches from `http://localhost:3001/products` with premium tier header
5. MSW intercepts the request
6. MSW matches against premiumUserScenario mock (specificity > 0)
7. Returns premium pricing: Product A £99.99, Product B £149.99, Product C £79.99
8. Page renders with premium prices

### Actual Behavior

**What's actually happening:**
1. Playwright test navigates to `/?tier=premium`
2. Page loads and products render
3. BUT products show STANDARD pricing: Product A £149.99, Product B £199.99, Product C £99.99
4. Test fails expecting £99.99 but sees £149.99

### Root Cause Analysis

#### Investigation Timeline

**Step 1: Manual Testing**
Created `/tmp/test-msw.sh` to test with curl:
```bash
curl -s -H "x-scenarist-test-id: test-premium" -H "x-user-tier: premium" "http://localhost:3000/?tier=premium" | grep -o "£[0-9.]\+"
```

**Result:** ✅ SUCCESS - Returns £99.99 (premium pricing)

**Conclusion:** MSW CAN intercept getServerSideProps fetches. The issue is Playwright-specific.

**Step 2: Examined Playwright Error Context**
Playwright's error-context.md shows the page snapshot:
```yaml
- article [ref=e26]:
  - generic [ref=e31]: £149.99   ← STANDARD price (expected £99.99)
  - generic [ref=e32]: standard   ← STANDARD tier
- article [ref=e34]:
  - generic [ref=e39]: £199.99   ← STANDARD price (expected £149.99)
  - generic [ref=e40]: standard   ← STANDARD tier
- article [ref=e42]:
  - generic [ref=e47]: £99.99    ← STANDARD price (expected £79.99)
  - generic [ref=e48]: standard   ← STANDARD tier
```

**Key Finding:** Products ARE rendering, but with STANDARD pricing instead of PREMIUM pricing.

**Step 3: Traced Scenario Configuration**

Examined `lib/scenarios.ts`:

**Default Scenario (always active):**
```typescript
export const defaultScenario: ScenaristScenario = {
  id: "default",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {  // Fallback with NO match criteria (specificity = 0)
        status: 200,
        body: { products: buildProducts("standard") },
      },
    },
  ],
};
```

**Premium User Scenario (NOT active in test):**
```typescript
export const premiumUserScenario: ScenaristScenario = {
  id: "premiumUser",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {  // WITH match criteria (specificity = 1)
        headers: { "x-user-tier": "premium" },
      },
      response: {
        status: 200,
        body: { products: buildProducts("premium") },
      },
    },
  ],
};
```

**Step 4: Analyzed Test Code**

The failing test:
```typescript
test('should render premium products server-side', async ({ page }) => {
  // DON'T switch scenarios - rely on automatic default fallback + header matching
  // Default scenario is active, premium mock matches via x-user-tier header

  console.log('[TEST] Testing premium products WITHOUT explicit scenario switch');
  console.log('[TEST] Relying on automatic default fallback + header matching');

  await page.goto('/?tier=premium');

  const firstProduct = page.getByRole('article').first();
  await expect(firstProduct.getByText('£99.99')).toBeVisible();
});
```

**Critical Issue:** Test does NOT switch to premiumUserScenario!

### THE ROOT CAUSE

**The test has a fundamental misunderstanding of how automatic default fallback works.**

**How Automatic Default Fallback Actually Works:**
1. When you switch to scenario X, MSW collects mocks from BOTH:
   - Default scenario (collected first)
   - Scenario X (collected second)
2. Specificity-based selection chooses the best match
3. Specific mocks (with match criteria) override fallback mocks

**What the test is doing:**
1. NOT switching scenarios
2. Only default scenario is active
3. Default scenario only has standard pricing fallback (no match criteria)
4. No premium mock exists in active scenario collection
5. MSW returns standard pricing

**What the test THINKS it's doing:**
- Expecting ALL scenarios to be merged automatically
- Expecting premium mock to be available without switching
- Misunderstanding "automatic default fallback" as "all scenarios always active"

**Why manual curl works:**
```bash
curl -H "x-scenarist-test-id: test-premium" ...
```
The `-H "x-scenarist-test-id: test-premium"` header likely triggers scenario switching via some other mechanism (not shown in test code), which activates premiumUserScenario.

### Pricing Reference

**Premium Prices (buildProducts("premium")):**
- Product A (id=1): £99.99
- Product B (id=2): £149.99
- Product C (id=3): £79.99

**Standard Prices (buildProducts("standard")):**
- Product A (id=1): £149.99
- Product B (id=2): £199.99
- Product C (id=3): £99.99

**Test expectation:** Product A £99.99 (premium)
**Actual result:** Product A £149.99 (standard)

### Solution Options

#### Option 1: Switch to Premium Scenario (Recommended)

```typescript
test('should render premium products server-side', async ({ page, switchScenario }) => {
  // Switch to premiumUserScenario FIRST
  await switchScenario(page, 'premiumUser');

  // Now navigate - automatic default fallback will combine:
  // - Default scenario mocks (collected first)
  // - Premium scenario mocks (collected second, includes premium match)
  await page.goto('/?tier=premium');

  const firstProduct = page.getByRole('article').first();
  await expect(firstProduct.getByText('£99.99')).toBeVisible();
});
```

**Why this works:**
- Explicitly activates premiumUserScenario
- Automatic default fallback combines default + premium mocks
- Premium mock has specificity 1 (header match)
- Default mock has specificity 0 (no match)
- Specificity-based selection chooses premium mock

#### Option 2: Merge Premium Mock into Default Scenario

```typescript
export const defaultScenario: ScenaristScenario = {
  id: "default",
  mocks: [
    // Specific match for premium tier (specificity = 1)
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {
        headers: { "x-user-tier": "premium" },
      },
      response: {
        status: 200,
        body: { products: buildProducts("premium") },
      },
    },
    // Fallback for all other requests (specificity = 0)
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {
        status: 200,
        body: { products: buildProducts("standard") },
      },
    },
  ],
};
```

**Why this works:**
- Both mocks always present in default scenario
- No scenario switching needed
- Specificity-based selection chooses premium when header matches
- Falls back to standard when header doesn't match

**Trade-off:** Defeats the purpose of having separate scenarios. Better for simple use cases.

### Files Involved

**Test file:**
- `/apps/nextjs-pages-router-example/tests/playwright/products-server-side.spec.ts`

**Scenario definitions:**
- `/apps/nextjs-pages-router-example/lib/scenarios.ts`

**Product data:**
- `/apps/nextjs-pages-router-example/data/products.ts`

**getServerSideProps implementation:**
- `/apps/nextjs-pages-router-example/pages/index.tsx:178-220`

**MSW setup:**
- `/apps/nextjs-pages-router-example/lib/scenarist.ts` (auto-start)
- `/apps/nextjs-pages-router-example/tests/playwright/globalSetup.ts` (Playwright config)

**Manual test script:**
- `/tmp/test-msw.sh`

### Key Learnings

1. **Automatic Default Fallback ≠ All Scenarios Active**
   - Only applies when you switch to a specific scenario
   - Combines default + active scenario mocks
   - Does NOT merge all scenarios automatically

2. **Scenario Switching is Required**
   - Tests must explicitly switch to target scenario
   - Cannot rely on all mocks being available by default
   - Use `switchScenario(page, 'scenarioId')` before navigation

3. **Manual curl vs Playwright**
   - Manual curl with explicit headers can bypass scenario system
   - Playwright tests must follow scenario switching protocol
   - Different behavior because different entry points

4. **MSW IS Working**
   - Manual test proves MSW intercepts getServerSideProps fetches
   - Issue is test configuration, not MSW functionality
   - Architectural pattern is sound

5. **Specificity-Based Selection is Correct**
   - Premium mock (specificity 1) should override standard fallback (specificity 0)
   - But only if premium mock is in the active scenario collection
   - No mock = falls back to next available mock

### Next Steps

1. ✅ **Root cause identified** - Test not switching to premiumUserScenario
2. ⏳ **Fix test** - Add `switchScenario(page, 'premiumUser')` before navigation
3. ⏳ **Verify fix** - Confirm test passes with premium pricing
4. ⏳ **Update test comments** - Correct misunderstanding about automatic fallback
5. ⏳ **Document pattern** - Add to testing guidelines for Pages Router

### Architectural Validation

**This investigation VALIDATES the architectural decisions:**

✅ **MSW CAN intercept getServerSideProps fetches** - Proven by manual test
✅ **Specificity-based selection works correctly** - Premium > Standard when both present
✅ **Automatic default fallback works as designed** - Combines default + active scenario
✅ **Test ID isolation works** - Different tests can use different scenarios
✅ **No custom Express server needed** - Standard Next.js with MSW in lib/scenarist.ts
✅ **Dynamic handler pattern works** - Single handler with internal scenario lookup

**The only issue is test configuration, not architecture.**

### Debug Commands

**Run single test:**
```bash
cd apps/nextjs-pages-router-example
pnpm exec playwright test tests/playwright/products-server-side.spec.ts --grep "premium"
```

**Manual test (known working):**
```bash
cd apps/nextjs-pages-router-example
pnpm dev > /tmp/nextjs.log 2>&1 &
PID=$!
sleep 8
curl -s -H "x-scenarist-test-id: test-premium" -H "x-user-tier: premium" "http://localhost:3000/?tier=premium" | grep -o "£[0-9.]\+" | head -3
kill $PID
```

**Check MSW logs:**
```bash
cat /tmp/nextjs.log | grep -E '\[MSW\]|\[Scenarist\]|\[getServerSideProps\]'
```

**View Playwright error context:**
```bash
find apps/nextjs-pages-router-example/test-results -name "error-context.md" | head -1 | xargs cat
```

### Conclusion (RESOLVED 2025-11-12)

**Status:** ✅ FIXED - Multiple Store Instances Due to Next.js HMR

**Root Cause:** Next.js dev mode with Hot Module Replacement (HMR) loaded the `lib/scenarist.ts` module multiple times, causing `createScenarist()` to be called multiple times. Each call created new instances of `InMemoryScenarioStore`, resulting in scenarios being stored in one instance while lookups happened in different instances.

**Evidence from ScenarioStore logging:**
```
[ScenarioStore.set] Store now has 1 scenarios
[ScenarioStore.get] Store has 0 scenarios  ← Different instance!
[ScenarioStore.get] Store has 1 scenarios  ← Back to first instance
[ScenarioStore.get] Store has 0 scenarios  ← Different instance again!
```

The store alternated between empty (0 scenarios) and populated (1 scenario), proving multiple instances existed and were being hit in rotation.

**The Fix:** Added singleton guards to Pages Router adapter (`packages/nextjs-adapter/src/pages/setup.ts`):
1. **Global singleton stores:** `__scenarist_registry_pages`, `__scenarist_store_pages`
2. **Global instance cache:** `__scenarist_instance_pages`
3. **Early return:** If instance already exists, return cached instance
4. **MSW start guard:** Prevent duplicate `server.listen()` calls

This ensures all module instances share the same stores and MSW server, even when Next.js HMR loads the module multiple times.

**Result:** ✅ Test passes consistently - Premium pricing displays correctly (£99.99)

**Files Modified:**
- `packages/nextjs-adapter/src/pages/setup.ts` - Added singleton pattern
- `packages/core/src/adapters/in-memory-store.ts` - Added temporary debug logging (removed after fix confirmed)

**Lesson:** Next.js adapters MUST use singleton patterns for stores and MSW servers to handle HMR module reloading.

### NEW DISCOVERY (2025-11-12 continued):

**Critical Finding:** Server-side console.log statements are NOT appearing in Playwright test output.

This means:
- `[getHeaders]` logs - NOT visible
- `[getServerSideProps]` logs - NOT visible
- `[MSW]` logs - NOT visible

**This prevents us from seeing:**
1. Whether getServerSideProps is even running
2. What headers are being extracted
3. What testId is being used
4. Whether MSW is intercepting the fetch call

**Hypothesis:** Playwright doesn't capture server-side console output by default. We need to:
1. Either capture Next.js server logs separately
2. Or use a different debugging approach (network inspection, MSW event logging to file)

**Next Step:** Run test with Next.js dev server logs captured separately to see what's actually happening server-side.

---

## Server Log Analysis (2025-11-12)

### Complete Evidence Trail

**1. Scenario Successfully Activated:**
```
[Scenario Endpoint POST] Switching scenario
[Scenario Endpoint POST] testId: 7303a536b19f9ee3cc0a-69ce08d219d2e1cd4cff-94f94aa5-ab97-4750-ac5c-2767efdc93a8
[Scenario Endpoint POST] scenarioId: premiumUser
[Scenario Endpoint POST] Result: SUCCESS
[Scenario Endpoint POST] Scenario is now active for test ID: 7303a536b19f9ee3cc0a...
POST /api/__scenario__ 200 in 204ms
```

**2. getServerSideProps Receives Correct Headers:**
```
[getHeaders] headerName: x-scenarist-test-id
[getHeaders] headerValue from request: 7303a536b19f9ee3cc0a-69ce08d219d2e1cd4cff-94f94aa5-ab97-4750-ac5c-2767efdc93a8
[getHeaders] resolved testId: 7303a536b19f9ee3cc0a...
[getServerSideProps] About to fetch products with headers: {
  'x-scenarist-test-id': '7303a536b19f9ee3cc0a-69ce08d219d2e1cd4cff-94f94aa5-ab97-4750-ac5c-2767efdc93a8',
  'x-user-tier': 'premium'
}
[getServerSideProps] tier param: premium
```

**3. MSW Intercepts But Fails Scenario Lookup:**
```
[MSW] Request intercepted: GET http://localhost:3001/products
[MSW] Intercepted request: GET http://localhost:3001/products
[MSW] testId extracted: 7303a536b19f9ee3cc0a-69ce08d219d2e1cd4cff-94f94aa5-ab97-4750-ac5c-2767efdc93a8
[MSW] activeScenario: undefined  ← THE BUG
[MSW] scenarioId to use: default  ← Falls back instead of using premiumUser
[MSW] request headers: {
  'x-scenarist-test-id': '7303a536b19f9ee3cc0a-69ce08d219d2e1cd4cff-94f94aa5-ab97-4750-ac5c-2767efdc93a8',
  'x-user-tier': 'premium'
}
[MSW] Number of mocks to evaluate: 1  ← Only default scenario mocks (should be default + premiumUser)
```

**4. Request Counts:**
```
Tier parameter breakdown:
- tier param: standard - 3 occurrences (wrong)
- tier param: premium - 1 occurrence (correct but scenario lookup failed)
```

### The Bug Location

**File:** `internal/msw-adapter/src/handlers/dynamic-handler.ts` (or wherever MSW calls `getActiveScenario`)

**Code flow:**
1. Request intercepted with testId: `7303a536b19f9ee3cc0a...`
2. Calls `manager.getActiveScenario(testId)`
3. Returns `undefined` (should return `{ scenarioId: 'premiumUser', variantName: undefined }`)
4. Falls back to default scenario
5. Only evaluates 1 mock (default fallback) instead of 2 (default + premiumUser)

### Key Questions to Answer

1. **Is scenario being stored?** 
   - Does `switchScenario()` actually call `store.set(testId, activeScenario)`?
   - Add logging to InMemoryScenarioStore.set()

2. **Is testId exact match required?**
   - Could there be whitespace/encoding differences?
   - Log the exact bytes/length of testId in both places

3. **Are there multiple store instances?**
   - Different Next.js processes/workers?
   - Singleton pattern not working?

4. **Is there a race condition?**
   - Scenario stored after MSW handler runs?
   - Timing suggests no (200ms between switch and fetch)

### Next Debugging Steps

1. Add logging to `InMemoryScenarioStore`:
   ```typescript
   set(testId: string, scenario: ActiveScenario): void {
     console.log('[ScenarioStore.set] Storing scenario for testId:', testId);
     console.log('[ScenarioStore.set] Scenario:', scenario);
     this.scenarios.set(testId, scenario);
   }

   get(testId: string): ActiveScenario | undefined {
     console.log('[ScenarioStore.get] Looking up testId:', testId);
     console.log('[ScenarioStore.get] Current keys:', Array.from(this.scenarios.keys()));
     const result = this.scenarios.get(testId);
     console.log('[ScenarioStore.get] Result:', result);
     return result;
   }
   ```

2. Run test again with logging
3. Compare testIds to see if they match exactly
4. Check if scenario is being stored at all

### Files to Investigate

- `packages/core/src/adapters/in-memory-scenario-store.ts` - The store implementation
- `packages/core/src/domain/scenario-manager.ts` - The switchScenario implementation
- `internal/msw-adapter/src/handlers/dynamic-handler.ts` - Where getActiveScenario is called
- `packages/nextjs-adapter/src/pages/setup.ts` - The switchScenario wrapper
