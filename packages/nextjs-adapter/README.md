# @scenarist/nextjs-adapter

Next.js adapter for [Scenarist](https://github.com/citypaul/scenarist) - manage MSW mock scenarios in your Next.js applications for testing **and** development.

## What is this?

This package provides complete Next.js integration for Scenarist's scenario management system, supporting both Pages Router and App Router. With one function call, you get:

- **Runtime scenario switching** via HTTP endpoints
- **Test isolation** using unique test IDs
- **Automatic MSW integration** for request interception
- **Zero boilerplate** - everything wired automatically
- **Both routers supported** - Pages Router and App Router in one package

## Installation

```bash
# npm
npm install --save-dev @scenarist/nextjs-adapter @scenarist/core msw

# pnpm
pnpm add -D @scenarist/nextjs-adapter @scenarist/core msw

# yarn
yarn add -D @scenarist/nextjs-adapter @scenarist/core msw
```

**Peer Dependencies:**
- `next` ^14.0.0 || ^15.0.0
- `msw` ^2.0.0

## Quick Start

Choose your router:
- **[Pages Router](#pages-router-usage)** - Traditional Next.js with `pages/` directory
- **[App Router](#app-router-usage)** - Modern Next.js with `app/` directory

Both routers follow the same core concepts—only the setup differs slightly.

---

## Pages Router Usage

### 1. Define Scenarios

```typescript
// lib/scenarios/default.ts
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

// lib/scenarios/admin-user.ts
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
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { defaultScenario, adminUserScenario } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  defaultScenario: defaultScenario, // REQUIRED - fallback for unmocked requests
  strictMode: false,
});

// Register additional scenarios (default is auto-registered)
scenarist.registerScenario(adminUserScenario);
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

## App Router Usage

### 1. Define Scenarios

Same as Pages Router - see [Define Scenarios](#1-define-scenarios) above.

### 2. Create Scenarist Instance

```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { defaultScenario, adminUserScenario } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  defaultScenario: defaultScenario, // REQUIRED
  strictMode: false,
});

scenarist.registerScenario(adminUserScenario);
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
type AdapterOptions = {
  enabled: boolean;                    // Whether mocking is enabled
  strictMode?: boolean;                 // Return 501 for unmocked requests (default: false)
  headers?: {
    testId?: string;                    // Header for test ID (default: 'x-test-id')
    mockEnabled?: string;               // Header to enable/disable mocking (default: 'x-mock-enabled')
  };
  defaultScenario: ScenarioDefinition;  // REQUIRED - fallback scenario (auto-registered)
  defaultTestId?: string;               // Default test ID (default: 'default-test')
  registry?: ScenarioRegistry;          // Custom registry (default: InMemoryScenarioRegistry)
  store?: ScenarioStore;                // Custom store (default: InMemoryScenarioStore)
};
```

**Returns:**
```typescript
type Scenarist = {
  config: ScenaristConfig;              // Resolved configuration (headers, etc.)
  createScenarioEndpoint: () => Handler; // Creates scenario endpoint handler
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

### Test ID Isolation

Each request can include an `x-test-id` header. Scenarist uses this to isolate scenarios, enabling concurrent tests with different backend states:

```typescript
// Test 1 uses scenario A
await fetch('http://localhost:3000/api/data', {
  headers: { 'x-test-id': 'test-1' },
}); // Uses scenario A

// Test 2 uses scenario B (runs concurrently!)
await fetch('http://localhost:3000/api/data', {
  headers: { 'x-test-id': 'test-2' },
}); // Uses scenario B
```

### Automatic MSW Integration

The `createScenarist()` function automatically:
1. Creates an MSW server with a dynamic handler
2. Wires test ID extraction from headers
3. Sets up scenario control endpoint handler (`/__scenario__`)
4. Looks up the active scenario for each test ID
5. Returns mocked responses based on the scenario

You never see MSW code - it's all handled internally.

### Default Scenario Fallback

If a mock isn't found in the active scenario, Scenarist falls back to the "default" scenario:

```typescript
// Default scenario with common responses
const defaultScenario: ScenarioDefinition = {
  id: 'default',
  name: 'Default Happy Path',
  mocks: [
    { method: 'GET', url: '*/api/users', response: { status: 200, body: [] } },
    { method: 'GET', url: '*/api/orders', response: { status: 200, body: [] } },
  ],
};

// Test scenario only overrides specific endpoints
const userErrorScenario: ScenarioDefinition = {
  id: 'user-error',
  name: 'User API Error',
  mocks: [
    { method: 'GET', url: '*/api/users', response: { status: 500, body: { error: 'Server error' } } },
    // Orders endpoint falls back to default scenario
  ],
};
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
  default: defaultScenario,
  success: successScenario,
  error: errorScenario,
  timeout: timeoutScenario,
} as const;

// scenarist.ts
import { scenarios } from './scenarios';

scenarist.registerScenarios(Object.values(scenarios));
```

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

// tests.ts - type-safe access with autocomplete
import { scenarios } from './scenarios';

await fetch('http://localhost:3000/__scenario__', {
  method: 'POST',
  headers: { 'x-test-id': 'test-1', 'content-type': 'application/json' },
  body: JSON.stringify({ scenario: scenarios.success.id }), // ✅ Autocomplete works!
});
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
    const response = await makeRequest(testId, '/api/charge', { method: 'POST' });
    expect(response.status).toBe(200);
  });
});
```

### Pattern 3: Development Workflows

Enable scenario switching during development:

```typescript
// lib/scenarist.ts
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  defaultScenario: myDefaultScenario,
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
  defaultScenario: myDefaultScenario,
  strictMode: true, // Fail if any unmocked request
});

// Development and test
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
  defaultScenario: myDefaultScenario,
  strictMode: false, // Allow passthrough to real APIs
});

// Opt-in with environment variable
const scenarist = createScenarist({
  enabled: process.env.ENABLE_MOCKING === 'true',
  defaultScenario: myDefaultScenario,
  strictMode: false,
});
```

### Custom Headers

```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: myDefaultScenario,
  headers: {
    testId: 'x-my-test-id',
    mockEnabled: 'x-my-mock-flag',
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

**Solution:** Ensure you've registered the scenario before using it:

```typescript
scenarist.registerScenario(myScenario);  // Register first

await setScenario('test-1', 'my-scenario');  // Then use
```

### TypeScript errors with Next.js types

**Problem:** Type errors with Next.js request/response types.

**Solution:** Ensure your `next` peer dependency version matches the adapter's supported versions (^14.0.0 || ^15.0.0).

## Pages Router vs App Router

| Feature | Pages Router | App Router |
|---------|-------------|------------|
| **Import** | `@scenarist/nextjs-adapter/pages` | `@scenarist/nextjs-adapter/app` |
| **API Route File** | `pages/api/__scenario__.ts` | `app/api/__scenario__/route.ts` |
| **Handler Export** | `export default scenarist.createScenarioEndpoint()` | `const handler = scenarist.createScenarioEndpoint();`<br>`export const POST = handler;`<br>`export const GET = handler;` |
| **Request Type** | `NextApiRequest` (Node.js) | `Request` (Web Standard) |
| **Response Type** | `NextApiResponse` (Node.js) | `Response` (Web Standard) |
| **Core Functionality** | ✅ Identical | ✅ Identical |

Both routers provide the exact same Scenarist functionality—only the Next.js integration differs.

## TypeScript

This package is written in TypeScript and includes full type definitions.

**Exported Types:**
```typescript
// Pages Router
import type {
  PagesAdapterOptions,
  PagesScenarist,
  PagesRequestContext,
} from '@scenarist/nextjs-adapter/pages';

// App Router
import type {
  AppAdapterOptions,
  AppScenarist,
  AppRequestContext,
} from '@scenarist/nextjs-adapter/app';

// Core types (same for both)
import type {
  ScenarioDefinition,
  MockDefinition,
  ScenaristConfig,
} from '@scenarist/core';
```

## Advanced Usage

For advanced scenarios, you can access low-level components:

```typescript
// Pages Router
import {
  PagesRequestContext,
  createScenarioEndpoint,
} from '@scenarist/nextjs-adapter/pages';

// App Router
import {
  AppRequestContext,
  createScenarioEndpoint,
} from '@scenarist/nextjs-adapter/app';
```

Most users should use the `createScenarist()` convenience function, which handles all wiring automatically.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management
- **[@scenarist/express-adapter](../express-adapter)** - Express.js adapter
- **[@scenarist/msw-adapter](../msw-adapter)** - MSW integration (used internally)

**Note:** The MSW adapter is used internally by this package. Users of `@scenarist/nextjs-adapter` don't need to interact with it directly.
