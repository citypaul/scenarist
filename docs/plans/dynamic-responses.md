# Dynamic Response System - Requirements & Implementation Plan

**Status:** ⏳ Not Started
**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Related ADR:** [ADR-0002: Dynamic Response System](../adrs/0002-dynamic-response-system.md)

## Overview

This document defines requirements for enabling different responses from the same endpoint based on request content, call sequence, and application state. Additionally, it specifies developer experience requirements for debugging complex scenarios. These features are essential for testing realistic user journeys where the same endpoint is called multiple times with different expected behaviors.

**Requirements Covered:**
- **REQ-1**: Request Content Matching (different responses based on body/headers/query)
- **REQ-2**: Response Sequences (polling with repeat modes)
- **REQ-3**: Stateful Mocks (capture and inject state)
- **REQ-4**: Feature Composition (all features working together)
- **REQ-5**: Developer Experience & Debugging (inspection API for complex scenarios)

**See also:** [ADR-0002](../adrs/0002-dynamic-response-system.md) for the architectural decision record (WHY), including alternatives considered and expected consequences. This document covers WHAT to build and HOW to implement it.

## Problem Statement

### Current Limitations

**Problem 1: Single Static Responses**

Each `MockDefinition` provides a single static response for a URL pattern. This makes it impossible to test:

- **Polling scenarios** - GET /job/:id should return "pending" → "processing" → "complete" over multiple calls
- **Content-based responses** - POST /items should return different prices based on which item is requested
- **Stateful interactions** - POST /cart/add should affect what GET /cart returns
- **Multi-step processes** - Form steps that depend on previous steps being completed

These are common real-world scenarios that E2E tests need to verify.

**Problem 2: Debugging Complex Scenarios**

When testing complex flows (Playwright, Cypress, manual testing), developers have no visibility into:

- **Sequence positions**: "Am I at step 3 of 5 in this polling sequence?"
- **Captured state**: "What values are currently captured in state?"
- **Match failures**: "Why didn't my match criteria match this request?"
- **Fallback behavior**: "Did this response come from my active scenario or the default?"
- **Flow progression**: "What requests have been made and in what order?"

This makes debugging complex scenarios difficult and time-consuming.

## Core Principles

### Must Remain 100% Serializable
All features must be expressible as pure JSON data (no functions). This is **non-negotiable** as it enables:
- Storage in Redis, files, or databases
- Version control of scenario definitions
- Future devtools and browser-based testing
- Hexagonal architecture compliance

### Must Be Self-Contained
Scenarios should work without requiring runtime configuration or special headers beyond the test ID. This ensures:
- Scenarios work seamlessly in browsers
- No special knowledge required by consumers
- Future devtools can execute scenarios without setup
- Consistent behavior across environments

### State is Isolated
- State is scoped per test ID (no cross-test contamination)
- State resets when switching scenarios (clean slate)
- State lives in adapter runtime (not in scenario definitions)

## Architectural Implementation

**CRITICAL:** The dynamic response logic is **domain logic** and lives in `packages/core/src/domain/`, not in adapters.

### Core Domain Responsibilities
The core package implements:
- `ResponseSelector` domain service (orchestrates all three phases)
  - Created via factory: `createResponseSelector({ sequenceTracker, stateManager })`
  - All ports INJECTED, never created internally
  - Returns `Result<MockResponse, ResponseError>` (not exceptions)
- `SequenceTracker` port (`interface` in `packages/core/src/ports/`)
  - Default: `InMemorySequenceTracker` with explicit `implements SequenceTracker`
  - Tracks sequence positions per `${testId}:${scenarioId}:${mockIndex}` key
- `StateManager` port (`interface` in `packages/core/src/ports/`)
  - Default: `InMemoryStateManager` with explicit `implements StateManager`
  - Manages captured state per test ID
- Match checking logic (body partial match, headers/query exact match)
- Sequence selection logic (position management, repeat modes)
- State capture and template replacement

**Type System Conventions:**
- **Data structures** use `type` with `readonly` (MatchCriteria, MockDefinition, RequestContext)
- **Ports** use `interface` (SequenceTracker, StateManager)
- **Implementations** use explicit `implements PortName`

### Adapter Responsibilities (Thin Layer)
Adapters only:
- Extract request context from framework (Express, Fastify, etc.)
- Convert framework request to domain `RequestContext` type
- Call injected `responseSelector.selectResponse(testId, context, mocks)`
- Convert domain `MockResponse` back to framework response
- **NO domain logic in adapters** - all logic in core

**Why:** This prevents logic duplication across adapters. Each adapter (Express, Fastify, Playwright) gets identical behavior without reimplementing the three-phase execution model. Bugs are fixed once in core, benefits propagate to all adapters.

**Dependency Injection:**  All ports are injected into `ResponseSelector`, never created internally. This enables multiple implementations (in-memory, Redis, file-based, remote).

**See:** [ADR-0002 § Architectural Layering](./adrs/0002-dynamic-response-system.md#architectural-layering-core-vs-adapters) for detailed rationale.

## Requirements

### REQ-1: Request Content Matching

**Status:** ⏸️ Not Started

Enable different responses based on request content (body, headers, query parameters).

#### REQ-1.1: Match on Request Body (Partial)
```typescript
{
  method: 'POST',
  url: '/api/items',
  match: { body: { itemId: 'premium-item' } },  // Partial match
  response: {
    status: 200,
    body: { price: 100, features: ['premium'] }
  }
}
```

**Matching logic:** Request body must contain all keys from `match.body` with matching values. Additional keys in request are ignored (partial match).

#### REQ-1.2: Match on Request Headers
```typescript
{
  method: 'GET',
  url: '/api/data',
  match: { headers: { 'x-user-tier': 'premium' } },
  response: {
    status: 200,
    body: { data: 'premium data', limit: 1000 }
  }
}
```

**Matching logic:** All headers in `match.headers` must be present with exact values (case-insensitive header names).

#### REQ-1.3: Match on Query Parameters
```typescript
{
  method: 'GET',
  url: '/api/search',
  match: { query: { filter: 'active', sort: 'asc' } },
  response: {
    status: 200,
    body: { results: [...], filtered: true }
  }
}
```

**Matching logic:** All query params in `match.query` must be present with exact values.

#### REQ-1.4: First Matching Mock Wins
When multiple mocks match the same URL:
1. Iterate through mocks in order
2. Skip if `match` criteria present but don't pass
3. Use first mock where all criteria pass
4. Mock without `match` criteria serves as fallback

**Test Requirements:**
- Unit tests in `packages/msw-adapter/tests/`
- Integration tests in `apps/express-example/tests/dynamic-matching.test.ts`
- Example scenarios in `apps/express-example/src/scenarios.ts`
- Bruno collection requests demonstrating feature

---

### REQ-2: Response Sequences

**Status:** ⏸️ Not Started

Enable ordered sequences of responses for polling and progressive scenarios.

#### REQ-2.1: Define Response Sequences
```typescript
{
  method: 'GET',
  url: '/api/job/:id',
  sequence: {
    responses: [
      { status: 200, body: { status: 'pending' } },
      { status: 200, body: { status: 'pending' } },
      { status: 200, body: { status: 'processing' } },
      { status: 200, body: { status: 'complete' } }
    ],
    repeat: 'last'  // Options: 'last' | 'cycle' | 'none'
  }
}
```

**Type Definition:**
```typescript
type MockDefinition = {
  method: HttpMethod;
  url: string;
  match?: MatchCriteria;
  response?: MockResponse;     // Single response (current behavior)
  sequence?: {                 // OR sequence (new)
    responses: ReadonlyArray<MockResponse>;
    repeat?: 'last' | 'cycle' | 'none';
  };
  captureState?: CaptureConfig;
};
```

#### REQ-2.2: Track Sequence Position Per Test ID
Adapter maintains runtime state:
```typescript
Map<string, {  // Key: `${testId}:${scenarioId}:${mockIndex}`
  position: number;      // Current position in sequence
  exhausted: boolean;    // True if repeat: 'none' and past end
}>
```

#### REQ-2.3: Repeat Modes

**`repeat: 'last'` (default)**
- Return last response infinitely after sequence ends
- Use case: Polling that eventually completes

**`repeat: 'cycle'`
- Return to first response after sequence ends
- Use case: Alternating states, periodic patterns

**`repeat: 'none'`
- After sequence ends, mark mock as exhausted
- Adapter skips exhausted mocks, tries next mock with same URL
- Use case: Time-limited sequences with fallback behavior

#### REQ-2.4: Exhausted Sequences Enable Fallback
```typescript
// Mock 1: First 3 calls (polling)
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
// Mock 2: After exhaustion, match-based responses
{
  method: 'GET',
  url: '/api/job/:id',
  match: { query: { retry: 'true' } },
  response: { status: 200, body: { status: 'retrying' } }
},
// Mock 3: Fallback for all other calls
{
  method: 'GET',
  url: '/api/job/:id',
  response: { status: 200, body: { status: 'cached' } }
}
```

**Execution:**
- Calls 1-3: Mock 1 applies (sequence)
- Call 4 with `?retry=true`: Mock 2 applies (Mock 1 exhausted, Mock 2 matches)
- Call 4 without retry param: Mock 3 applies (Mock 1 exhausted, Mock 2 doesn't match)

**Test Requirements:**
- Unit tests for all repeat modes
- Test sequence position tracking per test ID
- Test exhaustion and fallback behavior
- Integration tests in `apps/express-example/tests/dynamic-sequences.test.ts`
- Example polling scenarios in `apps/express-example/src/scenarios.ts`
- Bruno collection demonstrating sequences

---

### REQ-3: Stateful Mocks

**Status:** ⏸️ Not Started

Enable capturing data from requests and injecting it into subsequent responses.

#### REQ-3.1: Capture State from Requests
```typescript
{
  method: 'POST',
  url: '/api/cart/items',
  captureState: {
    'cartItems[]': 'body.item'  // [] means append to array
  },
  response: { status: 200, body: { success: true } }
}
```

**Path Syntax:**
- `body.field` - Extract from request body
- `headers.field` - Extract from request headers
- `query.field` - Extract from query parameters
- `params.field` - Extract from URL parameters

**Array Syntax:**
- `stateKey[]` - Append to array (creates array if doesn't exist)
- `stateKey` - Overwrite value

#### REQ-3.2: Store State Per Test ID
Adapter maintains runtime state:
```typescript
Map<testId, stateObject>
```

**State object structure:**
```typescript
{
  [stateKey: string]: unknown  // Any JSON-serializable value
}
```

#### REQ-3.3: Reset State on Scenario Switch
When `switchScenario()` is called:
1. Clear all state for that test ID
2. Start fresh state tracking for new scenario

#### REQ-3.4: Inject State into Responses
```typescript
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

**Template Syntax:**
- `{{state.key}}` - Replace with value from state
- `{{state.nested.key}}` - Support nested paths
- `{{state.array.length}}` - Support array length

**Template Processing:**
1. Response body is serialized to JSON
2. String values containing `{{state.X}}` are replaced with actual values
3. If value is object/array, it replaces the entire value (not string interpolation)

#### REQ-3.5: Support Nested Paths
```typescript
captureState: {
  'user.profile.name': 'body.name',
  'user.profile.email': 'body.email'
}

// Later in response:
body: {
  welcomeMessage: 'Hello {{state.user.profile.name}}'
}
```

#### REQ-3.6: Support Array Appending
```typescript
// First request
captureState: { 'items[]': 'body.item' }
// State: { items: [{ id: 1, name: 'Apple' }] }

// Second request
captureState: { 'items[]': 'body.item' }
// State: { items: [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }] }

// Response uses captured array
body: {
  cart: '{{state.items}}',
  total: '{{state.items.length}}'
}
```

**Test Requirements:**
- Unit tests for capture and injection logic
- Test state isolation per test ID
- Test state reset on scenario switch
- Test nested paths and array appending
- Integration tests in `apps/express-example/tests/dynamic-state.test.ts`
- Example stateful scenarios (cart, multi-step forms)
- Bruno collection demonstrating state

---

### REQ-4: Feature Composition

**Status:** ⏸️ Not Started

Define how features work together when combined on the same mock.

#### REQ-4.1: Match + Sequence
Sequence only advances for requests that pass match criteria:

```typescript
{
  method: 'POST',
  url: '/api/process',
  match: { body: { type: 'batch' } },  // Only for batch requests
  sequence: {
    responses: [
      { status: 202, body: { status: 'queued' } },
      { status: 200, body: { status: 'processing' } },
      { status: 200, body: { status: 'complete' } }
    ],
    repeat: 'last'
  }
}
```

**Behavior:**
- Request must pass match criteria for mock to apply
- If match fails, adapter tries next mock
- If match passes, sequence advances and response returned
- Non-matching requests don't affect sequence position

#### REQ-4.2: Match + State
State only captured/injected for requests that pass match criteria:

```typescript
{
  method: 'POST',
  url: '/api/items',
  match: { body: { category: 'premium' } },
  captureState: { 'premiumItems[]': 'body.item' },
  response: { status: 200, body: { captured: true } }
}
```

#### REQ-4.3: Sequence + State
Each response in sequence can inject state:

```typescript
{
  method: 'GET',
  url: '/api/job/:id',
  sequence: {
    responses: [
      {
        status: 200,
        body: {
          status: 'pending',
          processing: '{{state.itemCount}} items'
        }
      },
      {
        status: 200,
        body: {
          status: 'complete',
          results: '{{state.processedItems}}'
        }
      }
    ],
    repeat: 'last'
  }
}
```

#### REQ-4.4: Match + Sequence + State (All Three)
```typescript
{
  method: 'POST',
  url: '/api/batch',
  match: { body: { priority: 'high' } },
  captureState: { 'batchId': 'body.id' },
  sequence: {
    responses: [
      {
        status: 202,
        body: { status: 'queued', id: '{{state.batchId}}' }
      },
      {
        status: 200,
        body: { status: 'complete', id: '{{state.batchId}}' }
      }
    ],
    repeat: 'last'
  }
}
```

**Test Requirements:**
- Integration tests for all composition patterns
- Tests verifying composition precedence
- Real-world complex scenarios
- Integration tests in `apps/express-example/tests/dynamic-composition.test.ts`

---

## Three-Phase Execution Model

When a request matches a URL pattern, the adapter executes in three phases:

### Phase 1: Match (Does this mock apply?)

For each mock with matching URL:

1. **Check sequence exhaustion**
   - If `sequence` exists with `repeat: 'none'`
   - If position > responses.length
   - Skip this mock, try next

2. **Check match criteria**
   - If `match.body` exists, check partial match on request body
   - If `match.headers` exists, check exact match on request headers
   - If `match.query` exists, check exact match on query params
   - If any check fails, skip this mock, try next

3. **Mock applies**
   - If all checks pass (or no checks defined), use this mock

### Phase 2: Select Response (Which response to return?)

1. **If `sequence` is defined:**
   - Get response at current position
   - Increment position for this (testId + scenarioId + mockIndex)
   - Handle repeat mode:
     - `last`: Stay at last position
     - `cycle`: Wrap to position 0
     - `none`: Mark as exhausted after last response
   - Return selected response

2. **Else if `response` is defined:**
   - Return single response

### Phase 3: Transform (Modify response based on state)

1. **If `captureState` is defined:**
   - Extract values from request using paths
   - Store in state Map under testId
   - Handle array appending (stateKey[])

2. **If response body contains templates:**
   - Find all `{{state.X}}` patterns
   - Replace with actual values from state
   - Handle nested paths (state.user.name)
   - Handle special accessors (state.items.length)

3. **Apply response modifiers:**
   - Add configured delays
   - Add configured headers
   - Return final response

## Precedence Rules

### Multiple Mocks with Same URL

Order of evaluation:
1. Iterate through mocks in array order
2. Skip if sequence exhausted (`repeat: 'none'` and past end)
3. Skip if `match` criteria present but don't pass
4. Use first mock where all checks pass
5. Mock without `match` criteria = catch-all fallback

**Example:**
```typescript
mocks: [
  // Mock 1: Specific case (checked first)
  {
    url: '/api/data',
    match: { query: { premium: 'true' } },
    response: { status: 200, body: { tier: 'premium' } }
  },
  // Mock 2: Another specific case
  {
    url: '/api/data',
    match: { query: { premium: 'false' } },
    response: { status: 200, body: { tier: 'standard' } }
  },
  // Mock 3: Fallback (no match criteria)
  {
    url: '/api/data',
    response: { status: 200, body: { tier: 'default' } }
  }
]
```

Request evaluation:
- `GET /api/data?premium=true` → Mock 1
- `GET /api/data?premium=false` → Mock 2
- `GET /api/data` → Mock 3 (fallback)

### State Template Priority

When multiple templates reference same key:
- Templates are resolved in order of appearance
- Each template gets current value from state
- No dependency resolution needed (values are already computed)

## Type Definitions

### MatchCriteria
```typescript
type MatchCriteria = {
  readonly body?: Record<string, unknown>;      // Partial match on body
  readonly headers?: Record<string, string>;    // Exact match on headers
  readonly query?: Record<string, string>;      // Exact match on query
};
```

### MockDefinition (Updated)
```typescript
type MockDefinition = {
  readonly method: HttpMethod;
  readonly url: string;
  readonly match?: MatchCriteria;
  readonly response?: MockResponse;
  readonly sequence?: {
    readonly responses: ReadonlyArray<MockResponse>;
    readonly repeat?: 'last' | 'cycle' | 'none';
  };
  readonly captureState?: Record<string, string>;  // { stateKey: requestPath }
};
```

### Runtime State (Adapter-Only)
```typescript
// Sequence tracking
Map<string, {  // Key: `${testId}:${scenarioId}:${mockIndex}`
  position: number;
  exhausted: boolean;
}>

// State storage
Map<string, Record<string, unknown>>  // Key: testId
```

## Implementation Phases

### Phase 1: Request Content Matching (REQ-1)
**Goal:** Enable match criteria on body/headers/query

**Core Package Tasks:**
1. Add `MatchCriteria` type to `packages/core/src/types/scenario.ts`
2. Add `match` field to `MockDefinition` type
3. Add `RequestContext` type (method, url, body, headers, query)
4. Implement matching logic in `packages/core/src/domain/response-selector.ts`
5. Add unit tests in `packages/core/tests/`

**Express Adapter Tasks:**
6. Update adapter to extract `RequestContext` from Express request
7. Wire up core matching logic (no match logic in adapter!)
8. Create `apps/express-example/tests/dynamic-matching.test.ts`

**Example App Tasks:**
9. Add example scenarios to `apps/express-example/src/scenarios.ts`
10. Add Bruno collection requests with automated tests
11. Update `packages/express-adapter/README.md`

**Bruno Tests:**
12. Create `apps/express-example/bruno/Dynamic Responses/Request Matching/` folder
13. Add happy path tests for body/headers/query matching
14. Include automated assertions via Bruno's `tests` blocks

**Acceptance Criteria:**
- ✅ Can match on request body (partial)
- ✅ Can match on request headers (exact)
- ✅ Can match on query parameters (exact)
- ✅ First matching mock wins
- ✅ Fallback to unmatchable mock works
- ✅ Core unit tests passing (100% coverage)
- ✅ Adapter unit tests passing (100% translation coverage)
- ✅ Express integration tests passing
- ✅ Bruno automated tests passing (`bru run`)

### Phase 2: Response Sequences (REQ-2)
**Goal:** Enable ordered sequences of responses

**Core Package Tasks:**
1. Add `sequence` field and `RepeatMode` type to `MockDefinition`
2. Create `SequenceTracker` port interface in `packages/core/src/ports/`
3. Create `InMemorySequenceTracker` implementation in `packages/core/src/domain/`
4. Implement sequence selection logic in `ResponseSelector` domain service
5. Implement position increment and repeat logic (last/cycle/none)
6. Add unit tests for all repeat modes in `packages/core/tests/`

**Express Adapter Tasks:**
7. Wire up sequence tracking (no sequence logic in adapter!)
8. Create `apps/express-example/tests/dynamic-sequences.test.ts`

**Example App Tasks:**
9. Add polling scenarios to examples
10. Update documentation

**Bruno Tests:**
11. Create `apps/express-example/bruno/Dynamic Responses/Sequences/` folder
12. Add polling flow tests (pending → processing → complete)
13. Add tests for all repeat modes (last/cycle/none)
14. Include automated assertions for sequence progression

**Acceptance Criteria:**
- ✅ Sequences advance on each call
- ✅ `repeat: 'last'` works correctly
- ✅ `repeat: 'cycle'` works correctly
- ✅ `repeat: 'none'` exhaustion works
- ✅ Sequence state isolated per test ID
- ✅ Core unit tests passing (100% coverage)
- ✅ Adapter unit tests passing (100% translation coverage)
- ✅ Express integration tests passing
- ✅ Bruno automated tests passing (`bru run`)

### Phase 3: Stateful Mocks (REQ-3)
**Goal:** Enable state capture and injection

**Core Package Tasks:**
1. Add `captureState` field to `MockDefinition` type
2. Create `StateManager` port interface in `packages/core/src/ports/`
3. Create `InMemoryStateManager` implementation in `packages/core/src/domain/`
4. Implement path extraction logic in `ResponseSelector` (e.g., `body.item`, `query.userId`)
5. Implement array appending syntax (`stateKey[]`)
6. Implement template replacement engine (`{{state.X}}`) in `ResponseSelector`
7. Implement nested path support (`state.user.profile.name`)
8. Implement state reset on scenario switch
9. Add unit tests for capture, storage, and injection in `packages/core/tests/`

**Express Adapter Tasks:**
10. Wire up state management (no state logic in adapter!)
11. Create `apps/express-example/tests/dynamic-state.test.ts`

**Example App Tasks:**
12. Add stateful scenarios (cart, forms)
13. Update documentation

**Bruno Tests:**
14. Create `apps/express-example/bruno/Dynamic Responses/Stateful/` folder
15. Add shopping cart flow (add items → get cart with state)
16. Add form flow (multi-step with state persistence)
17. Include automated assertions for state capture/injection

**Acceptance Criteria:**
- ✅ Can capture from body/headers/query/params
- ✅ Array appending works
- ✅ Template injection works
- ✅ Nested paths work
- ✅ State resets on scenario switch
- ✅ State isolated per test ID
- ✅ Core unit tests passing (100% coverage)
- ✅ Adapter unit tests passing (100% translation coverage)
- ✅ Express integration tests passing
- ✅ Bruno automated tests passing (`bru run`)

### Phase 4: Feature Composition (REQ-4)
**Goal:** Verify all features work together

**Core Package Tasks:**
1. Add integration tests for composition patterns in `packages/core/tests/`
2. Test Match + Sequence composition
3. Test Match + State composition
4. Test Sequence + State composition
5. Test Match + Sequence + State (all three)
6. Performance benchmarking

**Express Adapter Tasks:**
7. Create `apps/express-example/tests/dynamic-composition.test.ts`
8. Test complex real-world composition scenarios

**Example App Tasks:**
9. Add comprehensive composition examples to scenarios
10. Update documentation with composition patterns and best practices

**Bruno Tests:**
11. Create `apps/express-example/bruno/Dynamic Responses/Composition/` folder
12. Add 2-3 key composition examples (match+sequence, sequence+state, all three)
13. Include automated assertions for complex flows

**Acceptance Criteria:**
- ✅ All composition patterns work
- ✅ Precedence rules enforced
- ✅ Complex scenarios working
- ✅ Core unit tests passing (100% coverage)
- ✅ Adapter unit tests passing (100% translation coverage)
- ✅ Express integration tests passing
- ✅ Bruno automated tests passing (`bru run`)
- ✅ Documentation complete

### Phase 5: Developer Experience & Debugging (REQ-5)
**Goal:** Enable world-class debugging experience for complex scenarios

**Problem Being Solved:**
Developers debugging complex scenarios (Playwright, Cypress, manual testing) have no visibility into:
- Current sequence positions (am I at step 3 of 5?)
- Captured state values (what's in my cart?)
- Why a specific mock matched or didn't match
- Whether response came from active scenario or default fallback
- Request history to understand flow progression

**Core Package Tasks:**
1. Add `ScenarioInspection` types to `packages/core/src/types/inspection.ts`
2. Add `inspect(testId: string): Result<ScenarioInspection>` to `ScenarioManager` port
3. Implement inspection logic in `ScenarioManager` implementation
4. Track request history in adapter runtime (last 10-20 requests per test ID)
5. Unit tests for inspection data accuracy

**Express Adapter Tasks:**
6. Add `/__scenario_debug__` GET endpoint to Express adapter
7. Wire up `scenarioManager.inspect()` to endpoint
8. Add integration tests for inspection endpoint

**Example App Tasks:**
9. Add Playwright debugging examples to documentation
10. Update README with debugging workflows

**Bruno Tests:**
11. Create `apps/express-example/bruno/Debug/` folder
12. Add "Inspect Current Scenario" request
13. Add documentation explaining debugging use cases
14. Include examples of programmatic assertions using inspection data

**Inspection Response Shape:**
```typescript
{
  testId: "checkout-test",
  activeScenario: { id: "checkout-flow", name: "Checkout Happy Path" },
  defaultScenario: { id: "default", name: "Default Responses" },
  sequenceState: [
    {
      mockIndex: 0,
      method: "GET",
      url: "/api/payment/status",
      currentPosition: 3,
      totalResponses: 5,
      repeatMode: "last",
      exhausted: false,
      nextResponse: { status: 200, body: { status: "processing" } },
      source: "checkout-flow"
    }
  ],
  capturedState: {
    cartItems: [{ id: "item-123", name: "Widget" }],
    userId: "user-456"
  },
  activeMocks: [
    {
      index: 0,
      method: "POST",
      url: "/api/payment",
      source: "checkout-flow",
      hasMatchCriteria: true,
      matchCriteria: { body: { amount: 29.99 } },
      hasSequence: false,
      capturesState: true
    }
  ],
  requestHistory: [
    {
      timestamp: "2025-10-23T12:34:56.789Z",
      method: "POST",
      url: "/api/cart/items",
      matchedMockIndex: 2,
      source: "default",
      responseStatus: 200
    }
  ]
}
```

**Usage Examples:**

*Playwright console debugging:*
```typescript
test('checkout flow', async ({ page }) => {
  await page.click('#checkout');

  const debug = await page.evaluate(async () => {
    const res = await fetch('http://localhost:3000/__scenario_debug__');
    return res.json();
  });

  console.log('Sequence positions:', debug.sequenceState);
  console.log('Next payment response:', debug.sequenceState[0].nextResponse);
});
```

*Browser DevTools:*
```javascript
// Quick state check during manual testing
await fetch('http://localhost:3000/__scenario_debug__')
  .then(r => r.json())
  .then(console.log);
```

*Programmatic assertions:*
```typescript
test('sequence should advance correctly', async ({ page }) => {
  await page.click('#check-status');

  const debug = await inspect();
  const paymentMock = debug.sequenceState.find(s => s.url.includes('payment'));

  expect(paymentMock.currentPosition).toBe(2);
  expect(paymentMock.nextResponse.body.status).toBe('complete');
});
```

**Acceptance Criteria:**
- ✅ `inspect()` method returns complete scenario state
- ✅ `/__scenario_debug__` endpoint works in Express adapter
- ✅ Sequence positions accurate (current, total, next response)
- ✅ Captured state values returned correctly
- ✅ Request history tracked (last N requests per test ID)
- ✅ Active vs default mock sources identified
- ✅ Bruno collection for interactive debugging
- ✅ Playwright debugging examples documented
- ✅ Core unit tests passing
- ✅ Integration tests passing
- ✅ Documentation complete

**Design Principles:**
- Zero-config (works automatically, no setup)
- Framework-agnostic (HTTP endpoint, works everywhere)
- Read-only (inspection never mutates state)
- Actionable (shows NEXT expected responses, not just current state)
- Minimal performance impact (optional endpoint)
- Can be disabled in production via config

**See Also:** [ADR-0002 § Future Enhancements](./adrs/0002-dynamic-response-system.md#future-enhancements) for detailed API specification and design rationale.

## Testing Strategy

The architectural separation of domain logic (core) from framework integration (adapters) requires a four-layer testing strategy. Each layer tests its own responsibility without duplication.

**See also:** [ADR-0002 § Testing Strategy](./adrs/0002-dynamic-response-system.md#testing-strategy) for detailed rationale and examples.

### Layer 1: Core Package Tests

**Location:** `packages/core/tests/`
**Purpose:** Comprehensive unit testing of ALL domain logic

**What to test:**
- `ResponseSelector` domain service (all three phases: match, select, transform)
- `SequenceTracker` port implementation (position tracking, repeat modes)
- `StateManager` port implementation (capture, storage, injection)
- Match criteria logic (body partial match, headers/query exact match)
- Sequence advancement (last/cycle/none, exhaustion)
- State capture (path extraction) and template replacement
- Edge cases: circular references, undefined keys, invalid paths
- Error conditions: sequence exhaustion, missing state, malformed templates

**Coverage:** 100% of all domain logic, every branch, every edge case

**Characteristics:**
- ✅ Fast (pure TypeScript, no framework overhead)
- ✅ Isolated (tests pure business logic)
- ✅ Single source of truth (domain behavior defined here)

### Layer 2: Adapter Package Tests

**Location:** `packages/express-adapter/tests/`
**Purpose:** Focused testing of translation layer ONLY

**What to test:**
- Request context extraction from Express (`req` → `RequestContext`)
- Response application to Express (`MockResponse` → `res`)
- Integration with core domain services
- Framework-specific quirks (header normalization, query parsing)
- Type conversions (Express types → domain types)
- Error handling in translation layer

**What NOT to test:**
- ❌ Match criteria logic (core's responsibility)
- ❌ Sequence advancement (core's responsibility)
- ❌ State management (core's responsibility)
- ❌ Template replacement (core's responsibility)

**Coverage:** 100% of translation functions

**Characteristics:**
- ✅ Fast (mock Express req/res, no full server)
- ✅ Focused (only translation, not domain logic)
- ❌ No duplication with core tests

### Layer 3: Integration Tests

**Location:** `apps/express-example/tests/dynamic-*.test.ts`
**Purpose:** E2E testing of real-world user journeys

**What to test:**
- Complete flows from HTTP request to response
- Real-world composition patterns (match + sequence + state)
- Scenario switching with test ID isolation
- Multi-request user journeys (polling, shopping cart, forms)
- All requirements (REQ-1 through REQ-4) demonstrated

**Coverage:** All composition patterns, all example scenarios

**Characteristics:**
- ✅ Realistic (full Express server, supertest)
- ✅ Comprehensive flows (tests complete user journeys)
- ❌ Slower (full server startup/teardown)

### Layer 4: Bruno Tests

**Location:** `apps/express-example/bruno/Dynamic Responses/`
**Purpose:** Executable API documentation with automated tests

**What to test:**
- Happy path scenarios (success flows)
- Common composition patterns (2-3 examples)
- Key user journeys (not every edge case)
- API contract validation

**Automated tests run via:**
```bash
bru run apps/express-example/bruno
```

**Coverage:** Selective - key flows only, not comprehensive

**Characteristics:**
- ✅ Human-readable (non-developers can understand)
- ✅ Executable docs (tests are documentation)
- ✅ CI-ready (run in pipeline for additional confidence)
- ❌ Selective (not comprehensive like Vitest tests)

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
- Bruno documents key patterns without duplicating Vitest tests

**Clear Debugging:**
- Core test failure → domain logic bug
- Adapter test failure → translation bug (req/res handling)
- Integration test failure → integration issue or missed scenario
- Bruno test failure → API contract change

**Fast Feedback:**
- Core tests run in milliseconds
- Adapter tests run in milliseconds
- Integration tests run in seconds
- Bruno tests run in seconds (CI)

### Anti-Patterns to Avoid

❌ **Testing domain logic in adapter tests** - Belongs in core tests
❌ **Testing translation in core tests** - Belongs in adapter tests
❌ **Duplicating all Vitest tests in Bruno** - Bruno should be selective
❌ **E2E testing translation edge cases** - Should be in adapter tests (faster)

## Design Decisions

### ✅ Serialization is Non-Negotiable
**Decision:** All features must be expressible as pure JSON data (no functions)

**Rationale:**
- Enables Redis, file, and database storage
- Scenarios can be version controlled
- Future devtools can load/edit scenarios
- Browser-based testing is possible
- Maintains hexagonal architecture

**Impact:** Template syntax instead of functions, state tracking in adapter runtime

### ✅ Self-Contained Scenarios
**Decision:** No runtime headers/configuration required beyond test ID

**Rationale:**
- Scenarios work in browsers without special setup
- Devtools can execute scenarios without knowledge of app internals
- Reduces consumer friction
- Makes scenarios portable

**Impact:** Match criteria and state capture embedded in scenario definitions

### ✅ State Resets on Scenario Switch
**Decision:** When switching scenarios, clear all state for that test ID

**Rationale:**
- Each scenario starts with clean slate
- Prevents state leakage between scenarios
- Makes scenarios predictable and reproducible
- Simplifies debugging

**Impact:** Can't carry state across scenarios (feature, not bug)

### ✅ Partial Matching for Request Body
**Decision:** `match.body` does partial matching (subset check)

**Rationale:**
- More flexible for real-world requests
- Request may have additional fields we don't care about
- Easier to write targeted matches
- Can add exact match mode later if needed

**Impact:** Match passes if request contains all specified keys with matching values

### ❌ No Template Operations (Phase 1)
**Decision:** Templates don't support operations like `{{state.count + 1}}`

**Rationale:**
- Keep template engine simple for v1
- Operations require expression parser (complexity)
- Most use cases satisfied by direct value injection
- Can add later if demand is clear

**Impact:** Consumers compute values before capturing, not in templates

## Future Considerations

### Exact Match Mode
If partial matching proves insufficient:
```typescript
match: {
  body: { ... },
  bodyExact: true  // Require exact match, no extra fields
}
```

### State Deletion
If needed for cleanup scenarios:
```typescript
{
  method: 'DELETE',
  url: '/api/cart/:id',
  clearState: ['cartItems', 'cartTotal']
}
```

### Template Operations
If demand is clear:
```typescript
body: {
  nextPage: '{{state.currentPage + 1}}',
  total: '{{state.items.length * state.pricePerItem}}'
}
```

### Cross-Test State Sharing
Currently not supported (by design). If needed:
```typescript
captureState: {
  'global.userId': 'body.userId'  // 'global.' prefix = shared state
}
```

## Success Criteria

This feature is complete when:

- ✅ All requirements (REQ-1 through REQ-4) implemented and tested
- ✅ 100% test coverage for all features
- ✅ Integration tests in express-example passing
- ✅ Example scenarios demonstrating each feature
- ✅ Bruno collection requests for manual testing
- ✅ Documentation updated with examples and patterns
- ✅ Features compose correctly without conflicts
- ✅ Serialization maintained throughout
- ✅ Performance acceptable (benchmarks TBD)

---

## Document Maintenance

This is a **living document** that will be updated throughout implementation.

### Requirements Document Updates

As we implement features:
- ✅ Update requirement statuses (⏸️ → 🏗️ → ✅)
- ✅ Add discovered edge cases
- ✅ Link to PRs and commits
- ✅ Add test file references
- ✅ Document lessons learned

### ADR Updates

After **each phase** implementation, update [ADR-0002](./adrs/0002-dynamic-response-system.md):

**After Phase 1 (Matching):**
- Update "Unknowns" section with discoveries
- Add actual performance data if measured
- Document any edge cases found
- Update alternatives if new approaches emerged

**After Phase 2 (Sequences):**
- Document sequence tracking performance
- Add any repeat mode edge cases discovered
- Update exhaustion handling learnings

**After Phase 3 (State):**
- Document state storage performance
- Add template replacement edge cases
- Document state isolation verification

**After Phase 4 (Composition):**
- Document composition patterns that work well
- Document composition patterns that are confusing
- Add real-world usage patterns observed
- Update consequences (positive/negative)
- Change ADR status from "Proposed" to "Accepted"

### Commit Message Template

When updating these documents:
```
docs(dynamic-responses): update after Phase X implementation

- Update requirement REQ-X status
- Add discovered edge case: [description]
- Update ADR-0002 with [learnings]
- Link to PR #[number]
```
