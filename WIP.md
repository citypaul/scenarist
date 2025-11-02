# Work In Progress - Next.js Pages Router + Playwright Helpers

**Last Updated**: 2025-11-02
**Branch**: feat/phase-2-products-matching (15 commits ahead of main)
**Overall Progress**: 40% complete (4 of 10 phases)

---

## Current Focus

**Phase 2: Products Page - Request Matching** ✅ COMPLETE

Full RED-GREEN-REFACTOR cycle complete with comprehensive documentation. Ready for PR review.

**Status**: ✅ Complete (15 commits - RED → GREEN → REFACTOR → DOCS)

---

## Phase 2 Infrastructure - COMPLETE

### Architecture Fix - MSW Interception Verification
- ✅ Modified `/apps/nextjs-pages-example/pages/api/products.ts` to fetch from json-server
- ✅ Proves Scenarist MSW intercepts real HTTP requests (not just mocking)
- ✅ Committed: "fix(architecture): API route now fetches from json-server for real MSW interception"

### MSW Import Resolution
- ✅ Fixed MSW import error without transpilePackages config
- ✅ Removed scenarist from `_app.tsx` (client/server boundary issue)
- ✅ Import scenarist only in API routes (server-only)
- ✅ Committed: "fix(msw): resolve MSW import without requiring transpilePackages"

### Playwright Configuration
- ✅ Added json-server to webServer array
- ✅ Updated smoke test expectations (product cards)
- ✅ Committed: "fix(tests): configure Playwright to start json-server and update smoke test"

### Helper Function - `getScenaristHeaders`
- ✅ Created `/packages/nextjs-adapter/src/pages/helpers.ts`
- ✅ Helper extracts and forwards `x-test-id` header
- ✅ Respects user configuration (custom headers, default test ID)
- ✅ Handles Next.js-specific request types
- ✅ Added 6 comprehensive tests
- ✅ Committed: "feat(nextjs-adapter): add getScenaristHeaders helper for Pages Router"

### Analysis Complete
- ✅ Express vs Next.js pattern comparison
- ✅ Express uses AsyncLocalStorage (no manual forwarding)
- ✅ Next.js requires manual forwarding via helper
- ✅ Express example verified correct (no changes needed)

**Tests**: 72 passing (including 6 new helper tests)
**Architecture**: Correctly proves MSW interception of real HTTP requests

---

## Phase 2 Complete Summary

### Phase 2a: RED - Playwright Tests ✅
- ✅ Created `tests/playwright/products.spec.ts` and `products.baseline.spec.ts`
- ✅ Test: "premium user sees premium pricing (£99.99)"
- ✅ Test: "standard user sees standard pricing (£149.99)"
- ✅ Test: "baseline without Scenarist shows json-server data"
- ✅ Confirmed RED state (failures as expected)
- ✅ Commit: `b40fa66 test(phase-2a): add failing tests for products page request matching (RED)`

### Phase 2b: GREEN - Products Feature Implementation ✅
- ✅ Updated `pages/api/products.ts` - Uses `getScenaristHeaders()` for test ID forwarding
- ✅ Created `pages/index.tsx` - Product listing page with tier display
- ✅ Created `components/ProductCard.tsx` - Displays price, name, category
- ✅ Created `components/TierSelector.tsx` - Toggle between premium/standard
- ✅ Updated `lib/scenarios.ts` - Added premiumUser and standardUser with header matching
- ✅ All 5 E2E tests passing (100% GREEN)
- ✅ Commit: `abb05ee feat(phase-2b): implement products page with tier-based pricing (GREEN)`

### Phase 2c: REFACTOR - Code Quality Improvements ✅
- ✅ Extracted Product type to `types/product.ts`
- ✅ Extracted product catalog to `data/products.ts` (DRY principle)
- ✅ Tests still passing after refactoring
- ✅ Commits:
  - `90c0f49 refactor(phase-2c): extract Product type to shared types file`
  - `92a471b refactor(phase-2c): extract product catalog to shared data module`

### Phase 2 Documentation & Fixes ✅
- ✅ Created ADR-0007 for framework-specific header helpers
- ✅ Updated Next.js adapter README (Making External API Calls section)
- ✅ Updated Express adapter README (Automatic Test ID Propagation section)
- ✅ Updated core functionality docs (Test ID Propagation Patterns)
- ✅ Created TESTING.md for example app standards (AI reviewer guidance)
- ✅ Fixed MSW adapter signature for Next.js compatibility
- ✅ Added `test:e2e:ui` script for visual testing
- ✅ Commits:
  - `d27e4e1 docs: add ADR-0007 and update docs for framework-specific header forwarding`
  - `9e44821 fix(msw-adapter): extract test ID from request headers for Next.js compatibility`
  - `bc6cafb feat(tests): add test:e2e:ui script for visual Playwright testing`
  - `0f2b378 docs(examples): add TESTING.md clarifying example app standards`

---

## Completed This Session

_Updated: 2025-11-02 (multiple sessions)_

### Phase 2 Complete - All Work
- ✅ **RED Phase**: Created 3 failing E2E tests for products page
- ✅ **GREEN Phase**: Implemented product catalog with tier-based pricing
- ✅ **REFACTOR Phase**: Extracted types and data modules (DRY)
- ✅ **Documentation**: ADR-0007, READMEs, TESTING.md, core docs
- ✅ **Fixes**: MSW adapter signature, test ID extraction, Playwright config
- ✅ **Infrastructure**: `getScenaristHeaders()` helper with 6 tests
- ✅ **Testing**: All 152 tests passing (5 E2E + 147 package tests)
- ✅ **Pushed**: 15 commits to `feat/phase-2-products-matching` branch

### Blockers Encountered
- MSW import issues (resolved: server-only imports)
- Test ID propagation for Next.js (resolved: extract from request headers in MSW handler)
- AI reviewer misunderstanding example code (resolved: TESTING.md documentation)

### Key Learnings
- **Framework Differences**: Next.js lacks middleware → manual forwarding via helper
- **MSW Integration**: Test ID must be extracted from intercepted request headers
- **DynamicHandler Signature**: Changed from `getTestId: () => string` to `getTestId: (request: Request) => string`
- **Example vs Production**: Different standards (documented in TESTING.md)
- **Header Forwarding**: Framework-specific patterns (ADR-0007)
- **Test ID Propagation**: AsyncLocalStorage (Express) vs Request Headers (Next.js)

---

## Session Log

### Phase -1: Next.js Adapter (MERGED)
- **Completed**: 2025-11-01 (PR #40, 1 day)
- **Key Learnings**: Coverage verification mandatory, 100% rule non-negotiable, factory pattern success

### Phase 0: Infrastructure Setup (MERGED)
- **Completed**: 2025-11-01 (PR #41, 0.5 day)
- **Key Learnings**: Scaffolding smooth, TypeScript strict mode throughout

### Phase 1: Scenarist Integration + First Helper (MERGED)
- **Completed**: 2025-11-01 (PR #42, 3 commits, ~0.5 day)
- **Key Learnings**: API route convention, scenario registration critical, 77% code reduction, 50% faster than estimated

### Phase 1 Post: Playwright Helpers Testing (MERGED)
- **Completed**: 2025-11-02 (5 commits, ~2-3 hours)
- **Key Learnings**: Two-layer testing essential, real Playwright > mocked, framework-agnostic testing, 13 tests in 1.7s

### Phase 2: Products Page - Request Matching (COMPLETE)
- **Completed**: 2025-11-02 (15 commits, ~1 day across multiple sessions)
- **Status**: ✅ Complete (RED → GREEN → REFACTOR → DOCS)
- **Key Learnings**:
  - MSW adapter signature change for Next.js compatibility
  - Framework-specific header forwarding patterns (ADR-0007)
  - Example apps vs production standards (TESTING.md)
  - Test ID extraction from intercepted requests

---

## Metrics

**Time**: 3/8-9 days (33% time, 40% work - ahead by 7%)
**Tests**: 152 passing (5 E2E + 147 package)
**Files**: 80+ changed across all phases (15+ new in Phase 2)
**Quality**: 0 TS errors, 0 lint warnings, architecture verified
**Coverage**: 100% on adapters, comprehensive E2E coverage

---

## Next Steps

1. **Phase 2 COMPLETE** ✅
   - All RED-GREEN-REFACTOR-DOCS tasks complete
   - Ready for PR review and merge

2. **Immediate**: Assess additional refactoring opportunities
   - Run refactor-scan agent to check for improvements
   - Review code quality post-completion
   - Consider any DRY violations or clarity improvements

3. **After Phase 2 Merge**: Continue with remaining phases
   - Phase 3: Shopping Cart
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
- **Branch**: `feat/phase-2-products-matching` (15 commits)
- **PR**: Ready for review - https://github.com/citypaul/scenarist/pull/43
- **Key Files**:
  - Tests: `tests/playwright/products.spec.ts`, `products.baseline.spec.ts`
  - UI: `pages/index.tsx`, `components/ProductCard.tsx`, `components/TierSelector.tsx`
  - Data: `data/products.ts`, `types/product.ts`
  - Scenarios: `lib/scenarios.ts` (premiumUser, standardUser)
  - Helpers: `packages/nextjs-adapter/src/pages/helpers.ts`
  - Docs: `docs/adrs/0007-framework-specific-header-helpers.md`, `TESTING.md`
