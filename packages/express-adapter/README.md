# @scenarist/express-adapter

Express.js adapter for [Scenarist](https://github.com/citypaul/scenarist) - manage MSW mock scenarios in your Express applications for testing **and** development.

## What is this?

This package provides a complete Express integration for Scenarist's scenario management system. With one function call, you get:

- **Runtime scenario switching** via HTTP endpoints
- **Test isolation** using unique test IDs
- **Automatic MSW integration** for request interception
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

### 1. Create Scenarist Instance

```typescript
// test/setup.ts
import { createScenarist } from '@scenarist/express-adapter';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  strictMode: false,
});
```

### 2. Register Scenarios

```typescript
// test/scenarios/admin-user.ts
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

// Register it
scenarist.registerScenario(adminUserScenario);
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
type CreateScenaristOptions = {
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
  defaultScenario?: string;             // Default scenario ID (default: 'default')
  defaultTestId?: string;               // Default test ID (default: 'default-test')
  registry?: ScenarioRegistry;          // Custom registry (default: InMemoryScenarioRegistry)
  store?: ScenarioStore;                // Custom store (default: InMemoryScenarioStore)
};
```

**Returns:**
```typescript
type Scenarist = {
  middleware: Router;                   // Express middleware (includes everything)
  registerScenario: (def: ScenarioDefinition) => void;
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
  strictMode: false,
});

scenarist.registerScenario(myScenario);
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

**Example:**
```typescript
const response = await request(app)
  .get('/__scenario__')
  .set('x-test-id', 'test-123');
```

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

### Automatic MSW Integration

The `createScenarist()` function automatically:
1. Creates an MSW server with a dynamic handler
2. Wires test ID from headers to MSW request interception
3. Looks up the active scenario for each test ID
4. Returns mocked responses based on the scenario

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
  strictMode: true, // Fail if any unmocked request
});

// Development and test
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
  strictMode: false, // Allow passthrough to real APIs
});

// Opt-in with environment variable
const scenarist = createScenarist({
  enabled: process.env.ENABLE_MOCKING === 'true',
  strictMode: false,
});
```

### Custom Headers and Endpoints

```typescript
const scenarist = createScenarist({
  enabled: true,
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
  CreateScenaristOptions,
  Scenarist,
} from '@scenarist/express-adapter';

import type {
  ScenarioDefinition,
  MockDefinition,
  ScenaristConfig,
} from '@scenarist/core';
```

## Examples

See the `examples/` directory for complete working examples:

- **Basic Express App** - Minimal setup with createScenarist
- **Advanced Testing** - Concurrent tests, variants, error scenarios
- **Development Workflows** - Using scenarios during local development

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management
- **[@scenarist/msw-adapter](../msw-adapter)** - MSW integration (used internally)

**Note:** The MSW adapter is used internally by this package. Users of `@scenarist/express-adapter` don't need to interact with it directly.
