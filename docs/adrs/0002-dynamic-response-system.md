# ADR-0002: Dynamic Response System

**Status**: Proposed
**Date**: 2025-10-23
**Authors**: Claude Code

## Context

Scenarist currently provides a single static response per `MockDefinition`. Each mock maps one URL pattern to one response:

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

We will implement a **Dynamic Response System** with three new capabilities that compose via a three-phase execution model.

### Three New Capabilities

#### 1. Request Content Matching

Enable different responses based on request content:

```typescript
type MatchCriteria = {
  readonly body?: Record<string, unknown>;      // Partial match on body
  readonly headers?: Record<string, string>;    // Exact match on headers
  readonly query?: Record<string, string>;      // Exact match on query
};

type MockDefinition = {
  // ... existing fields
  readonly match?: MatchCriteria;
};
```

**Example:**
```typescript
// Premium items get higher price
{
  method: 'POST',
  url: '/api/items',
  match: { body: { itemId: 'premium-item' } },
  response: { status: 200, body: { price: 100 } }
},
// Standard items get lower price (fallback)
{
  method: 'POST',
  url: '/api/items',
  response: { status: 200, body: { price: 50 } }
}
```

#### 2. Response Sequences

Enable ordered sequences of responses for polling:

```typescript
type MockDefinition = {
  // ... existing fields
  readonly response?: MockResponse;     // Single response (existing)
  readonly sequence?: {                 // OR sequence (new)
    readonly responses: ReadonlyArray<MockResponse>;
    readonly repeat?: 'last' | 'cycle' | 'none';
  };
};
```

**Example:**
```typescript
{
  method: 'GET',
  url: '/api/job/:id',
  sequence: {
    responses: [
      { status: 200, body: { status: 'pending' } },
      { status: 200, body: { status: 'processing' } },
      { status: 200, body: { status: 'complete' } }
    ],
    repeat: 'last'  // Keep returning 'complete' after sequence ends
  }
}
```

**Repeat modes:**
- `last` (default): Return last response infinitely
- `cycle`: Loop back to first response
- `none`: Mark mock as exhausted, try next mock

#### 3. Stateful Mocks

Enable capturing data from requests and injecting it into responses:

```typescript
type MockDefinition = {
  // ... existing fields
  readonly captureState?: Record<string, string>;  // { stateKey: requestPath }
};
```

**Example:**
```typescript
// Capture items as added
{
  method: 'POST',
  url: '/api/cart/items',
  captureState: { 'cartItems[]': 'body.item' },  // [] = append to array
  response: { status: 200, body: { success: true } }
},
// Inject captured items into response
{
  method: 'GET',
  url: '/api/cart',
  response: {
    status: 200,
    body: {
      items: '{{state.cartItems}}',
      count: '{{state.cartItems.length}}'
    }
  }
}
```

**State is:**
- Stored per test ID (isolated between tests)
- Reset when scenario switches
- Lives in adapter runtime (not in scenario definitions)
- Accessed via `{{state.key}}` template syntax

### Architectural Layering: Core vs Adapters

**CRITICAL**: The dynamic response logic is **domain logic** and must live in `packages/core/src/domain/`, not in adapters. Adapters are thin translation layers.

**Core Domain Responsibilities:**
- `ResponseSelector` domain service implementing all three phases:
  - Phase 1: Match checking (body/headers/query matching)
  - Phase 2: Sequence tracking (position management, repeat modes)
  - Phase 3: State management (capture, storage, template replacement)
- `SequenceTracker` port for tracking sequence positions per test ID
- `StateManager` port for managing captured state per test ID

**Adapter Responsibilities (Thin Layer):**
- Extract request context from framework (Express, Fastify, Playwright)
- Convert framework request to domain `RequestContext` type
- Call core `ResponseSelector.selectResponse(testId, context, mocks)`
- Convert domain `MockResponse` back to framework response

**Why This Matters:**
- ✅ **Single implementation** - All logic in core, tested once
- ✅ **No duplication** - Adapters just translate, don't reimplement
- ✅ **Consistency** - Every adapter behaves identically
- ✅ **Maintainability** - Fix bugs once, benefits all adapters
- ✅ **Hexagonal architecture** - Domain logic in hexagon, adapters are ports
- ❌ **Without this**: Every adapter reimplements the same logic (maintenance nightmare)

### Three-Phase Execution Model

When a request arrives, the **core domain service** executes in three phases:

#### Phase 1: Match (Does this mock apply?)

For each mock with matching URL, in order:

1. **Check sequence exhaustion**
   - If `sequence` exists with `repeat: 'none'`
   - If position > responses.length
   - Skip this mock, try next

2. **Check match criteria**
   - If `match.body` exists, verify request body contains all specified keys/values (partial match)
   - If `match.headers` exists, verify all specified headers match exactly
   - If `match.query` exists, verify all specified query params match exactly
   - If any check fails, skip this mock, try next

3. **Mock applies**
   - If all checks pass (or no checks defined), use this mock
   - First matching mock wins

#### Phase 2: Select Response (Which response to return?)

1. **If `sequence` is defined:**
   - Get response at current position
   - Increment position for this `(testId, scenarioId, mockIndex)` tuple
   - Apply repeat mode:
     - `last`: Stay at last position after reaching end
     - `cycle`: Wrap to position 0 after reaching end
     - `none`: Mark as exhausted after reaching end
   - Return selected response

2. **Else if `response` is defined:**
   - Return single response

#### Phase 3: Transform (Modify based on state)

1. **If `captureState` is defined:**
   - Extract values from request using path syntax (e.g., `body.item`, `query.userId`)
   - Store in state Map under test ID
   - Handle array appending (`stateKey[]` syntax)

2. **If response body contains templates:**
   - Find all `{{state.X}}` patterns
   - Replace with actual values from state
   - Support nested paths (`state.user.profile.name`)
   - Support special accessors (`state.items.length`)

3. **Apply response modifiers:**
   - Add configured delays
   - Add configured headers
   - Return final response

### Precedence Rules

**When multiple mocks match the same URL:**

1. Iterate through mocks in array order
2. Skip if sequence exhausted (`repeat: 'none'` and past end)
3. Skip if `match` criteria present but don't pass
4. Use first mock where all checks pass
5. Mock without `match` criteria = catch-all fallback

**Example:**
```typescript
[
  // Mock 1: Specific match (checked first)
  { url: '/api/data', match: { query: { tier: 'premium' } }, ... },

  // Mock 2: Another specific match
  { url: '/api/data', match: { query: { tier: 'standard' } }, ... },

  // Mock 3: Fallback (no match criteria)
  { url: '/api/data', response: { ... } }
]
```

### Feature Composition

All features work together naturally:

```typescript
// Exhaustible sequence → fallback to match-based
[
  // First 3 calls: polling sequence
  {
    method: 'GET',
    url: '/api/job/:id',
    sequence: {
      responses: [
        { status: 200, body: { status: 'pending' } },
        { status: 200, body: { status: 'processing' } },
        { status: 200, body: { status: 'complete' } }
      ],
      repeat: 'none'  // Exhausted after 3 calls
    }
  },
  // After exhaustion: match-based
  {
    method: 'GET',
    url: '/api/job/:id',
    match: { query: { retry: 'true' } },
    response: { status: 200, body: { status: 'retrying' } }
  },
  // Fallback
  {
    method: 'GET',
    url: '/api/job/:id',
    response: { status: 200, body: { status: 'cached' } }
  }
]
```

**All three features together:**
```typescript
{
  method: 'POST',
  url: '/api/batch',
  match: { body: { priority: 'high' } },           // Only for high priority
  captureState: { 'batchId': 'body.id' },          // Capture batch ID
  sequence: {                                       // Progress through states
    responses: [
      { status: 202, body: { id: '{{state.batchId}}', status: 'queued' } },
      { status: 200, body: { id: '{{state.batchId}}', status: 'complete' } }
    ],
    repeat: 'last'
  }
}
```

## Testing Strategy

The architectural decision to separate domain logic (core) from framework integration (adapters) requires a carefully designed testing strategy. Testing must validate each layer's responsibility without duplication.

### Four-Layer Testing Approach

#### Layer 1: Core Package Tests (`packages/core/tests/`)

**Purpose:** Comprehensive unit testing of ALL domain logic.

**What to test:**
- `ResponseSelector` domain service (all three phases)
- `SequenceTracker` port implementation (position tracking, repeat modes)
- `StateManager` port implementation (capture, storage, injection)
- Match criteria logic (body partial match, headers/query exact match)
- Sequence advancement logic (last/cycle/none, exhaustion)
- State capture logic (path extraction: `body.item`, `query.userId`)
- Template replacement engine (`{{state.X}}`, nested paths, array access)
- Edge cases: circular references, undefined keys, invalid paths
- Error conditions: sequence exhaustion, missing state, malformed templates

**Characteristics:**
- ✅ **Fast** - No framework overhead, pure TypeScript
- ✅ **Isolated** - Tests pure business logic
- ✅ **Comprehensive** - 100% coverage of domain logic
- ✅ **Single source of truth** - Domain behavior defined here

**Example:**
```typescript
describe('ResponseSelector - Match Phase', () => {
  it('should match request when body contains required fields (partial match)', () => {
    const context: RequestContext = {
      method: 'POST',
      url: '/api/items',
      body: { itemId: 'premium', quantity: 5, extra: 'ignored' },
      headers: {},
      query: {}
    };

    const mock: MockDefinition = {
      method: 'POST',
      url: '/api/items',
      match: { body: { itemId: 'premium' } },
      response: { status: 200, body: { price: 100 } }
    };

    const result = responseSelector.selectResponse('test-1', context, [mock]);

    expect(result.success).toBe(true);
    expect(result.data.body).toEqual({ price: 100 });
  });
});
```

**What NOT to test here:**
- ❌ Express-specific request handling
- ❌ Framework type conversions
- ❌ HTTP-level integration

#### Layer 2: Adapter Package Tests (`packages/express-adapter/tests/`)

**Purpose:** Focused testing of translation layer between framework and domain.

**What to test:**
- Request context extraction from Express (`req` → `RequestContext`)
- Response application to Express (`MockResponse` → `res`)
- Integration with core domain services
- Framework-specific quirks (header normalization, query parsing)
- Type conversions (Express types → domain types)
- Error handling in translation layer

**Characteristics:**
- ✅ **Fast** - Mock Express req/res, no full server
- ✅ **Focused** - Only translation, not domain logic
- ✅ **Framework-specific** - Tests Express quirks
- ❌ **No duplication** - Doesn't re-test core logic

**Example:**
```typescript
describe('Express Adapter - Request Translation', () => {
  it('should extract RequestContext with all fields from Express request', () => {
    const req = mockExpressRequest({
      method: 'POST',
      url: '/api/items',
      body: { itemId: 'premium' },
      query: { filter: 'active' },
      headers: { 'x-user-tier': 'gold' }
    });

    const context = extractRequestContext(req);

    expect(context).toEqual({
      method: 'POST',
      url: '/api/items',
      body: { itemId: 'premium' },
      query: { filter: 'active' },
      headers: expect.objectContaining({ 'x-user-tier': 'gold' })
    });
  });

  it('should handle missing optional fields gracefully', () => {
    const req = mockExpressRequest({ method: 'GET', url: '/api/data' });
    const context = extractRequestContext(req);

    expect(context.body).toBeUndefined();
    expect(context.query).toEqual({});
  });
});

describe('Express Adapter - Response Application', () => {
  it('should apply MockResponse to Express response', async () => {
    const res = mockExpressResponse();
    const mockResponse: MockResponse = {
      status: 201,
      body: { success: true },
      headers: { 'X-Custom': 'value' },
      delay: 100
    };

    await applyMockResponse(mockResponse, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.setHeader).toHaveBeenCalledWith('X-Custom', 'value');
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe('Express Adapter - Core Integration', () => {
  it('should call ResponseSelector with translated context', async () => {
    const mockSelector = {
      selectResponse: jest.fn().mockReturnValue({
        success: true,
        data: { status: 200, body: {} }
      })
    };

    const handler = createHandler(mockSelector, mocks);
    const req = mockExpressRequest({ method: 'GET', url: '/test' });

    await handler(req, mockExpressResponse());

    expect(mockSelector.selectResponse).toHaveBeenCalledWith(
      expect.any(String),  // testId
      expect.objectContaining({ method: 'GET', url: '/test' }),
      expect.any(Array)
    );
  });
});
```

**What NOT to test here:**
- ❌ Match criteria logic (core's responsibility)
- ❌ Sequence advancement (core's responsibility)
- ❌ State management (core's responsibility)
- ❌ Template replacement (core's responsibility)

#### Layer 3: Integration Tests (`apps/express-example/tests/`)

**Purpose:** E2E testing of real-world user journeys with full Express app.

**What to test:**
- Complete flows from HTTP request to response
- Real-world composition patterns (match + sequence + state)
- Scenario switching with test ID isolation
- Multi-request user journeys (polling, shopping cart, forms)
- Edge cases in full context

**Characteristics:**
- ✅ **Realistic** - Full Express server, supertest
- ✅ **Comprehensive flows** - Tests complete user journeys
- ✅ **Confidence** - Validates entire stack integration
- ❌ **Slower** - Full server startup/teardown

**Example:**
```typescript
describe('Dynamic Responses - Polling Scenario', () => {
  it('should progress through sequence on multiple calls', async () => {
    const testId = 'polling-test';

    // Set scenario with sequence
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId)
      .send({ scenario: 'job-polling' });

    // First call - pending
    const res1 = await request(app)
      .get('/api/job/123')
      .set('x-test-id', testId);
    expect(res1.body.status).toBe('pending');

    // Second call - processing
    const res2 = await request(app)
      .get('/api/job/123')
      .set('x-test-id', testId);
    expect(res2.body.status).toBe('processing');

    // Third call - complete
    const res3 = await request(app)
      .get('/api/job/123')
      .set('x-test-id', testId);
    expect(res3.body.status).toBe('complete');

    // Fourth call - still complete (repeat: 'last')
    const res4 = await request(app)
      .get('/api/job/123')
      .set('x-test-id', testId);
    expect(res4.body.status).toBe('complete');
  });
});
```

#### Layer 4: Bruno Tests (`apps/express-example/bruno/`)

**Purpose:** Executable API documentation with automated tests for key flows.

**What to test:**
- Happy path scenarios (success flows)
- Common composition patterns (match + sequence, state capture + injection)
- Key user journeys (not every edge case)
- API contract validation

**Characteristics:**
- ✅ **Human-readable** - Non-developers can understand
- ✅ **Executable docs** - Tests are documentation
- ✅ **CI-ready** - Run via `bru run` in CI pipeline
- ❌ **Selective** - Not comprehensive, just key flows

**Example:**
```javascript
// apps/express-example/bruno/Dynamic Responses/Polling - Job Status.bru

meta {
  name: Polling - Job Status
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/__scenario__
  body: json
}

body:json {
  {
    "scenario": "job-polling"
  }
}

tests {
  test("should set scenario successfully", function() {
    expect(res.getStatus()).to.equal(200);
  });
}

---

meta {
  name: Polling - First Call (Pending)
  type: http
  seq: 2
}

get {
  url: {{baseUrl}}/api/job/123
}

tests {
  test("should return pending status", function() {
    expect(res.getStatus()).to.equal(200);
    expect(res.getBody().status).to.equal('pending');
  });
}

---

meta {
  name: Polling - Second Call (Processing)
  type: http
  seq: 3
}

get {
  url: {{baseUrl}}/api/job/123
}

tests {
  test("should return processing status", function() {
    expect(res.getStatus()).to.equal(200);
    expect(res.getBody().status).to.equal('processing');
  });
}
```

### Testing Strategy Decision Matrix

| Layer | Tests | Doesn't Test | Speed | Coverage |
|-------|-------|--------------|-------|----------|
| **Core** | Domain logic (match, sequence, state) | Framework integration | Fast | 100% |
| **Adapter** | Translation (req→domain, domain→res) | Domain logic | Fast | Translation layer |
| **Integration** | Full flows, user journeys | Translation details | Slow | Real scenarios |
| **Bruno** | Key flows, API documentation | Every edge case | Medium | Happy paths |

### Why This Strategy Works

**No Duplication:**
- Each layer tests its **own responsibility**
- Core tests domain logic, adapters test translation, E2E tests flows
- Bruno documents key patterns, doesn't duplicate E2E

**Clear Debugging:**
- Core test failure → domain logic bug
- Adapter test failure → translation bug (req/res handling)
- Integration test failure → integration issue or missed scenario
- Bruno test failure → API contract change

**Fast Feedback:**
- Core tests run in milliseconds (pure TypeScript, no frameworks)
- Adapter tests run in milliseconds (mocked req/res)
- Integration tests run in seconds (full server)
- Bruno tests run in seconds (real HTTP)

**Maintainability:**
- Domain logic changes only affect core tests
- Framework changes only affect adapter tests
- New scenarios just need integration + selective Bruno tests
- No cascading test updates across layers

### Anti-Patterns to Avoid

❌ **Testing domain logic in adapter tests**
```typescript
// WRONG - This belongs in core tests
it('should match on body fields', () => {
  // Testing match criteria in adapter layer
});
```

❌ **Testing translation in core tests**
```typescript
// WRONG - This belongs in adapter tests
it('should extract Express query params', () => {
  // Testing Express-specific behavior in core
});
```

❌ **Duplicating all Vitest tests in Bruno**
```javascript
// WRONG - Bruno should be selective, not comprehensive
// Don't create Bruno test for every single edge case
```

❌ **E2E testing translation edge cases**
```typescript
// WRONG - This should be in adapter tests (faster feedback)
it('should handle missing headers in Express request', () => {
  // Testing adapter translation behavior in slow E2E test
});
```

### Coverage Requirements

**Core Package:**
- 100% coverage of all domain logic
- Every branch, every edge case, every error condition

**Adapter Package:**
- 100% coverage of translation functions
- All request extraction paths
- All response application paths
- Error handling in translation layer

**Integration Tests:**
- All requirements (REQ-1 through REQ-4) demonstrated
- All composition patterns validated
- All example scenarios exercised

**Bruno Tests:**
- Key happy path for each requirement
- 2-3 composition examples
- Primary user journeys

## Alternatives Considered

### Alternative 1: Function-Based Responses

**Decision**: Rejected

**Approach**: Allow response to be a function that receives request and returns response:

```typescript
{
  method: 'POST',
  url: '/api/items',
  response: (req) => {
    if (req.body.itemId === 'premium') {
      return { status: 200, body: { price: 100 } };
    }
    return { status: 200, body: { price: 50 } };
  }
}
```

**Why rejected:**
- ❌ Violates ADR-0001 (must be serializable)
- ❌ Cannot be stored in Redis, files, or databases
- ❌ Cannot be version controlled effectively
- ❌ Cannot be loaded in future devtools
- ❌ Breaks hexagonal architecture

### Alternative 2: Conditional Response Blocks

**Decision**: Rejected

**Approach**: Use JSON-based conditions with response blocks:

```typescript
{
  method: 'POST',
  url: '/api/items',
  conditions: [
    {
      when: { bodyPath: 'itemId', equals: 'premium-item' },
      response: { status: 200, body: { price: 100 } }
    },
    {
      when: { bodyPath: 'itemId', equals: 'standard-item' },
      response: { status: 200, body: { price: 50 } }
    }
  ],
  fallback: { status: 200, body: { price: 25 } }
}
```

**Why rejected:**
- ⚠️ More complex type system
- ⚠️ Harder to understand composition model
- ⚠️ Doesn't handle sequences or state naturally
- ✅ Could work, but our approach is cleaner

**Key insight:** Our "multiple mocks with match criteria" approach is simpler and more flexible than nested conditions.

### Alternative 3: State Machine Definitions

**Decision**: Rejected for v1, may revisit

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

**Why rejected for v1:**
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

✅ **No logic duplication** - Domain logic lives in core, adapters are thin translation layers. Every adapter (Express, Fastify, Playwright) gets identical behavior without reimplementing logic

### Negative

❌ **Increased complexity** - More concepts to learn (match, sequence, state)

❌ **Larger type surface** - More fields on `MockDefinition`, more documentation needed

❌ **Runtime state tracking** - Adapter must maintain sequence positions and application state

❌ **Template engine required** - Need to parse and replace `{{state.X}}` in responses

❌ **Potential performance impact** - Checking match criteria, sequence lookup, template replacement (needs benchmarking)

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

### Unknowns (To Be Discovered During Implementation)

🔍 **Performance characteristics**
- How much overhead does match checking add?
- Is sequence lookup fast enough for high-volume polling?
- Does template replacement become a bottleneck?

🔍 **Template edge cases**
- What happens with circular references in state?
- How to handle undefined state keys?
- Should we support escaping `{{` literals?

🔍 **Composition edge cases**
- What happens if match + sequence both defined but sequence exhausted?
- How to debug when mock doesn't match expectation?
- Are error messages clear enough?

🔍 **Real-world usage patterns**
- Which features get used most?
- Do people compose all three or use separately?
- What patterns emerge that we didn't anticipate?

## Implementation Plan

### Phase 1: Request Content Matching (REQ-1)

**Core Package (`packages/core/`):**
- Add `MatchCriteria` type and `match` field to `MockDefinition`
- Add `RequestContext` type (method, url, body, headers, query)
- Implement match checking logic in core domain service
- Unit tests for matching logic (body partial match, headers/query exact match)

**Express Adapter (`packages/express-adapter/`):**
- Update adapter to extract `RequestContext` from Express request
- Wire up core matching logic (no match logic in adapter!)
- Integration tests using express-example

**Example App:**
- Add example scenarios with match criteria
- Add Bruno collection requests demonstrating matching
- **Success criteria**: Can match on request content, first match wins

### Phase 2: Response Sequences (REQ-2)

**Core Package:**
- Add `sequence` field and `RepeatMode` type to `MockDefinition`
- Create `SequenceTracker` port interface
- Create `InMemorySequenceTracker` implementation
- Implement sequence selection logic in core domain service
- Unit tests for all repeat modes and exhaustion

**Express Adapter:**
- Wire up sequence tracking (no sequence logic in adapter!)
- Integration tests for polling scenarios

**Example App:**
- Polling example scenarios
- Bruno collection for testing sequences
- **Success criteria**: Sequences advance correctly, repeat modes work, exhaustion enables fallback

### Phase 3: Stateful Mocks (REQ-3)

**Core Package:**
- Add `captureState` field to `MockDefinition`
- Create `StateManager` port interface
- Create `InMemoryStateManager` implementation
- Implement path extraction logic (e.g., `body.item`, `query.userId`)
- Implement template replacement engine (`{{state.X}}`)
- Unit tests for capture, storage, and injection

**Express Adapter:**
- Wire up state management (no state logic in adapter!)
- Integration tests for stateful scenarios

**Example App:**
- Stateful scenarios (shopping cart, multi-step forms)
- Bruno collection for state testing
- **Success criteria**: Can capture from requests, inject into responses, state isolated per test ID

### Phase 4: Feature Composition (REQ-4)

**Core Package:**
- Integration tests for all composition patterns
- Performance benchmarking

**Express Adapter:**
- Complex composition integration tests

**Example App:**
- Complex real-world scenarios using all features
- Documentation of composition patterns
- **Success criteria**: All features work together correctly

### Post-Implementation
- Update this ADR with actual consequences discovered
- Benchmark performance and document characteristics
- Add lessons learned section
- Update alternatives if new approaches emerge

## Future Enhancements

These enhancements are deferred until after core features (REQ-1 through REQ-4) are implemented and validated.

### Scenario Inspection API (Phase 5)

**Problem:** Developers debugging complex scenarios (Playwright, Cypress, manual testing) have no visibility into:
- Current sequence positions
- Captured state values
- Why a specific mock matched/didn't match
- Whether response came from active scenario or default fallback
- Request history

**Use Case:**
```typescript
// Playwright test debugging
test('checkout flow', async ({ page }) => {
  await page.click('#checkout-button');
  // Expected: "processing" response
  // Actual: Got "error" response
  // Question: "What's my current scenario state?"

  const debug = await page.evaluate(async () => {
    const res = await fetch('http://localhost:3000/__scenario_debug__');
    return res.json();
  });

  console.log('Sequence positions:', debug.sequenceState);
  console.log('Captured state:', debug.capturedState);
  console.log('Next expected response:', debug.sequenceState[0].nextResponse);
});
```

**Proposed Solution:** Add `/__scenario_debug__` endpoint that returns complete scenario state.

**Response Shape:**
```typescript
type ScenarioInspection = {
  readonly testId: string;
  readonly activeScenario: { readonly id: string; readonly name: string } | null;
  readonly defaultScenario: { readonly id: string; readonly name: string } | null;
  readonly sequenceState: ReadonlyArray<{
    readonly mockIndex: number;
    readonly method: string;
    readonly url: string;
    readonly currentPosition: number;
    readonly totalResponses: number;
    readonly repeatMode: 'last' | 'cycle' | 'none';
    readonly exhausted: boolean;
    readonly nextResponse?: MockResponse;
    readonly source: 'active-scenario' | 'default-scenario';
  }>;
  readonly capturedState: Record<string, unknown>;
  readonly activeMocks: ReadonlyArray<{
    readonly index: number;
    readonly method: string;
    readonly url: string;
    readonly source: 'active-scenario' | 'default-scenario';
    readonly hasMatchCriteria: boolean;
    readonly matchCriteria?: MatchCriteria;
    readonly hasSequence: boolean;
    readonly capturesState: boolean;
    readonly captureKeys?: ReadonlyArray<string>;
  }>;
  readonly requestHistory: ReadonlyArray<{
    readonly timestamp: string;
    readonly method: string;
    readonly url: string;
    readonly matchedMockIndex: number;
    readonly source: 'active-scenario' | 'default-scenario';
    readonly sequencePosition?: number;
    readonly responseStatus: number;
  }>;
};
```

**Core Package Changes:**
```typescript
// Add to ScenarioManager port
interface ScenarioManager {
  // ... existing methods
  inspect(testId: string): Result<ScenarioInspection>;
}
```

**Adapter Changes:**
```typescript
// Add inspection endpoint to Express adapter
app.get('/__scenario_debug__', (req, res) => {
  const testId = getTestId(req);
  const result = scenarioManager.inspect(testId);

  if (result.success) {
    res.json(result.data);
  } else {
    res.status(404).json({ error: result.error.message, testId });
  }
});
```

**Bruno Collection:**
```
# apps/express-example/bruno/Debug/Inspect Current Scenario.bru

get {
  url: {{baseUrl}}/__scenario_debug__
}

headers {
  x-test-id: {{testId}}
}

docs {
  Get detailed debugging information about current scenario state.

  Useful for:
  - Debugging complex flows in Playwright/Cypress
  - Understanding why a specific response was returned
  - Checking current sequence positions
  - Inspecting captured state
  - Verifying scenario fallback behavior
}
```

**Benefits:**
- ✅ **Zero-config debugging** - Works automatically, no setup required
- ✅ **Framework-agnostic** - HTTP endpoint works in browser, Playwright, Cypress, manual testing
- ✅ **Actionable** - Shows not just state, but NEXT expected responses
- ✅ **Type-safe** - TypeScript types for programmatic assertions
- ✅ **Human-readable** - JSON structure is intuitive
- ✅ **Bruno integration** - Interactive debugging via API collection

**Implementation Plan:**
1. Add `ScenarioInspection` types to core package
2. Implement `inspect()` method in `ScenarioManager`
3. Track request history in adapter runtime (last N requests)
4. Add `/__scenario_debug__` endpoint to Express adapter
5. Add Bruno collection for debugging
6. Document inspection API in adapter README
7. Add Playwright examples showing debugging patterns

**Why Defer to Phase 5:**
- Not blocking for core feature implementation
- Requires core features (sequences, state) to be implemented first
- Inspection API shape depends on final implementation details
- Can be added incrementally without breaking changes
- Allows us to discover what debugging info is most valuable during implementation

**Design Principles:**
- Inspection never mutates state (read-only)
- Minimal performance impact (optional endpoint)
- Can be disabled in production via config
- Self-documenting (response explains current state)

### Rich Error Messages

When no mock matches a request, include debugging context in error:

```typescript
throw new Error(`
No mock found for request:
  Method: POST
  URL: /api/items
  Body: { "itemId": "premium-item", "quantity": 5 }

Available mocks for this URL:
  1. POST /api/items
     Match: { body: { itemId: "standard-item" } }
     Result: DIDN'T MATCH (body.itemId: expected "standard-item", got "premium-item")

  2. POST /api/items (no match criteria)
     Result: FALLBACK AVAILABLE

Sequence positions for test ID 'my-test':
  - Mock 0 (/api/job/:id): position 2/5 (repeat: last, next: "complete")

Captured state:
  - cartItems: [{ id: "item-123", name: "Widget" }]
  - userId: "user-456"

Suggestion: Check if you meant to use itemId "standard-item" in your request body.
`);
```

**Implementation:** Add to core `ResponseSelector` when no mock matches.

### Template Expression Language

If demand emerges for operations in templates:

```typescript
// Current (Phase 1-4): Simple value injection only
response: {
  body: {
    count: '{{state.items.length}}',  // ✅ Supported
    items: '{{state.items}}'           // ✅ Supported
  }
}

// Future: Template operations
response: {
  body: {
    count: '{{state.items.length + 1}}',  // ❌ Not supported in Phase 1-4
    total: '{{state.price * state.quantity}}',  // ❌ Not supported
    greeting: '{{state.firstName.toUpperCase()}}' // ❌ Not supported
  }
}
```

**Decision:** Keep template engine simple for v1. Can add expression parser later if clear demand.

### State Schema Validation

If state becomes complex, validate captured state against schemas:

```typescript
{
  captureState: {
    'user': 'body.user',
    'user.email': 'body.user.email'
  },
  stateSchema: {
    user: {
      type: 'object',
      required: ['email', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string' }
      }
    }
  }
}
```

**Decision:** Defer until state management patterns emerge from real usage.

## Related Decisions

- **ADR-0001**: Serializable Scenario Definitions (foundation for this decision)
- **Future**: Scenario Inspection API (Phase 5, documented above)
- **Future**: Template Expression Language (if we add operations like `{{state.count + 1}}`)
- **Future**: State Schema Validation (if we need to validate captured state)

## References

- [ADR-0001: Serializable Scenario Definitions](./0001-serializable-scenario-definitions.md)
- [Dynamic Responses Requirements](../dynamic-responses.md)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [MSW Documentation](https://mswjs.io/docs/)

## Update History

- **2025-10-23**: Initial version (proposed)
- **TBD**: Update after Phase 1 implementation
- **TBD**: Update after Phase 2 implementation
- **TBD**: Update after Phase 3 implementation
- **TBD**: Update after Phase 4 implementation
- **TBD**: Mark as accepted when complete
