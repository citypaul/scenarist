# Work In Progress - Next.js Pages Router + Playwright Helpers

**Last Updated**: 2025-11-02
**Branch**: feat/phase-2-products-matching (4 commits ahead of main)
**Overall Progress**: 40% complete (4 of 10 phases)

---

## Current Focus

**Phase 2: Products Page - Request Matching** ✅ COMPLETE

Architecture and foundation work completed. Ready for implementation of product catalog UI and scenarios.

**Status**: ✅ Infrastructure Complete (4 commits)

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

## Phase 2 Remaining Tasks

### Phase 2a: RED - Write Playwright Tests
- [ ] Create `tests/playwright/products.spec.ts`
- [ ] Write test: "premium user sees premium pricing"
- [ ] Write test: "standard user sees standard pricing"
- [ ] Run tests, confirm RED (failures expected)
- [ ] Commit: "test(products): add failing tests for premium/standard pricing (RED)"

### Phase 2b: GREEN - Implement Products Feature
- [ ] Update `pages/api/products.ts` - Use `getScenaristHeaders()` for forwarding
- [ ] Create `pages/index.tsx` - Product listing page
- [ ] Create `components/ProductCard.tsx` - Display individual product
- [ ] Create `components/TierSelector.tsx` - Toggle premium/standard
- [ ] Update `lib/scenarios.ts` - Add premiumUser and standardUser scenarios with match criteria
- [ ] Run tests, confirm GREEN (all tests pass)
- [ ] Commit: "feat(products): implement products page with tier-based pricing (GREEN)"

### Phase 2c: REFACTOR - Improve Code Quality
- [ ] **Agent Checkpoint**: Run `refactor-scan` agent to assess opportunities
- [ ] If valuable refactorings identified:
  - [ ] Extract product types to `types/product.ts`
  - [ ] Add loading states
  - [ ] Add error handling
  - [ ] Clean up component structure
  - [ ] Run tests (must still pass)
  - [ ] Commit: "refactor(products): extract types and improve error handling (REFACTOR)"
- [ ] **Agent Checkpoint**: Run `tdd-guardian` agent to verify TDD compliance
- [ ] **Agent Checkpoint**: Run `learn` agent if significant learnings (document in CLAUDE.md)

### Phase 2 Final Tasks
- [ ] Create ADR documenting framework-specific decision (AsyncLocalStorage vs manual forwarding)
- [ ] Update documentation explaining both patterns
- [ ] Update WIP.md with Phase 2 completion summary

---

## Completed This Session

_Update after each work session_

**Session Date**: 2025-11-02

### What Was Completed
- ✅ Fixed architecture: API route now calls json-server (proves MSW interception)
- ✅ Resolved MSW import: scenarist only in API routes (server-only)
- ✅ Configured Playwright: json-server in webServer array
- ✅ Created `getScenaristHeaders()` helper with 6 tests
- ✅ Analyzed Express vs Next.js patterns (AsyncLocalStorage vs manual)
- ✅ Pushed 4 commits to `feat/phase-2-products-matching` branch
- ✅ Updated WIP.md with infrastructure completion status

### Blockers Encountered
None

### Learnings
- Next.js has no middleware support (unlike Express AsyncLocalStorage)
- Manual header forwarding required via helper function
- MSW must be imported only in server-only contexts (API routes)
- json-server configuration in Playwright webServer array critical
- Architecture verification via real HTTP calls (not just mocks)

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

### Phase 2 Infrastructure: Architecture & Helpers
- **Completed**: 2025-11-02 (4 commits, ~2-3 hours)
- **Status**: In Progress (infrastructure complete, UI pending)
- **Key Learnings**: Framework-specific patterns (AsyncLocalStorage vs manual), MSW server-only imports, header forwarding helper critical

---

## Metrics

**Time**: 2.5/8-9 days (28% time, 40% work - ahead by 12%)
**Tests**: 72 passing (2 E2E + 70 package)
**Files**: 68 changed across all phases (6 new in Phase 2)
**Quality**: 0 TS errors, 0 lint warnings, architecture verified

---

## Next Steps

1. **Phase 2a (RED)**: Create `tests/playwright/products.spec.ts` with failing tests
   - Test premium user pricing
   - Test standard user pricing
   - Confirm RED state

2. **Phase 2b (GREEN)**: Implement product catalog UI
   - Use `getScenaristHeaders()` in API route
   - Create ProductCard and TierSelector components
   - Add premium/standard scenarios with match criteria
   - Confirm GREEN state

3. **Phase 2c (REFACTOR)**: Improve code quality
   - Run refactor-scan agent
   - Extract types if valuable
   - Add error handling if valuable
   - Run tdd-guardian verification

4. **Phase 2 Final**: Documentation
   - Create ADR for framework-specific patterns
   - Update docs with both patterns (AsyncLocalStorage vs manual)
   - Complete WIP.md summary

5. **After Phase 2**: Cart → Checkout → Payment → Isolation → Docs

---

## Blockers

**Current**: None

---

## Quick Links

- **Plan**: [docs/plans/nextjs-pages-and-playwright-helpers.md](docs/plans/nextjs-pages-and-playwright-helpers.md)
- **Roadmap**: [docs/plans/next-stages.md](docs/plans/next-stages.md)
- **Branch**: `feat/phase-2-products-matching`
- **Commits**: 4 infrastructure commits (architecture fix, MSW imports, Playwright config, helper function)
- **Files Changed**: `/apps/nextjs-pages-example/pages/api/products.ts`, `_app.tsx`, `playwright.config.ts`, smoke test, `/packages/nextjs-adapter/src/pages/helpers.ts` + tests
