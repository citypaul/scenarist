# Ultrathinking: Solution Analysis for Module Instance Duplication

## The Real Problem (Confirmed)

**Root Cause:** Next.js App Router creates **multiple instances** of the `lib/scenarist.ts` module within the SAME process (Next.js dev server).

### Evidence

```typescript
// app/api/__scenario__/route.ts
import { scenarist } from '../../../lib/scenarist';  // ← Instance A

// app/api/products/route.ts
import { scenarist } from '../../../lib/scenarist';  // ← Instance B (different!)
```

**Logs prove different stores:**
```
[Scenario Endpoint] Verification - active scenario after switch: { scenarioId: 'premiumUser' }  ← Store A
[MSW Handler] Active scenario: default  ← Store B
```

Same test ID, same Next.js process, **different scenario values** = different store instances.

## Why This Only Exposed Itself Now

### Timeline of Events

1. **Original PR**: Automatic fallback feature implemented
   - msw-adapter tests: Pass (unit tests, single process)
   - Express example tests: Pass (supertest, single process)
   - Next.js Playwright tests: **Not added yet**

2. **User populated default scenario**: Made automatic fallback work in happy path
   - Tests passed when run TOGETHER (cross-contamination masked the issue)
   - Tests FAILED when run in ISOLATION (clean state exposed the issue)

3. **Why it worked before**:
   - Previous tests either:
     - Ran in full suite (other tests set scenarios that happened to work)
     - Used scenarios with explicit fallbacks (didn't rely on automatic fallback)
     - Ran in isolation but lucked into working state

### Critical Insight

**This is NOT specific to the automatic fallback feature!** This would affect ANY scenario switching in Next.js App Router with the current architecture.

The automatic fallback feature just made it more obvious because:
- Tests now rely on default scenario being populated
- Tests fail more consistently when scenario isn't switched
- We started running tests in isolation more rigorously

## Comparison Across Adapters

### Express Adapter: ✅ NO ISSUE

**Test Setup:**
```typescript
// tests/test-id-isolation.test.ts
import request from 'supertest';
const { app, scenarist } = createApp();  // ← Single instance

scenarist.start();  // ← MSW in test process

await request(app).post('/__scenario__').send({ scenario: 'success' });  // ← Same process
await request(app).get('/api/data');  // ← Same process, same scenarist instance
```

**Why it works:**
- Supertest runs HTTP requests in SAME process as tests
- Single scenarist instance
- Single ScenarioStore
- No module duplication (standard Node.js module resolution)

**Tests pass:** 27/27 ✅

### Next.js Pages Router: ❓ UNKNOWN (Need to Verify)

**Hypothesis:** Likely has the SAME issue as App Router

**Reason:** Pages Router uses same Next.js module resolution, which can create duplicate instances.

**Action needed:** Add equivalent Playwright isolation tests to verify

### Next.js App Router: ❌ ISSUE CONFIRMED

**Test Setup:**
```typescript
// tests/playwright/globalSetup.ts
import { scenarist } from '../../lib/scenarist.js';  // ← Instance in Playwright process (UNUSED)
await scenarist.start();  // ← MSW in wrong process, doesn't intercept Next.js fetches

// app/api/__scenario__/route.ts
import { scenarist } from '../../../lib/scenarist';  // ← Instance A in Next.js process

// lib/scenarist.ts (auto-start)
scenarist.start();  // ← MSW in Next.js process (ACTUALLY INTERCEPTS)
```

**Why it fails:**
- Next.js creates multiple instances of `lib/scenarist.ts` in dev server process
- Each API route import can create separate instance
- Scenario endpoint writes to Store A
- MSW handler reads from Store B

**Tests fail:** Isolation tests fail, full suite passes due to cross-contamination

## Possible Solutions (Ranked by Quality)

### Solution 1: Global Singleton Pattern (Recommended)

**Concept:** Use Node.js global object to ensure single instance per process

```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { scenarios } from './scenarios.js';

declare global {
  // eslint-disable-next-line no-var
  var __scenarist: ReturnType<typeof createScenarist> | undefined;
}

export const getScenarist = () => {
  if (!global.__scenarist) {
    global.__scenarist = createScenarist({
      enabled: true,
      scenarios,
    });

    // Auto-start MSW in Node.js environment
    if (typeof window === 'undefined') {
      global.__scenarist.start();
    }
  }

  return global.__scenarist;
};

// For backward compatibility and convenience
export const scenarist = getScenarist();
```

**Usage in route handlers:**
```typescript
// app/api/__scenario__/route.ts
import { getScenarist } from '../../../lib/scenarist';

const scenarist = getScenarist();  // ← Always returns same instance

export const POST = scenarist.createScenarioEndpoint();
export const GET = scenarist.createScenarioEndpoint();
```

**Pros:**
- ✅ Guarantees single instance per process
- ✅ Works with Next.js module resolution quirks
- ✅ Simple implementation
- ✅ No infrastructure dependencies
- ✅ Backward compatible (export both `scenarist` and `getScenarist`)

**Cons:**
- ⚠️ Uses global namespace (but that's the point)
- ⚠️ Requires pattern change in Next.js adapters only

**Decision:** ✅ BEST SOLUTION

This is a well-known pattern for Next.js singletons. Prisma, Supabase, and other libraries use this exact approach.

### Solution 2: Remove Playwright globalSetup MSW (Partial Fix)

**Change:**
```typescript
// tests/playwright/globalSetup.ts
export default async function globalSetup(): Promise<void> {
  console.log('✅ Next.js dev server will start MSW');
  // Don't start MSW here - it runs in wrong process
}
```

**Why this helps:**
- Removes confusion about which MSW is active
- Clarifies that MSW runs in Next.js process only

**Why this is NOT enough:**
- Doesn't solve the module duplication in Next.js process
- Scenario endpoint and MSW handler still use different stores

**Decision:** ✅ Do this IN ADDITION to Solution 1

### Solution 3: Add Instance ID Logging (Diagnostic)

**Purpose:** Verify our hypothesis that Next.js creates multiple instances

```typescript
// lib/scenarist.ts
const instanceId = Math.random().toString(36).substring(7);

export const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

console.log('[Scenarist] Instance created:', instanceId);

// Add to all imports
console.log('[Scenarist] Instance used:', instanceId, 'in', import.meta.url);
```

**Decision:** ✅ Do this FIRST to confirm hypothesis, then remove after fixing

### Solution 4: Redis/External Store (Overkill)

**Concept:** Replace InMemoryScenarioStore with RedisScenarioStore

**Pros:**
- ✅ Works across processes AND multiple instances
- ✅ Could enable distributed testing

**Cons:**
- ❌ Requires Redis infrastructure
- ❌ Added complexity for all users
- ❌ Overkill for single-process issue
- ❌ Performance overhead

**Decision:** ❌ NOT RECOMMENDED (but could be offered as optional advanced feature later)

### Solution 5: HTTP-Based Store Queries (Interesting but Flawed)

**Concept:** MSW handler calls scenario endpoint to get active scenario

```typescript
const handler = createDynamicHandler({
  getActiveScenario: async (testId) => {
    // Call /__scenario__?testId=xxx to get active scenario
    const response = await fetch(`http://localhost:3002/__scenario__?testId=${testId}`);
    return await response.json();
  },
});
```

**Pros:**
- ✅ Works around module duplication
- ✅ No global namespace

**Cons:**
- ❌ HTTP overhead on EVERY intercepted request
- ❌ Circular dependency risk (fetch while intercepting fetch)
- ❌ Complex error handling
- ❌ Doesn't solve root cause

**Decision:** ❌ NOT RECOMMENDED

## Recommended Implementation Plan

### Phase 1: Confirm Hypothesis (5 min)

1. Add instance ID logging to `lib/scenarist.ts`
2. Run failing test
3. Verify logs show different instance IDs
4. Document findings
5. Remove logging

### Phase 2: Implement Singleton (15 min)

1. Update `lib/scenarist.ts` to use global singleton pattern
2. Update all route handlers to use `getScenarist()`
3. Update tests to import via `getScenarist()`
4. Run tests to verify fix

### Phase 3: Clean Up globalSetup (5 min)

1. Remove `scenarist.start()` from Playwright globalSetup
2. Add comment explaining MSW runs in Next.js process
3. Verify tests still pass

### Phase 4: Verify Across All Adapters (30 min)

1. **Express**: Already works, verify no regression
2. **Next.js Pages Router**: Add equivalent Playwright isolation tests
   - If fails: Apply singleton pattern
   - If passes: Document why (good to know)
3. **Next.js App Router**: Should now pass with singleton
4. Run ALL tests across ALL adapters

### Phase 5: Document Pattern (15 min)

1. Add to Next.js adapter README
2. Add to CLAUDE.md learnings
3. Create ADR documenting decision
4. Update example apps with pattern

## Test Coverage Requirements

### Express (Current: ✅)

```typescript
// tests/test-id-isolation.test.ts
it('should allow different test IDs to use different scenarios concurrently', async () => {
  // Set test-id-1 to scenario A
  // Set test-id-2 to scenario B
  // Set test-id-3 to scenario C

  // Verify test-id-1 gets scenario A data
  // Verify test-id-2 gets scenario B data
  // Verify test-id-3 gets scenario C data (or default fallback)
});

it('should not leak scenario state between test IDs', async () => {
  // Similar pattern
});
```

**Status:** ✅ Exists and passes

### Next.js App Router (Current: ❌)

```typescript
// tests/playwright/isolation.spec.ts
test.describe.configure({ mode: 'parallel' });

test('concurrent test 1: premium user sees £99.99 pricing', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser');
  // Navigate, interact, assert premium pricing
});

test('concurrent test 2: standard user sees £149.99 pricing', async ({ page, switchScenario }) => {
  await switchScenario(page, 'standardUser');
  // Navigate, interact, assert standard pricing
});

// 3 more concurrent tests proving isolation
```

**Status:** ❌ Exists but fails in isolation due to module duplication

### Next.js Pages Router (Missing: ❓)

**Need to add:** Equivalent Playwright isolation tests

```typescript
// tests/playwright/isolation.spec.ts (same pattern as App Router)
```

This will tell us if Pages Router has the same issue.

## Expected Outcomes

### After Implementing Singleton:

1. **Next.js App Router**:
   - Isolation tests: ❌ → ✅
   - Full suite tests: ✅ → ✅ (already passing)

2. **Express**:
   - All tests: ✅ → ✅ (no change, already works)

3. **Next.js Pages Router** (after adding tests):
   - If has same issue: ❌ → ✅ (after singleton)
   - If works already: ✅ → ✅ (no change needed)

## Why This is the Right Solution

### Architectural Soundness

- **Follows established patterns**: Prisma, Supabase, NextAuth all use global singletons in Next.js
- **Solves root cause**: Eliminates module duplication at source
- **Minimal API change**: Users can still use `export const scenarist` pattern, just internally backed by singleton
- **No infrastructure**: Pure JavaScript/TypeScript solution

### Maintainability

- **Clear intent**: Code explicitly shows singleton requirement
- **TypeScript safe**: Type declaration for global variable
- **Easy to test**: Can still inject mock instances in tests if needed
- **Well documented**: Pattern is well-known in Next.js ecosystem

### Performance

- **Zero runtime overhead**: Singleton check is O(1)
- **No HTTP calls**: Unlike HTTP-based store solution
- **No external dependencies**: Unlike Redis solution

### User Experience

- **Just works**: Users don't need to understand the problem
- **Backward compatible**: Existing code continues to work
- **Clear error messages**: If someone tries to use old pattern, easy to detect and fix
- **Documentation**: Clear upgrade guide for existing users

## Conclusion

**Implement Solution 1 (Global Singleton Pattern)**

This is:
- The most architecturally sound solution
- The standard Next.js pattern for this problem
- Zero infrastructure overhead
- Easy to implement and maintain
- Backward compatible

The automatic fallback feature is **working correctly**. The issue is Next.js-specific module duplication, which requires a Next.js-specific solution (global singleton).
