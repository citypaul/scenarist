# ADR-0002: Dynamic Response System

**Status**: Accepted
**Date**: 2025-10-23
**Last Updated**: 2025-10-27
**Authors**: Claude Code

## Context

Scenarist currently provides a single static response per `ScenaristMock`. Each mock maps one URL pattern to one response:

```typescript
{
  method: 'GET',
  url: '/api/job/:id',
  response: { status: 200, body: { status: 'complete' } }
}
```

This limitation makes it impossible to test common real-world scenarios:

1. **Polling scenarios** - GET /job/:id should return "pending" → "processing" → "complete" over multiple calls
2. **Content-based responses** - POST /items should return different prices depending on which item is requested
3. **Stateful interactions** - POST /cart/items should affect what GET /cart returns
4. **Multi-step processes** - Form steps where later steps depend on earlier steps being completed

These patterns appear in **every significant application**. Without support for them, Scenarist cannot adequately test realistic user journeys.

## Problem

Users need to define different responses from the same endpoint based on:
- **Request content** (body, headers, query parameters)
- **Call sequence** (1st call, 2nd call, 3rd call - for polling)
- **Application state** (responses depend on what happened in previous requests)

**Critical constraints:**
1. Must remain 100% serializable (JSON only, no functions) - see ADR-0001
2. Must be self-contained (no runtime headers/configuration required beyond test ID)
3. Must work in browsers (for future devtools)
4. Features must compose (match + sequence + state working together)
5. Clear precedence rules when multiple mocks match same URL

## Decision

We will implement a **Dynamic Response System** with three new capabilities that compose naturally.

### Three Core Capabilities

#### 1. Request Content Matching

Enable different responses based on request content using optional `match` criteria:

```typescript
type ScenaristMatch = {
  readonly body?: Record<string, unknown>;      // Partial match
  readonly headers?: Record<string, string>;    // Exact match
  readonly query?: Record<string, string>;      // Exact match
};
```

**First matching mock wins** - mocks are checked in array order, with match criteria acting as filters.

#### 2. Response Sequences

Enable ordered sequences of responses for polling scenarios using `sequence` field:

```typescript
type ScenaristMock = {
  readonly response?: ScenaristResponse;     // Single response (existing)
  readonly sequence?: {                 // OR sequence (new)
    readonly responses: ReadonlyArray<ScenaristResponse>;
    readonly repeat?: 'last' | 'cycle' | 'none';
  };
};
```

**Repeat modes:**
- `last` (default): Return last response infinitely
- `cycle`: Loop back to first response
- `none`: Mark mock as exhausted, enable fallback to next mock

#### 3. Stateful Mocks

Enable capturing data from requests and injecting it into responses:

```typescript
type ScenaristMock = {
  readonly captureState?: Record<string, string>;  // { stateKey: requestPath }
};
```

**State characteristics:**
- Stored per test ID (isolated between tests)
- Reset when scenario switches
- Accessed via `{{state.key}}` template syntax in responses
- Supports nested paths and array appending (`stateKey[]`)

### Architectural Decision: Core vs Adapters

**CRITICAL**: The dynamic response logic is **domain logic** and must live in `packages/core/src/domain/`, not in adapters.

**Core responsibilities:**
- `ResponseSelector` domain service (matching, sequence tracking, state management)
- `SequenceTracker` port (interface for tracking positions)
- `StateManager` port (interface for managing state)
- All implementations use dependency injection pattern

**Adapter responsibilities:**
- Extract request context from framework
- Call core domain services
- NO domain logic in adapters

**Why this matters:**
- ✅ Single implementation - logic tested once in core
- ✅ No duplication - adapters just translate
- ✅ Consistency - every adapter behaves identically
- ✅ Maintainability - fix bugs once, benefits all adapters

### Feature Composition

All three features compose naturally through a three-phase execution model:

1. **Phase 1: Match** - Does this mock apply? (check match criteria, sequence exhaustion)
2. **Phase 2: Select Response** - Which response to return? (sequence position or single response)
3. **Phase 3: Transform** - Modify based on state (capture and template replacement)

**Key architectural insight:** The phases are **orthogonal** (independent and non-interfering). Each phase:
- Has **single responsibility** and is independently testable
- Communicates through **data pipeline**, not shared logic
- **Cannot interfere** beyond defined boundaries

This orthogonal design guarantees composition works correctly without dedicated combination tests. The architecture itself enforces correct behavior - similar to how Unix pipes guarantee that `cat | grep | sort` works if each tool works independently.

See [ADR-0004](./0004-why-composition-tests-unnecessary.md) for detailed analysis of why this architecture eliminates the need for dedicated composition tests.

## Alternatives Considered

### Alternative 1: Function-Based Responses

**Approach**: Allow response to be a function:

```typescript
{
  method: 'POST',
  url: '/api/items',
  response: (req) => req.body.itemId === 'premium'
    ? { status: 200, body: { price: 100 } }
    : { status: 200, body: { price: 50 } }
}
```

**Decision**: Rejected

**Why:**
- ❌ Violates ADR-0001 (must be serializable)
- ❌ Cannot be stored in Redis, files, or databases
- ❌ Cannot be version controlled effectively
- ❌ Cannot be loaded in future devtools
- ❌ Breaks hexagonal architecture

### Alternative 2: Conditional Response Blocks

**Approach**: Use JSON-based conditions with response blocks:

```typescript
{
  method: 'POST',
  url: '/api/items',
  conditions: [
    {
      when: { bodyPath: 'itemId', equals: 'premium-item' },
      response: { status: 200, body: { price: 100 } }
    }
  ],
  fallback: { status: 200, body: { price: 25 } }
}
```

**Decision**: Rejected

**Why:**
- ⚠️ More complex type system
- ⚠️ Harder to understand composition model
- ⚠️ Doesn't handle sequences or state naturally
- ✅ Could work, but "multiple mocks with match criteria" is simpler and more flexible

### Alternative 3: State Machine Definitions

**Approach**: Define explicit state machines for sequences:

```typescript
{
  method: 'GET',
  url: '/api/job/:id',
  stateMachine: {
    initial: 'pending',
    states: {
      pending: { response: {...}, after: 2, goto: 'processing' },
      processing: { response: {...}, after: 1, goto: 'complete' },
      complete: { response: {...}, terminal: true }
    }
  }
}
```

**Decision**: Rejected for v1, may revisit

**Why:**
- ⚠️ Significantly more complex
- ⚠️ Overkill for most use cases
- ✅ Sequences with repeat modes cover 95% of cases
- 🔮 May add in v2 if clear demand emerges

### Alternative 4: Single Global State vs Per-Test-ID State

**Decision**: Chose per-test-ID state

**Why:**
- ✅ Enables parallel test execution (critical for performance)
- ✅ Tests don't interfere with each other
- ✅ Each test gets predictable, isolated state
- ✅ Aligns with existing test ID isolation model
- ❌ Global state would break concurrent tests

### Alternative 5: State Persists Across Scenario Switches

**Decision**: Chose reset on scenario switch

**Why:**
- ✅ Each scenario starts with clean slate (predictable)
- ✅ Prevents subtle bugs from state leakage
- ✅ Makes scenarios truly independent
- ✅ Easier to reason about and debug
- ❌ Persisting would create implicit dependencies

## Consequences

### Positive

✅ **Realistic user journeys testable** - Can finally test polling, multi-step processes, stateful interactions

✅ **Self-contained scenarios** - No runtime configuration needed, works in browsers

✅ **Maintains serializability** - All features are JSON data (ADR-0001 compliance)

✅ **Clear composition model** - Three-phase execution makes feature interaction predictable

✅ **Backward compatible** - Existing scenarios continue working (no breaking changes)

✅ **Incremental adoption** - Can use features individually or composed

✅ **Test ID isolation maintained** - Sequence state and application state both scoped per test ID

✅ **Future-proof** - Enables devtools, visual scenario builders, browser-based testing

✅ **No logic duplication** - Domain logic lives in core, adapters are thin translation layers

### Negative

❌ **Increased complexity** - More concepts to learn (match, sequence, state)

❌ **Larger type surface** - More fields on `ScenaristMock`, more documentation needed

❌ **Runtime state tracking** - Adapter must maintain sequence positions and application state

❌ **Template engine required** - Need to parse and replace `{{state.X}}` in responses

❌ **Potential performance impact** - Checking match criteria, sequence lookup, template replacement

### Risks & Mitigation

**Risk 1: Composition ambiguity**
- *Mitigation*: Clear three-phase model, explicit precedence rules, comprehensive tests

**Risk 2: State grows unbounded**
- *Mitigation*: State resets on scenario switch, scoped per test ID (tests are short-lived)

**Risk 3: Template syntax limitations**
- *Mitigation*: Start simple (no operations), can extend later if needed

**Risk 4: Performance degradation**
- *Mitigation*: Benchmark each phase, optimize hot paths, document performance characteristics

**Risk 5: Learning curve**
- *Mitigation*: Extensive documentation, examples, Bruno collection for exploration

### Implementation Learnings (Updated 2025-10-27)

✅ **Performance characteristics** - No significant overhead detected. Match checking, sequence lookup, and template replacement are all fast enough for testing workloads. No optimization needed for v1.

✅ **Template edge cases** - Handled through graceful degradation:
- Undefined keys remain as templates (e.g., `{{state.missing}}`)
- Nested path traversal handles null/undefined safely
- Array length works via `{{state.items.length}}`
- No circular reference issues (state is JSON-serializable)

✅ **Composition edge cases** - Only one meaningful edge case found:
- PR #28: Non-matching requests don't advance sequences
- All other compositions work by orthogonal phase design
- See ADR-0004 for why dedicated composition tests are unnecessary

✅ **Real-world usage patterns** - All three features heavily used:
- **Match:** Essential for premium/standard tier differences
- **Sequences:** Critical for polling scenarios (GitHub jobs, payment processing)
- **State:** Enables shopping cart, multi-step forms
- **Composition:** Match+Sequence and Sequence+State are common patterns

✅ **Test idempotency discovery** - Critical finding:
- Sequences and state MUST reset on scenario switch
- Without reset: Bruno tests fail on second run (117/133 vs 133/133)
- With reset: Tests idempotent, no server restart needed
- See ADR-0005 for detailed decision rationale

## Implementation

**Status:** ✅ Complete (Phases 1-3 implemented, Phase 4 analysis shows no action needed)

**Phase 1:** Request Content Matching (PR #24)
- Match on body/headers/query parameters
- Specificity-based selection
- Core tests: 100% coverage

**Phase 2:** Response Sequences (PRs #25-27, #35)
- Sequences with repeat modes (last/cycle/none)
- Sequence exhaustion and fallback
- Test idempotency via reset on scenario switch
- Core tests: 100% coverage

**Phase 3:** Stateful Mocks (PRs #30-35)
- State capture from requests (path extraction, array appending)
- Template injection (`{{state.key}}`, nested paths)
- State reset on scenario switch
- Core tests: 100% coverage

**Phase 4:** Feature Composition - No implementation needed
- Architecture guarantees composition via orthogonal phases
- Only meaningful edge case tested in PR #28
- See ADR-0004 for detailed analysis

**Documentation:**
- [Core Functionality § Three-Phase Execution Model](../core-functionality.md#three-phase-execution-model)
- [Stateful Mocks User Guide](../stateful-mocks.md)
- [State API Reference](../api-reference-state.md)

**Tests:** 281 tests across all packages (100% coverage maintained)
**Bruno Tests:** 133/133 assertions passing (idempotent)

## Related Decisions

- **ADR-0001**: Serializable Scenario Definitions (foundation for this decision)
- **ADR-0003**: Testing Strategy (four-layer approach for testing this feature)
- **ADR-0004**: Why Composition Tests Are Unnecessary (explains architectural guarantee)
- **ADR-0005**: State and Sequence Reset on Scenario Switch (idempotency decision)

## References

- [Core Functionality](../core-functionality.md) - User-facing documentation of dynamic response features
- [ADR-0001: Serializable Scenario Definitions](./0001-serializable-scenario-definitions.md)
- [ADR-0004: Why Composition Tests Are Unnecessary](./0004-why-composition-tests-unnecessary.md)
- [ADR-0005: State and Sequence Reset on Scenario Switch](./0005-state-sequence-reset-on-scenario-switch.md)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [MSW Documentation](https://mswjs.io/docs/)

## Update History

- **2025-10-23**: Initial version (proposed) - slimmed down to decisions only, moved implementation details to plans/
- **2025-10-27**: Status changed to Accepted - All phases complete
  - Added implementation learnings section (unknowns resolved)
  - Enhanced three-phase composition explanation
  - Updated implementation status (Phases 1-4 complete/analyzed)
  - Added references to ADR-0004 and ADR-0005
  - Removed broken link to deleted dynamic-responses.md plan document
