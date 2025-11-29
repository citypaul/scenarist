# Next.js Pages Router MSW Integration - Current Status

**Last Updated:** 2025-11-12
**Branch:** fix/playwright-test-flakiness
**Files Preserved:**

- `/docs/investigations/next-js-pages-router-msw-investigation.md` - Detailed investigation
- `/docs/investigations/next-js-pages-router-status.md` - This file (current status)
- CLAUDE.md (section appended at end)

## Quick Summary

**Goal:** Prove MSW can intercept external API calls from Next.js Pages Router `getServerSideProps` in Playwright tests.

**Current Status:** ⚠️ BLOCKED - Test failing, root cause partially identified

**Manual Test:** ✅ WORKS (curl returns premium pricing £99.99)
**Playwright Test:** ❌ FAILS (shows standard pricing £149.99)

## What We Know

### ✅ Confirmed Working

1. **MSW CAN intercept getServerSideProps fetches** (proven by manual curl test)
2. **Scenarist architecture is sound** (dynamic handler, specificity selection, automatic fallback all work)
3. **Scenario switching works** (POST to `/__scenario__` succeeds)
4. **Test ID injection works** (Playwright route interception injects headers)
5. **getServerSideProps extracts query params** (tier=premium → x-user-tier: premium)

### ❌ Current Issue

**Problem:** Playwright test shows standard pricing even after switching to premiumUserScenario

**Evidence from error context:**

```yaml
- article: Product A
  - price: £149.99  ← STANDARD (expected £99.99 PREMIUM)
  - tier: standard
- article: Product B
  - price: £199.99  ← STANDARD (expected £149.99 PREMIUM)
  - tier: standard
- article: Product C
  - price: £99.99   ← STANDARD (expected £79.99 PREMIUM)
  - tier: standard
```

### 🔍 Investigation Blockers

**Critical Issue:** Server-side console.log output is NOT captured by Playwright

**Missing Information:**

- Whether getServerSideProps is running at all
- What headers getScenaristHeaders() is extracting
- What testId MSW is using
- Whether MSW is intercepting the fetch to localhost:3001/products
- Whether MSW is matching the premium mock or falling back to default

**Debug logs added but not visible:**

- `[getHeaders]` logs in packages/nextjs-adapter/src/pages/setup.ts:128-131
- `[getServerSideProps]` logs in apps/nextjs-pages-router-example/pages/index.tsx:190-191
- `[MSW]` event logs in packages/nextjs-adapter/src/pages/setup.ts:141-150

## Architectural Flow

### Manual Curl (WORKS)

```
1. curl sends: GET http://localhost:3000/?tier=premium
   Headers: x-scenarist-test-id: test-premium, x-user-tier: premium

2. Next.js runs getServerSideProps
   - Extracts tier=premium from query
   - Calls getScenaristHeaders(context.req)
   - Returns { 'x-scenarist-test-id': 'test-premium' }
   - Creates headers: { 'x-scenarist-test-id': 'test-premium', 'x-user-tier': 'premium' }

3. Fetches http://localhost:3001/products with headers

4. MSW intercepts (default scenario active)
   - Collects mocks from default scenario
   - Premium mock matches (specificity 1: x-user-tier header)
   - Returns premium pricing

5. Page renders with £99.99
```

### Playwright Test (FAILS)

```
1. Test calls: await switchScenario(page, 'premiumUser')
   - POST /__scenario__ with testId
   - Scenario switched to premiumUserScenario
   - Route interception injects testId header

2. Test navigates: await page.goto('/?tier=premium')
   - Playwright sends GET with injected testId header
   - Query param: tier=premium

3. Next.js runs getServerSideProps (ASSUMED - not verified)
   - Should extract tier=premium
   - Should call getScenaristHeaders()
   - Should create headers with testId + x-user-tier

4. Should fetch localhost:3001/products (NOT VERIFIED)

5. MSW should intercept (NOT VERIFIED)
   - Should collect mocks from default + premiumUser
   - Should match premium mock (specificity 1)
   - Should return premium pricing

6. ACTUAL: Page shows standard pricing £149.99
```

## Hypotheses (Not Yet Tested)

### Hypothesis 1: getServerSideProps Not Running

**Possible causes:**

- Next.js caching the page
- Playwright navigation not triggering SSR
- Page already rendered by client-side navigation

**How to test:**

- Add file logging in getServerSideProps
- Check Next.js dev server logs separately
- Verify page.goto() triggers server request

### Hypothesis 2: Headers Not Being Forwarded

**Possible causes:**

- getScenaristHeaders() not extracting testId correctly
- Playwright's injected header not reaching Next.js server
- Header name case sensitivity issue

**How to test:**

- Log all incoming headers in getServerSideProps
- Verify testId header is present
- Check header name (x-scenarist-test-id vs X-Test-Id)

### Hypothesis 3: MSW Not Intercepting

**Possible causes:**

- MSW server not started for Playwright tests
- Undici (Next.js 15) interception issue
- Network request bypassing MSW

**How to test:**

- Check MSW server lifecycle in globalSetup
- Add MSW event logging to file
- Verify fetch() is being intercepted

### Hypothesis 4: Wrong Scenario Active

**Possible causes:**

- switchScenario not persisting correctly
- Different Next.js process has different scenario state
- Test ID mismatch between switch and navigation

**How to test:**

- Log active scenario in dynamic handler
- Verify testId matches between steps
- Check scenario state in MSW handler

## Files Modified (This Session)

### Tests

- `/apps/nextjs-pages-router-example/tests/playwright/products-server-side.spec.ts`
  - Added switchScenario call
  - Updated comments to reflect actual behavior
  - Added console capture (but server logs not visible)

### Documentation

- `/Users/paulhammond/personal/scenarist/CLAUDE.md`
  - Appended complete investigation section
- `/docs/investigations/next-js-pages-router-msw-investigation.md`
  - Created comprehensive investigation document
- `/docs/investigations/next-js-pages-router-status.md`
  - This file

### Debug Instrumentation (Already Present)

- `/packages/nextjs-adapter/src/pages/setup.ts:128-131` - getHeaders logging
- `/apps/nextjs-pages-router-example/pages/index.tsx:190-191` - getServerSideProps logging
- `/packages/nextjs-adapter/src/pages/setup.ts:141-150` - MSW event logging

## Next Steps (Priority Order)

### 1. Capture Server-Side Logs ⏳ IN PROGRESS

**Action:** Run Playwright test with separate Next.js dev server log capture

**Command:**

```bash
# Terminal 1: Start Next.js with logging
cd apps/nextjs-pages-router-example
pnpm dev 2>&1 | tee /tmp/nextjs-server.log

# Terminal 2: Run test
pnpm exec playwright test tests/playwright/products-server-side.spec.ts --grep "premium"

# Check logs
cat /tmp/nextjs-server.log | grep -E '\[getHeaders\]|\[getServerSideProps\]|\[MSW\]'
```

**Expected to reveal:**

- Whether getServerSideProps runs
- What headers are extracted
- What testId is used
- Whether MSW intercepts

### 2. Verify MSW Interception

If logs show MSW is NOT intercepting:

- Check MSW server lifecycle in globalSetup
- Verify undici interception is working
- Check if fetch() is actually being called

If logs show MSW IS intercepting:

- Check what scenario/testId MSW is using
- Verify specificity selection logic
- Check if headers match

### 3. Fix Root Cause

Based on findings from steps 1-2:

- Update code to fix identified issue
- Re-run test to verify fix
- Document solution

### 4. Update Documentation

- Update CLAUDE.md with solution
- Update investigation document
- Add to testing guidelines
- Create example pattern for others

## Manual Test Reference

**Known working command:**

```bash
cd apps/nextjs-pages-router-example
pnpm dev > /tmp/nextjs.log 2>&1 &
PID=$!
sleep 8
curl -s -H "x-scenarist-test-id: test-premium" -H "x-user-tier: premium" "http://localhost:3000/?tier=premium" | grep -o "£[0-9.]\+" | head -3
# Expected output: £99.99 £149.99 £79.99 (premium prices)
kill $PID
```

## Pricing Reference

**Premium Prices (expected):**

- Product A: £99.99
- Product B: £149.99
- Product C: £79.99

**Standard Prices (current result):**

- Product A: £149.99
- Product B: £199.99
- Product C: £99.99

## Key Architectural Insights

1. **Automatic Default Fallback** means default + active scenario mocks are combined, NOT all scenarios
2. **Specificity-Based Selection** chooses best match, with mocks containing match criteria winning over fallbacks
3. **Test ID Propagation** happens via Playwright route interception, but must be forwarded by Next.js to external APIs
4. **MSW Interception** works in Node.js with undici, but requires proper server lifecycle management
5. **getServerSideProps** runs on server, so MSW must be started in Next.js process, not Playwright process

## Questions To Answer

1. Is getServerSideProps running during Playwright test? ❓ UNKNOWN
2. Does scenarist.getHeaders() extract the testId? ❓ UNKNOWN
3. Does MSW intercept the fetch to localhost:3001? ❓ UNKNOWN
4. What scenario is active in MSW when fetch happens? ❓ UNKNOWN
5. Does the premium mock's match criteria get evaluated? ❓ UNKNOWN
6. Why does manual curl work but Playwright doesn't? ❓ PARTIALLY ANSWERED (both use same flow, but Playwright fails)

## Confidence Levels

- Architecture is correct: ✅ HIGH
- MSW can intercept getServerSideProps: ✅ HIGH (proven by curl)
- Scenario switching works: ✅ HIGH (logs show success)
- Test configuration is correct: ⚠️ MEDIUM (needs verification)
- Root cause identified: ❌ LOW (need server logs)
- Solution will work: ⚠️ MEDIUM (depends on root cause)

## Contact/Context Preservation

If context is lost, read:

1. This file (overview)
2. `/docs/investigations/next-js-pages-router-msw-investigation.md` (detailed analysis)
3. CLAUDE.md (appended section at end)
4. Test file: `/apps/nextjs-pages-router-example/tests/playwright/products-server-side.spec.ts:27-46`
5. Manual test: `/tmp/test-msw.sh`

**Key insight to remember:** Manual curl WORKS, Playwright FAILS, both use same getServerSideProps → issue is likely in test setup, not architecture.

---

## BREAKTHROUGH (2025-11-12 - Server Logs Captured)

### Root Cause Identified!

**The problem is NOT header propagation. Headers reach getServerSideProps correctly.**

**The REAL problem: MSW dynamic handler fails to lookup active scenario**

### Evidence from Server Logs

**Scenario is switched:**

```
[Scenario Endpoint POST] Scenario is now active for test ID: 7303a536b19f9ee3cc0a...
```

**getServerSideProps receives correct headers:**

```
[getServerSideProps] About to fetch products with headers: {
  'x-scenarist-test-id': '7303a536b19f9ee3cc0a...',
  'x-user-tier': 'premium'
}
[getServerSideProps] tier param: premium
```

**But MSW fails to find the scenario:**

```
[MSW] testId extracted: 7303a536b19f9ee3cc0a...
[MSW] activeScenario: undefined  ← BUG HERE!
[MSW] scenarioId to use: default  ← Falls back to default
```

### The Bug

When MSW's dynamic handler receives a request with the correct testId, it calls `manager.getActiveScenario(testId)` but gets `undefined` back, even though the scenario was just activated seconds before.

**Possible causes:**

1. ScenarioStore lookup failing (testId not found)
2. Scenario not persisting after switch
3. Different Next.js process has different state
4. Race condition between switch and fetch

### Next Steps

1. Add more logging to ScenarioStore.get() method
2. Log what testIds are in the store
3. Check if scenario is actually being stored
4. Verify scenario switch is calling store.set() correctly

### Server Logs Saved

Full server logs: `/tmp/nextjs-server.log`
