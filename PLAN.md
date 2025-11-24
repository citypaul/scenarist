# Plan: Add Production Parity Tests for All Example Apps

## Goal

**Semantic Meaning:** Prove that the same user journey produces the same business outcome in both test (with Scenarist mocking) and production (with real backend) environments.

For each example app, create production tests that prove the same journey as mocked tests:
- **Mocked tests:** Prove ALL Scenarist functionality (scenarios, state, matching, etc.)
  - These tests comprehensively verify Scenarist's features work correctly
  - They test scenarios, state capture/injection, matching, sequences, etc.
  - They prove: "Scenarist works as designed in testing environments"

- **Production tests:** Prove the SAME journey works with real API calls (no Scenarist)
  - These tests don't need to test every Scenarist feature (that's what mocked tests do)
  - They just prove the same user journey (e.g., "add items to cart, view cart") works end-to-end
  - They prove: "The app works in production without Scenarist"

**What This Demonstrates:**
1. **Scenarist works perfectly in tests** - All features verified via mocked tests
2. **Scenarist is completely absent in production** - Tree-shaken, zero bundle size impact
3. **Same code, same outcome** - User journey produces identical business results in both environments
4. **Core value proposition** - Develop and test with powerful mocking, deploy without any test infrastructure

## Approach: One PR Per App/Refactor

**Each app/refactor gets its own PR** to allow focused review and avoid scope creep:
1. ✅ **PR #1: Express Example - Production Tests** ([#126](https://github.com/citypaul/scenarist/pull/126) - MERGED)
2. ✅ **PR #2: Next.js App Router - Production Tests** ([#128](https://github.com/citypaul/scenarist/pull/128) - MERGED)
3. ✅ **PR #3: Express Example - Remove Environment Branching** ([#129](https://github.com/citypaul/scenarist/pull/129) - MERGED)
4. ✅ **PR #4: Next.js Pages Router - Production Tests** ([#130](https://github.com/citypaul/scenarist/pull/130) - MERGED)

---

## App 1: Express Example ✅ MERGED

### Test Journey: Shopping Cart State
**User story:** Add items to cart, verify cart persists state

### Mocked Tests (Scenarist)
- **Location:** `apps/express-example/tests/stateful-scenarios.test.ts`
- **What it proves:**
  - State capture works (productIds captured)
  - State injection works (cart items injected)
  - State isolation works (different test IDs have separate state)
  - State reset works (switching scenarios clears state)

### Production Tests (Real Backend)
- **Location:** `apps/express-example/tests/production/production.test.ts`
- **What it proves:**
  - Routes work with json-server (real backend)
  - POST `/api/cart/add` → json-server PATCH
  - GET `/api/cart` → json-server GET
  - Same cart accumulation logic works
  - Scenarist is absent (tree-shaken)

### Implementation Status
✅ Routes: Use GET-then-PATCH for json-server
✅ Scenarios: Mock PATCH `/cart` with items array capture
✅ Mocked tests: Pass
✅ Production test: Starts json-server, passes
✅ CI: Production test added

### Lessons Learned

**Vitest globalSetup Pattern (Immutability):**
- ✅ Return cleanup function from setup() - Vitest calls it automatically
- ❌ Don't use separate teardown() function
- ❌ Don't use mutable module-level state (let processes = [])
- Use wait-on library for reliable server readiness checking

**Separate Vitest Configs:**
- Default `vitest.config.ts`: Excludes production tests, no globalSetup
- Separate `vitest.production.config.ts`: Includes globalSetup, 30s timeout
- Prevents regular tests from waiting for servers to start
- CI runs both: `pnpm test` (mocked) and `pnpm test:production` (real backend)

**Environment-Aware Routes:**
- Routes check `process.env.NODE_ENV === 'production'`
- Test/dev: Call fake URLs (`https://api.store.com/cart`) → MSW intercepts
- Production: Call real backend (`http://localhost:3001/cart`) → json-server
- Pattern works cleanly, no MSW leakage into production

**Hostname Standardization:**
- ✅ Use `localhost` everywhere (globalSetup, wait-on, route URLs)
- ❌ Don't mix `127.0.0.1` and `localhost` - can cause IPv4/IPv6 issues
- Consistency prevents hard-to-debug connection failures

**json-server Pattern:**
- Use GET-then-PATCH for state accumulation (json-server doesn't have POST /cart/add)
- Reset database with file copy: `copyFileSync(db.template.json, db.json)`
- Works reliably with wait-on for readiness checking

**Test Timeouts:**
- Production tests with real HTTP calls need 30s timeout
- Mocked tests can use default timeout (5s)
- Configure in vitest.production.config.ts: `testTimeout: 30000`

---

## App 2: Next.js App Router Example ✅ MERGED

### Critical Differences from Express

**Testing Framework:**
- **Express:** Uses vitest for all tests (mocked + production)
- **Next.js:** Uses Playwright for all tests (mocked + production)
- **DO NOT add vitest to Next.js apps!**

**Route Implementation Pattern:**
- **Express:** Environment-aware (if/else based on NODE_ENV)
  - Test/dev: Calls fake `POST /cart/add` endpoint (MSW only)
  - Production: Calls real json-server endpoints (GET + PATCH)
  - Routes have environment branching logic

- **Next.js:** No environment branching! Always call real endpoints
  - All environments: Call real json-server REST endpoints (GET + PATCH)
  - Test/dev: MSW intercepts these real endpoints
  - Production: Calls pass through to real json-server
  - **Routes have ZERO environment logic** - same code everywhere

### The Key Insight: Use Real REST Endpoints Everywhere

**Routes always call json-server's actual endpoints:**
```typescript
// POST /api/cart/add - NO environment branching
export async function POST(request: NextRequest) {
  const { productId } = await request.json();

  // Always GET current cart
  const getResponse = await fetch('http://localhost:3001/cart', {
    headers: { ...getScenaristHeaders(request) }
  });
  const currentCart = await getResponse.json();

  // Route handles accumulation logic
  const updatedItems = [...(currentCart.items || []), productId];

  // Always PATCH with updated array
  const patchResponse = await fetch('http://localhost:3001/cart', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getScenaristHeaders(request) },
    body: JSON.stringify({ items: updatedItems })
  });

  return NextResponse.json({ success: true, items: patchResponse.items });
}
```

**MSW scenarios mock the REAL json-server endpoints:**
```typescript
// GET /cart - inject state
{
  method: 'GET',
  url: 'http://localhost:3001/cart',
  response: {
    body: {
      items: '{{state.cartItems}}',  // null initially (ADR-0017)
    }
  }
},
// PATCH /cart - capture full array
{
  method: 'PATCH',
  url: 'http://localhost:3001/cart',
  captureState: {
    'cartItems': 'body.items',  // Capture full array [1,2,3]
  },
  response: {
    body: {
      items: '{{body.items}}',  // Echo back what was sent
    }
  }
}
```

**Why This Is Superior:**
- ✅ True production parity - same code paths in test and production
- ✅ No environment branching - simpler, fewer edge cases
- ✅ Realistic testing - tests exercise actual production behavior
- ✅ json-server native - uses standard REST API
- ✅ ADR-0017 critical - null preserves fields in JSON, enables `|| []` pattern

### Implementation Status

**Step 1: Create Infrastructure** ✅
- ✅ fake-api/db.template.json
- ✅ app/api/health/route.ts

**Step 2: Update Cart Routes** ✅
- ✅ GET /api/cart: Always fetch from http://localhost:3001/cart
- ✅ POST /api/cart/add: Always GET-then-PATCH (no if/else)
- ✅ Remove all NODE_ENV checks
- ✅ Routes handle accumulation logic, not MSW

**Step 3: Update Scenarios** ✅
- ✅ Remove POST /cart/add mocks (fake endpoint)
- ✅ Add GET /cart with state injection ({{state.cartItems}})
- ✅ Add PATCH /cart with state capture (body.items)
- ✅ Both mocks use real json-server URLs

**Step 4: Create Playwright Production Config** ✅
- ✅ playwright.production.config.ts
- ✅ globalSetup: build Next.js, start json-server + next start
- ✅ Uses `request` fixture (API-only tests)

**Step 5: Create Playwright Production Tests** ✅
- ✅ tests/production/cart-api.spec.ts
- ✅ Health check (app runs)
- ✅ Scenario endpoint 405 (tree-shaken)
- ✅ Cart CRUD (real json-server)

**Step 6: Update package.json** ✅
- ✅ Add test:production script
- ✅ NO vitest dependencies (Playwright only)

**Step 7: Production Stub Tests** ✅
- ✅ packages/nextjs-adapter/src/app/production.test.ts (14 tests)
- ✅ packages/nextjs-adapter/src/pages/production.test.ts (13 tests)
- ✅ Comprehensive documentation of conditional exports mechanism
- ✅ All TypeScript strict mode errors resolved

---

## App 4: Next.js Pages Router Example ✅ MERGED

### Implementation Plan

**Apply App Router pattern from PR #2** - implementation will be nearly identical (no environment branching).

**Implementation Status:**
✅ 1. Update API routes with no-branching pattern (always GET-then-PATCH)
✅ 2. Update scenarios to mock real json-server endpoints (GET /cart, PATCH /cart)
✅ 3. Create Playwright production config with globalSetup
✅ 4. Add production tests (health, scenario 405, cart CRUD) - 3 tests passing
✅ 5. Verify tree-shaking - verified in production tests
✅ 6. Add production stub tests for Pages Router adapter - packages/nextjs-adapter/src/pages/production.test.ts

**Success Criteria Met:**
✅ All mocked tests pass (70 Playwright tests)
✅ All production tests pass (3 tests)
✅ CI updated to run production tests for all apps
✅ Tree-shaking verified (Scenarist completely absent in production builds)

---

## Success Criteria

### After App 2 (App Router) Complete ✅
```bash
cd apps/nextjs-app-router-example
pnpm test                    # ✅ All mocked tests pass
pnpm test:production         # ✅ Production test passes
```

### After Refactor 1 (Express No-Branching) Complete ✅
```bash
cd apps/express-example
pnpm test                    # ✅ All mocked tests pass (with updated scenarios)
pnpm test:production         # ✅ Production test passes (same tests, simpler routes)
git diff                     # ✅ Routes simpler, no environment branching
```

### After App 4 (Pages Router) Complete
```bash
cd apps/nextjs-pages-router-example
pnpm test                    # ✅ All mocked tests pass
pnpm test:production         # ✅ Production test passes
```

### Final Verification
```bash
pnpm test                    # ✅ ALL monorepo tests pass
```

---

## Refactor 1: Express Example - Remove Environment Branching ✅ MERGED

### Motivation

After implementing the Next.js App Router pattern, we discovered a superior approach: **no environment branching**. The Next.js implementation proved that routes can always call real json-server endpoints, with MSW intercepting in test/dev and json-server responding in production. This is simpler, provides true production parity, and eliminates environment-specific code paths.

### The Problem

Express example has environment branching that Next.js doesn't need:

```typescript
// ❌ Express (current) - has branching
const CART_BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://localhost:3001/cart'
    : 'https://api.store.com/cart';

if (process.env.NODE_ENV === 'production') {
  // GET-then-PATCH pattern
} else {
  // POST to fake /add endpoint
}

// ✅ Next.js (desired) - no branching
const CART_BACKEND_URL = 'http://localhost:3001/cart';  // Always same URL

// Always GET-then-PATCH (MSW intercepts in test/dev)
const getResponse = await fetch(CART_BACKEND_URL);
const currentCart = await getResponse.json();
const updatedItems = [...(currentCart.items || []), item];
await fetch(CART_BACKEND_URL, { method: 'PATCH', body: ... });
```

### The Solution

Apply the Next.js pattern to Express for consistency and simplicity:

**Core Changes:**
1. Remove environment branching from `apps/express-example/src/routes/cart.ts`
2. Always call real json-server endpoints (`http://localhost:3001/cart`)
3. Update scenarios to mock GET /cart and PATCH /cart (not POST /cart/add)
4. MSW intercepts in test/dev, json-server responds in production
5. **Same code everywhere** - simpler, true production parity

**Benefits:**
- ✅ No environment logic in routes
- ✅ True production parity (same code paths)
- ✅ Simpler implementation
- ✅ Consistent pattern across all example apps

### Implementation Plan

**Step 1: Update Cart Routes**
- Remove `CART_BACKEND_URL` constant with ternary
- Replace with single `const CART_BACKEND_URL = 'http://localhost:3001/cart'`
- Remove if/else branching in POST /api/cart/add
- Always use GET-then-PATCH pattern
- Routes handle accumulation logic (already do this in production path)

**Step 2: Update Scenarios**
- Remove POST /cart/add mock (fake endpoint that doesn't exist in json-server)
- Add GET /cart mock with state injection
- Add PATCH /cart mock with state capture
- Both mocks target real json-server URLs

**Step 3: Update Tests**
- Verify all mocked tests still pass
- Verify production tests still pass
- Confirm no regressions in test isolation

**Step 4: Verification**
- Run `pnpm test` - all mocked tests pass
- Run `pnpm test:production` - production tests pass
- Check diff: routes should be simpler, fewer lines
- Verify MSW intercepts work correctly in test/dev

---

## Decisions Made

**✅ Test Journey:** Shopping Cart State
- Proves state persistence (more complex than static pricing)
- Successfully implemented for Express example
- Same journey for App Router and Pages Router

**✅ App Order:** Express → App Router → Express Refactor → Pages Router
- Express production tests completed (PR #126 - MERGED)
- App Router production tests completed (PR #128 - MERGED)
- Express refactoring to remove branching (PR #129 - MERGED)
- Pages Router production tests (PR #4 - this branch)

**✅ Production Test Scope:**
- Health endpoint works (proves app runs)
- Scenario endpoint returns 404/405 (proves tree-shaking)
- Cart CRUD journey (proves production API integration)
- Production stub tests (document conditional exports behavior)
- All examples validate this scope is sufficient

**✅ Routing Pattern Evolution:**
- ❌ **Initial:** Environment branching (if/else based on NODE_ENV)
  - Express used this initially (PR #126)
  - Works but creates two code paths
- ✅ **Superior:** No environment branching (always call real endpoints)
  - App Router proved this works (PR #128)
  - MSW intercepts in test/dev, json-server in production
  - **Same code everywhere** = true production parity
  - Applied to Express (PR #129 - MERGED)
  - Now applying to Pages Router (PR #4 - this branch)

**✅ Hostname:** Use `localhost` everywhere
- Prevents IPv4/IPv6 resolution issues
- Consistent across all configs and URLs

**✅ Testing Patterns:**
- **Vitest (Express):** Separate configs with return-cleanup pattern
  - Default config excludes production tests
  - Production config uses globalSetup with return cleanup
  - No mutable module-level state
- **Playwright (Next.js):** globalSetup with server management
  - Build app, start servers, wait for readiness
  - Uses `request` fixture for API-only tests
  - Clean teardown in returned function
