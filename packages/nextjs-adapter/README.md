# @scenarist/nextjs-adapter

Next.js adapter for [Scenarist](https://github.com/citypaul/scenarist) - test different backend states in your Next.js applications without restarting your dev server or maintaining multiple test environments.

**Problem it solves:** Testing error scenarios, loading states, and edge cases in Next.js is painful. You either restart your app repeatedly, maintain complex mock setups per test, or run tests serially to avoid conflicts. Scenarist lets you switch between complete API scenarios instantly via HTTP calls, enabling parallel testing with isolated backend states.

## What is this?

**Before Scenarist:**
```typescript
// Every test has fragile per-test mocking
beforeEach(() => {
  server.use(
    http.get('/api/user', () => HttpResponse.json({ role: 'admin' }))
  );
});
// Repeat 100 times across test files, hope they don't conflict
```

**With Scenarist:**
```typescript
// Define scenario once
const adminScenario = { id: 'admin', mocks: [/* complete backend state */] };

// Use in any test with one line
await setScenario('test-1', 'admin');
// Test runs with complete "admin" backend state, isolated from other tests
```

This package provides complete Next.js integration for Scenarist's scenario management system, supporting both Pages Router and App Router:

- **Runtime scenario switching** via HTTP endpoints - no restarts needed
- **Test isolation** using unique test IDs - run 100 tests in parallel
- **Automatic MSW integration** for request interception - no MSW setup required
- **Zero boilerplate** - everything wired automatically with one function call
- **Both routers supported** - Pages Router and App Router with identical functionality

## Quick Navigation

| I want to... | Go to |
|-------------|--------|
| See what problems this solves | [What is this?](#what-is-this) |
| Get started in 5 minutes | [Quick Start (5 Minutes)](#quick-start-5-minutes) |
| Choose between routers | [Pages Router vs App Router](#pages-router-vs-app-router) |
| Set up Pages Router | [Pages Router Setup](#pages-router-setup) |
| Set up App Router | [App Router Setup](#app-router-setup) |
| Switch scenarios in tests | [Use in Tests](#4-use-in-tests) |
| Forward headers to external APIs | [Making External API Calls](#making-external-api-calls) |
| Understand test isolation | [Test ID Isolation](#test-id-isolation) |
| Reduce test boilerplate | [Common Patterns](#common-patterns) |
| Debug issues | [Troubleshooting](#troubleshooting) |
| See full API reference | [API Reference](#api-reference) |
| Learn about advanced features | [Core Functionality Docs](../../docs/core-functionality.md) |

## Core Capabilities

Scenarist provides 20+ powerful features for E2E testing. All capabilities work with Next.js (both Pages Router and App Router).

### Request Matching (6 capabilities)

**Body matching (partial match)** - Match requests based on request body fields
```typescript
{
  method: 'POST',
  url: '/api/items',
  match: { body: { itemId: 'premium-item' } },
  response: { status: 200, body: { price: 100 } }
}
```

**Header matching (exact match)** - Perfect for user tier testing
```typescript
{
  method: 'GET',
  url: '/api/data',
  match: { headers: { 'x-user-tier': 'premium' } },
  response: { status: 200, body: { limit: 1000 } }
}
```

**Query parameter matching** - Different responses for filtered requests
**Combined matching** - Combine body + headers + query (all must pass)
**Specificity-based selection** - Most specific mock wins (no need to order carefully)
**Fallback mocks** - Mocks without match criteria act as catch-all

### Response Sequences (4 capabilities)

**Single responses** - Return same response every time
**Response sequences (ordered)** - Perfect for polling APIs
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
    repeat: 'last'  // Stay at final response
  }
}
```

**Repeat modes** - `last` (stay at final), `cycle` (loop), `none` (exhaust)
**Sequence exhaustion with fallback** - Exhausted sequences skip to next mock

### Stateful Mocks (6 capabilities)

**State capture from requests** - Extract values from body/headers/query
**State injection via templates** - Inject captured state using `{{state.X}}`
```typescript
// Capture from POST
{
  method: 'POST',
  url: '/api/cart/items',
  captureState: { 'cartItems[]': 'body.item' },  // Append to array
  response: { status: 200 }
}

// Inject into GET response
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

**Array append support** - Syntax: `stateKey[]` appends to array
**Nested state paths** - Support dot notation: `user.profile.name`
**State isolation per test ID** - Each test ID has isolated state
**State reset on scenario switch** - Fresh state for each scenario

### Core Features (4 capabilities)

**Multiple API mocking** - Mock any number of external APIs in one scenario
**Automatic default fallback** - Active scenarios inherit mocks from default, override via specificity
**Test ID isolation** - Run 100+ tests concurrently without conflicts
**Runtime scenario switching** - Change backend state with one API call

### Additional Features

**Path parameters** (`/users/:id`), **Wildcard URLs** (`*/api/*`), **Response delays**, **Custom headers**, **Strict mode** (fail on unmocked requests)

**Want to learn more?** See [Core Functionality Documentation](../../docs/core-functionality.md) for detailed explanations and examples.

## Common Use Cases

### Testing Error Scenarios

Test how your UI handles API errors without maintaining separate error mocks per test:

```typescript
// Define once
const errorScenario = {
  id: 'api-error',
  name: 'API Error',
  mocks: [{ method: 'GET', url: '*/api/*', response: { status: 500 } }]
};

// Use in many tests
await setScenario('test-1', 'api-error');
// All API calls return 500 for this test
```

### Testing Loading States

Test slow API responses without actual network delays:

```typescript
const slowScenario = {
  id: 'slow-api',
  name: 'Slow API',
  mocks: [{
    method: 'GET',
    url: '*/api/data',
    response: { status: 200, body: { data: [] }, delay: 3000 } // 3s delay
  }]
};

// Perfect for testing loading spinners and skeleton screens
```

### Testing User Tiers

Test different user permission levels by switching scenarios:

```typescript
const freeUserScenario = { id: 'free', mocks: [/* limited features */] };
const premiumUserScenario = { id: 'premium', mocks: [/* all features */] };

// Test switches scenarios mid-suite - no app restart needed
test('free user sees upgrade prompt', async () => {
  await setScenario('test-1', 'free');
  // ... test free tier behavior
});

test('premium user sees all features', async () => {
  await setScenario('test-2', 'premium');
  // ... test premium tier behavior
});
```

### Parallel Test Execution

Run 100 tests concurrently with different backend states - no conflicts:

```typescript
// Test 1: Uses 'success' scenario with test-id-1
// Test 2: Uses 'error' scenario with test-id-2
// Test 3: Uses 'slow' scenario with test-id-3
// All running in parallel, completely isolated via test IDs
```

**Want to see these in action?** Jump to [Quick Start (5 Minutes)](#quick-start-5-minutes).

## Installation

```bash
# npm
npm install --save-dev @scenarist/nextjs-adapter msw

# pnpm
pnpm add -D @scenarist/nextjs-adapter msw

# yarn
yarn add -D @scenarist/nextjs-adapter msw
```

**Note:** All Scenarist types (`ScenaristScenario`, `ScenaristMock`, etc.) are re-exported from `@scenarist/nextjs-adapter` for convenience. You don't need to install `@scenarist/core` or `@scenarist/msw-adapter` separately - they're already included as dependencies.

**Peer Dependencies:**
- `next` ^14.0.0 || ^15.0.0
- `msw` ^2.0.0

## Quick Start (5 Minutes)

**Goal:** Switch between success and error scenarios in your tests.

### 1. Define Scenarios

```typescript
// lib/scenarios.ts
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/nextjs-adapter';

export const defaultScenario: ScenaristScenario = {
  id: 'default',
  name: 'Default',
  mocks: [{
    method: 'GET',
    url: 'https://api.example.com/user',
    response: { status: 200, body: { name: 'Default User', role: 'user' } }
  }]
};

export const successScenario: ScenaristScenario = {
  id: 'success',
  name: 'API Success',
  mocks: [{
    method: 'GET',
    url: 'https://api.example.com/user',
    response: { status: 200, body: { name: 'Alice', role: 'user' } }
  }]
};

export const scenarios = {
  default: defaultScenario,
  success: successScenario,
} as const satisfies ScenaristScenarios;
```

### 2. Create Scenarist Instance

```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/pages'; // or /app
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,                    // All scenarios registered upfront
});
```

> **CRITICAL: Singleton Pattern Required**
>
> **You MUST use `export const scenarist` as shown above.** Do NOT wrap `createScenarist()` in a function:
>
> ```typescript
> // ❌ WRONG - Creates new instance each time
> export function getScenarist() {
>   return createScenarist({ enabled: true, scenarios });
> }
>
> // ✅ CORRECT - Single exported constant
> export const scenarist = createScenarist({ enabled: true, scenarios });
> ```
>
> **Why:** Next.js dev server (and Turbopack) can load the same module multiple times. If you call `createScenarist()` repeatedly, you'll get multiple MSW servers conflicting with each other, causing `[MSW] Multiple handlers with the same URL` warnings and intermittent 500 errors.
>
> The singleton pattern inside `createScenarist()` prevents this - but ONLY if you export a constant. Wrapping in a function breaks the singleton protection.

### 3. Create Scenario Endpoint

**Pages Router:** Create `pages/api/__scenario__.ts`:
```typescript
import { scenarist } from '@/lib/scenarist';
export default scenarist.createScenarioEndpoint();
```

**App Router:** Create `app/api/%5F%5Fscenario%5F%5F/route.ts`:

> **Why the URL encoding?** Next.js App Router treats folders starting with `_` (underscore) as private folders that are excluded from routing. To create a URL route `/api/__scenario__`, we use `%5F` (URL-encoded underscore). This creates the actual endpoint at `http://localhost:3000/api/__scenario__`.

```typescript
import { scenarist } from '@/lib/scenarist';
const handler = scenarist.createScenarioEndpoint();
export const POST = handler;
export const GET = handler;
```

### 4. Use in Tests

```typescript
import { scenarist } from '@/lib/scenarist';

beforeAll(() => scenarist.start()); // Start MSW server
afterAll(() => scenarist.stop());   // Stop MSW server

it('fetches user successfully', async () => {
  // Set scenario for this test
  await fetch('http://localhost:3000/__scenario__', {
    method: 'POST',
    headers: { 'x-test-id': 'test-1', 'content-type': 'application/json' },
    body: JSON.stringify({ scenario: 'success' })
  });

  // Make request - MSW intercepts automatically
  const response = await fetch('http://localhost:3000/api/user', {
    headers: { 'x-test-id': 'test-1' }
  });

  expect(response.status).toBe(200);
  const user = await response.json();
  expect(user.name).toBe('Alice');
});
```

**That's it!** You've got runtime scenario switching.

**Next steps:**
- [Add more scenarios](#pages-router-setup) for different backend states
- [Use test helpers](#pattern-1-test-helpers) to reduce boilerplate
- [Learn about test isolation](#test-id-isolation) for parallel tests
- [See advanced features](../../docs/core-functionality.md#dynamic-response-system) like request matching and sequences

---

## Pages Router vs App Router

| Aspect | Pages Router | App Router |
|--------|-------------|------------|
| **Import Path** | `@scenarist/nextjs-adapter/pages` | `@scenarist/nextjs-adapter/app` |
| **Setup File** | `pages/api/__scenario__.ts` | `app/api/%5F%5Fscenario%5F%5F/route.ts` * |
| **Scenario Endpoint** | `export default scenarist.createScenarioEndpoint()` | `const handler = scenarist.createScenarioEndpoint();`<br>`export const POST = handler;`<br>`export const GET = handler;` |
| **Core Functionality** | ✅ Same scenarios, same behavior | ✅ Same scenarios, same behavior |

\* App Router uses `%5F%5Fscenario%5F%5F` (URL-encoded) because folders starting with `_` are treated as private folders in Next.js App Router. See [App Router Setup](#app-router-setup) for details.

**Key Insight:** Choose based on your Next.js version - all Scenarist features work identically in both routers.

**Detailed setup guides:**
- **[Pages Router Setup](#pages-router-setup)** - Full walkthrough for Pages Router
- **[App Router Setup](#app-router-setup)** - Full walkthrough for App Router

---

## Pages Router Setup

### 1. Define Scenarios

```typescript
// lib/scenarios/default.ts
import type { ScenaristScenario } from '@scenarist/nextjs-adapter/pages';

export const defaultScenario: ScenaristScenario = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Baseline responses for all APIs',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.example.com/user',
      response: {
        status: 200,
        body: {
          id: '000',
          name: 'Default User',
          role: 'user',
        },
      },
    },
  ],
};

// lib/scenarios/admin-user.ts
export const adminUserScenario: ScenaristScenario = {
  id: 'admin-user',
  name: 'Admin User',
  description: 'User with admin privileges',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.example.com/user',
      response: {
        status: 200,
        body: {
          id: '123',
          name: 'Admin User',
          role: 'admin',
        },
      },
    },
  ],
};
```

### 2. Create Scenarist Instance

```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,                    // All scenarios registered upfront
  strictMode: false,            // Allow unmocked requests to pass through to real APIs
});
```

### 3. Create Scenario Endpoint

```typescript
// pages/api/__scenario__.ts
import { scenarist } from '../../lib/scenarist';

export default scenarist.createScenarioEndpoint();
```

This single line creates a Next.js API route that handles both GET and POST requests for scenario management.

### 4. Use in Tests

```typescript
// tests/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { scenarist } from '../lib/scenarist';

describe('User API', () => {
  beforeAll(() => scenarist.start());
  afterAll(() => scenarist.stop());

  it('should return admin user', async () => {
    // Set scenario for this test
    await fetch('http://localhost:3000/__scenario__', {
      method: 'POST',
      headers: {
        'x-test-id': 'admin-test',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ scenario: 'admin-user' }),
    });

    // Make request - MSW intercepts automatically
    const response = await fetch('http://localhost:3000/api/user', {
      headers: { 'x-test-id': 'admin-test' },
    });

    const user = await response.json();
    expect(user.role).toBe('admin');
  });
});
```

---

## App Router Setup

### 1. Define Scenarios

Same as Pages Router - see [Define Scenarios](#1-define-scenarios) above.

### 2. Create Scenarist Instance

```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,                    // All scenarios registered upfront
  strictMode: false,            // Allow unmocked requests to pass through to real APIs
});
```

### 3. Create Scenario Route Handlers

```typescript
// app/api/__scenario__/route.ts
import { scenarist } from '@/lib/scenarist';

const handler = scenarist.createScenarioEndpoint();

export const POST = handler;
export const GET = handler;
```

The App Router uses Web standard Request/Response API and requires explicit exports for each HTTP method.

### 4. Use in Tests

Same as Pages Router - see [Use in Tests](#4-use-in-tests) above. The scenario endpoint works identically.

---

## API Reference

### `createScenarist(options)`

Creates a Scenarist instance with everything wired automatically.

**Import:**
```typescript
// Pages Router
import { createScenarist } from '@scenarist/nextjs-adapter/pages';

// App Router
import { createScenarist } from '@scenarist/nextjs-adapter/app';
```

**Parameters:**
```typescript
type AdapterOptions<T extends ScenaristScenarios> = {
  enabled: boolean;                    // Whether mocking is enabled
  scenarios: T;                        // REQUIRED - scenarios object (all scenarios registered upfront)
  strictMode?: boolean;                 // Return 501 for unmocked requests (default: false)
  headers?: {
    testId?: string;                    // Header for test ID (default: 'x-test-id')
  };
  defaultTestId?: string;               // Default test ID (default: 'default-test')
  registry?: ScenarioRegistry;          // Custom registry (default: InMemoryScenarioRegistry)
  store?: ScenarioStore;                // Custom store (default: InMemoryScenarioStore)
  stateManager?: StateManager;          // Custom state manager (default: InMemoryStateManager)
  sequenceTracker?: SequenceTracker;    // Custom sequence tracker (default: InMemorySequenceTracker)
};
```

**Returns:**
```typescript
type Scenarist<T extends ScenaristScenarios> = {
  config: ScenaristConfig;              // Resolved configuration (headers, etc.)
  createScenarioEndpoint: () => Handler; // Creates scenario endpoint handler
  switchScenario: (testId: string, scenarioId: ScenarioIds<T>, variant?: string) => ScenaristResult<void, Error>;
  getActiveScenario: (testId: string) => ActiveScenario | undefined;
  getScenarioById: (scenarioId: ScenarioIds<T>) => ScenaristScenario | undefined;
  listScenarios: () => ReadonlyArray<ScenaristScenario>;
  clearScenario: (testId: string) => void;
  start: () => void;                    // Start MSW server
  stop: () => Promise<void>;            // Stop MSW server
};
```

**Key Difference from Express Adapter:**

Unlike Express, Next.js doesn't have global middleware. Instead, you manually create the scenario endpoint using `createScenarioEndpoint()`:

```typescript
// Pages Router - single default export
export default scenarist.createScenarioEndpoint();

// App Router - explicit method exports
const handler = scenarist.createScenarioEndpoint();
export const POST = handler;
export const GET = handler;
```

### Scenario Endpoints

The endpoint handler exposes these operations:

#### `POST /__scenario__` - Set Active Scenario

**Request:**
```typescript
{
  scenario: string;      // Scenario ID (required)
  variant?: string;      // Variant name (optional)
}
```

**Response (200):**
```typescript
{
  success: true;
  testId: string;
  scenarioId: string;
  variant?: string;
}
```

**Example:**
```typescript
await fetch('http://localhost:3000/__scenario__', {
  method: 'POST',
  headers: {
    'x-test-id': 'test-123',
    'content-type': 'application/json',
  },
  body: JSON.stringify({ scenario: 'user-logged-in' }),
});
```

#### `GET /__scenario__` - Get Active Scenario

**Response (200):**
```typescript
{
  testId: string;
  scenarioId: string;
  scenarioName?: string;
  variantName?: string;
}
```

**Response (404) - No Active Scenario:**
```typescript
{
  error: "No active scenario for this test ID";
  testId: string;
}
```

**Example:**
```typescript
const response = await fetch('http://localhost:3000/__scenario__', {
  headers: { 'x-test-id': 'test-123' },
});

const data = await response.json();
console.log(data.scenarioId); // 'user-logged-in'
```

## Core Concepts

Scenarist's core functionality is framework-agnostic. For deep understanding of these concepts (request matching, sequences, stateful mocks), see **[Core Functionality Documentation](../../docs/core-functionality.md)**.

**Quick reference for Next.js:**

### Test ID Isolation

Each request includes an `x-test-id` header for parallel test isolation:

```typescript
// Test 1
headers: { 'x-test-id': 'test-1' } // Uses scenario A

// Test 2 (parallel!)
headers: { 'x-test-id': 'test-2' } // Uses scenario B
```

Each test ID has completely isolated:
- Active scenario selection
- Sequence positions (for polling scenarios)
- Captured state (for stateful mocks)

**Learn more:** [Test Isolation in Core Docs](../../docs/core-functionality.md#test-isolation)

### Making External API Calls

**IMPORTANT:** When your API routes call external APIs (or services mocked by Scenarist), you must forward Scenarist headers so MSW can intercept with the correct scenario.

**Why Next.js needs this:** Unlike Express (which uses AsyncLocalStorage middleware), Next.js API routes have no middleware layer to automatically propagate test IDs. You must manually forward the headers.

Use the `scenarist.getHeaders()` instance method:

```typescript
// pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { scenarist } from '@/lib/scenarist';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Fetch from external API with Scenarist headers forwarded
  const response = await fetch('http://external-api.com/products', {
    headers: {
      ...scenarist.getHeaders(req),  // ✅ Scenarist infrastructure headers
      'content-type': 'application/json',      // ✅ Your application headers
      'x-user-tier': req.headers['x-user-tier'], // ✅ Other app-specific headers
    },
  });

  const data = await response.json();
  res.json(data);
}
```

**What it does:**
- Extracts test ID from request headers (`x-test-id` by default)
- Respects your configured `testIdHeaderName` and `defaultTestId`
- Returns object with Scenarist headers ready to spread

**Key Distinction:**
- **Scenarist headers** (`x-test-id`) - Infrastructure for test isolation
- **Application headers** (`x-user-tier`, `content-type`) - Your app's business logic

Only Scenarist headers need forwarding via `scenarist.getHeaders()`. Your application headers are independent.

**App Router:** Different patterns depending on context:

**Route Handlers (Request object available):**
```typescript
// app/api/products/route.ts
import { scenarist } from '@/lib/scenarist';

export async function GET(request: Request) {
  const response = await fetch('http://external-api.com/products', {
    headers: {
      ...scenarist.getHeaders(request),
      'content-type': 'application/json',
    },
  });

  const data = await response.json();
  return Response.json(data);
}
```

**Server Components (ReadonlyHeaders from `headers()`):**
```typescript
// app/products/page.tsx
import { headers } from 'next/headers';
import { scenarist } from '@/lib/scenarist';

export default async function ProductsPage() {
  // Server Components use headers() which returns ReadonlyHeaders, not Request
  const headersList = await headers();

  const response = await fetch('http://external-api.com/products', {
    headers: {
      ...scenarist.getHeadersFromReadonlyHeaders(headersList),  // ✅ For ReadonlyHeaders
      'content-type': 'application/json',
    },
  });

  const data = await response.json();
  return <ProductList products={data.products} />;
}
```

**When to use which helper:**
- **`scenarist.getHeaders(request)` or `scenarist.getHeaders(req)`** - When you have a `Request` object (Route Handlers) or `NextApiRequest` (Pages Router API routes)
- **`scenarist.getHeadersFromReadonlyHeaders(headersList)`** - When you have `ReadonlyHeaders` from `headers()` (Server Components)

**For architectural rationale, see:** [ADR-0007: Framework-Specific Header Forwarding](../../docs/adrs/0007-framework-specific-header-helpers.md)

### Automatic MSW Integration

`createScenarist()` automatically wires MSW for request interception. You never see MSW code directly.

**What it does:**
1. Creates MSW server with dynamic handler
2. Extracts test ID from request headers
3. Looks up active scenario for that test ID
4. Returns mocked responses based on scenario

**Next.js-specific details:**
- Pages Router: Uses Next.js API routes
- App Router: Uses Web standard Request/Response
- Both: Full test ID isolation via headers

### Default Scenario Fallback

Active scenario mocks take precedence; unmocked endpoints fall back to default scenario:

```typescript
// Default covers all endpoints
const defaultScenario = {
  id: 'default',
  mocks: [
    { method: 'GET', url: '*/api/users', response: { status: 200, body: [] } },
    { method: 'GET', url: '*/api/orders', response: { status: 200, body: [] } },
  ]
};

// Test scenario overrides only specific endpoints
const errorScenario = {
  id: 'error',
  mocks: [
    { method: 'GET', url: '*/api/users', response: { status: 500 } }
    // Orders uses default scenario
  ]
};
```

**Learn more:** [Fallback Behavior in Core Docs](../../docs/core-functionality.md#fallback-behavior)

## Type-Safe Scenario IDs

TypeScript automatically infers scenario names from your scenarios object, providing autocomplete and compile-time safety.

### How It Works

```typescript
// lib/scenarios.ts
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/nextjs-adapter/pages';

export const scenarios = {
  default: { id: 'default', name: 'Default', mocks: [] },
  success: { id: 'success', name: 'Success', mocks: [] },
  error: { id: 'error', name: 'Error', mocks: [] },
  timeout: { id: 'timeout', name: 'Timeout', mocks: [] },
} as const satisfies ScenaristScenarios;

// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: true,
  scenarios, // ✅ Autocomplete + type-checked!
});
```

### Type Safety Benefits

```typescript
// ✅ Valid - TypeScript knows about these scenario IDs
scenarist.switchScenario('test-123', 'success');
scenarist.switchScenario('test-123', 'error');
scenarist.switchScenario('test-123', 'timeout');

// ❌ TypeScript error - 'invalid-name' is not a valid scenario ID
scenarist.switchScenario('test-123', 'invalid-name');
//                                    ^^^^^^^^^^^^^^
// Argument of type '"invalid-name"' is not assignable to parameter of type
// '"default" | "success" | "error" | "timeout"'
```

### In Tests

```typescript
// tests.ts
import { scenarios } from './scenarios';

// ✅ Type-safe scenario switching
await fetch('http://localhost:3000/__scenario__', {
  method: 'POST',
  headers: { 'x-test-id': 'test-1', 'content-type': 'application/json' },
  body: JSON.stringify({ scenario: 'success' }), // ✅ Autocomplete works!
});

// Or reference by object key for refactor-safety
await fetch('http://localhost:3000/__scenario__', {
  method: 'POST',
  headers: { 'x-test-id': 'test-1', 'content-type': 'application/json' },
  body: JSON.stringify({ scenario: scenarios.success.id }), // ✅ Even safer!
});
```

**What you get:**
- ✅ IDE autocomplete for all scenario names
- ✅ Compile-time errors for typos (catch bugs before runtime)
- ✅ Refactor-safe (rename scenarios and all usages update)
- ✅ Self-documenting code (see all available scenarios in one place)
- ✅ Single source of truth (scenarios object defines everything)

## Common Patterns

### Pattern 1: Test Helpers

Create helper functions to reduce boilerplate:

```typescript
// tests/helpers.ts
const API_BASE = 'http://localhost:3000';

export const setScenario = async (testId: string, scenario: string, variant?: string) => {
  await fetch(`${API_BASE}/__scenario__`, {
    method: 'POST',
    headers: {
      'x-test-id': testId,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ scenario, variant }),
  });
};

export const makeRequest = (testId: string, path: string, options?: RequestInit) => {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      'x-test-id': testId,
    },
  });
};
```

**Usage:**
```typescript
import { setScenario, makeRequest } from './helpers';

test('payment flow', async () => {
  const testId = 'payment-test';
  await setScenario(testId, 'payment-success');

  const response = await makeRequest(testId, '/api/charge', { method: 'POST' });
  expect(response.status).toBe(200);
});
```

### Pattern 2: Unique Test IDs

Generate unique test IDs automatically using a factory function:

```typescript
import { randomUUID } from 'crypto';

describe('API Tests', () => {
  // Factory function - no shared mutable state
  const createTestId = () => randomUUID();

  it('should process payment', async () => {
    const testId = createTestId(); // Fresh ID per test

    await setScenario(testId, 'payment-success');
    const response = await makeRequest(testId, '/api/charge', { method: 'POST' });
    expect(response.status).toBe(200);
  });

  it('should handle payment decline', async () => {
    const testId = createTestId(); // Independent state

    await setScenario(testId, 'payment-declined');
    const response = await makeRequest(testId, '/api/charge', { method: 'POST' });
    expect(response.status).toBe(402);
  });
});
```

### Pattern 3: Development Workflows

**⚠️ Security Warning:** Only enable scenario endpoints in development/test environments, **NEVER in production**.

**Why?** The `/__scenario__` endpoint allows arbitrary mock switching, which could be exploited in production to bypass security, fake data, or cause unexpected behavior.

**Safe configuration:**

```typescript
// lib/scenarist.ts
// ✅ CORRECT - Only enabled in safe environments
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  scenarios,
  strictMode: false,
});

// ❌ WRONG - Dangerous in production
const scenarist = createScenarist({
  enabled: true, // Always on, including production!
  scenarios,
});
```

**Production checklist:**
- ✅ `enabled` is conditional (never hardcoded `true`)
- ✅ Environment checks use `process.env.NODE_ENV`
- ✅ `/__scenario__` endpoints not exposed in production builds

**During development**, manually switch scenarios with curl:

```bash
# Switch to error scenario
curl -X POST http://localhost:3000/__scenario__ \
  -H "Content-Type: application/json" \
  -d '{"scenario": "payment-declined"}'

# Check active scenario
curl http://localhost:3000/__scenario__
```

## Configuration

### Environment-Specific

```typescript
// Test-only
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,
  strictMode: true, // Fail if any unmocked request
});

// Development and test
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
  scenarios,
  strictMode: false, // Allow passthrough to real APIs
});

// Opt-in with environment variable
const scenarist = createScenarist({
  enabled: process.env.ENABLE_MOCKING === 'true',
  scenarios,
  strictMode: false,
});
```

### strictMode Option

Controls behavior when no mock matches a request.

**`strictMode: false` (recommended for development):**
- Unmocked requests pass through to real APIs
- Useful when only mocking specific endpoints
- Default scenario provides fallback for common endpoints
- Best for development where you want partial mocking

**`strictMode: true` (recommended for tests):**
- Unmocked requests return 501 Not Implemented
- Ensures tests don't accidentally hit real APIs
- Catches missing mocks early in test development
- Best for test isolation and reproducibility

**Example:**

```typescript
// Development: Only mock failing endpoints, let others pass through
const minimalScenarios = {
  default: minimalScenario, // Only critical mocks
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'development',
  scenarios: minimalScenarios,
  strictMode: false, // Let unmocked APIs pass through to real services
});

// Testing: Ensure complete isolation
const testScenarios = {
  default: completeScenario, // Mock all endpoints
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios: testScenarios,
  strictMode: true, // Fail loudly if any endpoint isn't mocked
});
```

**When strictMode is true:**
- Request for mocked endpoint → Returns defined mock response ✅
- Request for unmocked endpoint → Returns 501 Not Implemented ❌
- Easy to spot missing mocks during test development

**When strictMode is false:**
- Request for mocked endpoint → Returns defined mock response ✅
- Request for unmocked endpoint → Passes through to real API 🌐
- Useful for incremental mocking in development

### Custom Headers

```typescript
const scenarist = createScenarist({
  enabled: true,
  scenarios,
  headers: {
    testId: 'x-my-test-id',
  },
});
```

## Troubleshooting

### Scenarios switch but requests aren't mocked

**Problem:** Scenario endpoints work but external API calls go to real endpoints.

**Solution:** Ensure you've called `scenarist.start()` before tests and `scenarist.stop()` after:

```typescript
beforeAll(() => scenarist.start());  // Starts MSW server
afterAll(() => scenarist.stop());    // Stops MSW server
```

### Tests see each other's scenarios

**Problem:** Different tests are seeing each other's active scenarios.

**Solution:** Ensure you're sending the `x-test-id` header with **every** request:

```typescript
// ❌ Wrong - missing header on second request
await setScenario('test-1', 'my-scenario');
const response = await fetch('http://localhost:3000/api/data'); // No test ID!

// ✅ Correct - header on all requests
await setScenario('test-1', 'my-scenario');
const response = await fetch('http://localhost:3000/api/data', {
  headers: { 'x-test-id': 'test-1' },
});
```

### Scenario not found error

**Problem:** `Scenario not found` when setting scenario.

**Solution:** Ensure the scenario is included in your scenarios object:

```typescript
// lib/scenarios.ts
export const scenarios = {
  default: defaultScenario,
  'my-scenario': myScenario,  // ✅ Include in scenarios object
} as const satisfies ScenaristScenarios;

// lib/scenarist.ts
const scenarist = createScenarist({
  enabled: true,
  scenarios,  // All scenarios registered automatically
});

// tests
await setScenario('test-1', 'my-scenario');  // ✅ Now works
```

### TypeScript errors with Next.js types

**Problem:** Type errors with Next.js request/response types.

**Solution:** Ensure your `next` peer dependency version matches the adapter's supported versions (^14.0.0 || ^15.0.0).

## TypeScript

This package is written in TypeScript and includes full type definitions.

**Exported Types:**
```typescript
// Pages Router - adapter-specific types
import type {
  PagesAdapterOptions,
  PagesScenarist,
  PagesRequestContext,
} from '@scenarist/nextjs-adapter/pages';

// Pages Router - core types (re-exported for convenience)
import type {
  ScenaristScenario,
  ScenaristMock,
  ScenaristResponse,
  ScenaristSequence,
  ScenaristMatch,
  ScenaristCaptureConfig,
  ScenaristScenarios,
  ScenaristConfig,
  ScenaristResult,
} from '@scenarist/nextjs-adapter/pages';

// App Router - adapter-specific types
import type {
  AppAdapterOptions,
  AppScenarist,
  AppRequestContext,
} from '@scenarist/nextjs-adapter/app';

// App Router - core types (re-exported for convenience)
import type {
  ScenaristScenario,
  ScenaristMock,
  ScenaristResponse,
  ScenaristSequence,
  ScenaristMatch,
  ScenaristCaptureConfig,
  ScenaristScenarios,
  ScenaristConfig,
  ScenaristResult,
} from '@scenarist/nextjs-adapter/app';
```

**Note:** All core types are re-exported from both `/pages` and `/app` subpaths for convenience. You only need one import path for all Scenarist types - just import from the subpath that matches your Next.js router.

## Advanced Usage

**Note:** Most users should use `createScenarist()`, which handles everything automatically.

<details>
<summary><strong>For framework authors or custom integrations only - click to expand</strong></summary>

If you need custom wiring for specialized use cases, you can access low-level components:

```typescript
// Pages Router low-level components
import {
  PagesRequestContext,
  createScenarioEndpoint,
} from '@scenarist/nextjs-adapter/pages';

// App Router low-level components
import {
  AppRequestContext,
  createScenarioEndpoint,
} from '@scenarist/nextjs-adapter/app';
```

**Use cases for low-level APIs:**
- Building a custom adapter for a Next.js-like framework
- Integrating with non-standard request handling
- Creating custom middleware chains
- Implementing custom test ID extraction logic

**For typical Next.js applications, use `createScenarist()` instead.** It provides the same functionality with zero configuration.

</details>

## Development & Testing

### Test Coverage Exception

**For users:** This package is production-ready and fully tested. The function coverage gap described below does not affect functionality or safety - it's an architectural pattern that will be resolved with integration tests in Phase 0.

**For developers:** This package has an explicit exception to the project's 100% coverage requirement.

**Current Coverage:**
- Lines: 100% ✅
- Statements: 100% ✅
- Branches: 100% ✅
- Functions: **93.2%** (explicit exception - improved from 86% after refactoring)

**Reason for Exception:**

Arrow functions passed to `createDynamicHandler()` in `src/common/create-scenarist-base.ts` are only executed when MSW handles actual HTTP requests:

```typescript
const handler = createDynamicHandler({
  getTestId: () => currentTestId,              // Only called during HTTP request
  getActiveScenario: (testId) => ...,          // Only called during HTTP request
  getScenarioDefinition: (scenarioId) => ...,  // Only called during HTTP request
});
```

Adapter unit tests focus on Layer 2 (translation layer):
- Request context extraction
- Endpoint request/response handling
- Framework-specific edge cases

These tests do NOT make real HTTP requests, so the handler arrow functions are never executed.

**Resolution:**

Phase 0 (Next.js example app) will add integration tests that:
- Make real HTTP requests (like Express example app does with supertest)
- Trigger MSW handlers
- Execute the remaining arrow functions
- Achieve 100% combined coverage across adapter + example app

**Precedent:**

The Express adapter follows the same pattern:
- Adapter unit tests: `packages/express-adapter/tests/`
- Integration tests: `apps/express-example/tests/` (with supertest)
- Combined result: 100% coverage

**This is the ONLY explicit exception to the 100% coverage rule in the project.**

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management
- **[@scenarist/express-adapter](../express-adapter)** - Express.js adapter
- **[@scenarist/msw-adapter](../msw-adapter)** - MSW integration (used internally)

**Note:** The MSW adapter is used internally by this package. Users of `@scenarist/nextjs-adapter` don't need to interact with it directly.
