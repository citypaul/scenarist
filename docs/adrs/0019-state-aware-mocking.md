# ADR-0019: State-Aware Mocking

**Status**: Proposed
**Date**: 2025-12-01
**Authors**: Claude Code

## Context

Sequence-based mocking is fragile with **stateless backend architectures** because we can't predict how many API calls occur before a state-changing operation. The count varies due to React re-renders, middleware, and async timing.

Current workaround requires magic numbers (`Array(11).fill(...)`) discovered through trial-and-error.

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

1. **Declarative patterns only** - `when` is partial object matching, not functions (per ADR-0013)
2. **State scoped per test** - Uses existing `x-scenarist-test-id` mechanism
3. **Specificity-based selection** - Most specific condition wins (consistent with `match` behavior)
4. **Initial typing**: `Record<string, unknown>` - schema-based typing deferred (Issue #305)
5. **Multi-transition via `match.state`** - Same endpoint can handle different state transitions

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
