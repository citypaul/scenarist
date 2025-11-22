# Production Readiness Plan - CORRECTED (2025-11-22)

## Critical Finding: GitHub Issue #118 is INCORRECTLY PRIORITIZED

After deep analysis of how conditional exports work at different layers, **the current plan is wrong**.

### The Misunderstanding

The current plan (lines 98-117 of production-readiness-assessment.md) proposes:

> **Phase 2: Core-level tree-shaking to eliminate Zod (~150kb)**
> - Expected result: 298kb → 148kb (additional 50% reduction)

**This is based on a fundamental misunderstanding of how tree-shaking works with conditional exports.**

---

## How Conditional Exports Actually Work

### Dependency Chain

```
User Application (production build)
  ↓ imports @scenarist/express-adapter
Express Adapter
  ↓ imports @scenarist/core
Core Package
  ↓ imports Zod, MSW types, etc.
```

### Current Express Adapter Pattern (CORRECT)

When bundler uses `--conditions=production`:

1. Resolves `@scenarist/express-adapter` → `production.js` (NOT `index.js`)
2. `production.ts` has **ZERO runtime imports** (only type imports which are erased)
3. Result: **Adapter code is NOT included**
4. Since adapter not included → **Core is NOT imported**
5. Since Core not imported → **Zod/MSW NOT imported**
6. **Total elimination**: Adapter + Core + All dependencies

**Key Files:**
- `packages/express-adapter/src/setup/production.ts` - Returns `undefined`, zero imports
- `packages/express-adapter/package.json` - `"production": "./dist/setup/production.js"`

### If We Added Core-Level Conditional Exports (WRONG APPROACH)

#### Scenario A: Adapter HAS production.ts (Express current state)

```
Bundler with --conditions=production
  ↓
Adapter → production.js (zero imports)
  ↓
Returns undefined WITHOUT importing Core
  ↓
Core's conditional exports NEVER USED (Core never imported)
  ↓
Result: Same as now (total elimination)
```

**Core conditional exports have NO EFFECT** because Core is never imported when adapter pattern is correct.

#### Scenario B: Adapter DOESN'T have production.ts (Next.js current state)

```
Bundler with --conditions=production
  ↓
Adapter → index.js (default path)
  ↓
Adapter imports from @scenarist/core
  ↓
Core → production.js (zero imports)
  ↓
Adapter code IS INCLUDED but gets undefined from Core
  ↓
Result: PARTIAL ELIMINATION (Adapter code included, Core deps eliminated)
```

**This is WRONG for Scenarist** - adapter code serves no purpose in production.

---

## The CORRECT Next Phase

### Phase 2 (REAL Priority): Add production.ts to Next.js Adapters

**Goal:** Apply the Express adapter pattern to Next.js adapters

**Implementation:**

1. **Create production entry points:**
   - `packages/nextjs-adapter/src/app/production.ts` (App Router)
   - `packages/nextjs-adapter/src/pages/production.ts` (Pages Router)

2. **Update package.json exports:**
   ```json
   {
     "exports": {
       "./app": {
         "types": "./dist/app/index.d.ts",
         "production": "./dist/app/production.js",
         "default": "./dist/app/index.js"
       },
       "./pages": {
         "types": "./dist/pages/index.d.ts",
         "production": "./dist/pages/production.js",
         "default": "./dist/pages/index.js"
       }
     }
   }
   ```

3. **Add verification scripts (per entry point):**
   ```json
   {
     "scripts": {
       "build:production:app": "esbuild ... --conditions=production",
       "build:production:pages": "esbuild ... --conditions=production",
       "verify:treeshaking:app": "pnpm build:production:app && ! grep -rE '(setupWorker|HttpResponse\\.json)' dist/app/",
       "verify:treeshaking:pages": "pnpm build:production:pages && ! grep -rE '(setupWorker|HttpResponse\\.json)' dist/pages/",
       "verify:treeshaking": "pnpm verify:treeshaking:app && pnpm verify:treeshaking:pages"
     }
   }
   ```

4. **Add tests proving tree-shaking works:**
   - Tests for App Router production entry
   - Tests for Pages Router production entry
   - Integration with Next.js example apps

**Effort Estimate:** 6-8 hours

**Expected Results:**
- Next.js App Router: ~300kb → 0kb (complete elimination)
- Next.js Pages Router: ~300kb → 0kb (complete elimination)
- Same 100% elimination as Express adapter

---

### Phase 3 (OPTIONAL, Low Priority): Core-Level Conditional Exports

**When would this be useful?**

Only for hypothetical future adapters that want PARTIAL functionality in production (e.g., logging, telemetry, analytics).

**Current Reality:**
- ALL Scenarist adapters should be completely eliminated in production
- Testing library has zero value in production environments
- Total elimination is the ONLY correct pattern

**Recommendation:** Defer to post-v1.0 or indefinitely

---

## Critical Bug in Documentation

### The Verification Command is WRONG

**Current docs command:**
```bash
grep -r "scenarist\|msw" dist/
```

**Problem:** This matches:
- The word "scenarist" in your OWN application code (variable names, routes, etc.)
- Zod code (expected in bundles that use Zod for validation)
- Comments and strings that contain these words

**CORRECT verification (from Express adapter):**
```bash
! grep -rE '(setupWorker|startWorker|http\.(get|post|put|delete|patch)|HttpResponse\.json)' dist/
```

**Why this is correct:**
- Searches for ACTUAL MSW runtime functions
- Not just words, but specific MSW API calls
- Exit code 1 (no matches) = success ✅
- Exit code 0 (found matches) = failure ❌

**Test Results:**
```bash
cd apps/express-example
rm -rf dist
pnpm build:production  # 298kb bundle

# Docs command (WRONG):
grep -r "scenarist\|msw" dist/  # Finds 1 match (application code)

# Correct command:
pnpm verify:treeshaking  # ✅ PASSES (no MSW runtime code)
```

**Action Required:**
1. Update docs site verification examples
2. Use correct grep pattern everywhere
3. Add explanation of what the pattern searches for

---

## Summary of Changes Needed

### 1. Update production-readiness-assessment.md

**Remove incorrect Phase 2:**
- Lines 98-117 about core-level tree-shaking
- GitHub Issue #118 priority

**Add correct Phase 2:**
- Next.js adapters production.ts implementation
- Verification scripts for both entry points
- Tests for tree-shaking

### 2. Update Documentation Site

**Fix verification command** in:
- `apps/docs/src/content/docs/introduction/production-safety.mdx`
- Any other docs showing verification examples

**Replace:**
```bash
grep -r "scenarist\|msw" dist/
```

**With:**
```bash
! grep -rE '(setupWorker|startWorker|http\.(get|post|put|delete|patch)|HttpResponse\.json)' dist/
```

**Add explanation:**
> This searches for MSW runtime functions like `http.get()`, `HttpResponse.json()`, and worker setup code. If no matches are found (exit code 1), tree-shaking succeeded.

### 3. Close/Update GitHub Issue #118

**Options:**
1. Close as "won't fix" (not needed for current architecture)
2. Relabel as "enhancement" and deprioritize to post-v1.0
3. Repurpose for Next.js adapters (the REAL Phase 2)

**Recommended:** Close and create new issue for Next.js adapters

---

## Why Each Adapter MUST Have Its Own production.ts

**Question:** If we add conditional exports to core, can we delete Express's production.ts?

**Answer:** NO. Here's why:

### Adapter-Level Conditional Exports
- **Purpose:** Eliminate adapter code + all dependencies (TOTAL)
- **Pattern:** production.ts with zero imports
- **Result:** Complete elimination of adapter and everything downstream
- **Use case:** Testing libraries (like Scenarist) useless in production

### Core-Level Conditional Exports
- **Purpose:** Eliminate core dependencies while keeping adapter code
- **Pattern:** production.ts in core package
- **Result:** Partial elimination (adapter included, core deps excluded)
- **Use case:** Adapters that want partial production functionality

**For Scenarist:**
- ✅ Each adapter MUST have production.ts (total elimination)
- ❌ Core conditional exports DON'T help (Core never imported when done right)
- ✅ Each adapter needs its own tests and verification scripts

---

## Testing Requirements Per Adapter

Even though the pattern is the same, each adapter needs:

1. **Unit tests** - Prove production entry returns undefined
2. **Integration tests** - Prove bundler configuration works
3. **Verification scripts** - Prove no MSW code in production bundles
4. **Example app tests** - Prove tree-shaking works in real applications

**Why?**
- Each adapter has different entry points (/app vs /pages)
- Each adapter might bundle differently
- Tests prevent regressions in that specific adapter
- Verification scripts prove the pattern works for that adapter

---

## Next Steps

1. ✅ **Update production-readiness-assessment.md** with corrected Phase 2
2. ⏳ **Fix documentation site** verification commands
3. ⏳ **Implement Next.js adapters** production.ts files
4. ⏳ **Add verification scripts** to Next.js adapters
5. ⏳ **Write tests** proving tree-shaking works
6. ⏳ **Update GitHub Issue #118** (close or repurpose)

**Estimated Effort:**
- Documentation fixes: 1 hour
- Next.js adapters implementation: 6-8 hours
- Testing and verification: 2-3 hours
- **Total: 9-12 hours (1.5 days)**

---

## Architectural Validation

This analysis VALIDATES the Express adapter pattern:

✅ **Conditional exports at adapter level** = Total elimination
✅ **production.ts with zero imports** = Correct approach
✅ **Verification via MSW function search** = Reliable method
✅ **Each adapter needs own implementation** = Architecture requirement

**The current Express adapter implementation is EXACTLY right.**

**Next.js adapters need to follow the SAME pattern, not a different one.**
