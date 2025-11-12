# TDD Violation: Singleton Implementation

**Status:** Documented - Tests Added Retroactively
**Severity:** CRITICAL (Implementation before tests)
**Date:** 2025-11-11 to 2025-11-12

---

## Summary

The singleton pattern implementation for Next.js adapters violated TDD principles by writing production code before failing tests. Tests were added retroactively 3-16 hours after implementation.

---

## Chronology

### App Router Adapter

1. **c273893** (2025-11-11 19:03) - `feat(nextjs-adapter): add singleton guards for MSW and stores`
   - **Type:** Implementation
   - **TDD Phase:** ❌ NONE (no failing test first)

2. **84f5fb3** (2025-11-11 22:06) - `fix(nextjs-adapter): move singleton guard from application to adapter`
   - **Type:** Refactor
   - **Time Since Implementation:** +3 hours

3. **16a0d73** (2025-11-11 22:11) - `test(nextjs-adapter): add comprehensive tests for createScenarist() singleton guard`
   - **Type:** Tests (RED → GREEN retroactive)
   - **Time Since Implementation:** +3 hours 8 minutes
   - **Tests Added:** 5 comprehensive tests

### Pages Router Adapter

1. **b72db17** (2025-11-12 10:16) - `fix(nextjs-adapter/pages): add singleton pattern to prevent multiple store instances`
   - **Type:** Implementation
   - **TDD Phase:** ❌ NONE (no failing test first)

2. **c946000** (2025-11-12 10:24) - `test(nextjs-adapter): add clearAllGlobals() to fix singleton test isolation`
   - **Type:** Test infrastructure
   - **Time Since Implementation:** +8 minutes

3. **90491fd** (2025-11-12 13:00) - `test(nextjs-adapter/pages): add comprehensive singleton behavior tests`
   - **Type:** Tests (RED → GREEN retroactive)
   - **Time Since Implementation:** +2 hours 44 minutes
   - **Tests Added:** 5 comprehensive tests

---

## Why This Happened

### Context: Bug Discovery During Manual Testing

The singleton issue was discovered through:
1. Playwright tests failing with standard pricing instead of premium
2. Server logs showing alternating store state (0 scenarios → 1 scenario → 0 scenarios)
3. Manual curl tests working but Playwright tests failing
4. Investigation documented in `/docs/investigations/`

### Pressure to Fix Failing Tests

Once the root cause was identified (Next.js module duplication creating multiple store instances), there was pressure to:
- Fix the failing Playwright tests immediately
- Unblock the PR from merging
- Resolve what appeared to be a simple implementation (add singleton guards)

### The Mistake

Instead of following TDD:
```
1. RED: Write failing test proving multiple instances cause problems
2. GREEN: Implement singleton guard to make test pass
3. REFACTOR: Clean up if needed
```

We did:
```
1. Implement singleton guard (no test)
2. Verify Playwright tests pass
3. Add unit tests retroactively
```

---

## What Should Have Been Done (TDD)

### RED Phase (Should Have Come First)

```typescript
// packages/nextjs-adapter/tests/app/app-setup.test.ts
describe('createScenarist() singleton behavior', () => {
  it('should return the same instance when called multiple times', () => {
    const instance1 = createScenarist({ enabled: true, scenarios: testScenarios });
    const instance2 = createScenarist({ enabled: true, scenarios: testScenarios });

    // This SHOULD fail initially (proving we need singleton)
    expect(instance1).toBe(instance2);  // FAILS before singleton implementation
  });

  it('should prevent duplicate scenario registration errors', () => {
    const scenarios = { default: mockScenario };

    // First call registers scenarios
    const instance1 = createScenarist({ enabled: true, scenarios });

    // Second call should NOT throw DuplicateScenarioError
    // This SHOULD fail initially (multiple registries = duplicate error)
    expect(() => {
      const instance2 = createScenarist({ enabled: true, scenarios });
    }).not.toThrow();  // FAILS before singleton implementation
  });
});
```

### GREEN Phase (Then Implement)

```typescript
// packages/nextjs-adapter/src/app/setup.ts
declare global {
  var __scenarist_instance: AppScenarist | undefined;
  var __scenarist_registry: ScenarioRegistry | undefined;
  var __scenarist_store: ScenarioStore | undefined;
}

export const createScenarist = (options: AppAdapterOptions): AppScenarist => {
  // Singleton guard - return existing instance if already created
  if (global.__scenarist_instance) {
    return global.__scenarist_instance;  // ✅ Tests now pass
  }

  // ... rest of implementation
};
```

### REFACTOR Phase (Clean Up)

- Extract `clearAllGlobals()` helper for test isolation
- Document why singleton is needed (Next.js module duplication)
- Add comments explaining global state

---

## Actual Impact

### Positive

Despite the TDD violation, the implementation WAS correct:
- ✅ Singleton pattern solved the Playwright test failures
- ✅ Retroactive tests achieved 100% coverage
- ✅ Tests documented the behavior comprehensively
- ✅ Investigation was thorough (see `/docs/investigations/`)

### Negative

The TDD violation cost us:
- ❌ Lost confidence that implementation is minimal (might be over-engineered)
- ❌ No proof that tests drove the design
- ❌ Tests might be testing implementation, not behavior
- ❌ Future developers might think "tests optional if bug is obvious"

---

## Lessons Learned

### 1. "Obvious Bug" Is Not An Excuse

Even when the root cause is clear and the fix seems obvious, **write the failing test first**. The test documents:
- What problem we're solving
- How we know it's fixed
- What behavior is expected

### 2. Pressure Is Not An Excuse

Pressure to fix failing tests is real, but TDD is **non-negotiable**. The correct response:
- Take 5 minutes to write failing test
- Then implement fix
- Then verify tests pass
- Total time overhead: ~5 minutes
- Confidence gained: priceless

### 3. Integration Tests ≠ Unit Tests

Playwright tests passing doesn't mean unit tests aren't needed. Different layers:
- **Integration tests:** Prove the fix works end-to-end
- **Unit tests:** Prove the specific mechanism works (singleton guard)
- **Both are required**

### 4. Retroactive Tests Are Expensive

Adding tests after implementation:
- Requires fabricating RED state (already know implementation works)
- Tests might be biased toward implementation (not behavior)
- Loses TDD's design feedback loop
- More work than writing test first

---

## Mitigation

### What We Did

1. **Documented the violation** (this document + CLAUDE.md Issue #4)
2. **Added comprehensive tests** retroactively (5 tests App Router, 5 tests Pages Router)
3. **Verified 100% coverage** maintained
4. **Added test isolation helpers** (`clearAllGlobals()`)

### What We Should Do Next Time

1. **Use TDD Guardian agent** before implementing fixes
2. **Set timer:** If writing test takes >5 minutes, something is wrong
3. **Commit sequence:**
   - Commit 1: RED (failing test)
   - Commit 2: GREEN (minimal implementation)
   - Commit 3: REFACTOR (if needed)
4. **Review git history:** Before requesting PR review, verify RED → GREEN → REFACTOR visible in commits

---

## Recommendations for PR Review

### Acknowledge in PR Description

Add section:

```markdown
### ⚠️ TDD Violation Acknowledged

The singleton implementation commits (c273893, b72db17) violated TDD by implementing before writing tests. Tests were added retroactively (16a0d73, 90491fd) 3-16 hours after implementation.

**Why this happened:** Pressure to fix failing Playwright tests led to implementing "obvious fix" without test-first discipline.

**Mitigation:**
- Comprehensive tests added retroactively (10 tests total)
- 100% coverage verified
- Violation documented in `/docs/tdd-violation-singleton-implementation.md`
- Future work: Use TDD Guardian agent to prevent recurrence

**Lesson:** Even "obvious bugs" require test-first discipline. No exceptions.
```

### Commit Message Template for Future

```
fix(component): description of fix

RED: What test failed and why
GREEN: Minimal change to make test pass
REFACTOR: N/A (or describe refactoring)

Files:
- test file (RED commit)
- implementation file (GREEN commit)

Test evidence: git log shows RED → GREEN sequence
```

---

## References

- [CLAUDE.md § PR Review Fixes: Issue #4](../CLAUDE.md#issue-4-missing-tests-for-adapter-singleton-guard)
- [docs/investigations/next-js-pages-router-msw-investigation.md](investigations/next-js-pages-router-msw-investigation.md)
- [packages/nextjs-adapter/tests/app/app-setup.test.ts](../packages/nextjs-adapter/tests/app/app-setup.test.ts)
- [packages/nextjs-adapter/tests/pages/pages-setup.test.ts](../packages/nextjs-adapter/tests/pages/pages-setup.test.ts)

---

**Document Owner:** Claude Code (automated review)
**Last Updated:** 2025-11-12
**Status:** Complete - Violation documented, tests added, 100% coverage maintained
