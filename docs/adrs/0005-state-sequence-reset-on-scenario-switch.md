# ADR-0005: State and Sequence Reset on Scenario Switch

**Status**: Accepted
**Date**: 2025-10-27
**Authors**: Claude Code

## Context

Scenarist enables switching scenarios at runtime without restarting the application. When a test calls `POST /__scenario__` to switch scenarios, the system must decide what happens to:

1. **Sequence positions** - Current position in each sequence (e.g., step 2 of 5 in a polling sequence)
2. **Captured state** - Data captured from previous requests (e.g., shopping cart items)

This decision impacts:

- Test idempotency (can tests run multiple times with same results?)
- Bruno test automation (can manual tests be re-run without server restart?)
- Integration tests (can tests switch scenarios and get predictable results?)
- User experience (debugging complex scenarios)

## Problem

When switching from Scenario A to Scenario B (same test ID), should we:

**Option 1:** Preserve state and sequences

- Sequences stay at current positions
- State remains captured
- Next scenario continues where previous left off

**Option 2:** Reset state and sequences

- Sequences reset to position 0
- State cleared
- Next scenario starts with clean slate

## Decision

**Reset state and sequences** when switching scenarios for the same test ID.

When `switchScenario(testId, scenarioId)` is called:

1. Switch the active scenario
2. Call `sequenceTracker.reset(testId)` - clear all sequence positions
3. Call `stateManager.reset(testId)` - clear all captured state
4. If scenario switch fails, do NOT reset (preserve state for debugging)

## Rationale

### 1. Test Idempotency

**Requirement:** Tests must produce identical results when run multiple times.

**With Reset:**

```typescript
// Run 1
switchScenario("test-1", "github-polling");
request("/api/job/123"); // Returns "pending" (sequence position 0)
request("/api/job/123"); // Returns "processing" (sequence position 1)
request("/api/job/123"); // Returns "complete" (sequence position 2)

// Run 2 (without server restart)
switchScenario("test-1", "github-polling"); // ← Resets sequences
request("/api/job/123"); // Returns "pending" (position 0 again) ✅
request("/api/job/123"); // Returns "processing" (position 1 again) ✅
request("/api/job/123"); // Returns "complete" (position 2 again) ✅
```

**Without Reset:**

```typescript
// Run 2 would continue from position 3
request("/api/job/123"); // Returns "complete" (stuck at last) ❌
// Tests fail - expected "pending", got "complete"
```

### 2. Bruno Test Success

Bruno tests run against a live server. Without reset:

- First run: 133/133 assertions pass ✅
- Second run: 117/133 assertions fail ❌ (sequences exhausted, state polluted)
- Required: Server restart between runs (terrible UX)

With reset:

- First run: 133/133 assertions pass ✅
- Second run: 133/133 assertions pass ✅
- No server restart needed

### 3. Scenario Isolation

Each scenario should be **self-contained** and **predictable**:

**With Reset:**

- Scenario always starts in known state (clean slate)
- No hidden dependencies on previous scenarios
- Easy to debug (known starting conditions)

**Without Reset:**

- Scenario behavior depends on previous scenarios
- "It works in test A, fails in test B" bugs
- Debugging nightmare (need to know execution order)

### 4. Mental Model Simplicity

**User expectation:** "Switch scenario" means "start fresh with new rules"

**With Reset:**

- Matches user mental model ✅
- "Shopping cart scenario" starts with empty cart
- "Payment polling scenario" starts at step 1

**Without Reset:**

- Violates user expectations ❌
- "Shopping cart scenario" might start with items from previous scenario
- Confusing and error-prone

## Alternatives Considered

### Alternative 1: Preserve State and Sequences

**Approach:** Keep state and sequences across scenario switches

**Advantages:**

- Could test "handoff" between scenarios
- State accumulates across scenarios

**Disadvantages:**

- ❌ Tests not idempotent (fail on second run)
- ❌ Bruno tests require server restart
- ❌ Scenario behavior depends on execution order
- ❌ Debugging difficulty (unknown starting state)
- ❌ Violates user mental model

**Decision:** Rejected - idempotency is critical

### Alternative 2: Explicit Reset API

**Approach:** Add separate `POST /__reset__` endpoint, don't reset on scenario switch

**Advantages:**

- Explicit control over when to reset
- Could preserve state if desired

**Disadvantages:**

- ❌ Extra API to remember
- ❌ Easy to forget reset between tests
- ❌ Tests not idempotent by default
- ❌ More complexity for users

**Decision:** Rejected - reset should be automatic

### Alternative 3: Per-Scenario Reset Configuration

**Approach:** Each scenario declares whether it wants reset

```typescript
{
  id: 'shopping-cart',
  resetOnSwitch: true, // ← per-scenario config
  mocks: [...]
}
```

**Advantages:**

- Flexibility per scenario

**Disadvantages:**

- ❌ Complexity - users must understand reset semantics
- ❌ Inconsistent behavior across scenarios
- ❌ Easy to get wrong
- ❌ Doesn't solve idempotency (some scenarios still polluted)

**Decision:** Rejected - always reset is simpler and safer

## Implementation

### Phase 2 (Sequences)

**File:** `packages/core/src/domain/scenario-manager.ts`

```typescript
switchScenario(testId, scenarioId, variantName): ScenaristResult<void, Error> {
  const definition = registry.get(scenarioId);
  if (!definition) {
    return { success: false, error: new ScenarioNotFoundError(scenarioId) };
  }

  store.set(testId, { scenarioId, variantName });

  // Reset sequence positions (from Dynamic Response Phase 2: Sequences)
  if (sequenceTracker) {
    sequenceTracker.reset(testId);
  }

  return { success: true, data: undefined };
}
```

**Tests:**

- `packages/core/tests/in-memory-sequence-tracker.test.ts` (7 tests for reset behavior)
- `packages/core/tests/scenario-manager.test.ts` (4 tests for integration)
- E2E: Bruno tests pass 133/133 on multiple runs

### Phase 3 (State)

**File:** `packages/core/src/domain/scenario-manager.ts`

```typescript
switchScenario(testId, scenarioId, variantName): ScenaristResult<void, Error> {
  const definition = registry.get(scenarioId);
  if (!definition) {
    return { success: false, error: new ScenarioNotFoundError(scenarioId) };
  }

  store.set(testId, { scenarioId, variantName });

  // Reset sequence positions (from Dynamic Response Phase 2: Sequences)
  if (sequenceTracker) {
    sequenceTracker.reset(testId);
  }

  // Reset captured state (from Dynamic Response Phase 3: Stateful Mocks)
  if (stateManager) {
    stateManager.reset(testId);
  }

  return { success: true, data: undefined };
}
```

**Tests:**

- `packages/core/tests/in-memory-state-manager.test.ts` (14 tests including reset)
- `packages/core/tests/scenario-manager.test.ts` (state reset integration tests)
- `apps/express-example/tests/stateful-scenarios.test.ts` (E2E reset verification)

### Error Case: Failed Scenario Switch

**Behavior:** If scenario switch fails (scenario not found), do NOT reset state/sequences

**Rationale:**

- State might help debug why switch failed
- Don't destroy evidence
- Only reset on successful switch

**Code:**

```typescript
if (!definition) {
  // DON'T reset - failed switch, preserve state for debugging
  return { success: false, error: new ScenarioNotFoundError(scenarioId) };
}

// Only reset AFTER successful scenario set
store.set(testId, { scenarioId, variantName });
sequenceTracker?.reset(testId);
stateManager?.reset(testId);
```

## Consequences

### Positive

✅ **Test idempotency** - Tests run multiple times with identical results

✅ **Bruno test success** - Manual/automated tests work without server restart

✅ **Scenario isolation** - Each scenario starts with clean, predictable state

✅ **Simple mental model** - "Switch scenario" = "start fresh"

✅ **Easy debugging** - Known starting state for each scenario

✅ **Consistent behavior** - All scenarios behave the same way

### Negative

❌ **Cannot test scenario handoff** - Can't accumulate state across scenarios

_Mitigation:_ Not a real use case - tests should be independent. If needed, use single scenario with multiple mocks.

❌ **State lost on accidental switch** - Switching scenarios loses work

_Mitigation:_ This is by design. Switching scenarios means "start over with new rules."

## Verification

**Bruno Tests (E2E):**

- First run: 133/133 assertions ✅
- Second run: 133/133 assertions ✅
- Third run: 133/133 assertions ✅

**Unit Tests:**

- 7 tests for SequenceTracker.reset()
- 14 tests for StateManager (including reset)
- 4 tests for ScenarioManager integration

**Integration Tests:**

- Shopping cart: state cleared on scenario switch
- Multi-step form: state reset between scenarios
- Polling: sequences reset to position 0

## Related Documents

- [CLAUDE.md § Sequence Reset - Idempotency Fix](../../CLAUDE.md#sequence-reset-on-scenario-switch---idempotency-fix)
- [core-functionality.md § Test Isolation](../core-functionality.md#test-isolation)
- [PR #33: State Reset on Scenario Switch](https://github.com/citypaul/scenarist/pull/33)
- [PR #35: Bruno Test Automation](https://github.com/citypaul/scenarist/pull/35)

## Future Considerations

If user feedback indicates need for state persistence across scenarios:

1. Could add optional `preserveState` flag to scenario switch
2. Default remains "reset" for idempotency
3. Advanced users can opt into preservation if needed

**However**, current design is intentionally opinionated toward idempotency and simplicity. We should resist adding complexity unless strong use case emerges.
