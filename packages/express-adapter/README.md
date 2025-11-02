# @scenarist/express-adapter

Express.js adapter for [Scenarist](https://github.com/citypaul/scenarist) - manage MSW mock scenarios in your Express applications for testing **and** development.

## What is Scenarist?

**Scenarist** enables concurrent E2E tests to run with different backend states by switching mock scenarios at runtime via test IDs. No application restarts needed, no complex per-test mocking, just simple scenario switching.

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

## Why Use Scenarist with Express?

**Runtime Scenario Switching**
- Change entire backend state with one API call
- No server restarts between tests
- Instant feedback during development

**True Parallel Testing**
- 100+ tests run concurrently with different scenarios
- Each test ID has isolated scenario state
- No conflicts, no serialization needed

**Automatic Test ID Propagation** (Express advantage)
- AsyncLocalStorage propagates test IDs automatically
- No manual header forwarding in route handlers
- MSW handlers receive test ID transparently

**Reusable Scenarios**
- Define scenarios once, use across all tests
- Version control your mock scenarios
- Share scenarios across teams

**Zero Boilerplate**
- One function call (`createScenarist()`) wires everything
- Middleware + endpoints + MSW automatically configured
- Just add `app.use(scenarist.middleware)` and you're done

## What is this package?

This package provides a complete Express integration for Scenarist's scenario management system. With one function call, you get:

- **Runtime scenario switching** via HTTP endpoints (`/__scenario__`)
- **Test isolation** using unique test IDs (`x-test-id` header)
- **Automatic MSW integration** for request interception
- **AsyncLocalStorage** for automatic test ID propagation
- **Zero boilerplate** - everything wired automatically

## Installation

```bash
# npm
npm install --save-dev @scenarist/express-adapter @scenarist/core msw

# pnpm
pnpm add -D @scenarist/express-adapter @scenarist/core msw

# yarn
yarn add -D @scenarist/express-adapter @scenarist/core msw
```

**Peer Dependencies:**
- `express` ^4.18.0 || ^5.0.0
- `msw` ^2.0.0

## Quick Start

### 1. Define Scenarios

```typescript
// test/scenarios/default.ts
import type { ScenarioDefinition } from '@scenarist/core';

export const defaultScenario: ScenarioDefinition = {
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

// test/scenarios/admin-user.ts
export const adminUserScenario: ScenarioDefinition = {
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
// test/setup.ts
import { createScenarist } from '@scenarist/express-adapter';
import { defaultScenario, adminUserScenario } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  defaultScenario: defaultScenario, // REQUIRED - fallback for unmocked requests
  strictMode: false,
});

// Register additional scenarios (default is auto-registered)
scenarist.registerScenario(adminUserScenario);

// Or register multiple scenarios at once
scenarist.registerScenarios([adminUserScenario, /* ... more scenarios */]);
```

### 3. Add to Express App

```typescript
// src/app.ts
import express from 'express';
import { scenarist } from '../test/setup';

const app = express();
app.use(express.json());

// Add Scenarist middleware (includes everything)
if (process.env.NODE_ENV === 'test') {
  app.use(scenarist.middleware);
}

// Your application routes
app.get('/api/user', async (req, res) => {
  const response = await fetch('https://api.example.com/user');
  const user = await response.json();
  res.json(user);
});

export { app };
```

### 4. Use in Tests

```typescript
// test/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { scenarist } from './setup';

describe('User API', () => {
  beforeAll(() => scenarist.start());
  afterAll(() => scenarist.stop());

  it('should return admin user', async () => {
    // Set scenario for this test
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'admin-test')
      .send({ scenario: 'admin-user' });

    // Make request - MSW intercepts automatically
    const response = await request(app)
      .get('/api/user')
      .set('x-test-id', 'admin-test');

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('admin');
  });
});
```

## API Reference

### `createScenarist(options)`

Creates a Scenarist instance with everything wired automatically.

**Parameters:**
```typescript
type ExpressAdapterOptions = {
  enabled: boolean;                    // Whether mocking is enabled
  strictMode?: boolean;                 // Return 501 for unmocked requests (default: false)
  headers?: {
    testId?: string;                    // Header for test ID (default: 'x-test-id')
    mockEnabled?: string;               // Header to enable/disable mocking (default: 'x-mock-enabled')
  };
  endpoints?: {
    setScenario?: string;               // POST endpoint (default: '/__scenario__')
    getScenario?: string;               // GET endpoint (default: '/__scenario__')
  };
  defaultScenario: ScenarioDefinition;  // REQUIRED - fallback scenario (auto-registered)
  defaultTestId?: string;               // Default test ID (default: 'default-test')
  registry?: ScenarioRegistry;          // Custom registry (default: InMemoryScenarioRegistry)
  store?: ScenarioStore;                // Custom store (default: InMemoryScenarioStore)
};
```

**Returns:**
```typescript
type ExpressScenarist = {
  config: ScenaristConfig;              // Resolved configuration (endpoints, headers, etc.)
  middleware: Router;                   // Express middleware (includes test ID extraction + scenario endpoints)
  registerScenario: (def: ScenarioDefinition) => void;
  registerScenarios: (defs: ReadonlyArray<ScenarioDefinition>) => void;
  switchScenario: (testId: string, scenarioId: string, variant?: string) => Result<void, Error>;
  getActiveScenario: (testId: string) => ActiveScenario | undefined;
  getScenarioById: (scenarioId: string) => ScenarioDefinition | undefined;
  listScenarios: () => ReadonlyArray<ScenarioDefinition>;
  clearScenario: (testId: string) => void;
  start: () => void;                    // Start MSW server
  stop: () => Promise<void>;            // Stop MSW server
};
```

**Example:**
```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: myDefaultScenario, // Required
  strictMode: false,
});

scenarist.registerScenario(myScenario); // Additional scenarios
app.use(scenarist.middleware);

beforeAll(() => scenarist.start());
afterAll(() => scenarist.stop());
```

### Scenario Endpoints

The middleware automatically exposes these endpoints:

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
  scenario: string;
  variant?: string;
}
```

**Example:**
```typescript
await request(app)
  .post('/__scenario__')
  .set('x-test-id', 'test-123')
  .send({ scenario: 'user-logged-in' });
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
// After setting a scenario
const response = await request(app)
  .get('/__scenario__')
  .set('x-test-id', 'test-123');

expect(response.status).toBe(200);
expect(response.body.scenarioId).toBe('success');

// Before setting a scenario
const response2 = await request(app)
  .get('/__scenario__')
  .set('x-test-id', 'new-test');

expect(response2.status).toBe(404);
expect(response2.body.error).toBe('No active scenario for this test ID');
```

## Core Capabilities

Scenarist provides 20+ powerful features for E2E testing. All capabilities work seamlessly with Express via automatic test ID propagation.

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
```typescript
{
  method: 'GET',
  url: '/api/search',
  match: { query: { filter: 'active' } },
  response: { status: 200, body: { results: [...] } }
}
```

**Combined matching** - Combine body + headers + query (all must pass)
**Specificity-based selection** - Most specific mock wins (no need to order carefully)
**Fallback mocks** - Mocks without match criteria act as catch-all

### Response Sequences (4 capabilities)

**Single responses** - Return same response every time
**Response sequences (ordered)** - Return different response on each call
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

// Inject into GET
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
**Default scenario fallback** - Unmocked endpoints fall back to default scenario
**Test ID isolation** - Run 100+ tests concurrently without conflicts
**Runtime scenario switching** - Change backend state with one API call

### Additional Features

**Path parameters** (`/users/:id`), **Wildcard URLs** (`*/api/*`), **Response delays**, **Custom headers**, **Strict mode** (fail on unmocked requests)

**Want to learn more?** See [Core Functionality Documentation](../../docs/core-functionality.md) for detailed explanations and examples.

## Core Concepts

### Test ID Isolation

Each request can include an `x-test-id` header. Scenarist uses this to isolate scenarios, enabling concurrent tests with different backend states:

```typescript
// Test 1 uses scenario A
await request(app)
  .get('/api/data')
  .set('x-test-id', 'test-1'); // Uses scenario A

// Test 2 uses scenario B (runs concurrently!)
await request(app)
  .get('/api/data')
  .set('x-test-id', 'test-2'); // Uses scenario B
```

### Automatic Test ID Propagation

**Express advantage:** Unlike frameworks without middleware (like Next.js), Express uses **AsyncLocalStorage** to automatically propagate test IDs throughout the request lifecycle.

**What this means:**
- Middleware extracts test ID from `x-test-id` header **once**
- Test ID stored in AsyncLocalStorage for the request duration
- MSW handlers automatically access test ID from AsyncLocalStorage
- **No manual header forwarding needed** when making external API calls

**Example - No manual forwarding:**

```typescript
// routes/products.ts
app.get('/api/products', async (req, res) => {
  // Test ID automatically available to MSW via AsyncLocalStorage
  // No need to manually forward headers!
  const response = await fetch('http://external-api.com/products');
  const products = await response.json();
  res.json(products);
});
```

**Compare to Next.js** (which requires manual forwarding):

```typescript
// Next.js - MUST manually forward headers
const response = await fetch('http://external-api.com/products', {
  headers: {
    ...getScenaristHeaders(req, scenarist),  // Required!
  },
});
```

**Express - NO manual forwarding needed** (AsyncLocalStorage handles it):

```typescript
// Express - AsyncLocalStorage propagates automatically
const response = await fetch('http://external-api.com/products');
// MSW handlers receive test ID from AsyncLocalStorage
```

**Why this works:**
- Express middleware runs before all routes
- Middleware extracts `x-test-id` and stores in AsyncLocalStorage
- MSW dynamic handler reads from AsyncLocalStorage
- All external API calls intercepted with correct test ID

**For architectural details, see:** [ADR-0007: Framework-Specific Header Forwarding](../../docs/adrs/0007-framework-specific-header-helpers.md)

### Automatic MSW Integration

The `createScenarist()` function automatically:
1. Creates an MSW server with a dynamic handler
2. Wires test ID extraction from headers via AsyncLocalStorage
3. Sets up scenario control endpoints (POST/GET `/__scenario__`)
4. Looks up the active scenario for each test ID
5. Returns mocked responses based on the scenario

The `middleware` includes everything:
- Test ID extraction from `x-test-id` header (stored in AsyncLocalStorage)
- Scenario control endpoints (`/__scenario__`)
- All wired together - just add `app.use(scenarist.middleware)`

You never see MSW code - it's all handled internally.

### Default Scenario Fallback

If a mock isn't found in the active scenario, Scenarist falls back to the "default" scenario:

```typescript
// Register default scenario with common responses
scenarist.registerScenario({
  id: 'default',
  name: 'Default Happy Path',
  description: 'Base responses for all APIs',
  mocks: [
    { method: 'GET', url: '*/api/users', response: { status: 200, body: [] } },
    { method: 'GET', url: '*/api/orders', response: { status: 200, body: [] } },
  ],
});

// Test scenario only overrides specific endpoints
scenarist.registerScenario({
  id: 'user-error',
  name: 'User API Error',
  mocks: [
    { method: 'GET', url: '*/api/users', response: { status: 500, body: { error: 'Server error' } } },
    // Orders endpoint falls back to default scenario
  ],
});
```

## Scenario Registration

### Single Registration

Register scenarios one at a time:

```typescript
scenarist.registerScenario(successScenario);
scenarist.registerScenario(errorScenario);
scenarist.registerScenario(timeoutScenario);
```

### Batch Registration

Register multiple scenarios at once for cleaner code:

```typescript
scenarist.registerScenarios([
  successScenario,
  errorScenario,
  timeoutScenario,
  notFoundScenario,
]);
```

**Tip:** Use with the scenarios object pattern for maximum type safety:

```typescript
// scenarios.ts
export const scenarios = {
  success: successScenario,
  error: errorScenario,
  timeout: timeoutScenario,
  notFound: notFoundScenario,
} as const;

// setup.ts
import { scenarios } from './scenarios';

scenarist.registerScenarios(Object.values(scenarios));
```

### Duplicate Protection

Scenarist protects against duplicate scenario IDs to prevent accidental overwrites:

```typescript
const scenario1 = { id: 'test', name: 'First', /* ... */ };
const scenario2 = { id: 'test', name: 'Second', /* ... */ };

scenarist.registerScenario(scenario1);
scenarist.registerScenario(scenario2); // ❌ Throws: Scenario 'test' is already registered
```

**Idempotent Registration**

Re-registering the **exact same scenario object** is safe (no-op):

```typescript
scenarist.registerScenario(defaultScenario);
scenarist.registerScenario(defaultScenario); // ✅ Safe - same object

// This is useful when using Object.values(scenarios):
const scenarios = {
  default: defaultScenario,
  success: successScenario,
  error: errorScenario,
} as const;

// Even though default is auto-registered by createScenarist(),
// this won't throw because it's the same object:
scenarist.registerScenarios(Object.values(scenarios)); // ✅ Works!
```

**Why idempotent?** The `defaultScenario` is auto-registered by `createScenarist()`, so if you organize all your scenarios (including default) in a const object and use `Object.values(scenarios)`, it would fail without idempotent behavior. By checking object reference equality, we allow the common pattern while still protecting against accidentally registering different scenarios with the same ID.

### Type-Safe Scenario Access

Combine batch registration with const objects for full type safety:

```typescript
// scenarios.ts - define and export scenarios
export const scenarios = {
  success: successScenario,
  githubNotFound: githubNotFoundScenario,
  weatherError: weatherErrorScenario,
  stripeFailure: stripeFailureScenario,
} as const;

// setup.ts - register all scenarios at once
import { scenarios } from './scenarios';

scenarist.registerScenarios(Object.values(scenarios));

// test.ts - type-safe access with autocomplete
import { scenarios } from './scenarios';

await request(app)
  .post(scenarist.config.endpoints.setScenario)
  .set(scenarist.config.headers.testId, 'test-123')
  .send({ scenario: scenarios.success.id }); // ✅ Autocomplete works!
```

This pattern provides:
- ✅ Autocomplete for scenario IDs
- ✅ Refactor-safe (rename propagates everywhere)
- ✅ Compile-time errors for typos
- ✅ Single source of truth

## Common Patterns

### Pattern 1: Test Helpers

Create helper functions to reduce boilerplate:

```typescript
// test/helpers.ts
import request from 'supertest';
import { app } from '../src/app';

export const setScenario = async (testId: string, scenario: string, variant?: string) => {
  await request(app)
    .post('/__scenario__')
    .set('x-test-id', testId)
    .send({ scenario, variant });
};

export const makeRequest = (testId: string) => {
  return request(app).set('x-test-id', testId);
};
```

**Usage:**
```typescript
import { setScenario, makeRequest } from './helpers';

test('payment flow', async () => {
  const testId = 'payment-test';
  await setScenario(testId, 'payment-success');

  const response = await makeRequest(testId).post('/api/charge');
  expect(response.status).toBe(200);
});
```

### Pattern 2: Unique Test IDs

Generate unique test IDs automatically:

```typescript
import { randomUUID } from 'crypto';

describe('API Tests', () => {
  let testId: string;

  beforeEach(() => {
    testId = randomUUID();
  });

  it('should process payment', async () => {
    await setScenario(testId, 'payment-success');
    const response = await makeRequest(testId).post('/api/charge');
    expect(response.status).toBe(200);
  });
});
```

### Pattern 3: Development Workflows

Enable scenario switching during development:

```typescript
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  defaultScenario: myDefaultScenario, // Required
  strictMode: false,
});
```

Manually switch scenarios with curl:

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
  defaultScenario: myDefaultScenario, // Required
  strictMode: true, // Fail if any unmocked request
});

// Development and test
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
  defaultScenario: myDefaultScenario, // Required
  strictMode: false, // Allow passthrough to real APIs
});

// Opt-in with environment variable
const scenarist = createScenarist({
  enabled: process.env.ENABLE_MOCKING === 'true',
  defaultScenario: myDefaultScenario, // Required
  strictMode: false,
});
```

### Custom Headers and Endpoints

```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: myDefaultScenario, // Required
  headers: {
    testId: 'x-my-test-id',
    mockEnabled: 'x-my-mock-flag',
  },
  endpoints: {
    setScenario: '/api/scenarios/set',
    getScenario: '/api/scenarios/active',
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
const response = await request(app).get('/api/data'); // No test ID!

// ✅ Correct - header on all requests
await setScenario('test-1', 'my-scenario');
const response = await request(app)
  .get('/api/data')
  .set('x-test-id', 'test-1');
```

### Scenario not found error

**Problem:** `Scenario not found` when setting scenario.

**Solution:** Ensure you've registered the scenario before using it:

```typescript
scenarist.registerScenario(myScenario);  // Register first

await setScenario('test-1', 'my-scenario');  // Then use
```

## Advanced Usage

For advanced users who need custom wiring, the low-level APIs are available:

```typescript
import {
  ExpressRequestContext,
  createTestIdMiddleware,
  createScenarioEndpoints,
  testIdStorage,
} from '@scenarist/express-adapter';

import { createDynamicHandler } from '@scenarist/msw-adapter';

// Manual wiring (not recommended for most users)
const handler = createDynamicHandler({
  getTestId: () => testIdStorage.getStore() ?? 'default-test',
  getActiveScenario: (testId) => manager.getActiveScenario(testId),
  getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
  strictMode: false,
});
```

## TypeScript

This package is written in TypeScript and includes full type definitions.

**Exported Types:**
```typescript
import type {
  ExpressAdapterOptions,
  ExpressScenarist,
} from '@scenarist/express-adapter';

import type {
  ScenarioDefinition,
  MockDefinition,
  ScenaristConfig,
} from '@scenarist/core';
```

## Examples

See the [**Express Example App**](../../apps/express-example) for a complete working example demonstrating:

- ✅ **Runtime scenario switching** - Change API behavior without restart
- ✅ **Test ID isolation** - 20 E2E tests with concurrent scenarios
- ✅ **Default fallback** - Partial scenarios automatically falling back
- ✅ **Real API integration** - Actual Express routes calling external APIs
- ✅ **Multiple scenarios** - Success, errors, timeouts, mixed results

The example includes:
- Complete Express application with GitHub, Weather, and Stripe API integrations
- 7 different scenario definitions
- 20 passing E2E tests demonstrating all features
- Comprehensive documentation and usage patterns

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management
- **[@scenarist/msw-adapter](../msw-adapter)** - MSW integration (used internally)

**Note:** The MSW adapter is used internally by this package. Users of `@scenarist/express-adapter` don't need to interact with it directly.
