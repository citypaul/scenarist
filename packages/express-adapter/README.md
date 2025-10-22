# @scenarist/express-adapter

Express.js middleware adapter for [Scenarist](https://github.com/citypaul/scenarist) - manage MSW mock scenarios in your Express applications for testing **and** development.

## What is this?

This package provides Express-specific middleware and endpoints to integrate Scenarist's scenario management system into your Express.js application. It enables you to:

- **Switch mock scenarios at runtime** via HTTP endpoints
- **Isolate concurrent tests** using unique test IDs
- **Drive different user journeys** during local development
- **Query active scenarios** for debugging and validation
- **Integrate with MSW** for API mocking without modifying your application code

## Why use this?

Traditional API mocking approaches require either:
- Hardcoded mocks that can't change between tests
- Complex test setup/teardown that prevents concurrent execution
- Tight coupling between tests and application code

Scenarist with the Express adapter solves these problems:

```typescript
// Before: Tests must run sequentially, mocks are global
beforeEach(() => {
  server.use(http.get('/api/user', () => HttpResponse.json({ role: 'admin' })));
});

// After: Tests run concurrently, each with its own scenario
test('admin user', async () => {
  await request(app)
    .post('/__scenario__')
    .set('x-test-id', 'test-1')
    .send({ scenario: 'admin-user' });

  const response = await request(app)
    .get('/api/dashboard')
    .set('x-test-id', 'test-1');

  expect(response.body).toHaveProperty('adminPanel');
});

test('regular user', async () => {
  await request(app)
    .post('/__scenario__')
    .set('x-test-id', 'test-2')
    .send({ scenario: 'regular-user' });

  const response = await request(app)
    .get('/api/dashboard')
    .set('x-test-id', 'test-2');

  expect(response.body).not.toHaveProperty('adminPanel');
});
```

Both tests run **concurrently** with **different backend states**.

### Beyond Testing: Development Workflows

Scenarist isn't just for automated tests. It enables rapid development and debugging workflows:

```typescript
// Manually switch to error scenarios without modifying backend code
curl -X POST http://localhost:3000/__scenario__ \
  -H "Content-Type: application/json" \
  -d '{"scenario": "payment-declined"}'

// Now interact with your UI to see how it handles the error state
```

**Use cases for development:**
- **Manually test edge cases**: Switch to error scenarios instantly without backend changes
- **Demo different states**: Show stakeholders various application states during demos
- **Develop offline**: Build frontend features without waiting for backend APIs
- **Debug production issues**: Recreate problematic scenarios locally
- **Onboarding**: New developers can explore all application states without complex setup

## Installation

```bash
# npm
npm install --save-dev @scenarist/express-adapter @scenarist/msw-adapter @scenarist/core msw

# pnpm
pnpm add -D @scenarist/express-adapter @scenarist/msw-adapter @scenarist/core msw

# yarn
yarn add -D @scenarist/express-adapter @scenarist/msw-adapter @scenarist/core msw
```

**Required Packages:**
- `@scenarist/express-adapter` - Express middleware and scenario endpoints
- `@scenarist/msw-adapter` - Converts scenario definitions to MSW handlers
- `@scenarist/core` - Core scenario management
- `msw` ^2.0.0 - Mock Service Worker for request interception

**Peer Dependencies:**
- `express` ^4.18.0 || ^5.0.0

**Why both adapters?** The Express adapter provides scenario switching and test ID isolation, but doesn't intercept HTTP requests. The MSW adapter converts your scenario definitions into MSW handlers that actually mock the requests.

## Quick Start

### 1. Create Your Configuration

```typescript
// config/scenarist.config.ts
import { buildConfig } from '@scenarist/core';

export const scenaristConfig = buildConfig({
  enabled: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
  strictMode: false, // Allow unmocked requests to pass through
  headers: {
    testId: 'x-test-id',
    mockEnabled: 'x-mock-enabled',
  },
  endpoints: {
    setScenario: '/__scenario__',
    getScenario: '/__scenario__',
  },
  defaultScenario: 'default',
  defaultTestId: 'default-test',
});
```

### 2. Add Middleware to Your Express App

```typescript
// src/app.ts
import express from 'express';
import { createTestIdMiddleware, createScenarioEndpoints } from '@scenarist/express-adapter';
import { createScenarioManager } from '@scenarist/core';
import { InMemoryScenarioRegistry, InMemoryScenarioStore } from '@scenarist/core';
import { scenaristConfig } from './config/scenarist.config';

const app = express();

// Enable in test and development environments
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  // Create scenario manager
  const registry = new InMemoryScenarioRegistry();
  const store = new InMemoryScenarioStore();
  const manager = createScenarioManager({ registry, store, config: scenaristConfig });

  // Register scenarios (import your scenario definitions)
  // manager.registerScenario(adminUserScenario);
  // manager.registerScenario(regularUserScenario);
  // manager.registerScenario(defaultScenario);

  // Apply test ID middleware (must come before your routes)
  app.use(createTestIdMiddleware(scenaristConfig));

  // Mount scenario endpoints
  app.use(createScenarioEndpoints(manager, scenaristConfig));
}

// Your application routes...
app.get('/api/user', async (req, res) => {
  const user = await fetch('https://api.example.com/user');
  res.json(user);
});

export { app };
```

### 3. Define Scenarios

```typescript
// test/scenarios/admin-user.ts
import { http, HttpResponse } from 'msw';
import type { ScenarioDefinition } from '@scenarist/core';

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

### 4. Set Up MSW Request Interception

The Express adapter manages scenarios but doesn't intercept requests. You need MSW with the dynamic handler:

```typescript
// test/setup.ts
import { setupServer } from 'msw/node';
import { createDynamicHandler } from '@scenarist/msw-adapter';
import { testIdStorage } from '@scenarist/express-adapter';
import { manager } from '../src/app'; // Export manager from your app

// Create MSW handler that reads test ID from Express middleware
const handler = createDynamicHandler({
  getTestId: () => testIdStorage.getStore() ?? 'default-test',
  getActiveScenario: (testId) => manager.getActiveScenario(testId),
  getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
  strictMode: false,
});

export const server = setupServer(handler);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 5. Use in Tests

```typescript
// test/api.test.ts
import request from 'supertest';
import { app } from '../src/app';
import './setup'; // Import MSW setup

describe('User API', () => {
  it('should return admin user', async () => {
    // Set the scenario for this test
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'admin-test')
      .send({ scenario: 'admin-user' });

    // Make requests with the same test ID
    const response = await request(app)
      .get('/api/user')
      .set('x-test-id', 'admin-test');

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('admin');
  });
});
```

## Core Concepts

### How It Works: Two Adapters Working Together

Scenarist uses two complementary adapters:

**@scenarist/express-adapter** (this package):
- Provides `POST /__scenario__` and `GET /__scenario__` endpoints
- Stores test ID in AsyncLocalStorage via middleware
- Manages which scenario is active for each test ID
- Exports `testIdStorage` for MSW integration

**@scenarist/msw-adapter**:
- Creates MSW handlers from scenario definitions
- Reads test ID from `testIdStorage`
- Intercepts outgoing HTTP requests
- Returns mocked responses based on active scenario

**The complete flow:**
1. Test calls `POST /__scenario__` with test ID "test-1" to activate scenario "admin-user"
2. Test makes request to Express app with `x-test-id: test-1` header
3. Express middleware stores "test-1" in AsyncLocalStorage
4. Your route handler calls external API (e.g., `fetch('https://api.example.com/user')`)
5. MSW's dynamic handler intercepts that fetch call
6. Handler reads "test-1" from AsyncLocalStorage
7. Handler looks up active scenario for "test-1" (finds "admin-user")
8. Handler converts MockDefinition to MSW response and returns it

### Test ID Isolation

Each HTTP request can include an `x-test-id` header. Scenarist uses this to isolate scenarios:

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

The Express adapter uses **AsyncLocalStorage** to maintain test ID context throughout the request lifecycle, even through async operations.

### Scenario Switching

Switch scenarios at runtime via the `POST /__scenario__` endpoint:

```typescript
await request(app)
  .post('/__scenario__')
  .set('x-test-id', 'my-test')
  .send({
    scenario: 'payment-success',
    variant: 'credit-card' // optional
  });
```

### Scenario Querying

Check which scenario is active for a test ID:

```typescript
const response = await request(app)
  .get('/__scenario__')
  .set('x-test-id', 'my-test');

console.log(response.body);
// {
//   testId: 'my-test',
//   scenarioId: 'payment-success',
//   scenarioName: 'Payment Success',
//   variantName: 'credit-card'
// }
```

## API Reference

### `createTestIdMiddleware(config)`

Creates Express middleware that extracts the test ID from request headers and stores it in AsyncLocalStorage.

**Parameters:**
- `config: ScenaristConfig` - Scenarist configuration

**Returns:** `RequestHandler` - Express middleware function

**Usage:**
```typescript
import { createTestIdMiddleware } from '@scenarist/express-adapter';

app.use(createTestIdMiddleware(scenaristConfig));
```

**Important:** This middleware must be applied **before** your application routes.

---

### `createScenarioEndpoints(manager, config)`

Creates Express router with scenario management endpoints.

**Parameters:**
- `manager: ScenarioManager` - Scenario manager instance
- `config: ScenaristConfig` - Scenarist configuration

**Returns:** `Router` - Express router with scenario endpoints

**Endpoints:**

#### `POST /__scenario__` - Set Active Scenario

**Request Body:**
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

**Response (400):**
```typescript
{
  error: string;
  details?: Array<ValidationError>; // If Zod validation fails
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

**Response (404):**
```typescript
{
  error: 'No active scenario for this test ID';
  testId: string;
}
```

**Example:**
```typescript
const response = await request(app)
  .get('/__scenario__')
  .set('x-test-id', 'test-123');
```

---

### `ExpressRequestContext`

Implements the `RequestContext` port from `@scenarist/core` for Express.

**Usage:**
```typescript
import { ExpressRequestContext } from '@scenarist/express-adapter';

const context = new ExpressRequestContext(req, config);
const testId = context.getTestId();
const isMockEnabled = context.isMockEnabled();
```

**Methods:**
- `getTestId(): string` - Extract test ID from request headers
- `isMockEnabled(): boolean` - Check if mocking is enabled for this request
- `getHeaders(): Record<string, string | string[] | undefined>` - Get all request headers
- `getHostname(): string` - Get request hostname

---

### `testIdStorage`

The AsyncLocalStorage instance used to store test IDs.

**Usage:**
```typescript
import { testIdStorage } from '@scenarist/express-adapter';

// Inside middleware or route handler
const currentTestId = testIdStorage.getStore();
```

**Note:** This is primarily for internal use. Most consumers should use the `RequestContext` API.

## Configuration

### ScenaristConfig

```typescript
type ScenaristConfig = {
  // Whether mocking is enabled
  enabled: boolean;

  // Strict mode: return 501 for unmocked requests (vs passthrough)
  strictMode: boolean;

  // Header names for test isolation
  headers: {
    testId: string;        // Default: 'x-test-id'
    mockEnabled: string;   // Default: 'x-mock-enabled'
  };

  // Endpoint paths for scenario control
  endpoints: {
    setScenario: string;   // Default: '/__scenario__'
    getScenario: string;   // Default: '/__scenario__'
  };

  // Default scenario when none is set
  defaultScenario: string; // Default: 'default'

  // Default test ID when header is missing
  defaultTestId: string;   // Default: 'default-test'
};
```

### Environment-Specific Configuration

```typescript
import { buildConfig } from '@scenarist/core';

// Test-only configuration
export const testOnlyConfig = buildConfig({
  enabled: process.env.NODE_ENV === 'test',
  strictMode: true, // Fail if any unmocked request is made
});

// Development and test configuration
export const devAndTestConfig = buildConfig({
  enabled: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
  strictMode: false, // Allow passthrough to real APIs
});

// Opt-in development configuration
export const optInDevConfig = buildConfig({
  enabled: process.env.ENABLE_MOCKING === 'true',
  strictMode: false,
});
```

## Common Patterns

### Pattern 1: Test Setup Helper

Create a helper to reduce boilerplate:

```typescript
// test/helpers/scenario.ts
import request from 'supertest';
import { app } from '../../src/app';

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
import { setScenario, makeRequest } from './helpers/scenario';

test('payment flow', async () => {
  const testId = 'payment-test';

  await setScenario(testId, 'payment-success');

  const response = await makeRequest(testId).post('/api/charge');
  expect(response.status).toBe(200);
});
```

---

### Pattern 2: Test ID Generation

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

    const response = await makeRequest(testId)
      .post('/api/charge')
      .send({ amount: 100 });

    expect(response.status).toBe(200);
  });
});
```

---

### Pattern 3: Scenario Variants

Use variants for different flavors of the same scenario:

```typescript
// scenarios/payment.ts
export const paymentScenario: ScenarioDefinition = {
  id: 'payment',
  name: 'Payment Processing',
  description: 'Payment processing with different card types',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: { success: true },
      },
    },
  ],
  variants: {
    'credit-card': [
      {
        method: 'POST',
        url: 'https://api.stripe.com/v1/charges',
        response: {
          status: 200,
          body: { success: true, method: 'credit_card' },
        },
      },
    ],
    'declined': [
      {
        method: 'POST',
        url: 'https://api.stripe.com/v1/charges',
        response: {
          status: 402,
          body: { error: 'card_declined' },
        },
      },
    ],
  },
};
```

**Usage:**
```typescript
await setScenario(testId, 'payment', 'credit-card');
await setScenario(testId, 'payment', 'declined');
```

---

### Pattern 4: Conditional Mocking

Disable mocking for specific requests:

```typescript
const response = await request(app)
  .get('/api/user')
  .set('x-test-id', 'my-test')
  .set('x-mock-enabled', 'false'); // Bypass mocks, hit real API
```

---

### Pattern 5: Default Scenario

Set up a default scenario that applies when no specific scenario is set:

```typescript
// scenarios/default.ts
export const defaultScenario: ScenarioDefinition = {
  id: 'default',
  name: 'Default Happy Path',
  description: 'Default responses for all APIs',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.example.com/*',
      response: {
        status: 200,
        body: { success: true },
      },
    },
  ],
};
```

Register it as the default in your config:

```typescript
export const scenaristConfig = buildConfig({
  // ...
  defaultScenario: 'default',
});
```

---

### Pattern 6: Development Workflows

Enable scenario switching during development for rapid iteration:

```typescript
// config/scenarist.config.ts
export const scenaristConfig = buildConfig({
  enabled: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  strictMode: false, // Allow passthrough to real APIs when needed
  defaultScenario: 'default',
});
```

**Manually switch scenarios with curl:**

```bash
# Switch to error scenario
curl -X POST http://localhost:3000/__scenario__ \
  -H "Content-Type: application/json" \
  -d '{"scenario": "payment-declined"}'

# Check active scenario
curl http://localhost:3000/__scenario__

# Switch to success scenario
curl -X POST http://localhost:3000/__scenario__ \
  -H "Content-Type: application/json" \
  -d '{"scenario": "payment-success"}'
```

**Use with browser DevTools:**

```javascript
// In browser console, switch to error state
await fetch('http://localhost:3000/__scenario__', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'api-error', variant: 'timeout' })
});

// Now interact with UI to test error handling
```

**Development use cases:**
- **Feature development**: Build UI for features before backend is ready
- **Error state testing**: Manually trigger error scenarios without backend changes
- **Demo preparation**: Switch between scenarios to demonstrate different flows
- **Bug reproduction**: Recreate production issues locally with specific scenarios
- **Onboarding**: New developers can explore all states without complex setup

**Note**: For development, you typically use the default test ID, so no need to send `x-test-id` headers when making manual requests.

## Troubleshooting

### Test ID not being isolated

**Problem:** Different tests are seeing each other's scenarios.

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

---

### Middleware not detecting test ID

**Problem:** Test ID middleware always returns default test ID.

**Solution:** Ensure middleware is applied **before** your routes:

```typescript
// ❌ Wrong order
app.get('/api/data', handler);
app.use(createTestIdMiddleware(config)); // Too late!

// ✅ Correct order
app.use(createTestIdMiddleware(config));
app.get('/api/data', handler);
```

---

### Scenario not found error

**Problem:** `Scenario not found` when setting scenario.

**Solution:** Ensure you've registered the scenario:

```typescript
import { myScenario } from './scenarios/my-scenario';

// Register before using
manager.registerScenario(myScenario);

// Now you can set it
await setScenario('test-1', 'my-scenario');
```

---

### Headers are case-sensitive

**Problem:** Test ID not detected when using different case.

**Solution:** Express automatically lowercases header names, but your config might not match:

```typescript
// ✅ Use lowercase in config
export const scenaristConfig = buildConfig({
  headers: {
    testId: 'x-test-id', // lowercase
    mockEnabled: 'x-mock-enabled', // lowercase
  },
});
```

---

### Requests aren't being mocked

**Problem:** Scenarios switch successfully but API requests go to real endpoints instead of mocked responses.

**Solution:** Ensure you've set up MSW with the dynamic handler:

```typescript
import { setupServer } from 'msw/node';
import { createDynamicHandler } from '@scenarist/msw-adapter';
import { testIdStorage } from '@scenarist/express-adapter';

const handler = createDynamicHandler({
  getTestId: () => testIdStorage.getStore() ?? 'default-test',
  getActiveScenario: (testId) => manager.getActiveScenario(testId),
  getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
  strictMode: false,
});

const server = setupServer(handler);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

The Express adapter manages scenarios but doesn't intercept requests - that's MSW's job.

## TypeScript

This package is written in TypeScript and includes full type definitions.

**Exported Types:**
```typescript
import type {
  RequestContext,
  ScenaristConfig,
  ScenarioManager,
  ScenarioDefinition,
} from '@scenarist/core';

import type {
  ExpressRequestContext,
} from '@scenarist/express-adapter';
```

## Examples

See the `examples/` directory for complete working examples:

- **Basic Express App** - Minimal setup
- **Advanced Testing** - Concurrent tests, variants, error scenarios
- **Real-World Integration** - Full application with multiple APIs

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management (required)
- **[@scenarist/msw-adapter](../msw-adapter)** - MSW request interception (required)

Both adapters work together to provide the complete solution. The Express adapter manages scenario state, while the MSW adapter intercepts and mocks HTTP requests based on that state.
