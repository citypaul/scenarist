# ADR-0020: Conditional afterResponse for stateResponse Conditions

**Status**: Accepted
**Date**: 2025-12-06
**Authors**: Claude Code
**Supersedes**: Reverses decision in ADR-0019 "Alternatives Considered"

## Context

ADR-0019 introduced state-aware mocking with `stateResponse` for condition-based responses and `afterResponse.setState` for state mutations. However, in that ADR, "Conditional afterResponse" was listed as **Rejected** because it was thought to "duplicate conditions" and be "harder to reason about."

In practice, Issue #332 revealed a critical limitation: **mock-level `afterResponse` always runs regardless of which condition matched**, causing unintended state regressions in multi-stage flows.

### The Problem

```typescript
{
  method: "GET",
  url: "/loan/status",
  stateResponse: {
    default: { status: 200, body: { status: "pending" } },
    conditions: [
      { when: { submitted: true }, then: { status: 200, body: { status: "reviewing" } } },
      { when: { approved: true }, then: { status: 200, body: { status: "complete" } } }
    ]
  },
  afterResponse: { setState: { phase: "initial" } }  // Always runs, even when approved!
}
```

**Scenario:**

1. User submits application → state becomes `{ submitted: true, phase: "processing" }`
2. User gets approved → state becomes `{ submitted: true, approved: true, phase: "processing" }`
3. User checks status → matches `approved: true` condition, returns "complete"
4. **BUG:** Mock-level `afterResponse` runs → `phase` reset to "initial"!

The mock-level `afterResponse` always executes, **regardless of which condition matched**, causing state to regress inappropriately.

## Decision

Allow `afterResponse` at the condition level within `stateResponse`, with **replace semantics** (not merge):

```typescript
{
  method: "GET",
  url: "/loan/status",
  stateResponse: {
    default: { status: 200, body: { status: "pending" } },
    conditions: [
      {
        when: { submitted: true },
        then: { status: 200, body: { status: "reviewing" } },
        afterResponse: { setState: { phase: "review" } }  // Condition-specific
      },
      {
        when: { approved: true },
        then: { status: 200, body: { status: "complete" } },
        afterResponse: null  // Explicitly suppress state mutation
      }
    ]
  },
  afterResponse: { setState: { phase: "initial" } }  // Fallback for default
}
```

### Resolution Logic

```
1. Request matches mock
2. Resolve stateResponse → get matched condition or default
3. Determine afterResponse to apply:
   a. If condition matched AND condition has `afterResponse` key → use condition's (including null)
   b. If condition matched AND condition has no `afterResponse` key → use mock-level
   c. If default matched → use mock-level
4. Execute afterResponse (if not null)
```

### Key Design Choices

**1. Replace, not merge:**

When a condition defines `afterResponse`, it completely replaces the mock-level one. No merging.

**Rationale (aligns with "screamingly obvious" philosophy):**

- **Clarity**: Looking at a condition shows exactly what happens
- **Explicit null**: `afterResponse: null` unambiguously means "no mutation"
- **No surprises**: No need to mentally compute merged results
- **Simple mental model**: "Condition-level wins, mock-level is fallback"

**2. Three-way distinction:**

```typescript
// afterResponse: { setState: {...} } → Apply this specific mutation
// afterResponse: null → Explicitly no mutation (suppress mock-level)
// (no afterResponse key) → Inherit mock-level afterResponse
```

This allows conditions to:

- Override with custom mutations
- Explicitly suppress mutations
- Inherit the fallback behavior

### Debug State Endpoint

To support debugging state flows, a new endpoint was added:

```
GET /__scenarist__/state
Header: x-scenarist-test-id: test-123
```

**Response:**

```json
{
  "testId": "test-123",
  "state": {
    "phase": "review",
    "submitted": true
  }
}
```

### Playwright Debug Fixtures

New fixtures in `@scenarist/playwright-helpers`:

```typescript
// Inspect current state at any point in test
const state = await debugState(page);
expect(state.phase).toBe("review");

// Wait for state to meet condition
const state = await waitForDebugState(page, (s) => s.approved === true, {
  timeout: 10000,
});
```

## Consequences

**Positive:**

- ✅ Multi-stage flows work correctly without state regression
- ✅ Clear, explicit control over state mutations per condition
- ✅ `afterResponse: null` provides explicit suppression
- ✅ Debug endpoint enables state inspection for test debugging
- ✅ Backward compatible (existing mocks without condition afterResponse unchanged)

**Trade-offs:**

- ⚠️ Adds complexity to condition schema
- ⚠️ Replace semantics require explicit null for suppression

## Alternatives Considered

| Alternative                          | Decision | Reason                                          |
| ------------------------------------ | -------- | ----------------------------------------------- |
| Keep mock-level only                 | Rejected | Cannot handle multi-stage flows correctly       |
| Merge condition + mock afterResponse | Rejected | Hidden complexity, harder to reason about       |
| Event-based system                   | Deferred | More indirection, solve immediate problem first |

## Why ADR-0019's Rejection Was Reconsidered

ADR-0019 rejected conditional afterResponse because:

> "Duplicates conditions, harder to reason about"

This was reconsidered because:

1. **Not duplication**: The condition's `when` clause determines _which response_, while condition's `afterResponse` determines _what state mutation_. These are orthogonal concerns.

2. **Actually easier to reason about**: With replace semantics, each condition is self-contained. Looking at a condition tells you everything that happens when it matches.

3. **Real-world need**: Issue #332 demonstrated practical scenarios where mock-level afterResponse is inappropriate for certain conditions.

## Related

- **ADR-0019**: State-Aware Mocking (this extends)
- **ADR-0013**: Declarative Scenarios (constraint satisfied - afterResponse is declarative)
- **Issue #332**: Conditional afterResponse implementation
