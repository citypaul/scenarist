# Work In Progress - Next.js Pages Router + Playwright Helpers

**Last Updated**: 2025-11-02
**Branch**: feat/phase-3-shopping-cart
**Overall Progress**: 50% complete (5 of 10 phases)

---

## Current Focus

**Phase 3: Shopping Cart - Stateful Mocks** 🔄 IN PROGRESS

Implementing shopping cart functionality with state capture (adding items) and state injection (displaying cart contents). This demonstrates Scenarist's stateful mock capabilities.

**Status**: Starting RED phase
**Tests Passing**: N/A (no tests yet)
**Last Commit**: N/A (fresh branch)

---

## Phase 3 Plan - Stateful Mocks

### Goal
Implement shopping cart with state capture (adding items) and state injection (displaying cart contents). This demonstrates Scenarist's Phase 3 stateful mock capabilities.

### Tasks - RED-GREEN-REFACTOR

**Phase 3a: RED - Playwright Tests**
- [ ] Create `tests/playwright/shopping-cart.spec.ts`
- [ ] Test: "add product to cart shows item count"
- [ ] Test: "add multiple products accumulates cart"
- [ ] Test: "cart displays correct products and quantities"
- [ ] Test: "cart persists across page navigation"
- [ ] Confirm RED state (failures expected)
- [ ] Commit: `test(phase-3a): add failing tests for shopping cart stateful mocks (RED)`

**Phase 3b: GREEN - Shopping Cart Implementation**
- [ ] Create `pages/cart.tsx` - Cart display page
- [ ] Create `components/CartSummary.tsx` - Cart header widget
- [ ] Create `components/CartItem.tsx` - Individual cart item display
- [ ] Update `pages/index.tsx` - Add "Add to Cart" buttons
- [ ] Create `pages/api/cart/add.ts` - POST endpoint to add items
- [ ] Create `pages/api/cart/get.ts` - GET endpoint to fetch cart
- [ ] Update `lib/scenarios.ts` - Add cart scenarios with state capture/injection
- [ ] All tests passing (100% GREEN)
- [ ] Commit: `feat(phase-3b): implement shopping cart with stateful mocks (GREEN)`

**Phase 3c: REFACTOR - Code Quality**
- [ ] Extract Cart types (`CartItem`, `Cart`)
- [ ] Assess DRY violations
- [ ] Improve naming/clarity if needed
- [ ] Tests still passing after refactoring
- [ ] Commits: `refactor(phase-3c): [description]`

**Phase 3d: DOCUMENTATION**
- [ ] Update TESTING.md if needed
- [ ] Document stateful mock patterns
- [ ] Update plan document
- [ ] Commit: `docs(phase-3d): document shopping cart stateful patterns`

### Key Scenarist Features Demonstrated
- **State Capture**: `captureState` from request body (productId, quantity)
- **State Injection**: `{{cart.items}}` templates in responses
- **State Persistence**: Cart state maintained across requests
- **Test Isolation**: Each test ID has independent cart state

---

## Completed This Session

_Updated: 2025-11-02_

### Branch Setup
- ✅ Phase 2 merged to main (PR #43)
- ✅ WIP.md updated for Phase 3
- ⏳ Ready to create `feat/phase-3-shopping-cart` branch

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
- **Status**: Starting RED phase
- **Branch**: `feat/phase-3-shopping-cart` (to be created)

---

## Metrics

**Time**: 3/8-9 days (33% time, 50% work - ahead by 17%)
**Tests**: 152 passing (5 E2E + 147 package)
**Phases Complete**: 5 of 10 (50%)
**PRs Merged**: 5 (Phase -1, Phase 0, Phase 1, Phase 1 Post, Phase 2)
**Quality**: 0 TS errors, 0 lint warnings, architecture verified
**Coverage**: 100% on adapters, comprehensive E2E coverage

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
- Phase 4: Checkout Flow
- Phase 5: Payment Processing
- Phase 6: Test Isolation Verification
- Phase 7: Documentation & Polish

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
