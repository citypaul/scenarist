# ADR-0018: MSW Vitest File Parallelism Constraint

**Status**: Accepted
**Date**: 2025-11-26
**Authors**: Claude Code
**Fixes**: [GitHub Issue #139](https://github.com/citypaul/scenarist/issues/139)

## Context

During integration testing of Scenarist's express-example application, we encountered intermittent test failures across multiple test files (`string-matching.test.ts`, `dynamic-sequences.test.ts`, and others). These failures manifested as:

- "socket hang up" errors from MSW interceptors
- Real API responses (403, 404) indicating MSW wasn't intercepting requests
- ~17% failure rate when running multiple test files in parallel

### Initial Concern

The immediate question was: **Is this a fundamental limitation of Scenarist?**

**Answer: No.** Scenarist's Test ID isolation is designed for concurrent tests and works correctly. The issue is MSW's process-level HTTP interception architecture.

### How MSW Works

MSW (Mock Service Worker) intercepts HTTP requests at the **process level**:

```
Process A                    Process B
┌─────────────────┐         ┌─────────────────┐
│  MSW Server 1   │         │  MSW Server 2   │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ Intercept │  │         │  │ Intercept │  │
│  │ ALL HTTP  │  │         │  │ ALL HTTP  │  │
│  └───────────┘  │         └───────────┘  │
│  Tests A1, A2   │         │  Tests B1, B2   │
└─────────────────┘         └─────────────────┘
```

When multiple processes run simultaneously, each has its own MSW server instance. These instances can interfere with each other, especially during startup and shutdown.

### How Vitest File Parallelism Works

Vitest's `fileParallelism: true` (default) runs test files in separate **processes** using the forks pool:

```typescript
// vitest.config.ts default behavior
export default defineConfig({
  test: {
    fileParallelism: true,  // Default - runs files in parallel processes
    pool: 'forks',          // Default - separate Node.js processes
  },
});
```

When test files run in parallel:
1. Each file imports test helpers
2. Each helper calls `createApp()` which initializes MSW
3. Each process has its own MSW server instance
4. Race conditions occur during MSW startup/shutdown

### Why Tests Were Flaky

The flaky tests exhibited two patterns:

**Pattern 1: MSW Startup Race**
```
Time →
Process A: Start MSW ─────────────> Listening
Process B: Start MSW ────> Listening (partial intercept)
                          ↑
                          Real API called (MSW not ready)
```

**Pattern 2: MSW Shutdown Interference**
```
Time →
File A: Tests complete ──> Stop MSW ───> Done
File B: Tests running ────────────────> Request fails (MSW stopped by A)
```

### The Distinction: Test ID Isolation vs MSW Instance

**Scenarist's Test ID isolation** enables concurrent tests **within a single MSW server**:

```
Single MSW Server
┌─────────────────────────────────────────────┐
│  Request comes in with Test ID "test-123"   │
│           ↓                                  │
│  Scenarist routes to Test 123's scenario    │
│                                              │
│  Test 1 (ID: test-1) ───┐                   │
│  Test 2 (ID: test-2) ───┼──> Same MSW      │
│  Test 3 (ID: test-3) ───┘    Different data │
└─────────────────────────────────────────────┘
```

This works **perfectly** when all tests share one MSW instance. The issue is **multiple MSW instances** interfering at the process level.

## Problem

**How can we run reliable MSW-based tests in Vitest while maintaining Scenarist's concurrent test support?**

The tension:
- Vitest's file parallelism provides faster test execution
- MSW's process-level interception creates race conditions when multiple processes have MSW servers
- Scenarist needs reliable MSW operation to demonstrate its Test ID isolation

## Decision

**Disable file parallelism for MSW-based test suites** using `fileParallelism: false` in Vitest configuration.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,  // Sequential file execution for MSW stability
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/production/**'],
  },
});
```

### Critical Implementation Detail: Async Cleanup

**The cleanup function MUST be async and MUST be awaited**:

```typescript
// test-helpers.ts
export const createTestFixtures = async (): Promise<{
  app: Express;
  scenarist: ExpressScenarist<typeof scenarios>;
  cleanup: () => Promise<void>;  // Must return Promise
}> => {
  const setup = await createApp();

  if (!setup.scenarist) {
    throw new Error('Scenarist not initialized');
  }

  setup.scenarist.start();

  return {
    app: setup.app,
    scenarist: setup.scenarist,
    cleanup: async () => {
      await setup.scenarist?.stop();  // Async MSW server.close()
    },
  };
};

// In test files - MUST await cleanup
describe('My Tests', () => {
  afterAll(async () => {
    await fixtures.cleanup();  // MUST await!
  });
});
```

**Why async matters**: MSW's `server.close()` is asynchronous. Not awaiting it causes the next test file to start before the previous MSW server fully stops, creating the exact race condition we're avoiding.

## Rationale

### Why This Is the Correct Solution

**1. Matches MSW's Design**

MSW is designed for process-level HTTP interception. The [MSW documentation](https://mswjs.io/) shows single-server patterns because that's how it's meant to be used.

**2. Matches Production Usage**

In production E2E testing (Playwright, Cypress), there's ONE application server with ONE MSW instance, and multiple test workers each use unique Test IDs:

```
Production E2E Architecture (What Scenarist is designed for)
┌─────────────────────────────────────────────────────────┐
│                  Application Server                      │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  Express/Next   │──│  Scenarist + MSW (ONE instance) │
│  └─────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           ↑                           ↑
    ┌──────┴──────┐             ┌──────┴──────┐
    │ Playwright  │             │ Playwright  │
    │ Worker 1    │             │ Worker 2    │
    │ (Test ID: A)│             │ (Test ID: B)│
    └─────────────┘             └─────────────┘
```

**3. Scenarist's Test ID Isolation Works Within This Model**

Scenarist's value proposition is **concurrent tests with different backend states**. This works perfectly when all tests hit the same MSW server with different Test IDs.

**4. Performance Impact Is Minimal**

Sequential file execution adds ~1 second to the total test time. With 12 test files and 85 tests, execution time went from ~3.8s (flaky parallel) to ~4.9s (reliable sequential).

### Why Not Other Solutions?

**Alternative 1: Use `pool: 'threads'` instead of `forks`**

Vitest's threads pool runs tests in V8 isolates within a single process. However:
- MSW still creates separate server instances per test file
- Race conditions still occurred in testing (~17% failure rate)
- Not a fundamental fix

**Alternative 2: Singleton MSW Instance Across Files**

We attempted to share a single MSW instance across all test files:

```typescript
// Attempted singleton pattern (DOESN'T WORK)
let sharedFixtures: TestFixtures | null = null;

export const getSharedFixtures = async () => {
  if (!sharedFixtures) {
    sharedFixtures = await createTestFixtures();
  }
  return sharedFixtures;
};
```

This failed because:
- Vitest's forks pool creates separate processes
- Singleton state isn't shared across processes
- Even with threads pool, module state isolation prevented sharing

**Alternative 3: Global Setup/Teardown**

Vitest's `globalSetup` runs once before all tests:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globalSetup: './setup.ts',
  },
});
```

However:
- Global setup runs in a separate process
- MSW server can't be shared to test processes
- Would require inter-process communication (complex, error-prone)

## Consequences

### Positive

✅ **100% test reliability** - 10 consecutive runs, 85 tests each, 0 failures

✅ **Clear mental model** - One MSW server per test run matches MSW's design

✅ **Production-representative** - Sequential file execution mirrors single-server production architecture

✅ **Scenarist isolation preserved** - Test ID isolation works perfectly within each file

✅ **Async cleanup enforced** - Pattern prevents race conditions

### Negative

❌ **Slightly slower test execution** - ~1 second additional time (4.9s vs 3.8s)

❌ **Can't parallelize across files** - Files must run sequentially

### Neutral

⚪ **Tests within files run efficiently** - Scenarist's Test ID isolation allows concurrent test logic

⚪ **Same pattern as Jest** - Jest's default is sequential file execution

## Implementation

### Changes Made

**1. vitest.config.ts**
```typescript
fileParallelism: false,
```

**2. test-helpers.ts**
- Cleanup function returns `Promise<void>`
- MSW stop is properly awaited

**3. All 12 test files**
- Updated `afterAll` to use async/await pattern:
```typescript
afterAll(async () => {
  await fixtures.cleanup();
});
```

### Verification

```bash
# Run tests 10 times to verify stability
for i in 1 2 3 4 5 6 7 8 9 10; do
  pnpm --filter=@scenarist/express-example test
done
# Result: 10/10 successful runs, 85 tests passing each time
```

## Related Decisions

- **[ADR-0003: Testing Strategy](./0003-testing-strategy.md)** - Four-layer testing approach
- **[ADR-0006: Thin Adapters Real Integration Tests](./0006-thin-adapters-real-integration-tests.md)** - When adapters can use real framework dependencies

## References

- [GitHub Issue #139](https://github.com/citypaul/scenarist/issues/139) - Flaky test report
- [Vitest File Parallelism](https://vitest.dev/config/#fileparallelism) - Configuration documentation
- [MSW Server API](https://mswjs.io/docs/api/setup-server) - MSW Node.js integration
- [Vitest Pool Options](https://vitest.dev/config/#pool) - Process isolation strategies

## Key Insight

**This is NOT a Scenarist limitation.** Scenarist's Test ID isolation is specifically designed for concurrent tests with different backend states. The constraint is MSW's process-level HTTP interception architecture.

The production model (one app server, one MSW instance, multiple test workers with unique Test IDs) works exactly as designed. The only limitation is Vitest's file parallelism creating multiple MSW instances.

**Bottom line:** Use `fileParallelism: false` for MSW-based tests. This matches MSW's design, mirrors production architecture, and enables Scenarist's Test ID isolation to work correctly.
