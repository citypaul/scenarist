# WIP: Remove Legacy Variant System Support

**Issue:** [#90](https://github.com/citypaul/scenarist/issues/90)
**Branch:** `feat/remove-legacy-variant-system`
**Status:** ✅ Complete

## Overview

Remove remnants of the old variant system that was replaced by the `buildVariants` utility approach. The legacy `variantName` concept is woven throughout the codebase but **never actually used for any runtime behavior** - it's just stored metadata.

**Key insight:** The variant is accepted, stored, and returned, but no code actually reads or uses it for mock matching, response selection, or any functional behavior.

## Progress Tracker

### Phase 1: Core Schema & Type Definitions

| File | Status | Notes |
|------|--------|-------|
| `packages/core/src/schemas/scenario-definition.ts` | [x] | Removed `ScenaristVariantSchema`, `ScenaristVariant` type, and `variants` field |
| `packages/core/src/schemas/scenario-requests.ts` | [x] | Removed `variant` field from `ScenarioRequestSchema` |
| `packages/core/src/schemas/index.ts` | [x] | Removed `ScenaristVariantSchema` and `ScenaristVariant` exports |
| `packages/core/src/types/scenario.ts` | [x] | Removed `variantName` from `ActiveScenario` type |
| `packages/core/src/types/index.ts` | [x] | Removed `ScenaristVariant` re-export |

### Phase 2: Core Domain Logic & Port

| File | Status | Notes |
|------|--------|-------|
| `packages/core/src/domain/scenario-manager.ts` | [x] | Removed `variantName` parameter from `switchScenario`, don't store in `ActiveScenario` |
| `packages/core/src/ports/driving/scenario-manager.ts` | [x] | Removed `variantName` parameter from interface and JSDoc |

### Phase 3: Express Adapter

| File | Status | Notes |
|------|--------|-------|
| `packages/express-adapter/src/endpoints/scenario-endpoints.ts` | [x] | Removed `variant` from POST handler, removed `variantName` from GET response |
| `packages/express-adapter/src/setup/impl.ts` | [x] | Removed `variantName` parameter from `switchScenario` wrapper |

### Phase 4: Next.js Adapter

| File | Status | Notes |
|------|--------|-------|
| `packages/nextjs-adapter/src/common/endpoint-handlers.ts` | [x] | Removed `variant` from `PostResult`, `variantName` from `GetResult`, updated handlers |
| `packages/nextjs-adapter/src/app/impl.ts` | [x] | Removed `variantName` parameter from `switchScenario` wrapper |
| `packages/nextjs-adapter/src/pages/impl.ts` | [x] | Removed `variantName` parameter from `switchScenario` wrapper |
| `packages/nextjs-adapter/src/app/endpoints.ts` | [x] | Removed `variant` and `variantName` from response building |
| `packages/nextjs-adapter/src/pages/endpoints.ts` | [x] | Removed `variant` and `variantName` from response building |

### Phase 5: Playwright Helpers

| File | Status | Notes |
|------|--------|-------|
| `packages/playwright-helpers/src/switch-scenario.ts` | [x] | Removed `variant` option from `SwitchScenarioOptions` |
| `packages/playwright-helpers/tests/switch-scenario.spec.ts` | [x] | Removed variant test and mock handler references |
| `packages/playwright-helpers/tests/fixtures.spec.ts` | [x] | Updated MSW mock handlers |

### Phase 6: Tests to Update/Remove

| File | Action | Status | Notes |
|------|--------|--------|-------|
| `packages/core/tests/scenario-manager.test.ts` | REMOVE | [x] | Removed "should support scenario variants" |
| `packages/core/tests/scenario-manager.test.ts` | UPDATE | [x] | Removed variantName from store test |
| `packages/core/tests/in-memory-store.test.ts` | UPDATE | [x] | Removed variant from test factory and test data |
| `packages/express-adapter/tests/scenario-endpoints.test.ts` | REMOVE | [x] | Removed "should set scenario with variant" |
| `packages/express-adapter/tests/scenario-endpoints.test.ts` | UPDATE | [x] | Removed variantName from GET response test |
| `packages/nextjs-adapter/tests/app/app-setup.test.ts` | UPDATE | [x] | Removed `undefined` variant parameters |
| `packages/nextjs-adapter/tests/app/app-scenario-endpoints.test.ts` | REMOVE | [x] | Removed "should switch scenario with variant" and "should return variant name" |
| `packages/nextjs-adapter/tests/pages/pages-setup.test.ts` | UPDATE | [x] | Removed `undefined` variant parameters |
| `packages/nextjs-adapter/tests/pages/pages-scenario-endpoints.test.ts` | REMOVE | [x] | Removed "should switch scenario with variant" and "should return variant name" |

## Implementation Order

Execute in this order to maintain type safety throughout:

1. **Core types/schemas first** - This will cause TypeScript errors everywhere
2. **Core domain logic** - Fix the scenario manager
3. **Adapters** - Fix Express, then Next.js adapters
4. **Tests** - Update/remove tests last (they'll fail until code is updated)

## Verification Checklist

- [x] `pnpm build` - All packages compile
- [x] `pnpm test` - All package tests pass (263 core + 110 msw-adapter + 21 playwright-helpers + express/nextjs adapter tests)
- [x] `pnpm lint` - No lint errors (only pre-existing warnings)

## Risk Assessment

**Low Risk** - The variant system was:
- Never documented as stable API
- Never used for actual runtime behavior (just stored/returned)
- Explicitly rejected per ADR-0013 (declarative constraint violation)

**No breaking changes** for users who weren't using the undocumented variant feature.

## Session Log

### Session 1 - 2025-11-26

- Created plan and WIP document
- Completed all 6 phases of implementation:
  - Phase 1: Removed variant schemas and types from core
  - Phase 2: Updated scenario manager domain logic and port interface
  - Phase 3: Updated Express adapter endpoints and impl
  - Phase 4: Updated Next.js adapter endpoint handlers and implementations (app + pages routers)
  - Phase 5: Updated Playwright helpers switch-scenario options
  - Phase 6: Updated/removed variant tests across all packages
- Fixed TypeScript build errors in Next.js adapter endpoints (referenced removed properties)
- All package tests pass, lint passes
- Ready for commit and PR
