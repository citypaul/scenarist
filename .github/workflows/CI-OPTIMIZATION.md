# CI Pipeline Optimization

## Overview

This document compares the original sequential CI pipeline with the optimized parallel version.

## Current Pipeline (`ci.yml`) - Sequential

**Total Runtime: ~20-25 minutes**

```
build-and-test (single job)
├── Setup (~2-3 min)
│   ├── Checkout
│   ├── Install deps
│   └── Setup caches
├── Typecheck (~1 min)
├── Lint (~1 min)
├── Build (~2-3 min)
├── Test (~3-5 min)
├── Coverage (~2 min)
├── Bruno API Tests (~1 min)
├── Comparison E2E (~2 min)
├── Production Build Tests - Express (~2-3 min)
├── Production Build Tests - App Router (~2-3 min)
└── Production Build Tests - Pages Router (~2-3 min)
```

**Characteristics:**
- ✅ Simple single-job workflow
- ✅ Low runner cost (1 concurrent runner)
- ❌ Slow (~20-25 minutes)
- ❌ Production tests run sequentially despite being independent
- ❌ Late failure (typecheck/lint run before all tests)

## Optimized Pipeline (`ci.yml`) - Parallel

**Total Runtime: ~8-12 minutes** (60% faster)

```
setup-and-build (shared)
├── Setup (~2-3 min)
├── Build (~2-3 min)
└── Cache artifacts

┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ validation   │ library-tests│ mocked-tests │ bruno-tests  │ prod-build-  │
│ (matrix: 2)  │              │              │              │ tests (x3)   │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ • Typecheck  │ • Core       │ • Apps +MSW  │ • Bruno API  │ • Express    │
│ • Lint       │ • Adapters   │ • Playwright │ • Comparison │ • App Router │
│              │ • Coverage   │ • Vitest     │ • No MSW     │ • Pages Rtr  │
│              │              │              │              │ • Tree-shake │
│ ~1 min       │ ~3 min       │ ~5 min       │ ~3 min       │ ~3 min       │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

Total: setup (3 min) + max(1, 3, 5, 3, 3) = ~8 min
```

**Characteristics:**
- ✅ **60% faster** (~10 min vs ~25 min)
- ✅ **Fail fast** - Validation runs early in parallel
- ✅ **Clear logs** - Each job shows specific test type
- ✅ **Independent failures** - One app's production test failure doesn't block others
- ⚠️ Higher runner cost (up to 7 concurrent runners)
- ⚠️ More complex workflow structure

## Key Improvements

### 1. Production Build Tests Run in Parallel (3x speedup)

**What these test:** Tree-shaking, conditional exports, and production build setup (not actual production environments - they're library integration tests with real servers)

**Before:**
```yaml
- name: Production Build Tests (Express)      # 2-3 min
- name: Production Build Tests (App Router)   # 2-3 min
- name: Production Build Tests (Pages Router) # 2-3 min
# Total: 6-9 minutes sequential
```

**After:**
```yaml
production-build-tests:
  strategy:
    matrix:
      include:
        - name: Express
        - name: App Router
        - name: Pages Router
  # All run concurrently: ~3-4 min total
  # ❌ Not cached (spawns servers: json-server + app)
```

### 2. Validation Runs in Parallel

**Before:**
```yaml
- name: Check types    # 1 min
- name: Lint          # 1 min
# Total: 2 minutes sequential
```

**After:**
```yaml
validation:
  strategy:
    matrix:
      check: [typecheck, lint]
  # Both run concurrently: ~1 min total
```

### 3. Better Resource Utilization & Turbo Caching

**Before:**
- 1 runner idle while production build tests run sequentially
- Typecheck and lint run one after another
- No Turbo caching (commands bypassed Turbo)

**After:**
- Multiple runners work simultaneously
- Production build tests of different apps run concurrently
- Validation steps run concurrently
- ✅ Turbo caching enabled for all test commands
- Cache hits on re-runs for unchanged code

## Migration Strategy

### Phase 1: Testing (Current)
- Keep both workflows (ci.yml + ci-parallel.yml)
- Run ci-parallel.yml on feature branches
- Monitor for issues

### Phase 2: Validation
- Verify ci-parallel.yml on multiple PRs
- Check runner cost vs time savings
- Ensure cache coordination works reliably

### Phase 3: Migration
- Rename ci.yml to ci-legacy.yml (backup)
- Rename ci-parallel.yml to ci.yml
- Update branch protection rules

### Phase 4: Cleanup
- After 2 weeks of stable parallel CI
- Remove ci-legacy.yml

## Cost Analysis

### Runner Minutes

**Sequential (ci.yml):**
- 1 job × 25 minutes = 25 runner-minutes

**Parallel (ci.yml):**
- setup-and-build: 1 job × 5 min = 5 runner-minutes
- validation: 2 jobs × 1 min = 2 runner-minutes
- library-tests: 1 job × 3 min = 3 runner-minutes
- mocked-tests: 1 job × 5 min = 5 runner-minutes
- bruno-tests: 1 job × 3 min = 3 runner-minutes
- production-build-tests: 3 jobs × 3-4 min = 9-12 runner-minutes
- **Total: 27-30 runner-minutes**
- **With caching (re-runs):** ~20-24 runner-minutes (library/mocked tests cached, production not cached)

### Analysis

**Cost (first run):** ~8-20% increase (27-30 vs 25 runner-minutes)
**Cost (re-runs with cache):** ~4-20% decrease (20-24 vs 25 runner-minutes)
**Time:** ~60% decrease (10 vs 25 wall-clock minutes)
**Developer productivity:** Significant improvement (faster feedback + partial cache hits)

For GitHub Actions (2,000 free minutes/month for private repos):
- Sequential: ~80 CI runs/month before hitting limit
- Parallel (first run): ~67-74 CI runs/month before hitting limit
- Parallel (with cache): ~83-100 CI runs/month before hitting limit
- **Impact: Neutral to positive** - faster feedback is worth the marginal cost increase

## Rollback Plan

If issues arise with parallel workflow:

```bash
# 1. Disable ci-parallel.yml
mv .github/workflows/ci-parallel.yml .github/workflows/ci-parallel.yml.disabled

# 2. Re-enable original ci.yml (if renamed)
mv .github/workflows/ci-legacy.yml .github/workflows/ci.yml

# 3. Push changes
git add .github/workflows/
git commit -m "rollback: revert to sequential CI"
git push
```

## Future Optimizations

1. **Selective test execution** - Only run tests for changed packages
2. **Docker layer caching** - Speed up Next.js builds
3. **Test splitting** - Distribute Playwright tests across multiple runners
4. **Reusable workflows** - Extract common setup steps

## References

- [GitHub Actions: Using a matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [GitHub Actions: Caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [GitHub Actions: Using concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency)
