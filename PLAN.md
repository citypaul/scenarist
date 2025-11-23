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
1. ✅ **PR #1: Express Example** (completed, ready for review)
2. 📋 **PR #2: Next.js App Router Example** (future PR)
3. 📋 **PR #3: Next.js Pages Router Example** (future PR)

---

## App 1: Express Example ✅ COMPLETE

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

---

## App 2: Next.js App Router Example 📋 FUTURE PR

### Implementation Notes for Next PR

**Key Challenge:** API routes call backend endpoints that don't exist in real json-server.

**Current Implementation:**
- Routes call `POST http://localhost:3001/cart/add` (fake endpoint, only works with MSW)
- Scenarios mock `POST /cart/add` with state capture using `cartItems[]` (append pattern)
- Mocked tests pass (MSW intercepts the fake endpoint)
- Production tests fail (json-server doesn't have `/cart/add` endpoint)

**Two Viable Approaches:**

**Option A: Keep Routes Simple, Mock Both Patterns**
- Keep routes calling `POST /cart/add` (current implementation)
- Add both patterns to scenarios:
  - `POST /cart/add` → for mocked tests (MSW intercepts)
  - `GET + PATCH /cart` → for production (json-server REST API)
- Frontend chooses based on env or adapter provides shim
- **Pro:** Minimal route changes
- **Con:** Scenarios need both patterns, frontend complexity

**Option B: Production-Ready Routes, Scenarios Support Both**
- Change routes to GET-then-PATCH pattern (works with real json-server)
- Scenarios mock both:
  - `POST /cart/add` with `cartItems[]` append (backward compat if needed)
  - `PATCH /cart` with `cartItems` replace (production pattern)
  - `GET /cart` with state injection (both patterns)
- **Pro:** Routes work in production without MSW
- **Con:** More complex implementation, two patterns to maintain

**Hostname Consistency:**
- Main branch uses `localhost:3001`
- Commit 74d0b20 uses `127.0.0.1:3001`
- **Decision needed:** Standardize on one (probably `localhost` for consistency)

**For Next PR:**
1. Choose approach (A or B)
2. Implement chosen pattern
3. Ensure both mocked AND production tests pass
4. Verify tree-shaking (/__scenario__ returns 404)
5. Add beforeEach cart reset for production tests

---

## App 3: Next.js Pages Router Example 📋 FUTURE PR

### Implementation Notes for Future PR

**Same challenges and approaches as App Router** - refer to App 2 notes above.

**Implementation will be nearly identical:**
1. Same cart journey testing
2. Same route pattern decisions (Option A or B from App 2)
3. Same scenario configuration
4. Same production test structure

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

## Questions for Confirmation

1. **Test Journey:** Is "Shopping Cart State" the right journey to prove for production parity?
   - Alternative: Could do products with premium/standard pricing instead
   - Cart proves state persistence which is more complex

2. **App Order:** Express → App Router → Pages Router - correct?

3. **Production Test Scope:** Just cart journey, or also test:
   - Health endpoint works
   - Scenario endpoint doesn't exist (404/405)
   - One API call proves enough

Please confirm and I'll start with App 2 (Next.js App Router).
