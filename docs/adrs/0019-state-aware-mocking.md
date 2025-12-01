# ADR-0019: State-Aware Mocking

**Status**: Proposed
**Date**: 2025-12-01
**Authors**: Claude Code

## Context

Sequence-based mocking is fragile with **stateless backend architectures** because we can't predict how many API calls occur before a state-changing operation. The count varies due to React re-renders, middleware, and async timing.

### The Problem

Current workaround requires magic numbers discovered through trial-and-error:

```typescript
// Ineligible scenario - needs exactly 11 "appStarted" before "quoteDecline"
sequence: {
  responses: [
    ...Array(11).fill({ body: { state: 'appStarted' } }),
    { body: { state: 'quoteDecline' } },
  ],
  repeat: 'last'
}
```

**Why this is problematic:**

- Fragile - any change to React components can break it
- Non-obvious - why 11? Not documented anywhere
- Different per scenario - each journey has different call patterns

We need tests to express **intent** ("after POST, GETs return new state") not **call counts** ("11 GETs then POST").

## Decision

Adopt **explicit state mutation pattern** with three new capabilities:

| Capability               | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `stateResponse`          | Return different responses based on current test state     |
| `afterResponse.setState` | Mutate test state after returning a response               |
| `match.state`            | Select which mock handles a request based on current state |

**Example:**

```typescript
{
  method: 'GET',
  url: '/applications/:id',
  stateResponse: {
    default: { body: { state: 'appStarted' } },
    conditions: [
      { when: { checked: true }, then: { body: { state: 'quoteDecline' } } }
    ]
  }
},
{
  method: 'POST',
  url: '/applications/:id/eligibility',
  response: { body: { state: 'quoteDecline' } },
  afterResponse: { setState: { checked: true } }
}
```

Tests now express **intent** ("after POST, GETs return new state") not **call counts** ("11 GETs then POST").

## Key Design Decisions

1. **Declarative patterns only** - `when` is partial object matching, not functions (per ADR-0013). Enables inspection, composition, and maintains serializability.

2. **State scoped per test** - Uses existing `x-scenarist-test-id` mechanism. No new infrastructure needed; concurrent tests remain isolated.

3. **Specificity-based selection** - Most specific condition wins (more keys = more specific). Consistent with existing `match` behavior, eliminates ordering concerns.

4. **Initial typing**: `Record<string, unknown>` - Schema-based typing deferred to prove concept first (Issue #305). Pragmatic path to value.

5. **Multi-transition via `match.state`** - Same endpoint can handle different state transitions based on current state. Solves "same POST, different outcomes" problem.

## Consequences

**Positive:**

- ✅ Tests resilient to call count variations
- ✅ Expresses business intent, not implementation details
- ✅ Backward compatible (existing `response`/`sequence` unchanged)
- ✅ Maintains declarative philosophy (ADR-0013)

**Trade-offs:**

- ⚠️ Adds complexity to mock definition schema
- ⚠️ No strong typing initially

## Alternatives Considered

| Alternative                                       | Decision | Reason                                         |
| ------------------------------------------------- | -------- | ---------------------------------------------- |
| Option B: `responseFromState: (state) => ...`     | Rejected | Uses functions, violates ADR-0013              |
| Option C: Event-based (`emitsEvent`/`afterEvent`) | Deferred | More indirection, may build later (Issue #304) |
| Conditional `afterResponse`                       | Rejected | Duplicates conditions, harder to reason about  |
| Continue with sequences only                      | Rejected | Too fragile for stateless architectures        |

## Related

- **ADR-0002**: Dynamic Response System (architecture this extends)
- **ADR-0005**: State & Sequence Reset (cleanup behavior)
- **ADR-0013**: Declarative Scenarios (constraint satisfied)
- **Issue #304**: Event-Based State (future consideration)
- **Issue #305**: Schema-Based Typing (future DX enhancement)
- **[Implementation Reference](../plans/state-aware-mocking-implementation.md)**: Technical details for building this feature
