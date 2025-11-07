# Core Functionality

This document explains Scenarist's core domain logic, independent of any specific framework or adapter. Understanding these concepts is essential for working with Scenarist effectively, regardless of which adapter (Express, Fastify, etc.) you're using.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Scenario Definitions](#scenario-definitions)
- [Mock Definitions](#mock-definitions)
- [Dynamic Response System](#dynamic-response-system)
  - [Request Content Matching](#request-content-matching)
  - [Specificity-Based Selection](#specificity-based-selection)
  - [Fallback Behavior](#fallback-behavior)
  - [Three-Phase Execution Model](#three-phase-execution-model)
- [Test Isolation](#test-isolation)
- [Architecture](#architecture)

## Overview

Scenarist's core functionality is implemented in `@scenarist/core`, which contains zero framework dependencies. All domain logic lives here, ensuring consistent behavior across all adapters (Express, Fastify, Next.js, etc.).

**Key Principle:** The core defines **what** happens (business logic), while adapters define **how** it happens in specific frameworks.

## Core Concepts

### Scenario

A **Scenario** is a complete set of mock API responses representing a specific application state. Each scenario defines how all external APIs should respond during that test scenario.

**Examples of scenarios:**
- "Payment Success" - All payment APIs return success responses
- "Payment Declined" - Payment APIs return declined responses
- "Network Error" - All APIs return 500 errors or timeout
- "Free Tier User" - APIs return responses for free tier features
- "Premium Tier User" - APIs return responses for premium features

**Key characteristics:**
- Scenarios are **serializable** (pure JSON, no functions)
- Scenarios can be stored in version control
- Scenarios can be loaded from files, databases, or Redis
- One scenario is active per test ID at a time

### Test ID

A **Test ID** is a unique identifier for each test execution, passed via the `x-test-id` header (configurable). Test IDs enable parallel test isolation - 100 tests can run simultaneously with different scenarios without conflicts.

**How it works:**
```typescript
// Test A
headers: { 'x-test-id': 'test-A' }
// Switches to "payment-success" scenario for test-A only

// Test B (running in parallel)
headers: { 'x-test-id': 'test-B' }
// Switches to "payment-error" scenario for test-B only
```

Each test ID has its own:
- Active scenario
- Sequence positions (reset on scenario switch)
- Captured state (reset on scenario switch)

### Mock Definition

A **Mock Definition** is a serializable description of how to respond to HTTP requests. Unlike MSW handlers (which contain functions), mock definitions are pure data that can be serialized to JSON.

**Basic mock:**
```typescript
{
  method: 'GET',
  url: 'https://api.stripe.com/charges/:id',
  response: {
    status: 200,
    body: { id: 'ch_123', amount: 1000, status: 'succeeded' }
  }
}
```

**Why serializable?**
- Store in Redis for distributed testing
- Save to files for version control
- Fetch from remote APIs
- Works across process boundaries

## Scenario Definitions

Scenarios are defined using `ScenaristScenario`:

```typescript
import type { ScenaristScenario } from '@scenarist/core';

const paymentSuccess: ScenaristScenario = {
  id: 'payment-success',
  name: 'Payment Success',
  description: 'All payment operations succeed',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/charges',
      response: {
        status: 200,
        body: {
          id: 'ch_123',
          amount: 1000,
          status: 'succeeded'
        }
      }
    },
    {
      method: 'GET',
      url: 'https://api.stripe.com/charges/:id',
      response: {
        status: 200,
        body: {
          id: 'ch_123',
          amount: 1000,
          status: 'succeeded'
        }
      }
    }
  ]
};
```

## Mock Definitions

### URL Patterns

Scenarist supports dynamic URL patterns using MSW syntax:

```typescript
// Exact match
url: 'https://api.example.com/users'

// Path parameters
url: 'https://api.example.com/users/:id'
url: 'https://api.example.com/users/:userId/posts/:postId'

// Wildcards
url: 'https://api.example.com/users/*'
```

### Response Structure

```typescript
response: {
  status: 200,              // HTTP status code
  body: { ... },            // Response body (JSON-serializable)
  headers?: {               // Optional response headers
    'x-custom': 'value'
  },
  delay?: 1000              // Optional delay in milliseconds
}
```

## Dynamic Response System

### Request Content Matching

**Status:** ✅ Implemented (Phase 1)

Scenarist can return different responses from the same endpoint based on request content. This enables testing complex scenarios where the same API behaves differently based on what you send.

#### Match on Request Body (Partial Match)

Match when request body **contains** specific fields. Additional fields in the request are ignored.

```typescript
{
  method: 'POST',
  url: '/api/items',
  match: {
    body: { itemId: 'premium-item' }  // Request must have this field
  },
  response: {
    status: 200,
    body: { price: 100, features: ['premium'] }
  }
}
```

**Example requests:**
```typescript
// ✅ MATCHES - has itemId field
{ itemId: 'premium-item', quantity: 5, color: 'blue' }

// ❌ NO MATCH - missing itemId field
{ quantity: 5, color: 'blue' }

// ❌ NO MATCH - itemId value differs
{ itemId: 'standard-item', quantity: 5 }
```

#### Match on Request Headers (Exact Match)

Match when request headers **exactly match** specified values. Header names are case-insensitive.

```typescript
{
  method: 'GET',
  url: '/api/data',
  match: {
    headers: { 'x-user-tier': 'premium' }
  },
  response: {
    status: 200,
    body: { data: 'premium data', limit: 1000 }
  }
}
```

**Example requests:**
```typescript
// ✅ MATCHES - header value matches
headers: { 'x-user-tier': 'premium', 'x-other': 'value' }

// ✅ MATCHES - header names are case-insensitive
headers: { 'X-User-Tier': 'premium' }

// ❌ NO MATCH - header value differs
headers: { 'x-user-tier': 'standard' }

// ❌ NO MATCH - header missing
headers: { 'x-other': 'value' }
```

#### Match on Query Parameters (Exact Match)

Match when query parameters **exactly match** specified values.

```typescript
{
  method: 'GET',
  url: '/api/search',
  match: {
    query: { filter: 'active', sort: 'asc' }
  },
  response: {
    status: 200,
    body: { results: [...], filtered: true }
  }
}
```

**Example requests:**
```typescript
// ✅ MATCHES - all query params match
?filter=active&sort=asc&limit=10

// ❌ NO MATCH - query param value differs
?filter=inactive&sort=asc

// ❌ NO MATCH - missing required query param
?sort=asc
```

#### Combined Match Criteria

You can combine multiple match criteria. **All** criteria must pass for the mock to apply.

```typescript
{
  method: 'POST',
  url: '/api/charge',
  match: {
    body: { itemType: 'premium' },
    headers: { 'x-user-tier': 'gold' },
    query: { currency: 'USD' }
  },
  response: {
    status: 200,
    body: { discount: 20 }
  }
}
```

### Specificity-Based Selection

**Status:** ✅ Implemented (Phase 1)

When multiple mocks match the same URL, Scenarist selects the **most specific** match. This prevents less specific mocks from shadowing more specific ones.

#### Specificity Scoring

Each match criterion adds to the specificity score:
- Each body field = **+1 point**
- Each header = **+1 point**
- Each query parameter = **+1 point**

**Examples:**
```typescript
// Specificity: 1 (one body field)
match: { body: { itemId: 'premium' } }

// Specificity: 2 (two body fields)
match: { body: { itemId: 'premium', quantity: 5 } }

// Specificity: 3 (two body fields + one header)
match: {
  body: { itemId: 'premium', quantity: 5 },
  headers: { 'x-user-tier': 'gold' }
}
```

#### Selection Algorithm

1. **Filter candidates** - Only consider mocks with matching URL and method
2. **Check match criteria** - Skip mocks where match criteria don't pass
3. **Calculate specificity** - Score each matching mock
4. **Select most specific** - Return mock with highest specificity score
5. **Break ties by order** - If multiple mocks have equal specificity, first one wins

#### Example: Specificity in Action

```typescript
const mocks = [
  // Mock 1: Specificity 1 (one body field)
  {
    method: 'POST',
    url: '/api/charge',
    match: { body: { itemType: 'premium' } },
    response: { status: 200, body: { discount: 10 } }
  },
  // Mock 2: Specificity 3 (two body fields + one header)
  {
    method: 'POST',
    url: '/api/charge',
    match: {
      body: { itemType: 'premium', quantity: 5 },
      headers: { 'x-user-tier': 'gold' }
    },
    response: { status: 200, body: { discount: 20 } }
  }
];

// Request:
// POST /api/charge
// Headers: { 'x-user-tier': 'gold' }
// Body: { itemType: 'premium', quantity: 5 }

// Result: Mock 2 wins (specificity 3 > 1)
// Response: { discount: 20 }
```

**Why this matters:**
- Place mocks in any order - specificity determines selection
- More specific matches always win, regardless of position
- Order only matters when specificity is equal (tiebreaker)

### Fallback Behavior

Mocks without match criteria serve as **fallback** or "catch-all" mocks.

```typescript
const mocks = [
  // Specific mock: Only for premium items
  {
    method: 'POST',
    url: '/api/items',
    match: { body: { itemId: 'premium' } },
    response: { status: 200, body: { price: 100 } }
  },
  // Fallback mock: For all other items
  {
    method: 'POST',
    url: '/api/items',
    // No match criteria = catches everything that didn't match above
    response: { status: 200, body: { price: 50 } }
  }
];
```

**Behavior:**
- Specific mocks (with match criteria) always take precedence over fallbacks
- Fallbacks have specificity of 0
- Multiple fallbacks: first one wins as tiebreaker
- If no mocks match and no fallback exists: error returned

### Three-Phase Execution Model

**Status:** ✅ Implemented (Phases 1-3 complete)

Every request goes through three mandatory sequential phases. This architecture guarantees that features compose correctly without needing dedicated composition tests.

#### Phase 1: Match (Which mock applies?)

For each mock with a matching URL:

1. **Check sequence exhaustion** (if applicable)
   - If mock has `sequence` with `repeat: 'none'`
   - Skip if position > total responses (exhausted)

2. **Check match criteria** (if present)
   - Evaluate `match.body` (partial match)
   - Evaluate `match.headers` (exact match)
   - Evaluate `match.query` (exact match)
   - Skip if any criterion fails

3. **Calculate specificity**
   - Count match criteria (body fields + headers + query params)
   - Track highest specificity match

4. **Select best match**
   - Mock with highest specificity wins
   - Order breaks ties when specificity is equal

**Phase 1 Gates Everything:** If a mock doesn't match, it's skipped entirely - no sequence advancement, no state capture.

#### Phase 2: Select (Which response to return?)

Once best match is selected:

1. **If mock has `sequence`:**
   - Get response at current position
   - Advance position for this (testId + scenarioId + mockIndex)
   - Handle repeat mode:
     - `'last'`: Stay at final position
     - `'cycle'`: Wrap to position 0
     - `'none'`: Mark as exhausted

2. **Else if mock has `response`:**
   - Return the single response

**Phase 2 is Independent:** Knows nothing about match criteria or state management.

#### Phase 3: Transform (Modify response based on state)

After selecting response:

1. **If mock has `captureState`:**
   - Extract values from request using paths (`body.field`, `query.param`)
   - Store in state Map under testId
   - Handle array appending syntax (`stateKey[]`)
   - Support nested paths (`user.profile.name`)

2. **If response contains templates:**
   - Find all `{{state.X}}` patterns
   - Replace with actual values from state
   - Handle nested paths (`{{state.user.name}}`)
   - Handle special accessors (`{{state.items.length}}`)

3. **Apply response modifiers:**
   - Add configured delays
   - Add configured headers
   - Return final response

**Phase 3 is Independent:** Knows nothing about matching or sequence selection.

#### Why This Architecture Matters

**Composition Guaranteed by Design:**

The three phases are **orthogonal** (independent and non-interfering):
- Match doesn't know about sequences or state
- Select doesn't know about match criteria or state
- Transform doesn't know about matching or sequences

They communicate through a **data pipeline**, not shared logic. Each phase has a **single responsibility**.

**This means:**
- Features automatically compose correctly
- No dedicated composition tests needed
- Like Unix pipes: `cat | grep | sort` works because each tool is independent
- The only edge case (match gates sequence) is explicitly tested in PR #28

**Examples of composition:**

```typescript
// Match + Sequence: Sequence only advances for matching requests
{
  match: { body: { tier: 'premium' } },
  sequence: {
    responses: [/* ... */],
    repeat: 'last'
  }
}
// Phase 1 checks match → Phase 2 advances sequence (if Phase 1 passed)

// Sequence + State: Each sequence response can inject state
{
  sequence: {
    responses: [
      { body: { step: 1, user: '{{state.userName}}' } },
      { body: { step: 2, user: '{{state.userName}}' } }
    ]
  },
  captureState: { 'userName': 'body.name' }
}
// Phase 2 selects response → Phase 3 captures and injects state

// All three: Match gates, sequence selects, state injects
{
  match: { body: { tier: 'premium' } },
  sequence: { responses: [/* ... */] },
  captureState: { 'userName': 'body.name' }
}
// Phase 1 gates → Phase 2 selects → Phase 3 transforms
```

## Test Isolation

### Per-Test-ID Isolation

Each test ID has completely isolated state:

```typescript
// Test A
POST /__scenario__
Headers: { 'x-test-id': 'test-A' }
Body: { scenario: 'payment-success' }

// Test B (parallel, different scenario)
POST /__scenario__
Headers: { 'x-test-id': 'test-B' }
Body: { scenario: 'payment-error' }
```

**Isolation guarantees:**
- Test A and Test B can run simultaneously
- Each sees their own active scenario
- No interference or conflicts
- Each has their own sequence positions and captured state

### Default Test ID

If no `x-test-id` header is provided, requests use the default test ID: `'default-test'`.

### Test ID Propagation Patterns

Different frameworks have different architectures for propagating test IDs throughout the request lifecycle. Scenarist adapters implement framework-specific patterns optimized for each framework's capabilities.

#### Pattern 1: AsyncLocalStorage (Express)

**How it works:**
1. Middleware extracts `x-test-id` header **once** at request start
2. Test ID stored in AsyncLocalStorage for request duration
3. MSW dynamic handler reads from AsyncLocalStorage
4. All external API calls automatically use correct test ID

**Code example:**

```typescript
// Middleware (runs once per request)
app.use(testIdMiddleware); // Extracts x-test-id → AsyncLocalStorage

// Route handler (no manual forwarding needed)
app.get('/api/products', async (req, res) => {
  const response = await fetch('http://external-api.com/products');
  // MSW handler automatically receives test ID from AsyncLocalStorage
  const products = await response.json();
  res.json(products);
});
```

**Advantages:**
- ✅ Zero boilerplate in route handlers
- ✅ Automatic propagation across async boundaries
- ✅ Test ID available anywhere in request lifecycle
- ✅ No manual header forwarding required

**Frameworks using this pattern:**
- Express
- Future: Fastify (with middleware support)

#### Pattern 2: Manual Forwarding (Next.js)

**How it works:**
1. No global middleware layer for API routes
2. Each route receives request independently
3. Routes must manually forward `x-test-id` header when calling external APIs
4. Use `getScenaristHeaders()` helper to extract and forward

**Code example:**

```typescript
// pages/api/products.ts
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
import { scenarist } from '@/lib/scenarist';

export default async function handler(req, res) {
  // MUST manually forward headers
  const response = await fetch('http://external-api.com/products', {
    headers: {
      ...getScenaristHeaders(req, scenarist), // Extract test ID from req
      'content-type': 'application/json',
    },
  });

  const products = await response.json();
  res.json(products);
}
```

**Why manual forwarding is needed:**
- Next.js API routes have no middleware layer
- Each route is isolated entry point
- Test ID must be explicitly passed to MSW
- Without forwarding, MSW sees `'default-test'` instead of actual test ID

**Advantages:**
- ✅ Explicit and clear (visible in code)
- ✅ Works without middleware support
- ✅ Type-safe helper function

**Disadvantages:**
- ❌ Boilerplate in every route that calls external APIs
- ❌ Easy to forget (but tests will fail)

**Frameworks using this pattern:**
- Next.js Pages Router
- Next.js App Router (Server Actions)
- Any framework without middleware support

#### Comparison Table

| Aspect | AsyncLocalStorage (Express) | Manual Forwarding (Next.js) |
|--------|----------------------------|----------------------------|
| **Middleware support** | ✅ Yes | ❌ No |
| **Manual forwarding** | ❌ Not needed | ✅ Required |
| **Boilerplate** | None | One line per external call |
| **Helper function** | N/A | `getScenaristHeaders()` |
| **Risk of forgetting** | ✅ None (automatic) | ⚠️ Tests will fail if forgotten |
| **Visibility** | Implicit (AsyncLocalStorage) | Explicit (in every route) |

#### When to Use Which Pattern

**Use AsyncLocalStorage pattern when:**
- Framework has global middleware support
- Can intercept all requests before route handlers
- AsyncLocalStorage available (Node.js 16+)

**Use Manual Forwarding pattern when:**
- Framework has no middleware layer (Next.js)
- Routes are isolated entry points
- Need explicit control over header propagation

**For architectural rationale, see:** [ADR-0007: Framework-Specific Header Forwarding](../docs/adrs/0007-framework-specific-header-helpers.md)

## Architecture

### Hexagonal Architecture (Ports & Adapters)

Scenarist uses hexagonal architecture to remain framework-agnostic:

```
┌──────────────────────────────────────────┐
│         Core (@scenarist/core)           │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Ports (interfaces)                │ │
│  │  • ScenarioManager                 │ │
│  │  • ScenarioRegistry                │ │
│  │  • ScenarioStore                   │ │
│  │  • ResponseSelector                │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Domain (implementations)          │ │
│  │  • createScenarioManager()         │ │
│  │  • createResponseSelector()        │ │
│  │  • buildConfig()                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Types (data structures)           │ │
│  │  • ScenaristScenario               │ │
│  │  • ScenaristMock                   │ │
│  │  • ScenaristResponse               │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
                    ▲
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼─────────┐   ┌────────▼──────────┐
│  Express Adapter│   │  Fastify Adapter  │
│                 │   │     (future)      │
│  • Middleware   │   │  • Plugin         │
│  • Endpoints    │   │  • Hooks          │
└─────────────────┘   └───────────────────┘
```

### Core Responsibilities

The core package provides:

1. **Ports** (interfaces) - Contracts that adapters must implement
2. **Domain Logic** - Business logic for response selection, scenario management
3. **Types** - Data structures for scenarios, mocks, responses
4. **Default Implementations** - In-memory implementations of ports

### Adapter Responsibilities

Adapters provide:

1. **Framework Integration** - Middleware, plugins, hooks for specific frameworks
2. **Request Context Extraction** - Convert framework request to core `RequestContext`
3. **Response Application** - Convert core `ScenaristResponse` to framework response
4. **Port Implementations** - Framework-specific implementations (optional)

**Critical:** Adapters are **thin translation layers**. All domain logic lives in core, not in adapters.

### Dependency Injection

All ports are injected as dependencies, never created internally:

```typescript
// ✅ CORRECT - Ports injected
const scenarioManager = createScenarioManager({
  registry: myRegistry,  // Injected
  store: myStore,        // Injected
  config: myConfig
});

// ❌ WRONG - Creating implementation internally
const scenarioManager = createScenarioManager({
  config: myConfig
});
// Creates new Map() internally - can only ever be in-memory!
```

**Why dependency injection?**
- Enables multiple implementations (in-memory, Redis, files, remote)
- Supports distributed testing
- True hexagonal architecture
- Follows dependency inversion principle

## Future Features

### Response Sequences (Phase 2)

Enable ordered sequences of responses for polling scenarios:

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
    repeat: 'last'  // After sequence ends, repeat last response
  }
}
```

**Use cases:**
- Polling APIs that return different status over time
- Progressive multi-step processes
- Time-dependent behaviors

### Stateful Mocks (Phase 3)

Enable capturing data from requests and injecting it into responses:

```typescript
// Capture from POST request
{
  method: 'POST',
  url: '/api/cart/items',
  captureState: {
    'cartItems[]': 'body.item'  // Append to array
  },
  response: { status: 200, body: { success: true } }
}

// Inject into GET response
{
  method: 'GET',
  url: '/api/cart',
  response: {
    status: 200,
    body: {
      items: '{{state.cartItems}}',  // Template replacement
      count: '{{state.cartItems.length}}'
    }
  }
}
```

**Use cases:**
- Shopping cart flows
- Multi-step forms
- User profile updates
- Any scenario where later responses depend on earlier requests

## Related Documentation

- [Express Adapter README](../packages/express-adapter/README.md) - Express-specific usage
- [MSW Adapter README](../packages/msw-adapter/README.md) - MSW integration details
- [Dynamic Responses Plan](./plans/dynamic-responses.md) - Complete implementation plan
- [ADR-0002: Dynamic Response System](./adrs/0002-dynamic-response-system.md) - Architectural decisions

## Examples

See the [Express Example App](../apps/express-example/) for complete working examples:

- Scenario definitions: `src/scenarios.ts`
- Integration tests: `tests/dynamic-matching.test.ts`
- Bruno API tests: `bruno/Dynamic Responses/`
