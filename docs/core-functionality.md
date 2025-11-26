# Core Functionality

This document explains Scenarist's core domain logic, independent of any specific framework or adapter. Understanding these concepts is essential for working with Scenarist effectively, regardless of which adapter (Express, Next.js, etc.) you're using.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Scenario Definitions](#scenario-definitions)
- [Mock Definitions](#mock-definitions)
  - [URL Patterns](#url-patterns)
  - [Response Structure](#response-structure)
- [Dynamic Response System](#dynamic-response-system)
  - [Request Content Matching](#request-content-matching)
  - [Specificity-Based Selection](#specificity-based-selection)
  - [Fallback Behavior](#fallback-behavior)
  - [Three-Phase Execution Model](#three-phase-execution-model)
- [Test Isolation](#test-isolation)
- [Architecture](#architecture)

## Overview

Scenarist's core functionality is implemented in `@scenarist/core`, which contains zero framework dependencies. All domain logic lives here, ensuring consistent behavior across all adapters (Express, Next.js, etc.).

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
- Scenarios use **declarative patterns** (explicit, inspectable, no hidden logic)
- Scenarios can be stored in version control
- Most scenarios CAN be stored as JSON (when not using native RegExp)
- One scenario is active per test ID at a time

### Test ID

A **Test ID** is a unique identifier for each test execution, passed via the `x-scenarist-test-id` header (configurable). Test IDs enable parallel test isolation - 100 tests can run simultaneously with different scenarios without conflicts.

**How it works:**
```typescript
// Test A
headers: { 'x-scenarist-test-id': 'test-A' }
// Switches to "payment-success" scenario for test-A only

// Test B (running in parallel)
headers: { 'x-scenarist-test-id': 'test-B' }
// Switches to "payment-error" scenario for test-B only
```

Each test ID has its own:
- Active scenario
- Sequence positions (reset on scenario switch)
- Captured state (reset on scenario switch)

### Mock Definition

A **Mock Definition** is a declarative description of how to respond to HTTP requests. Unlike MSW handlers (which contain functions), mock definitions use explicit patterns that are inspectable and composable.

**Basic mock:**
```typescript
{
  method: 'GET',
  url: 'https://api.stripe.com/charges/:id',  // String or native RegExp (ADR-0016)
  response: {
    status: 200,
    body: { id: 'ch_123', amount: 1000, status: 'succeeded' }
  }
}
```

**Why declarative patterns?**
- Explicit and inspectable (visible in scenario definition)
- Composable with other features (match + sequence + state)
- Type-safe and validatable
- Side benefit: Most mocks CAN be stored as JSON (when not using native RegExp)

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

**Status:** ✅ Implemented (Phase 2.5)

Scenarist supports two types of URL handling:

1. **Routing Patterns** - Define which URLs a mock can intercept
2. **URL Matching** - Match specific URL characteristics for conditional responses

#### Routing Patterns

The `url` field supports three pattern types with different hostname matching behaviors:

**1. Pathname-only patterns** (origin-agnostic)
```typescript
url: '/api/users'          // Exact pathname
url: '/api/users/:id'      // Path parameters
url: '/api/users/*'        // Wildcards
```
- **Matches ANY hostname** - works across localhost, staging, production
- Best for environment-agnostic mocks
- Example: `/api/users/123` matches:
  - `http://localhost:3000/api/users/123` ✅
  - `https://staging.example.com/api/users/123` ✅
  - `https://api.production.com/api/users/123` ✅

**2. Full URL patterns** (hostname-specific)
```typescript
url: 'https://api.example.com/users'           // Exact match with hostname
url: 'https://api.example.com/users/:id'       // Path parameters with hostname
url: 'https://api.example.com/users/*'         // Wildcards with hostname
```
- **Matches ONLY the specified hostname** (protocol + host must match exactly)
- Best for environment-specific mocks
- Example: `https://api.example.com/users/:id` matches:
  - `https://api.example.com/users/123` ✅
  - `http://api.example.com/users/123` ❌ (different protocol)
  - `https://api.staging.com/users/123` ❌ (different hostname)

**3. Native RegExp patterns** (origin-agnostic, weak comparison)
```typescript
url: /\/users\/\d+/        // Matches /users/123, /users/456, etc.
url: /\/posts\//           // Matches any URL containing /posts/
```
- **Matches ANY hostname** - substring matching (MSW weak comparison)
- Best for flexible pattern matching across environments
- Example: `/\/posts\//` matches:
  - `DELETE http://localhost:8080/posts/` ✅
  - `DELETE https://backend.dev/user/posts/` ✅
  - Any URL containing `/posts/` ✅

**Choosing the right pattern type:**

```typescript
// ✅ Pathname pattern - environment-agnostic (recommended for most mocks)
{
  url: '/api/products',
  response: { status: 200, body: { products: [] } }
}

// ✅ Full URL pattern - hostname-specific (when environment matters)
{
  url: 'https://api.production.com/admin',
  response: { status: 403, body: { error: 'Admin disabled in production' } }
}

// ✅ RegExp pattern - flexible matching across environments
{
  url: /\/api\/v\d+\/users/,  // Matches /api/v1/users, /api/v2/users, etc.
  response: { status: 200, body: { users: [] } }
}
```

**IMPORTANT:** If you specify a hostname explicitly in a full URL pattern, it WILL be matched. Choose pathname patterns for flexibility, full URL patterns for control.

**Key Point:** The `url` field determines **which requests** the mock can intercept (routing), not which requests it will actually respond to (that's what `match.url` is for).

#### URL Matching (Phase 2.5)

Once a routing pattern matches, you can use `match.url` to conditionally respond based on URL characteristics:

**1. Native RegExp Matching:**
```typescript
{
  method: 'GET',
  url: 'https://api.example.com/users/:username',  // Routing: any username
  match: {
    url: /\/users\/\d+$/  // Matching: only numeric IDs get this response
  },
  response: { status: 200, body: { type: 'numeric-user' } }
}
```

**2. String Matching Strategies:**
```typescript
// Contains - URL contains substring
{
  method: 'GET',
  url: 'https://api.example.com/weather/:city',
  match: {
    url: { contains: '/london' }  // Matches any URL containing '/london'
  },
  response: { status: 200, body: { city: 'London' } }
}

// StartsWith - URL starts with prefix
{
  method: 'GET',
  url: 'https://api.example.com/weather/:version/:city',
  match: {
    url: { startsWith: 'https://api.example.com/weather/v2' }  // Only v2 API
  },
  response: { status: 200, body: { version: 2 } }
}

// EndsWith - URL ends with suffix
{
  method: 'GET',
  url: 'https://api.example.com/files/:filename',
  match: {
    url: { endsWith: '.json' }  // Only JSON files
  },
  response: { status: 200, body: { type: 'json-file' } }
}

// Equals - Exact string match (backward compatible)
{
  method: 'GET',
  url: 'https://api.example.com/users/:username',
  match: {
    url: 'https://api.example.com/users/exactuser'  // Exact URL only
  },
  response: { status: 200, body: { user: 'exact' } }
}
```

**3. MSW Weak Comparison (RegExp):**

RegExp patterns use **weak comparison** - they match anywhere in the URL (substring matching), regardless of origin. This is MSW-compatible behavior.

```typescript
// Example: Match users endpoints across any origin
{
  method: 'GET',
  url: '*',  // Route all GET requests
  match: {
    url: /\/users\/\d+/  // Match only URLs containing /users/{numeric-id}
  },
  response: { status: 200, body: { matched: true } }
}
```

**This matches:**
- ✅ `https://api.example.com/users/123`
- ✅ `http://localhost/v1/users/456/profile`
- ✅ `https://backend.dev/api/users/789/settings`

**This does NOT match:**
- ❌ `https://api.example.com/posts/123` (pattern not found)

**Weak Comparison Use Cases:**

**Cross-Origin API Calls:**
```typescript
{
  match: {
    url: /\/api\/v\d+\//  // Matches v1, v2, v3, etc.
  }
}
// Works for: localhost, staging, production, any API version
```

**Query Parameter Matching:**
```typescript
{
  match: {
    url: /\/search\?/  // Matches any URL with query params
  }
}
// Matches: '/search?q=test', 'https://example.com/v1/search?filter=active'
```

**Case-Insensitive Matching:**
```typescript
{
  match: {
    url: /\/API\/USERS/i  // 'i' flag = case-insensitive
  }
}
// Matches: '/api/users', '/API/USERS', '/Api/Users'
```

**Weak vs. Strong Comparison:**

| Pattern Type | Comparison | Origin-Agnostic? | Example |
|--------------|------------|------------------|---------|
| String literal | Strong (exact) | ❌ No | `url: '/api/users/123'` |
| `{ contains }` | Strong (substring) | ❌ No | `url: { contains: '/users/' }` |
| `{ startsWith }` | Strong (prefix) | ❌ No | `url: { startsWith: '/api/' }` |
| `{ endsWith }` | Strong (suffix) | ❌ No | `url: { endsWith: '.json' }` |
| RegExp | Weak (substring) | ✅ Yes | `url: /\/users\/\d+/` |

**Key Difference:** Only RegExp patterns match across different origins. String strategies require the full URL to match exactly.

**Routing vs. Matching Example:**
```typescript
const mocks = [
  // Routing: Intercepts ALL /users/:id requests
  // Matching: Only responds when ID is numeric
  {
    method: 'GET',
    url: 'https://api.example.com/users/:id',  // Routing pattern
    match: {
      url: /\/users\/\d+$/  // URL matching condition
    },
    response: { status: 200, body: { type: 'numeric' } }
  },

  // Fallback: Responds when routing matches but URL matching doesn't
  {
    method: 'GET',
    url: 'https://api.example.com/users/:id',
    response: { status: 200, body: { type: 'other' } }
  }
];

// GET /users/123   → First mock (numeric ID matches regex)
// GET /users/alice → Second mock (fallback, regex doesn't match)
```

**How the resolved URL works:**
- For exact URLs: `match.url` compares against the literal URL string
- For path params/wildcards: `match.url` compares against the **resolved URL** (path params replaced with actual values)

Example:
```typescript
// Routing pattern: /users/:id
// Request: GET /users/123
// Resolved URL: /users/123  ← This is what match.url tests against

{
  url: 'https://api.example.com/users/:id',  // Routing: matches /users/123
  match: {
    url: /\/users\/\d+$/  // Matching: tests against resolved "/users/123"
  }
}
```

### Response Structure

```typescript
response: {
  status: 200,              // HTTP status code
  body: { ... },            // Response body (plain data or template strings)
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

#### String Matching Strategies

**Status:** ✅ Implemented (Phase 2 - PR #98)

Scenarist supports **6 matching modes** for headers, query params, and body fields. This enables flexible pattern matching without duplicating mocks.

**1. Exact Match (Default)**

Plain string or explicit `equals` strategy:

```typescript
{
  match: {
    headers: {
      'x-user-tier': 'premium'  // Must match exactly
    }
  }
}

// Explicit form (same behavior):
{
  match: {
    headers: {
      'x-user-tier': { equals: 'premium' }
    }
  }
}
```

**2. Contains (Substring Match)**

Match when field value **contains** the substring:

```typescript
{
  match: {
    headers: {
      'x-campaign': { contains: 'summer' }
    }
  }
}

// Matches:
// ✅ 'summer-sale'
// ✅ 'mega-summer-event'
// ✅ 'SUMMER' (case-sensitive)
// ❌ 'winter-sale'
```

**3. Starts With (Prefix Match)**

Match when field value **starts with** the prefix:

```typescript
{
  match: {
    headers: {
      'x-api-key': { startsWith: 'sk_' }
    }
  }
}

// Matches:
// ✅ 'sk_test_12345'
// ✅ 'sk_live_67890'
// ❌ 'pk_test_12345'
```

**4. Ends With (Suffix Match)**

Match when field value **ends with** the suffix:

```typescript
{
  match: {
    query: {
      email: { endsWith: '@company.com' }
    }
  }
}

// Matches:
// ✅ 'john@company.com'
// ✅ 'admin@company.com'
// ❌ 'john@example.com'
```

**5. Regex (Pattern Match)**

Match when field value **matches** the regex pattern. You can use either native JavaScript RegExp or the serialized form:

```typescript
// Native RegExp (recommended for readability)
{
  match: {
    headers: {
      referer: /\/premium|\/vip/i  // Case-insensitive pattern
    }
  }
}

// Serialized form (equivalent to above)
{
  match: {
    headers: {
      referer: {
        regex: {
          source: '/premium|/vip',  // Pattern (alternation)
          flags: 'i'  // Optional flags (case-insensitive)
        }
      }
    }
  }
}

// Matches:
// ✅ 'https://example.com/premium/checkout'
// ✅ 'https://example.com/vip-lounge'
// ✅ 'https://example.com/PREMIUM' (case-insensitive with 'i' flag)
// ❌ 'https://example.com/standard'
```

**Common Pattern Examples:**

```typescript
// API versioning - match any version number
{ referer: /\/api\/v\d+\// }
// Matches: /api/v1/, /api/v2/, /api/v10/

// Email domain restriction
{ email: /@company\.com$/i }
// Matches: john@company.com, admin@COMPANY.COM

// API key format validation
{ 'x-api-key': /^sk_(test|live)_[a-zA-Z0-9]{24}$/ }
// Matches: sk_test_abcd1234..., sk_live_wxyz5678...

// Multiple values with alternation
{ campaign: /summer|winter|spring|fall/i }
// Matches: summer-sale, WINTER-promo, Spring-event

// Numeric ID format
{ userId: /^\d{6,10}$/ }
// Matches: 123456, 9876543210
// Rejects: abc123, 12345 (too short)
```

**Security: ReDoS Protection**

⚠️ **IMPORTANT**: Both serialized and native RegExp patterns are validated using `redos-detector` to prevent ReDoS (Regular Expression Denial of Service) attacks.

**Unsafe patterns are automatically rejected at scenario registration:**

```typescript
// ❌ REJECTED - Catastrophic backtracking
{ referer: /(a+)+b/ }
// Error: Unsafe regex pattern detected

// ❌ REJECTED - Exponential time complexity
{ email: /(x+x+)+@/ }
// Error: Unsafe regex pattern detected

// ✅ SAFE - Linear time complexity
{ referer: /\/api\/[^/]+\/users/ }
// Matches safely with bounded backtracking
```

Scenarist validates patterns before execution to protect your tests from denial-of-service attacks caused by malicious or poorly designed regex patterns.

**Supported Flags:**
- `i` - Case-insensitive
- `g` - Global (allowed but has no effect in matching)
- `m` - Multiline
- `s` - Dot matches newline
- `u` - Unicode
- `v` - Unicode sets
- `y` - Sticky (allowed but has no effect in matching)

**Type Coercion:**
All values are converted to strings before matching. This allows matching against numeric query params and body fields:

```typescript
{
  match: {
    query: {
      page: { equals: '1' }  // Matches ?page=1 (number coerced to string)
    }
  }
}
```

### Specificity-Based Selection

**Status:** ✅ Implemented (Phase 1)

When multiple mocks match the same URL, Scenarist selects the **most specific** match. This prevents less specific mocks from shadowing more specific ones.

#### Specificity Priority Ranges

Scenarist uses **separate priority ranges** to ensure correct selection:

1. **Mocks WITH match criteria:** Base 100 + field count (minimum 101)
2. **Fallback sequences:** Specificity 1
3. **Simple fallback responses:** Specificity 0

This guarantees:
- ✅ Mocks with match criteria ALWAYS win over fallbacks
- ✅ Sequence fallbacks take priority over simple response fallbacks
- ✅ No conflicts between match criteria and sequence features

#### Specificity Scoring

**Mocks with match criteria:**
- Base specificity: **100**
- Each body field: **+1 point**
- Each header: **+1 point**
- Each query parameter: **+1 point**

**Mocks without match criteria (fallbacks):**
- Has `sequence`: **1 point**
- Simple `response`: **0 points**

**Examples:**
```typescript
// Specificity: 101 (100 base + 1 body field)
match: { body: { itemId: 'premium' } }

// Specificity: 102 (100 base + 2 body fields)
match: { body: { itemId: 'premium', quantity: 5 } }

// Specificity: 103 (100 base + 2 body + 1 header)
match: {
  body: { itemId: 'premium', quantity: 5 },
  headers: { 'x-user-tier': 'gold' }
}

// Specificity: 1 (sequence fallback, no match criteria)
sequence: {
  responses: [...],
  repeat: 'last'
}

// Specificity: 0 (simple fallback, no match criteria)
response: { status: 200, body: { default: true } }
```

#### Selection Algorithm

1. **Filter candidates** - Only consider mocks with matching URL and method
2. **Skip exhausted sequences** - If `repeat: 'none'` and position exceeded
3. **Check match criteria** - Skip mocks where match criteria don't pass
4. **Calculate specificity** - Score each matching mock (separate ranges)
5. **Select most specific** - Return mock with highest specificity score
6. **Break ties by order** - If multiple mocks have equal specificity, first one wins

#### Example: Specificity in Action

```typescript
const mocks = [
  // Mock 1: Specificity 101 (100 base + 1 body field)
  {
    method: 'POST',
    url: '/api/charge',
    match: { body: { itemType: 'premium' } },
    response: { status: 200, body: { discount: 10 } }
  },
  // Mock 2: Specificity 103 (100 base + 2 body + 1 header)
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

// Result: Mock 2 wins (specificity 103 > 101)
// Response: { discount: 20 }
```

**Why this matters:**
- Place mocks in any order - specificity determines selection
- Mocks with match criteria always win over fallbacks
- Sequence fallbacks take priority over simple fallbacks
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
  // Sequence fallback: For all other items
  {
    method: 'POST',
    url: '/api/items',
    sequence: {
      responses: [
        { status: 200, body: { price: 50, attempt: 1 } },
        { status: 200, body: { price: 50, attempt: 2 } },
      ],
      repeat: 'last'
    }
  },
  // Simple fallback: Last resort
  {
    method: 'POST',
    url: '/api/items',
    response: { status: 200, body: { price: 50 } }
  }
];
```

**Priority order (highest to lowest):**
1. **Match criteria mocks** (specificity 101+) - Always checked first
2. **Sequence fallbacks** (specificity 1) - Used when no match criteria mocks match
3. **Simple fallbacks** (specificity 0) - Used when sequences exhausted or no sequences

**Behavior:**
- Specific mocks (with match criteria) always take precedence over fallbacks
- Sequence fallbacks take priority over simple response fallbacks
- Multiple fallbacks of equal priority: first one wins as tiebreaker
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
Headers: { 'x-scenarist-test-id': 'test-A' }
Body: { scenario: 'payment-success' }

// Test B (parallel, different scenario)
POST /__scenario__
Headers: { 'x-scenarist-test-id': 'test-B' }
Body: { scenario: 'payment-error' }
```

**Isolation guarantees:**
- Test A and Test B can run simultaneously
- Each sees their own active scenario
- No interference or conflicts
- Each has their own sequence positions and captured state

### Default Test ID

If no `x-scenarist-test-id` header is provided, requests use the default test ID: `'default-test'`.

### Test ID Propagation Patterns

Different frameworks have different architectures for propagating test IDs throughout the request lifecycle. Scenarist adapters implement framework-specific patterns optimized for each framework's capabilities.

#### Pattern 1: AsyncLocalStorage (Express)

**How it works:**
1. Middleware extracts `x-scenarist-test-id` header **once** at request start
2. Test ID stored in AsyncLocalStorage for request duration
3. MSW dynamic handler reads from AsyncLocalStorage
4. All external API calls automatically use correct test ID

**Code example:**

```typescript
// Middleware (runs once per request)
app.use(testIdMiddleware); // Extracts x-scenarist-test-id → AsyncLocalStorage

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

#### Pattern 2: Manual Forwarding (Next.js)

**How it works:**
1. No global middleware layer for API routes
2. Each route receives request independently
3. Routes must manually forward `x-scenarist-test-id` header when calling external APIs
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
│  Express Adapter│   │  Next.js Adapter  │
│                 │   │                   │
│  • Middleware   │   │  • App Router     │
│  • Endpoints    │   │  • Pages Router   │
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

## Related Documentation

- [Express Adapter README](../packages/express-adapter/README.md) - Express-specific usage
- [MSW Adapter README](../internal/msw-adapter/README.md) - MSW integration details (internal)
- [Dynamic Responses Plan](./plans/dynamic-responses.md) - Complete implementation plan
- [ADR-0002: Dynamic Response System](./adrs/0002-dynamic-response-system.md) - Architectural decisions

## Examples

See the [Express Example App](../apps/express-example/) for complete working examples:

- Scenario definitions: `src/scenarios.ts`
- Integration tests: `tests/dynamic-matching.test.ts`
- Bruno API tests: `bruno/Dynamic Responses/`
