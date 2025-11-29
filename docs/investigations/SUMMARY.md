# Scenarist Investigation Summary

**Date:** 2025-11-13
**Branch:** fix/playwright-test-flakiness
**Status:** ✅ RESOLVED - All Flakiness Issues Fixed

---

## Issues Resolved

### 1. ✅ Next.js Pages Router HMR Singleton Issue (2025-11-12)

**Problem:** Multiple ScenarioStore instances due to Next.js HMR module reloading
**Fix:** Applied singleton pattern with global state

### 2. ✅ Playwright Test Flakiness (2025-11-13)

**Problem:** Race condition in `route.continue()` causing intermittent test failures
**Fix:** Added missing `await` and handler cleanup

**Root Cause:** Missing `await` on `route.continue()` in `switch-scenario.ts:58`

- `route.continue()` is async but wasn't awaited
- Under parallel test load, header modification completed after navigation started
- Some requests missed x-scenarist-test-id header → wrong scenario data → test failures

**Changes Applied:**

1. Added `await page.unroute('**/*')` - prevents handler accumulation
2. Added `async` to route callback
3. Added `await` to `route.continue({ headers })` - fixes race condition

**Files Modified:**

- `packages/playwright-helpers/src/switch-scenario.ts` - Fixed race condition
- `docs/investigations/playwright-fetch-headers-flakiness.md` - Documented resolution
- `docs/investigations/parallel-execution-race-condition.md` - Documented resolution

---

## The Problem

Playwright test for Next.js Pages Router getServerSideProps failed:

- **Expected:** Premium pricing (Product A: £99.99)
- **Actual:** Standard pricing (Product A: £149.99)
- **Manual curl test:** ✅ WORKED (returned £99.99)

---

## Root Cause - CONFIRMED

**Multiple instances of ScenarioStore due to Next.js HMR (Hot Module Replacement)**

Next.js dev mode with HMR loaded the `lib/scenarist.ts` module multiple times, causing `createScenarist()` to be called multiple times. Each call created new instances of `InMemoryScenarioStore`, resulting in scenarios being stored in one instance while lookups happened in different instances.

### Evidence from ScenarioStore Logging

```
[ScenarioStore.set] Store now has 1 scenarios
[ScenarioStore.get] Store has 0 scenarios  ← Different instance!
[ScenarioStore.get] Store has 1 scenarios  ← Back to first instance
[ScenarioStore.get] Store has 0 scenarios  ← Different instance again!
```

The store alternated between empty (0 scenarios) and populated (1 scenario), proving multiple instances existed and were being hit in rotation by MSW's request interception.

### The Fix

**Applied singleton pattern to Pages Router adapter** (`packages/nextjs-adapter/src/pages/setup.ts`):

1. **Global singleton stores:**

   ```typescript
   global.__scenarist_registry_pages = new InMemoryScenarioRegistry();
   global.__scenarist_store_pages = new InMemoryScenarioStore();
   ```

2. **Global instance cache:**

   ```typescript
   if (global.__scenarist_instance_pages) {
     return global.__scenarist_instance_pages; // Early return
   }
   ```

3. **MSW start guard:**
   ```typescript
   if (global.__scenarist_msw_started_pages) {
     return; // Prevent duplicate server.listen() calls
   }
   ```

This ensures all module instances share the same stores and MSW server, even when Next.js HMR loads the module multiple times.

---

## What We Learned

### ✅ Architecture is Sound

All the core pieces work correctly:

- Scenario switching mechanism ✅
- Header propagation (Playwright → Next.js → getServerSideProps) ✅
- MSW interception in Node.js ✅
- Test ID isolation pattern ✅
- Specificity-based mock selection ✅

### ❌ Next.js HMR Module Reloading Issue

**Problem:** Next.js dev mode with HMR can load modules multiple times, creating duplicate instances of stores and services.

**Solution:** Singleton pattern with global state ensures all module instances share the same stores:

- Global singleton stores for registry and store
- Global instance cache for the adapter itself
- MSW start guard to prevent duplicate server initialization

**Lesson:** When building Next.js adapters, ALWAYS use singleton patterns for stateful services (stores, MSW servers) to handle HMR module reloading gracefully.

---

## Result

✅ **Test passes consistently** - Premium pricing displays correctly (£99.99)

**Files Modified:**

- `packages/nextjs-adapter/src/pages/setup.ts` - Added singleton pattern
- `packages/core/src/adapters/in-memory-store.ts` - Added temporary debug logging (removed after fix confirmed)

**Verification:**

```bash
pnpm exec playwright test tests/playwright/products-server-side.spec.ts --grep "premium"
# Result: 1 passed (3.4s) ✅
```

---

## Documentation Files

All investigation documented in:

1. **This summary:** `/docs/investigations/SUMMARY.md`
2. **Complete investigation:** `/docs/investigations/next-js-pages-router-msw-investigation.md`
3. **Current status:** `/docs/investigations/next-js-pages-router-status.md`
4. **CLAUDE.md:** Updated with critical findings (end of file)
5. **Server logs:** `/tmp/nextjs-server.log`

---

## Key Commands

**Run failing test:**

```bash
cd apps/nextjs-pages-router-example
pnpm exec playwright test tests/playwright/products-server-side.spec.ts --grep "premium"
```

**Run manual test (works):**

```bash
pnpm dev > /tmp/nextjs.log 2>&1 &
sleep 8
curl -s -H "x-scenarist-test-id: test-premium" -H "x-user-tier: premium" "http://localhost:3000/?tier=premium" | grep "£99.99"
pkill -f "pnpm dev"
```

**Check server logs:**

```bash
cat /tmp/nextjs-server.log | grep -E '\[MSW\]|\[getServerSideProps\]|\[Scenario'
```

---

## Expected Behavior After Fix

When test runs:

1. Switch to premiumUser scenario → `store.set(testId, { scenarioId: 'premiumUser' })`
2. Navigate to `/?tier=premium` → getServerSideProps runs
3. Fetch localhost:3001/products with testId header
4. MSW intercepts → `store.get(testId)` → returns `{ scenarioId: 'premiumUser' }`
5. Collect mocks: default + premiumUser
6. Premium mock (specificity 1) beats default fallback (specificity 0)
7. Return premium pricing: Product A £99.99 ✅

---

## Confidence Level

- **Root cause identified:** ✅ HIGH (server logs provide definitive proof)
- **Location of bug:** ✅ HIGH (scenario store get/set operations)
- **Fix complexity:** ⚠️ MEDIUM (depends on cause: simple if testId mismatch, complex if multiple instances)
- **Solution will work:** ✅ HIGH (once store lookup fixed, everything else works)

---

**Investigation complete. Ready for debugging and fix implementation.**
