# ADR-0019: State-Aware Mocking

**Status**: Accepted
**Date**: 2025-12-01
**Authors**: Claude Code
**Extended by**: [ADR-0020](0020-conditional-afterresponse.md) (Conditional afterResponse)

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

| Capability               | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `stateResponse`          | Return different responses based on current test state         |
| `afterResponse.setState` | Mutate test state after returning a response                   |
| `match.state`            | Determines which mock handles a request based on current state |

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

## Type Safety Migration Path

Initial implementation uses `Record<string, unknown>` for pragmatic delivery. Migration to schema-based typing (Issue #305):

**Phase 1 (This ADR):** `Record<string, unknown>` - proves concept, gathers feedback

**Phase 2 (Issue #305):** Optional schema validation

```typescript
const scenario = defineStatefulScenario({
  id: 'workflow',
  stateSchema: z.object({
    step: z.enum(['initial', 'reviewed', 'approved']),
    checked: z.boolean(),
  }),
  mocks: [...] // TypeScript infers state shape from schema
});
```

Schema-based typing will provide: autocomplete for state keys, compile-time errors for invalid state, runtime validation in development mode.

## State Reset Behavior

Per ADR-0005, state follows existing reset semantics:

| Event                          | Behavior                                              |
| ------------------------------ | ----------------------------------------------------- |
| Scenario switch                | State cleared (idempotent tests)                      |
| Test ends (cleanup)            | State cleared for that test ID                        |
| Variant switch (same scenario) | State preserved (same scenario context)               |
| No explicit cleanup            | State persists until test ID reused or server restart |

**Nested scenario switches:** Each switch clears state. No state inheritance between scenarios.

## Composition with Existing Features

### Precedence Rules

When multiple response mechanisms are present:

1. `match` criteria (including `match.state`) filter which mock handles request
2. Response determination: `stateResponse` > `sequence` > `response`
3. `afterResponse.setState` executes after any response type

### Feature Combinations

| Combination                           | Behavior                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| `stateResponse` + `sequence`          | Invalid - use one or the other                                 |
| `sequence` + `afterResponse.setState` | ✅ Valid - state mutates after each sequence response          |
| `match.state` + `match.body`          | ✅ Valid - both must match (AND logic)                         |
| `match.state` + `stateResponse`       | ✅ Valid - state selects mock, then conditions select response |

### Match Criteria Order of Operations

1. Filter mocks by `method` + `url`
2. Filter by `match.state` (if present)
3. Filter by other `match` criteria (`body`, `headers`, `query`)
4. Select most specific match (existing specificity rules)
5. Resolve response (`stateResponse` conditions or direct `response`)
6. Execute `afterResponse.setState` (if present)

## Performance Characteristics

This is test infrastructure - performance overhead is negligible in practice:

- **State lookup:** O(1) via `Map<testId, Record<string, unknown>>`
- **Condition evaluation:** O(n) where n = number of conditions
- **Per-request overhead:** < 0.1% of typical HTTP request handling time
- **Memory:** ~200 bytes per active test ID (cleaned on test end)

**Design guidance:** For scenarios with > 20 conditions, consider splitting into multiple scenarios for readability, not performance.

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

| Alternative                                       | Decision     | Reason                                                        |
| ------------------------------------------------- | ------------ | ------------------------------------------------------------- |
| Option B: `responseFromState: (state) => ...`     | Rejected     | Uses functions, violates ADR-0013                             |
| Option C: Event-based (`emitsEvent`/`afterEvent`) | Deferred     | More indirection, may build later (Issue #304)                |
| Conditional `afterResponse`                       | **Accepted** | See [ADR-0020](0020-conditional-afterresponse.md) for details |
| Continue with sequences only                      | Rejected     | Too fragile for stateless architectures                       |

## Related

- **ADR-0002**: Dynamic Response System (architecture this extends)
- **ADR-0005**: State & Sequence Reset (cleanup behavior)
- **ADR-0013**: Declarative Scenarios (constraint satisfied)
- **ADR-0020**: Conditional afterResponse (extends this ADR)
- **Issue #304**: Event-Based State (future consideration)
- **Issue #305**: Schema-Based Typing (future DX enhancement)
- **[Implementation Reference](../plans/state-aware-mocking-implementation.md)**: Technical details for building this feature
