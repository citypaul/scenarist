# Plan: Simplify Test ID Header (Issue #123)

## Summary

Remove the configurable `headers.testId` option and standardize on `'x-scenarist-test-id'` as the single, non-configurable header name.

**Status:** Ready for implementation

**Decisions:**
- Documentation: Include in this PR
- Config shape: Remove `headers` object entirely (cleaner API)
- Migration: Clean break, no backward compatibility

## Problem

The current `headers.testId` configuration option creates inconsistency:

1. **Helper function limitations**: `getScenaristTestId()` and `getScenaristTestIdFromReadonlyHeaders()` cannot respect custom configurations without accessing the full scenarist instance. They fall back to hardcoded `'x-scenarist-test-id'`.

2. **Confusing API**: Users can configure a custom header name, but convenience helpers won't work with that configuration.

3. **Unnecessary complexity**: No compelling use case exists for customizing this internal infrastructure header.

## Proposed Changes

### Header Name Change

| Before | After |
|--------|-------|
| Configurable via `headers.testId` | Fixed constant |
| Default: `'x-scenarist-test-id'` | Standard: `'x-scenarist-test-id'` |

### Files to Modify

#### Core Package (5 files)

1. **`packages/core/src/types/config.ts`**
   - Remove entire `headers` property from `ScenaristConfig` type (lines 28-34)
   - Remove `headers` from `ScenaristConfigInput` (line 59)

2. **`packages/core/src/domain/config-builder.ts`**
   - Remove `headers` object from config building (lines 19-21)

3. **`packages/core/src/constants/headers.ts`** (NEW FILE)
   - Create new file with: `export const SCENARIST_TEST_ID_HEADER = 'x-scenarist-test-id';`
   - Export from `packages/core/src/index.ts`

4. **`packages/core/src/contracts/framework-adapter.ts`**
   - Update JSDoc example that references custom header (lines 71-76)

5. **`packages/core/tests/config-builder.test.ts`**
   - Remove test: "should allow overriding header config" (lines 31-41)
   - Remove test for headers in full override test (lines 93-103)

#### Express Adapter (2 files)

1. **`packages/express-adapter/src/context/express-request-context.ts`**
   - Replace `this.config.headers.testId` with imported constant

2. **`packages/express-adapter/tests/`**
   - Update all `'x-scenarist-test-id'` references to `'x-scenarist-test-id'`

#### Next.js Adapter (6 files)

1. **`packages/nextjs-adapter/src/app/helpers.ts`**
   - Change `FALLBACK_TEST_ID_HEADER` from `'x-scenarist-test-id'` to `'x-scenarist-test-id'`
   - Remove comments about "configuration" since it's no longer configurable
   - Simplify JSDoc to remove "Important Limitation" sections

2. **`packages/nextjs-adapter/src/app/context.ts`**
   - Replace `this.config.headers.testId` with imported constant

3. **`packages/nextjs-adapter/src/pages/context.ts`**
   - Replace `this.config.headers.testId` with imported constant

4. **`packages/nextjs-adapter/src/app/impl.ts`**
   - Replace `config.headers.testId` with imported constant

5. **`packages/nextjs-adapter/src/pages/impl.ts`**
   - Replace `config.headers.testId` with imported constant

6. **`packages/nextjs-adapter/src/common/create-scenarist-base.ts`**
   - Replace `config.headers.testId` with imported constant

#### Playwright Helpers (2 files)

1. **`packages/playwright-helpers/src/switch-scenario.ts`**
   - Update default header name

2. **`packages/playwright-helpers/README.md`**
   - Update documentation

#### Example Apps (3 apps, many files)

1. **`apps/express-example/`** - Update all test files, Bruno collections
2. **`apps/nextjs-app-router-example/`** - Update test files, fixtures
3. **`apps/nextjs-pages-router-example/`** - Update test files, fixtures

#### Documentation (20+ files)

- All files in `apps/docs/src/content/docs/`
- All README.md files in packages
- Investigation docs, ADRs referencing the header

## Implementation Strategy

### TDD Approach

For each file change:
1. **RED**: Update test to expect `'x-scenarist-test-id'` - watch it fail
2. **GREEN**: Update implementation to use new header name
3. **REFACTOR**: Simplify any code that was dealing with configuration complexity

### Execution Order

1. **Core package first** - Define the constant, update types
2. **Adapters second** - Import constant, update implementations
3. **Playwright helpers third** - Update default header
4. **Example apps fourth** - Update all tests to pass
5. **Documentation last** - Update all references

### Constant Location Decision

Export from core so all packages use same source:

```typescript
// packages/core/src/constants/headers.ts
export const SCENARIST_TEST_ID_HEADER = 'x-scenarist-test-id';
```

Then import in adapters:
```typescript
import { SCENARIST_TEST_ID_HEADER } from '@scenarist/core';
```

## Breaking Change Impact

### What Users Must Change

1. **Remove configuration**: Delete any `headers: { testId: '...' }` from their config
2. **Update test headers**: Change `'x-scenarist-test-id'` to `'x-scenarist-test-id'` in:
   - Playwright fixtures
   - Test setup code
   - Any direct header references

### Migration Example

```typescript
// Before
const scenarist = createScenarist({
  enabled: true,
  headers: { testId: 'x-custom-header' }, // Remove this
  scenarios,
});

// Test code before
await page.setExtraHTTPHeaders({ 'x-scenarist-test-id': testId });

// After
const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

// Test code after
await page.setExtraHTTPHeaders({ 'x-scenarist-test-id': testId });
```

## Scope Breakdown

| Category | File Count | Complexity |
|----------|------------|------------|
| Core types/config | 4 | Low |
| Adapter implementations | 8 | Low |
| Package tests | ~15 | Medium |
| Example app tests | ~40 | Medium (find/replace) |
| Bruno collections | ~30 | Low (find/replace) |
| Documentation | ~25 | Low (find/replace) |
| **Total** | **~122** | |

## Decisions (Resolved)

| Question | Decision |
|----------|----------|
| Documentation scope | Include in this PR |
| Config type approach | Remove `headers` entirely |
| Backward compatibility | Clean break, document migration |
| Example apps scope | Update everything (ensures examples work) |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking user tests | High | Medium | Clear migration docs |
| Missing file updates | Medium | Low | Comprehensive grep before PR |
| Constant import cycles | Low | Medium | Put in dedicated constants file |

## Success Criteria

- [ ] All 314+ tests pass
- [ ] No references to `'x-scenarist-test-id'` remain (except migration docs)
- [ ] No references to `headers.testId` configuration remain
- [ ] TypeScript strict mode satisfied
- [ ] Helper functions simplified (no "Important Limitation" sections)
- [ ] Constant exported from core and used by all adapters

## Estimated Effort

- Core + adapters: 2-3 hours (careful TDD)
- Tests update: 1-2 hours (systematic find/replace + verification)
- Documentation: 1 hour (find/replace + review)
- **Total: 4-6 hours**

---

**Next Steps:** Answer clarification questions, then begin implementation following TDD.
