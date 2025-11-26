# WIP: Simplify Test ID Header (Issue #123)

> **Branch:** `issue-123-simplify-test-id-header`
> **Issue:** https://github.com/citypaul/scenarist/issues/123
> **Plan:** [../plans/issue-123-simplify-test-id-header.md](../plans/issue-123-simplify-test-id-header.md)

## Progress Overview

| Phase | Status | Files | Progress |
|-------|--------|-------|----------|
| 1. Core Package | Not Started | 6 | 0/6 |
| 2. Express Adapter | Not Started | 4 | 0/4 |
| 3. Next.js Adapter | Not Started | 12 | 0/12 |
| 4. Playwright Helpers | Not Started | 3 | 0/3 |
| 5. Example Apps | Not Started | ~50 | 0/50 |
| 6. Documentation | Not Started | ~25 | 0/25 |

**Total Progress:** 0/~100 files

---

## Phase 1: Core Package

### 1.1 Create Header Constant (NEW)

- [ ] `packages/core/src/constants/headers.ts` - Create new file
  ```typescript
  export const SCENARIST_TEST_ID_HEADER = 'x-scenarist-test-id';
  ```
- [ ] `packages/core/src/constants/index.ts` - Create barrel export
- [ ] `packages/core/src/index.ts` - Export constants

### 1.2 Update Config Types

- [ ] `packages/core/src/types/config.ts`
  - [ ] Remove `headers` property from `ScenaristConfig` (lines 28-34)
  - [ ] Remove `headers` from `ScenaristConfigInput` (line 59)
  - [ ] Update JSDoc comment on line 47 that mentions "x-scenarist-test-id"

### 1.3 Update Config Builder

- [ ] `packages/core/src/domain/config-builder.ts`
  - [ ] Remove `headers` object from config building (lines 19-21)

### 1.4 Update Contracts

- [ ] `packages/core/src/contracts/framework-adapter.ts`
  - [ ] Update JSDoc example (lines 71-76)

### 1.5 Update Core Tests

- [ ] `packages/core/tests/config-builder.test.ts`
  - [ ] Remove "should allow overriding header config" test (lines 31-41)
  - [ ] Update full override test to not include headers (lines 93-103)

### 1.6 Verify Core

- [ ] Run: `pnpm --filter=@scenarist/core test`
- [ ] Run: `pnpm --filter=@scenarist/core check-types`

---

## Phase 2: Express Adapter

### 2.1 Update Implementation

- [ ] `packages/express-adapter/src/context/express-request-context.ts`
  - [ ] Import `SCENARIST_TEST_ID_HEADER` from core
  - [ ] Replace `this.config.headers.testId` with constant

### 2.2 Update Tests

- [ ] `packages/express-adapter/tests/express-request-context.test.ts`
  - [ ] Change all `'x-scenarist-test-id'` to `'x-scenarist-test-id'`
- [ ] `packages/express-adapter/tests/test-helpers.ts`
  - [ ] Update header reference
- [ ] `packages/express-adapter/tests/setup-scenarist.test.ts`
  - [ ] Update header references
- [ ] `packages/express-adapter/tests/setup-scenarist-production.test.ts`
  - [ ] Update header references
- [ ] `packages/express-adapter/tests/scenario-endpoints.test.ts`
  - [ ] Update header references
- [ ] `packages/express-adapter/tests/test-id-middleware.test.ts`
  - [ ] Update header references

### 2.3 Verify Express Adapter

- [ ] Run: `pnpm --filter=@scenarist/express-adapter test`
- [ ] Run: `pnpm --filter=@scenarist/express-adapter check-types`

---

## Phase 3: Next.js Adapter

### 3.1 Update Helpers

- [ ] `packages/nextjs-adapter/src/app/helpers.ts`
  - [ ] Change `FALLBACK_TEST_ID_HEADER` to `'x-scenarist-test-id'`
  - [ ] Remove references to `config.headers.testId`
  - [ ] Simplify JSDoc (remove "Important Limitation" sections)

### 3.2 Update Contexts

- [ ] `packages/nextjs-adapter/src/app/context.ts`
  - [ ] Import `SCENARIST_TEST_ID_HEADER` from core
  - [ ] Replace `this.config.headers.testId` with constant
- [ ] `packages/nextjs-adapter/src/pages/context.ts`
  - [ ] Import `SCENARIST_TEST_ID_HEADER` from core
  - [ ] Replace `this.config.headers.testId` with constant

### 3.3 Update Implementations

- [ ] `packages/nextjs-adapter/src/app/impl.ts`
  - [ ] Replace `config.headers.testId` with constant
- [ ] `packages/nextjs-adapter/src/pages/impl.ts`
  - [ ] Replace `config.headers.testId` with constant
- [ ] `packages/nextjs-adapter/src/common/create-scenarist-base.ts`
  - [ ] Replace `config.headers.testId` with constant

### 3.4 Update Tests

- [ ] `packages/nextjs-adapter/tests/app/app-request-context.test.ts`
  - [ ] Change `'x-scenarist-test-id'` to `'x-scenarist-test-id'`
- [ ] `packages/nextjs-adapter/tests/app/app-setup.test.ts`
  - [ ] Update header references
- [ ] `packages/nextjs-adapter/tests/app/app-scenario-endpoints.test.ts`
  - [ ] Update header references
- [ ] `packages/nextjs-adapter/tests/app/app-helpers.test.ts`
  - [ ] Update header references
- [ ] `packages/nextjs-adapter/tests/pages/pages-request-context.test.ts`
  - [ ] Change `'x-scenarist-test-id'` to `'x-scenarist-test-id'`
- [ ] `packages/nextjs-adapter/tests/pages/pages-setup.test.ts`
  - [ ] Update header references
- [ ] `packages/nextjs-adapter/tests/pages/pages-scenario-endpoints.test.ts`
  - [ ] Update header references
- [ ] `packages/nextjs-adapter/src/app/production.test.ts`
  - [ ] Update header references
- [ ] `packages/nextjs-adapter/src/pages/production.test.ts`
  - [ ] Update header references

### 3.5 Verify Next.js Adapter

- [ ] Run: `pnpm --filter=@scenarist/nextjs-adapter test`
- [ ] Run: `pnpm --filter=@scenarist/nextjs-adapter check-types`

---

## Phase 4: Playwright Helpers

### 4.1 Update Implementation

- [ ] `packages/playwright-helpers/src/switch-scenario.ts`
  - [ ] Import `SCENARIST_TEST_ID_HEADER` from core
  - [ ] Update default header name

### 4.2 Update Tests

- [ ] `packages/playwright-helpers/tests/switch-scenario.spec.ts`
  - [ ] Update header references

### 4.3 Update Docs

- [ ] `packages/playwright-helpers/README.md`
  - [ ] Update header name references

### 4.4 Verify Playwright Helpers

- [ ] Run: `pnpm --filter=@scenarist/playwright-helpers test`
- [ ] Run: `pnpm --filter=@scenarist/playwright-helpers check-types`

---

## Phase 5: Example Apps

### 5.1 Express Example

#### Tests
- [ ] `apps/express-example/tests/products-repo.test.ts`
- [ ] `apps/express-example/tests/url-matching.test.ts`
- [ ] `apps/express-example/tests/test-id-isolation.test.ts`
- [ ] `apps/express-example/tests/string-matching.test.ts`
- [ ] `apps/express-example/tests/stateful-scenarios.test.ts`
- [ ] `apps/express-example/tests/scenario-switching.test.ts`
- [ ] `apps/express-example/tests/scenario-persistence.test.ts`
- [ ] `apps/express-example/tests/regex-matching.test.ts`
- [ ] `apps/express-example/tests/hostname-matching.test.ts`
- [ ] `apps/express-example/tests/dynamic-sequences.test.ts`
- [ ] `apps/express-example/tests/dynamic-matching.test.ts`
- [ ] `apps/express-example/tests/default-fallback.test.ts`

#### Source Files
- [ ] `apps/express-example/src/routes/products-repo.ts`

#### Bruno Collections (all .bru files)
- [ ] `apps/express-example/bruno/Scenarios/*.bru` (7 files)
- [ ] `apps/express-example/bruno/Dynamic Responses/State/*.bru` (9 files)
- [ ] `apps/express-example/bruno/Dynamic Responses/Sequences/*.bru` (15 files)
- [ ] `apps/express-example/bruno/Dynamic Responses/Request Matching/*.bru` (10 files)
- [ ] `apps/express-example/bruno/API/*.bru` (3 files)

#### Docs
- [ ] `apps/express-example/README.md`

#### Verify
- [ ] Run: `pnpm --filter=@scenarist/express-example test`

### 5.2 Next.js App Router Example

#### Tests
- [ ] `apps/nextjs-app-router-example/tests/playwright/scenario-switching.spec.ts`
- [ ] `apps/nextjs-app-router-example/tests/playwright/fixtures.ts`
- [ ] `apps/nextjs-app-router-example/tests/playwright/cart-server-components.spec.ts`

#### Source Files
- [ ] `apps/nextjs-app-router-example/app/products/page.tsx`
- [ ] `apps/nextjs-app-router-example/app/api/test/users/route.ts`
- [ ] `apps/nextjs-app-router-example/app/api/test/seed/route.ts`
- [ ] `apps/nextjs-app-router-example/app/api/recommendations/route.ts`
- [ ] `apps/nextjs-app-router-example/app/api/products/route.ts`

#### Docs
- [ ] `apps/nextjs-app-router-example/README.md`

#### Verify
- [ ] Run: `pnpm --filter=nextjs-app-router-example test:e2e` (if applicable)

### 5.3 Next.js Pages Router Example

#### Tests
- [ ] `apps/nextjs-pages-router-example/tests/playwright/scenario-switching.spec.ts`
- [ ] `apps/nextjs-pages-router-example/tests/playwright/fixtures.ts`

#### Source Files
- [ ] `apps/nextjs-pages-router-example/pages/products-repo.tsx`
- [ ] `apps/nextjs-pages-router-example/pages/api/test/seed.ts`
- [ ] `apps/nextjs-pages-router-example/pages/api/test-string-match.ts`
- [ ] `apps/nextjs-pages-router-example/pages/api/products.ts`
- [ ] `apps/nextjs-pages-router-example/pages/api/cart.ts`

#### Verify
- [ ] Run: `pnpm --filter=nextjs-pages-router-example test:e2e` (if applicable)

---

## Phase 6: Documentation

### 6.1 Package READMEs

- [ ] `packages/core/README.md`
- [ ] `packages/express-adapter/README.md`
- [ ] `packages/nextjs-adapter/README.md`
- [ ] `packages/playwright-helpers/README.md`

### 6.2 Docs Site (apps/docs)

- [ ] `apps/docs/src/content/docs/reference/verification.md`
- [ ] `apps/docs/src/content/docs/introduction/overview.md`
- [ ] `apps/docs/src/content/docs/introduction/ephemeral-endpoints.mdx`
- [ ] `apps/docs/src/content/docs/introduction/endpoint-apis.mdx`
- [ ] `apps/docs/src/content/docs/introduction/default-mocks.mdx`
- [ ] `apps/docs/src/content/docs/guides/testing-database-apps/testcontainers-hybrid.mdx`
- [ ] `apps/docs/src/content/docs/guides/testing-database-apps/repository-pattern.mdx`
- [ ] `apps/docs/src/content/docs/guides/testing-database-apps/parallelism-options.mdx`
- [ ] `apps/docs/src/content/docs/guides/testing-database-apps/index.mdx`
- [ ] `apps/docs/src/content/docs/frameworks/nextjs-pages-router/example-app.mdx`
- [ ] `apps/docs/src/content/docs/frameworks/nextjs-app-router/example-app.mdx`
- [ ] `apps/docs/src/content/docs/frameworks/express/getting-started.mdx`
- [ ] `apps/docs/src/content/docs/frameworks/express/example-app.mdx`
- [ ] `apps/docs/src/content/docs/concepts/architecture.mdx`

### 6.3 Root Docs

- [ ] `README.md`
- [ ] `AGENTS.md`
- [ ] `docs/testing-guidelines.md`
- [ ] `docs/stateful-mocks.md`
- [ ] `docs/core-functionality.md`
- [ ] `docs/api-reference-state.md`

### 6.4 Investigation/Architecture Docs

- [ ] `docs/architecture/hexagonal-architecture.md`
- [ ] `docs/investigations/playwright-fetch-headers-flakiness.md`
- [ ] `docs/investigations/next-js-pages-router-status.md`
- [ ] `docs/investigations/next-js-pages-router-msw-investigation.md`
- [ ] `docs/investigations/SUMMARY.md`
- [ ] `docs/investigations/README.md`

### 6.5 ADRs

- [ ] `docs/adrs/0011-domain-constants-location.md`
- [ ] `docs/adrs/0007-framework-specific-header-helpers.md`
- [ ] `docs/adrs/0003-testing-strategy.md`

### 6.6 Plans (historical reference)

- [ ] `docs/plans/next-stages.md`
- [ ] `docs/plans/hybrid-testing-demonstration.md`
- [ ] `docs/plans/documentation-site.md`
- [ ] `docs/analysis/acquisition-web-scenario-analysis.md`

---

## Final Verification

- [ ] `pnpm build` - All packages build
- [ ] `pnpm test` - All 314+ tests pass
- [ ] `pnpm check-types` - No TypeScript errors
- [ ] `pnpm lint` - No lint errors
- [ ] `grep -r "x-scenarist-test-id" --include="*.ts" --include="*.tsx"` - No remaining references (except migration docs)
- [ ] `grep -r "headers\.testId" --include="*.ts"` - No remaining references
- [ ] `grep -r "headers: {" packages/` - No headers config in types

---

## Notes & Issues

### Blockers
_(None yet)_

### Decisions Made During Implementation
_(Track any decisions made while implementing)_

### Files Discovered That Need Updates
_(Add any files found during implementation that weren't in the original list)_

---

## Commit Log

| Commit | Phase | Description |
|--------|-------|-------------|
| _(pending)_ | 1 | feat(core): add SCENARIST_TEST_ID_HEADER constant |
| _(pending)_ | 1 | refactor(core): remove headers config option |
| _(pending)_ | 2 | refactor(express): use header constant |
| _(pending)_ | 3 | refactor(nextjs): use header constant, simplify helpers |
| _(pending)_ | 4 | refactor(playwright): use header constant |
| _(pending)_ | 5 | test: update example apps to use new header |
| _(pending)_ | 6 | docs: update all references to x-scenarist-test-id |
