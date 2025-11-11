# Investigation: Playwright Test Isolation Failure (Nov 11, 2024)

## Problem Statement

Playwright tests for Next.js App Router example show **opposite behavior** from original flaky test issue:
- **Full test suite (35 tests)**: Premium/standard tests PASS ✅
- **Tests in isolation**: Same tests FAIL ❌
- Symptom: Premium scenario switched, premium tier selected, but standard pricing (£149.99) displayed instead of premium (£99.99)

## Investigation Timeline

### Phase 1: Header Propagation Verification

**Hypothesis:** `page.setExtraHTTPHeaders()` not propagating to `fetch()` calls

**Evidence AGAINST:**
```
[API Route] Received headers: {
  'x-test-id': '8603831629f4016ade15-efbb11b6f31c024dc741-aff2b359-255e-414c-b6a5-63a769e69bc6',
  'x-user-tier': 'premium'  ← Headers ARE propagating ✅
}
```

**Conclusion:** Headers propagate correctly. This was NOT the issue.

### Phase 2: Scenario Switch Verification

**Hypothesis:** Scenario endpoint not actually switching scenario

**Evidence:**
```
[Scenario Endpoint] Switching scenario: {
  testId: '8603831629f4016ade15-efbb11b6f31c024dc741-aff2b359-255e-414c-b6a5-63a769e69bc6',
  scenarioId: 'premiumUser',
  variant: undefined
}
[Scenario Endpoint] Switch result: { success: true, data: undefined }
[Scenario Endpoint] Verification - active scenario after switch: {
  scenarioId: 'premiumUser',  ← Scenario DOES switch successfully ✅
  variantName: undefined
}
```

**Conclusion:** Scenario switch succeeds. The store is updated.

### Phase 3: MSW Handler Read Verification

**Hypothesis:** MSW handler reading from correct store

**Evidence:**
```
[MSW Handler] Active scenario: default  ← MSW sees 'default', NOT 'premiumUser' ❌
[MSW Handler] Context headers: {
  'x-test-id': '8603831629f4016ade15-efbb11b6f31c024dc741-aff2b359-255e-414c-b6a5-63a769e69bc6',
  'x-user-tier': 'premium'
}
[MSW Handler] Test ID: 8603831629f4016ade15-efbb11b6f31c024dc741-aff2b359-255e-414c-b6a5-63a769e69bc6
```

**Critical Finding:** Same test ID, but different active scenario!

**Conclusion:** MSW handler is reading from a DIFFERENT ScenarioStore instance.

## Root Cause Analysis

### The Smoking Gun

**Scenario endpoint** and **MSW handler** operate on **different ScenarioStore instances**:

```
Store A (written by scenario endpoint): scenarioId = 'premiumUser' ✅
Store B (read by MSW handler):          scenarioId = 'default'     ❌
```

### Why Two Stores Exist

#### Current Architecture

```typescript
// apps/nextjs-app-router-example/lib/scenarist.ts
export const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

// Auto-start MSW in Next.js process
if (typeof window === 'undefined') {
  scenarist.start();  // ← Creates Store A in Next.js process
}
```

```typescript
// apps/nextjs-app-router-example/tests/playwright/globalSetup.ts
import { scenarist } from '../../lib/scenarist.js';

export default async function globalSetup(): Promise<void> {
  await scenarist.start();  // ← Creates Store B in Playwright process
}
```

**The Problem:** `createScenarist()` creates a **new** `InMemoryScenarioStore` each time:

```typescript
// packages/nextjs-adapter/src/common/create-scenarist-base.ts
export const createScenaristBase = (options: BaseAdapterOptions): ScenaristBaseSetup => {
  // ...
  const store = options.store ?? new InMemoryScenarioStore();  // ← NEW instance!
  // ...
};
```

**Result:** Two separate Node.js processes = Two separate stores = No shared state

### Process Isolation Diagram

```
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│   Playwright Test Process       │         │   Next.js Dev Server Process    │
│                                  │         │                                  │
│  globalSetup.ts                  │         │  lib/scenarist.ts               │
│  ├─ createScenarist()            │         │  ├─ createScenarist()           │
│  ├─ InMemoryScenarioStore A      │         │  ├─ InMemoryScenarioStore B     │
│  ├─ MSW server (unused)          │         │  ├─ MSW server ✅                │
│  └─ ScenarioManager A            │         │  └─ ScenarioManager B           │
│                                  │         │                                  │
│  Test Execution                  │         │  HTTP Endpoints                 │
│  ├─ switchScenario() fixture     │  HTTP   │  ├─ POST /__scenario__          │
│  │   └─ POST to Next.js server ──┼────────>│  │   └─ Writes to Store B ✅    │
│  │                                │         │  │                              │
│  ├─ page.goto('/')               │  HTTP   │  ├─ GET /api/products           │
│  │   └─ fetch() to external API ─┼────────>│  │   └─ Intercepted by MSW      │
│  │                                │         │  │       └─ Reads from Store B  │
│  └─ Assertions FAIL ❌            │         │  │           └─ scenarioId='default' ❌
│                                  │         │                                  │
└─────────────────────────────────┘         └─────────────────────────────────┘
```

### Why Tests Pass in Full Suite But Fail in Isolation

**Full suite execution:**
- Multiple tests run concurrently
- Some test likely runs FIRST and switches to a scenario
- That scenario happens to satisfy other tests' assertions
- Tests pass by accident due to cross-contamination

**Isolation execution:**
- Test runs alone with clean state
- Store B starts with scenario = 'default'
- Test switches scenario (updates Store B)
- But... wait, that SHOULD work!

**Critical Realization:** The logs show Store B WAS updated (`[Scenario Endpoint] Verification - active scenario after switch: { scenarioId: 'premiumUser' }`), but MSW handler STILL sees 'default'. This suggests:

**Either:**
1. MSW handler is reading from Store A (Playwright process), not Store B (Next.js process)
2. There's a third store somewhere
3. MSW handler is cached/stale

Let me check the logs more carefully:

```
[Scenario Endpoint] Verification - active scenario after switch: { scenarioId: 'premiumUser' }
POST /api/__scenario__ 200 in 597ms

[API Route] Received headers: { 'x-user-tier': 'standard' }
[MSW Handler] Active scenario: default  ← First request
GET /api/products 200 in 360ms

[API Route] Received headers: { 'x-user-tier': 'premium' }
[MSW Handler] Active scenario: default  ← Second request
GET /api/products 200 in 7ms
```

**Both requests** show `Active scenario: default`, even though scenario was switched to 'premiumUser' successfully.

**New hypothesis:** MSW server in Next.js process is running, but it's using a DIFFERENT scenarist instance than the one created in `lib/scenarist.ts`.

Wait... let me re-read the globalSetup code:

```typescript
// apps/nextjs-app-router-example/tests/playwright/globalSetup.ts
import { scenarist } from '../../lib/scenarist.js';

export default async function globalSetup(): Promise<void> {
  console.log('✅ Starting MSW server for Playwright tests');
  await scenarist.start();  // ← This imports SAME instance from lib/scenarist.ts
}
```

Ah! `globalSetup` imports the SAME `scenarist` instance. But it's running in the Playwright process, which is a DIFFERENT Node.js process from the Next.js dev server.

**So we have:**
- `lib/scenarist.ts` exports a scenarist instance
- Next.js dev server imports it in its process → creates Store B
- Playwright globalSetup imports it in its process → creates Store A (DIFFERENT instance in different process)

Even though they import the same module, they're in different processes, so they get different in-memory state.

## Verification: Core Logic Is Correct

```bash
cd packages/msw-adapter && pnpm test dynamic-handler.test.ts

✓ tests/dynamic-handler.test.ts (10 tests) 41ms
  ✓ should fall back to default mock when active scenario mock match criteria fail
  # ... 9 other tests

Test Files  1 passed (1)
     Tests  10 passed (10)
```

**Conclusion:** The automatic fallback feature works perfectly. This is NOT a core logic bug.

## The Real Problem

**This is a fundamental architectural challenge with Next.js App Router + Server Components + Playwright:**

1. Server Components execute in Next.js server process
2. Playwright tests execute in Playwright test process
3. In-memory stores don't share state across processes
4. MSW must run in Next.js process to intercept Server Component fetches
5. Scenario switching endpoint runs in Next.js process
6. But Playwright globalSetup tries to start MSW in test process (unused)

**Current state:**
- Scenario endpoint writes to Store B (Next.js process) ✅
- MSW handler reads from Store B (Next.js process) ✅
- **But both see 'default'** ❌

**Wait, that doesn't make sense!** If they're both in the Next.js process using the same store, they should see the same data.

Let me look at the code more carefully...

Oh! I think I see it. Let me check if `lib/scenarist.ts` is being imported multiple times:

```typescript
// lib/scenarist.ts
export const scenarist = createScenarist({ ... });

if (typeof window === 'undefined') {
  scenarist.start();
}
```

Each import in Next.js creates a NEW instance due to Next.js module resolution. This is a known Next.js gotcha - server-side imports aren't singletons across route handlers and API routes.

**Actual architecture:**

```
Next.js Process
├─ API Route: /__scenario__
│  └─ imports lib/scenarist.ts → Instance A
│      └─ Store A (gets 'premiumUser' written)
├─ API Route: /api/products
│  └─ imports lib/scenarist.ts → Instance B???
│      └─ Store B (reads 'default')???
└─ MSW Handler
   └─ imports lib/scenarist.ts → Instance B???
       └─ Store B (reads 'default')
```

This would explain everything!

## Next Steps

Need to investigate:
1. Is Next.js creating multiple instances of the scenarist module?
2. Do we need a singleton pattern for Next.js?
3. Do we need a cross-process store (Redis, shared memory)?
4. Or is there a simpler solution?

## Files Modified During Investigation

- `/packages/msw-adapter/src/handlers/dynamic-handler.ts` - Added MSW debug logging
- `/apps/nextjs-app-router-example/app/api/products/route.ts` - Added API route debug logging
- `/packages/nextjs-adapter/src/common/endpoint-handlers.ts` - Added scenario endpoint debug logging

All logging is marked `// TEMPORARY DEBUG LOGGING` for easy removal.
