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

## Approach: One PR Per App

**Each app gets its own PR** to allow focused review and avoid scope creep:
1. ✅ **PR #1: Express Example** ([#126](https://github.com/citypaul/scenarist/pull/126) - MERGED)
2. 📋 **PR #2: Next.js App Router Example** (this PR)
3. 📋 **PR #3: Next.js Pages Router Example** (future PR)

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

## App 2: Next.js App Router Example 📋 THIS PR

### Critical Difference from Express: Playwright vs Vitest

**Express Example:**
- Uses **vitest** for all tests (mocked + production)
- Mocked tests: vitest → Express server → MSW intercepts
- Production tests: vitest → json-server (real backend)

**Next.js Examples:**
- Use **Playwright** for all tests (mocked + production)
- Mocked tests: Playwright → Next.js → MSW intercepts in browser
- Production tests: Playwright → Next.js production build → json-server (real backend)

**DO NOT add vitest to Next.js apps!** They use Playwright exclusively.

### Implementation Plan

**Step 1: Update API Routes with Environment-Aware Pattern** ✅
```typescript
// app/api/cart/add/route.ts
const CART_BACKEND_URL = 'http://localhost:3001/cart';

if (process.env.NODE_ENV === 'production') {
  // GET-then-PATCH for json-server (production)
  const current = await fetch(CART_BACKEND_URL);
  const cart = await current.json();
  const updated = await fetch(CART_BACKEND_URL, {
    method: 'PATCH',
    body: JSON.stringify({ items: [...cart.items, productId] }),
  });
} else {
  // POST to mocked endpoint (test/dev - MSW intercepts)
  const response = await fetch(`${CART_BACKEND_URL}/add`, {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}
```

**Step 2: Create Playwright Production Config**
- `playwright.config.ts`: Existing config for mocked tests (MSW active)
- `playwright.production.config.ts`: New config for production tests
  - globalSetup: starts json-server + Next.js production build
  - Uses `request` fixture (no browser needed for API tests)
- Add script: `test:production` using production config

**Step 3: Create globalSetup for Playwright**
- Build Next.js in production mode
- Start json-server with db.template.json
- Start Next.js production server (`next start`)
- Wait for servers (wait-on library)
- Return cleanup function

**Step 4: Create Playwright Production Tests**
```typescript
// tests/production/cart-api.spec.ts
import { test, expect } from '@playwright/test';

test('cart API works with real backend', async ({ request }) => {
  // Reset cart
  await request.patch('http://localhost:3001/cart', {
    data: { items: [] }
  });

  // Add items via Next.js API route (calls json-server)
  const response = await request.post('http://localhost:3000/api/cart/add', {
    data: { productId: 1 }
  });

  expect(response.status()).toBe(200);
});
```

**Step 5: Verify Tree-Shaking**
- Playwright test checks `/__scenario__` returns 405
- Build verification script already exists

**Key Differences from Express:**
- Playwright tests (not vitest)
- Playwright globalSetup (not vitest globalSetup)
- Uses Playwright `request` fixture for API calls
- Scenario endpoint returns 405 (Next.js behavior) not 404 (Express behavior)

---

## App 3: Next.js Pages Router Example 📋 FUTURE PR

### Implementation Plan

**Apply App Router pattern from PR #2** - implementation will be nearly identical.

**Key Steps:**
1. Update API routes with environment-aware pattern (GET-then-PATCH for production)
2. Create separate vitest configs (mocked vs production)
3. Create globalSetup.ts with return-cleanup pattern
4. Add production tests (health, scenario 405, cart CRUD)
5. Verify tree-shaking

**Differences from App Router:**
- Pages Router uses `pages/api/` instead of `app/api/`
- API handler signature: `(req: NextApiRequest, res: NextApiResponse) => void`
- Otherwise, same environment-aware routing pattern applies

---

## Success Criteria

### After App 2 (App Router) Complete
```bash
cd apps/nextjs-app-router-example
pnpm test                    # ✅ All mocked tests pass
pnpm test:production         # ✅ Production test passes
```

### After App 3 (Pages Router) Complete
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

## Decisions Made

**✅ Test Journey:** Shopping Cart State
- Proves state persistence (more complex than static pricing)
- Successfully implemented for Express example
- Same journey for App Router and Pages Router

**✅ App Order:** Express → App Router → Pages Router
- Express completed and merged (PR #126)
- App Router next (PR #2, this branch)
- Pages Router last (PR #3, future)

**✅ Production Test Scope:**
- Health endpoint works (proves app runs)
- Scenario endpoint returns 404/405 (proves tree-shaking)
- Cart CRUD journey (proves production API integration)
- Express example validated this scope is sufficient

**✅ Approach:** Production-ready routes with environment-aware pattern
- GET-then-PATCH for json-server in production
- POST /cart/add for MSW mocking in test/dev
- Express proved this pattern works cleanly

**✅ Hostname:** Use `localhost` everywhere
- Prevents IPv4/IPv6 resolution issues
- Consistent across all configs and URLs

**✅ Vitest Pattern:** Separate configs with return-cleanup
- Default config excludes production tests
- Production config uses globalSetup with return cleanup
- No mutable module-level state
