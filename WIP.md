# Work In Progress - Next.js Pages Router + Playwright Helpers

**Last Updated**: 2025-11-02
**Branch**: feat/phase-3-shopping-cart
**PR**: #44 - Comprehensive update (Phase 3 + API unification + schema-first + refactoring)

---

## Current Status

**PHASE 3 COMPLETE + MAJOR REFACTORINGS**: ✅ Ready for Review

This PR represents a comprehensive update combining multiple features and improvements:

1. ✅ **Phase 3: Shopping Cart** - Stateful mocks fully implemented
2. ✅ **Unified Type-Safe API** - Consistent API across all adapters
3. ✅ **Schema-First Architecture** - Zod schemas as single source of truth
4. ✅ **Playwright Fixture Improvements** - Guaranteed unique test IDs
5. ✅ **Dead Code Removal** - x-mock-enabled header feature removed
6. ✅ **Test Selector Improvements** - Semantic data-testid selectors
7. ✅ **Documentation Updates** - Self-contained adapter READMEs

**Impact**:
- **372 tests passing** across all packages (Core: 159, MSW: 35, Express: 34, Express Example: 49, Next.js: 62, Playwright: 23, Example: 10)
- TypeScript strict mode satisfied
- 100% test coverage maintained
- All functionality working

**Status**: ✅ PR #44 updated with complete documentation, awaiting review

**Quick API Comparison (Before → After)**:

```typescript
// BEFORE: Imperative registration, no type safety
const scenarist = createScenarist({
  defaultScenario: scenarios.cartWithState,
  // ...
});
scenarist.registerScenario(scenarios.premiumUser);
scenarist.registerScenario(scenarios.standardUser);

await setScenario(page, 'premiumUser'); // ❌ No autocomplete, runtime error if typo

// AFTER: Upfront registration, full type safety
const scenarist = createScenarist({
  scenarios, // Object with all scenarios
  // ...
});

const test = withScenarios(scenarios); // Type-safe fixture creation
test('my test', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser'); // ✅ Autocomplete + compile-time checking!
});
```

---

## Phase 3 - Shopping Cart with Stateful Mocks ✅ COMPLETE

### Goal
Implement shopping cart demonstrating state capture and injection in a real-world scenario.

### What Was Implemented

**Shopping Cart Feature:**
- ✅ Cart count badge in header (updates in real-time)
- ✅ Add-to-cart buttons on product cards
- ✅ `/cart` page displaying cart items with quantities
- ✅ Cart persistence across page navigation
- ✅ Item quantity aggregation (2x Product A, 1x Product B)

**API Routes:**
- ✅ `GET /api/cart` - Fetch cart items (state injection)
- ✅ `POST /api/cart/add` - Add item to cart (state capture)

**Scenarist Features Demonstrated:**
- ✅ State capture with array append: `captureState: { 'cartItems[]': 'body.productId' }`
- ✅ Template injection: `items: '{{state.cartItems}}'`
- ✅ State isolation per test ID (parallel test support)
- ✅ Empty state handling (graceful degradation)

**Tests:**
- ✅ 4 comprehensive Playwright E2E tests
- ✅ Tests cover: add, accumulate, display, persist
- ✅ Proper test isolation via fixtures
- ✅ All tests passing with parallel execution

### Tasks Completed - RED-GREEN-REFACTOR

**Phase 3a: RED - Playwright Tests**
- [x] Create `tests/playwright/shopping-cart.spec.ts` ✅
- [x] Test: "add product to cart shows item count" ✅
- [x] Test: "add multiple products accumulates cart" ✅
- [x] Test: "cart displays correct products and quantities" ✅
- [x] Test: "cart persists across page navigation" ✅
- [x] Confirm RED state (failures expected) ✅
- [x] Commit: `c925187` - test(phase-3a): add failing tests ✅

**Phase 3b: GREEN - Shopping Cart Implementation**
- [x] Create `pages/cart.tsx` - Cart display page ✅
- [x] Update `pages/index.tsx` - Add "Add to Cart" buttons + cart count ✅
- [x] Create `pages/api/cart.ts` - GET endpoint to fetch cart ✅
- [x] Create `pages/api/cart/add.ts` - POST endpoint to add items ✅
- [x] Update `lib/scenarios.ts` - Add `cartWithState` scenario ✅
- [x] Fix Product ID type mismatch (string → number) ✅
- [x] All tests passing (4/4 GREEN) ✅
- [x] Commit: `9a246d0` - fix product ID type mismatch ✅

**Phase 3c: Bug Fixes & Improvements**
- [x] Fix parallel test isolation bug (Date.now() → UUID) ✅
- [x] Implement Playwright fixtures for guaranteed test IDs ✅
- [x] Commit: `11dbd1a` - fix parallel test isolation ✅

**Future Phases (Not Included in Phase 3):**
- Query parameter matching demonstration → Phase 4
- Combined matching (body + headers + query) → Phase 4
- Default scenario fallback → Phase 4
- Multiple API mocking → Phase 5
- [ ] Nested state paths
- [ ] Analytics service (second API)

**Phase 3c: REFACTOR - Code Quality**
- [ ] Extract Cart types (`CartItem`, `Cart`, `CartMetadata`)
- [ ] Extract Analytics types (`AnalyticsEvent`)
- [ ] Assess DRY violations
- [ ] Improve naming/clarity if needed
- [ ] Tests still passing after refactoring
- [ ] Commits: `refactor(phase-3c): [description]`

**Phase 3d: DOCUMENTATION**
- [ ] Update TESTING.md if needed
- [ ] Document stateful mock patterns
- [ ] Document multi-API mocking approach
- [ ] Update capability coverage matrix in WIP.md
- [ ] Update plan document
- [ ] Commit: `docs(phase-3d): document shopping cart + multi-API patterns`

### Key Scenarist Features Demonstrated

**Phase 3 (Stateful Mocks):**
- **State Capture**: `captureState` from request body (productId, quantity)
- **State Injection**: `{{cart.items}}` templates in responses
- **Array Append**: `cart.items[]` for accumulating cart items
- **Nested State Paths**: `cart.metadata.userId` for complex state structures
- **State Persistence**: Cart state maintained across requests

**Phase 1 (Request Matching) - Additional Coverage:**
- **Query Parameter Matching**: Filter cart items by `?tier=premium`
- **Combined Matching**: Body + headers + query together
- **Default Scenario Fallback**: No match criteria → fallback mock

**Core Features:**
- **Multiple API Mocking**: Cart service `/api/cart/*` + Analytics service `/api/analytics/*`
- **Test Isolation**: Each test ID has independent cart + analytics state

---

## Completed This Session

_Updated: 2025-11-02_

### Unified Type-Safe API Migration (Just Completed)
- **Duration**: ~4-6 hours
- **Impact**: All packages + all examples + all tests + all documentation
- **Key Achievements**:
  1. ✅ Added `ScenariosObject` and `ScenarioIds<T>` types to core package
  2. ✅ Updated Express adapter to accept `scenarios` object (breaking change)
  3. ✅ Updated Next.js adapter to accept `scenarios` object (breaking change)
  4. ✅ Added `withScenarios()` function to Playwright helpers for type-safe fixtures
  5. ✅ Updated Express example app with new API pattern
  6. ✅ Updated Next.js example app with new API pattern
  7. ✅ Updated ALL adapter tests (Express: 37, Next.js: 68)
  8. ✅ Updated ALL example tests (Express: 49 E2E tests)
  9. ✅ Comprehensive documentation updates:
     - Express adapter README (complete rewrite of API examples)
     - Next.js adapter README (unified setup section)
     - Core package README (new types documented)
     - Playwright helpers README (new `withScenarios()` API)
     - Main project README (updated examples)
  10. ✅ All 359 tests passing across all packages

**Benefits Achieved**:
- **Type Safety**: Scenario IDs now autocomplete in IDEs with TypeScript inference
- **API Consistency**: Express, Next.js, and Playwright helpers now use identical patterns
- **Better DX**: Upfront scenario registration (no more imperative `registerScenario` calls)
- **Compile-Time Errors**: Invalid scenario IDs caught at compile time, not runtime
- **Simpler Setup**: One `scenarios` object instead of `defaultScenario` + multiple `registerScenario()` calls

**Files Changed**: 36 files modified, 1501 insertions, 987 deletions

**Next Actions**:
1. Commit this work as a major API improvement
2. Resume Phase 3 (Shopping Cart) implementation
3. Consider documenting this as an ADR for the API design decision

**Key Technical Insights**:

1. **TypeScript Type Inference Magic**: The `as const satisfies ScenariosObject` pattern enables TypeScript to:
   - Extract literal scenario IDs from object keys: `'cartWithState' | 'premiumUser' | ...`
   - Provide autocomplete in IDEs for scenario names
   - Catch typos at compile time instead of runtime

2. **Breaking Changes with Migration Path**: This was a breaking change, but worth it for:
   - Better developer experience (autocomplete, type safety)
   - Simpler API (one `scenarios` object vs `defaultScenario` + multiple `registerScenario()`)
   - Consistency across all adapters

3. **Testing Strategy for Breaking Changes**:
   - Updated ALL tests first (Express adapter: 37 tests, Next.js adapter: 68 tests)
   - Verified example apps work (Express: 49 E2E tests)
   - Ensured documentation reflects new patterns
   - All 359 tests passing before commit

4. **Playwright Fixtures Pattern**: The `withScenarios()` function creates a type-safe test object:
   ```typescript
   export const test = withScenarios(scenarios); // Returns test object with typed switchScenario
   ```
   This pattern enables fixture composition and maintains type safety.

5. **Documentation Updates Critical**: Changed 5 README files to ensure users see the new API:
   - Core package README (new types)
   - Express adapter README (complete API rewrite)
   - Next.js adapter README (unified setup)
   - Playwright helpers README (`withScenarios()` API)
   - Main project README (updated examples)

---

## Session Log

### Phase -1: Next.js Adapter (MERGED - PR #40)
- **Completed**: 2025-11-01 (1 day)
- **Key Learnings**: Coverage verification mandatory, 100% rule non-negotiable, factory pattern success

### Phase 0: Infrastructure Setup (MERGED - PR #41)
- **Completed**: 2025-11-01 (0.5 day)
- **Key Learnings**: Scaffolding smooth, TypeScript strict mode throughout

### Phase 1: Scenarist Integration + First Helper (MERGED - PR #42)
- **Completed**: 2025-11-01 (3 commits, ~0.5 day)
- **Key Learnings**: API route convention, scenario registration critical, 77% code reduction, 50% faster than estimated

### Phase 1 Post: Playwright Helpers Testing (MERGED)
- **Completed**: 2025-11-02 (5 commits, ~2-3 hours)
- **Key Learnings**: Two-layer testing essential, real Playwright > mocked, framework-agnostic testing, 13 tests in 1.7s

### Phase 2: Products Page - Request Matching (MERGED - PR #43)
- **Completed**: 2025-11-02 (15 commits, ~1 day across multiple sessions)
- **Status**: ✅ Merged to main
- **Key Deliverables**:
  - RED Phase: 3 failing E2E tests for products page
  - GREEN Phase: Product catalog with tier-based pricing
  - REFACTOR Phase: Extracted types and data modules (DRY)
  - Documentation: ADR-0007, READMEs, TESTING.md, core docs
  - Fixes: MSW adapter signature, test ID extraction, Playwright config
  - Infrastructure: `getScenaristHeaders()` helper with 6 tests
  - Testing: All 152 tests passing (5 E2E + 147 package tests)
- **Key Learnings**:
  - MSW adapter signature change for Next.js compatibility
  - Framework-specific header forwarding patterns (ADR-0007)
  - Example apps vs production standards (TESTING.md)
  - Test ID extraction from intercepted requests
  - Header forwarding: AsyncLocalStorage (Express) vs Request Headers (Next.js)

### Phase 3: Shopping Cart - Stateful Mocks (IN PROGRESS)
- **Started**: 2025-11-02
- **Status**: Paused for API migration, resuming after commit
- **Branch**: `feat/phase-3-shopping-cart`

### API Migration (COMPLETED - 2025-11-02)
- **Duration**: ~4-6 hours
- **Scope**: All packages, all examples, all tests, all documentation
- **Status**: ✅ Complete - ready for commit
- **Impact**: Breaking API change with major DX improvements
- **Key Deliverables**:
  - Type-safe scenario IDs with autocomplete
  - Unified API across all adapters
  - `withScenarios()` function for Playwright helpers
  - Comprehensive documentation updates
  - All 359 tests passing

---

## Metrics

**Time**: 3.5/9-10 days (~38% time, 50% work - ahead by 12%)
**Tests**: 359 passing (54 E2E + 305 package tests)
  - Core: 157 tests
  - MSW adapter: 35 tests
  - Express adapter: 37 tests
  - Next.js adapter: 68 tests
  - Playwright helpers: 13 tests
  - Express example: 49 E2E tests
**Phases Complete**: 5.5 of 11 (50% - API migration counts as 0.5 phase)
**PRs Merged**: 5 (Phase -1, Phase 0, Phase 1, Phase 1 Post, Phase 2)
**PRs Pending**: 1 (API Migration - ready to commit)
**Quality**: 0 TS errors, 0 lint warnings, architecture verified
**Coverage**: 100% on adapters, comprehensive E2E coverage
**Capability Coverage**: 30% demonstrated (6/20 core capabilities)

---

## Capability Coverage Matrix

This section tracks which Scenarist capabilities are implemented in core packages vs. demonstrated in the Next.js example app.

### Legend
- ✅ **Demonstrated** - Implemented AND explicitly shown in Next.js example with E2E tests
- ⏳ **In Progress** - Implementation exists, adding to example now
- 🔜 **Planned** - Implementation exists, planned for future phase
- ⚠️ **Used but Implicit** - Working but not explicitly demonstrated
- ❌ **Not Demonstrated** - Implementation exists but not shown in example

---

### Phase 1: Request Content Matching

| Capability | Core Status | Example Status | Phase | Notes |
|------------|-------------|----------------|-------|-------|
| Body matching | ✅ Implemented | ✅ Demonstrated | Phase 2 | Tier-based pricing (`tier: "premium"`) |
| Header matching | ✅ Implemented | ✅ Demonstrated | Phase 2 | `x-user-tier` header |
| Query parameter matching | ✅ Implemented | ⏳ In Progress | Phase 3 | Filter cart items by `?tier=premium` |
| Combined matching (all 3) | ✅ Implemented | ⏳ In Progress | Phase 3 | Body + headers + query together |
| Specificity-based selection | ✅ Implemented | ⏳ In Progress | Phase 3 | Explicit test showing "more specific wins" |
| Fallback mocks (no match criteria) | ✅ Implemented | ⏳ In Progress | Phase 3 | Explicit "no match → fallback" test |

**Phase 1 Coverage: 33% → 100% after Phase 3** (2/6 → 6/6) - Phase 3 completes all Phase 1 gaps

---

### Phase 2: Response Sequences

| Capability | Core Status | Example Status | Phase | Notes |
|------------|-------------|----------------|-------|-------|
| Basic sequence (ordered responses) | ✅ Implemented | 🔜 Planned | Phase 5 | Payment processing flow |
| Repeat mode: `last` | ✅ Implemented | 🔜 Planned | Phase 5 | Payment settled state |
| Repeat mode: `cycle` | ✅ Implemented | 🔜 Planned | Phase 5 | Status polling |
| Repeat mode: `none` (exhaustion) | ✅ Implemented | 🔜 Planned | Phase 5 | Rate limiting |
| Sequence + match criteria | ✅ Implemented | 🔜 Planned | Phase 5 | Premium-only sequence |

**Phase 2 Coverage: 0% demonstrated (0/5)** - Phase 5 will add payment processing sequences

---

### Phase 3: Stateful Mocks

| Capability | Core Status | Example Status | Phase | Notes |
|------------|-------------|----------------|-------|-------|
| State capture (request → state) | ✅ Implemented | ⏳ In Progress | Phase 3 | Shopping cart add items |
| State injection (state → response) | ✅ Implemented | ⏳ In Progress | Phase 3 | Display cart contents |
| Array append `[]` syntax | ✅ Implemented | ⏳ In Progress | Phase 3 | Cart items array |
| Nested state paths | ✅ Implemented | ⏳ In Progress | Phase 3 | `cart.metadata.userId` example added |
| Multiple state sources | ✅ Implemented | 🔜 Planned | Phase 4 | Cart + user profile state (next phase) |

**Phase 3 Coverage: 60% → 80% after Phase 3** (3/5 → 4/5) - Only "multiple state sources" deferred to Phase 4

---

### Core Features (Architecture)

| Capability | Core Status | Example Status | Phase | Notes |
|------------|-------------|----------------|-------|-------|
| Multiple API mocking | ✅ Implemented | ⏳ In Progress | Phase 3 | Cart service + Analytics service |
| Default scenario | ✅ Implemented | ⏳ In Progress | Phase 3 | Explicit fallback test added |
| Test isolation (test IDs) | ✅ Implemented | 🔜 Planned | Phase 6 | Need parallel test verification |
| Scenario switching | ✅ Implemented | ✅ Demonstrated | Phase 2 | `setScenario()` helper works |

**Core Coverage: 25% → 75% after Phase 3** (1/4 → 3/4) - Only "test isolation" deferred to Phase 6

---

### Overall Capability Coverage

**Current Status:**
- **Demonstrated**: 6 (30%)
- **In Progress (Phase 3)**: 10 (50%) ← Phase 3 addresses 10 capabilities!
- **Planned (Phase 4-6)**: 4 (20%)

**After Phase 3 Completes:**
- **Demonstrated**: 16 (80%) ← Massive jump from 30%!
- **Remaining**: 4 (20%) - sequences (5 in Phase 5) + test isolation (1 in Phase 6) - multiple state sources (1 in Phase 4)

**Total Capabilities**: 20
**Target by Phase 8**: 100% demonstrated (all 20 capabilities explicitly shown and verified)

---

### Gaps to Address

**Phase 3 Will Address (10 capabilities):**
1. ⏳ **Multiple APIs** - Cart service + Analytics service
2. ⏳ **Query parameter matching** - Filter cart items by `?tier=premium`
3. ⏳ **Combined matching** - Body + headers + query together
4. ⏳ **Default scenario fallback** - Explicit "no match → fallback" test
5. ⏳ **Specificity selection** - Explicit "more specific wins" test
6. ⏳ **Nested state paths** - `cart.metadata.userId` example
7. ⏳ **State capture** - Shopping cart add items
8. ⏳ **State injection** - Display cart contents
9. ⏳ **Array append []** - Cart items array
10. ⏳ **Default scenario** - Explicit test of default scenario behavior

**Phase 4 Will Address (1 capability):**
11. 🔜 **Multiple state sources** - Cart + user profile state

**Phase 5 Will Address (5 capabilities):**
12-16. 🔜 **All sequence capabilities** - Basic, repeat: last/cycle/none, sequence + match

**Phase 6 Will Address (1 capability):**
17. 🔜 **Test isolation** - Parallel test verification

**Phase 8 Will Verify:**
18-20. ✅ **All 20 capabilities explicitly demonstrated** - Final audit and verification

---

## Next Steps

### Immediate Actions (Phase 3a - RED)
1. **Create feature branch**: `git checkout -b feat/phase-3-shopping-cart`
2. **Write failing tests**: Create `tests/playwright/shopping-cart.spec.ts`
   - Test: "add product to cart shows item count"
   - Test: "add multiple products accumulates cart"
   - Test: "cart displays correct products and quantities"
   - Test: "cart persists across page navigation"
3. **Confirm RED state**: All tests should fail (no implementation yet)
4. **Commit RED phase**: `test(phase-3a): add failing tests for shopping cart stateful mocks (RED)`

### After RED Phase Complete
5. **Phase 3b - GREEN**: Implement shopping cart functionality
   - Create cart pages and components
   - Create API routes (add, get)
   - Add stateful scenarios to `lib/scenarios.ts`
   - All tests passing

6. **Phase 3c - REFACTOR**: Code quality improvements
   - Extract types, assess DRY violations
   - Improve naming/clarity

7. **Phase 3d - DOCUMENTATION**: Document patterns and learnings

### Remaining Phases (After Phase 3)

**Phase 4: Checkout Flow + Multiple State Sources**
- Checkout form with user profile + cart state
- Demonstrate combining multiple state sources
- Address "Multiple state sources" gap (Phase 3 capability)

**Phase 5: Payment Processing + Sequences**
- Payment flow with sequences (pending → processing → complete)
- Demonstrate all 5 sequence capabilities:
  - Basic sequence, repeat: last, repeat: cycle, repeat: none, sequence + match
- Address all Phase 2 capability gaps

**Phase 6: Test Isolation Verification**
- Parallel test execution with independent state
- Explicit test ID isolation demonstration
- Address "Test isolation" core capability gap

**Phase 7: Documentation & Polish**
- README updates
- Example documentation
- Final polish

**Phase 8: Capability Coverage Verification (NEW)**
- Comprehensive audit of all 20 capabilities
- Verify 100% demonstration coverage
- Create final capability checklist
- Ensure no gaps remain

---

## Phase 8 Plan - Capability Coverage Verification

### Goal
Verify that ALL 20 Scenarist core capabilities are explicitly demonstrated in the Next.js example app with E2E tests. This is the final quality gate before considering the example complete.

### Verification Checklist

**Phase 1: Request Content Matching (6 capabilities)**
- [ ] Body matching - Explicit test demonstrating body criteria
- [ ] Header matching - Explicit test demonstrating header criteria
- [ ] Query parameter matching - Explicit test demonstrating query criteria
- [ ] Combined matching (all 3) - Test using body + headers + query together
- [ ] Specificity-based selection - Test showing "more specific wins"
- [ ] Fallback mocks - Test showing "no match → fallback"

**Phase 2: Response Sequences (5 capabilities)**
- [ ] Basic sequence - Ordered responses advancing on each call
- [ ] Repeat mode: last - Sequence exhausts, repeats final response
- [ ] Repeat mode: cycle - Sequence cycles back to first response
- [ ] Repeat mode: none - Sequence exhausts, returns error/fallback
- [ ] Sequence + match criteria - Sequence only advances when matching

**Phase 3: Stateful Mocks (5 capabilities)**
- [ ] State capture - Request data captured to state store
- [ ] State injection - State injected into response templates
- [ ] Array append [] - State appended to array (cart items)
- [ ] Nested state paths - Deep state paths (e.g., cart.metadata.userId)
- [ ] Multiple state sources - Combining state from multiple captures

**Core Features (4 capabilities)**
- [ ] Multiple API mocking - 2+ distinct APIs mocked (cart + analytics)
- [ ] Default scenario - Explicit test of default scenario behavior
- [ ] Test isolation - Parallel tests with independent state
- [ ] Scenario switching - Runtime scenario switching via helper

### Verification Tasks

**Task 1: Audit Current Coverage**
- [ ] Review all E2E tests
- [ ] Check coverage matrix against actual tests
- [ ] Identify any missing demonstrations
- [ ] Document gaps

**Task 2: Add Missing Tests (if any)**
- [ ] Write tests for any gaps found
- [ ] Ensure explicit assertion for each capability
- [ ] Add descriptive test names showing capability

**Task 3: Update Documentation**
- [ ] Update capability coverage matrix to 100%
- [ ] Document where each capability is demonstrated
- [ ] Create capability → test mapping
- [ ] Update README with capability showcase

**Task 4: Final Verification**
- [ ] Run all E2E tests (should be 20+ tests covering all capabilities)
- [ ] Verify each capability has at least one explicit test
- [ ] Confirm no implicit-only capabilities remain
- [ ] Mark Phase 8 complete

### Success Criteria

- ✅ All 20 capabilities have explicit E2E tests
- ✅ Capability coverage matrix shows 100% demonstrated
- ✅ Each capability has clear test → implementation mapping
- ✅ No "⚠️ Used but Implicit" or "❌ Not Demonstrated" statuses remain
- ✅ Documentation clearly shows where each capability is demonstrated

---

## Blockers

**Current**: None

---

## Quick Links

- **Plan**: [docs/plans/nextjs-pages-and-playwright-helpers.md](docs/plans/nextjs-pages-and-playwright-helpers.md)
- **Roadmap**: [docs/plans/next-stages.md](docs/plans/next-stages.md)
- **Branch**: `feat/phase-3-shopping-cart` (to be created)
- **Previous PR**: Phase 2 - https://github.com/citypaul/scenarist/pull/43 (merged)

### Phase 3 Target Files
**Tests (to be created):**
- `tests/playwright/shopping-cart.spec.ts` - E2E tests for cart

**UI (to be created):**
- `pages/cart.tsx` - Cart display page
- `components/CartSummary.tsx` - Cart header widget
- `components/CartItem.tsx` - Individual cart item

**API Routes (to be created):**
- `pages/api/cart/add.ts` - POST to add items
- `pages/api/cart/get.ts` - GET to fetch cart

**Scenarios (to be updated):**
- `lib/scenarios.ts` - Add cart scenarios with `captureState` and state injection

### Phase 2 Key Files (Merged)
- Tests: `tests/playwright/products.spec.ts`, `products.baseline.spec.ts`
- UI: `pages/index.tsx`, `components/ProductCard.tsx`, `components/TierSelector.tsx`
- Data: `data/products.ts`, `types/product.ts`
- Scenarios: `lib/scenarios.ts` (premiumUser, standardUser)
- Helpers: `packages/nextjs-adapter/src/pages/helpers.ts`
- Docs: `docs/adrs/0007-framework-specific-header-helpers.md`, `TESTING.md`
