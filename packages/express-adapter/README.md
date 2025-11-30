# @scenarist/express-adapter

[![npm version](https://img.shields.io/npm/v/@scenarist/express-adapter.svg)](https://www.npmjs.com/package/@scenarist/express-adapter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Express.js adapter for [Scenarist](https://scenarist.io) - manage MSW mock scenarios in your Express applications for testing **and** development.

## 📖 Documentation

**→ [Express Getting Started Guide](https://scenarist.io/frameworks/express/getting-started)** — Full setup instructions and examples

| Topic                 | Link                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Why Scenarist?**    | [scenarist.io/getting-started/why-scenarist](https://scenarist.io/getting-started/why-scenarist) |
| **Tool Comparison**   | [scenarist.io/comparison](https://scenarist.io/comparison)                                       |
| **Parallel Testing**  | [scenarist.io/testing/parallel-testing](https://scenarist.io/testing/parallel-testing)           |
| **Dynamic Responses** | [scenarist.io/concepts/dynamic-responses](https://scenarist.io/concepts/dynamic-responses)       |

## What is Scenarist?

**Scenarist** enables concurrent tests to run with different backend states by switching mock scenarios at runtime via test IDs. Your real application code executes while external API responses are controlled by scenarios. No application restarts needed, no complex per-test mocking, just simple scenario switching.

**Before Scenarist:**

```typescript
// Every test has fragile per-test mocking
beforeEach(() => {
  server.use(http.get("/api/user", () => HttpResponse.json({ role: "admin" })));
});
// Repeat 100 times across test files, hope they don't conflict
```

**With Scenarist:**

```typescript
// Define scenario once
const adminScenario = {
  id: "admin",
  mocks: [
    /* complete backend state */
  ],
};

// Use in any test with one line
await setScenario("test-1", "admin");
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
- **Test isolation** using unique test IDs (`x-scenarist-test-id` header)
- **Automatic MSW integration** for request interception
- **AsyncLocalStorage** for automatic test ID propagation
- **Zero boilerplate** - everything wired automatically

## Installation

```bash
# npm
npm install --save-dev @scenarist/express-adapter msw

# pnpm
pnpm add -D @scenarist/express-adapter msw

# yarn
yarn add -D @scenarist/express-adapter msw
```

**Note:** All Scenarist types (`ScenaristScenario`, `ScenaristMock`, etc.) are re-exported from `@scenarist/express-adapter` for convenience. You don't need to install `@scenarist/core` or `@scenarist/msw-adapter` separately - they're already included as dependencies.

**Peer Dependencies:**

- `express` ^4.18.0 || ^5.0.0
- `msw` ^2.0.0

## 📖 Documentation

**Full documentation at [scenarist.io](https://scenarist.io)**

| Topic                         | Link                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Why Scenarist?**            | [scenarist.io/getting-started/why-scenarist](https://scenarist.io/getting-started/why-scenarist)           |
| **Getting Started (Express)** | [scenarist.io/frameworks/express/getting-started](https://scenarist.io/frameworks/express/getting-started) |
| **Tool Comparison**           | [scenarist.io/comparison](https://scenarist.io/comparison)                                                 |
| **Parallel Testing**          | [scenarist.io/testing/parallel-testing](https://scenarist.io/testing/parallel-testing)                     |
| **Testing Philosophy**        | [scenarist.io/concepts/philosophy](https://scenarist.io/concepts/philosophy)                               |
| **Architecture**              | [scenarist.io/concepts/architecture](https://scenarist.io/concepts/architecture)                           |

## Quick Start

### 1. Define Scenarios

```typescript
// test/scenarios.ts
import type {
  ScenaristScenario,
  ScenaristScenarios,
} from "@scenarist/express-adapter";

const defaultScenario: ScenaristScenario = {
  id: "default",
  name: "Default Scenario",
  description: "Baseline responses for all APIs",
  mocks: [
    {
      method: "GET",
      url: "https://api.example.com/user",
      response: {
        status: 200,
        body: {
          id: "000",
          name: "Default User",
          role: "user",
        },
      },
    },
  ],
};

const adminUserScenario: ScenaristScenario = {
  id: "admin-user",
  name: "Admin User",
  description: "User with admin privileges",
  mocks: [
    {
      method: "GET",
      url: "https://api.example.com/user",
      response: {
        status: 200,
        body: {
          id: "123",
          name: "Admin User",
          role: "admin",
        },
      },
    },
  ],
};

// Export as typed scenarios object for type safety
export const scenarios = {
  default: defaultScenario,
  adminUser: adminUserScenario,
} as const satisfies ScenaristScenarios;
```

### 2. Create Scenarist Instance

```typescript
// test/setup.ts
import { createScenarist } from "@scenarist/express-adapter";
import { scenarios } from "./scenarios";

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios, // All scenarios registered upfront
  strictMode: false,
});
```

### 3. Add to Express App

```typescript
// src/app.ts
import express from "express";
import { scenarist } from "../test/setup";

const app = express();
app.use(express.json());

// Add Scenarist middleware (includes everything)
if (process.env.NODE_ENV === "test") {
  app.use(scenarist.middleware);
}

// Your application routes
app.get("/api/user", async (req, res) => {
  const response = await fetch("https://api.example.com/user");
  const user = await response.json();
  res.json(user);
});

export { app };
```

### 4. Use in Tests

```typescript
// test/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { scenarist } from "./setup";

describe("User API", () => {
  beforeAll(() => scenarist.start());
  afterAll(() => scenarist.stop());

  it("should return admin user", async () => {
    // Set scenario for this test
    await request(app)
      .post("/__scenario__")
      .set("x-scenarist-test-id", "admin-test")
      .send({ scenario: "admin-user" });

    // Make request - MSW intercepts automatically
    const response = await request(app)
      .get("/api/user")
      .set("x-scenarist-test-id", "admin-test");

    expect(response.status).toBe(200);
    expect(response.body.role).toBe("admin");
  });
});
```

## API Reference

### `createScenarist(options)`

Creates a Scenarist instance with everything wired automatically.

**Parameters:**

```typescript
type ExpressAdapterOptions<T extends ScenaristScenarios> = {
  enabled: boolean; // Whether mocking is enabled
  scenarios: T; // REQUIRED - scenarios object
  strictMode?: boolean; // Return 501 for unmocked requests (default: false)
  headers?: {
    testId?: string; // Header for test ID (default: 'x-scenarist-test-id')
  };
  endpoints?: {
    setScenario?: string; // POST endpoint (default: '/__scenario__')
    getScenario?: string; // GET endpoint (default: '/__scenario__')
  };
  defaultTestId?: string; // Default test ID (default: 'default-test')
  registry?: ScenarioRegistry; // Custom registry (default: InMemoryScenarioRegistry)
  store?: ScenarioStore; // Custom store (default: InMemoryScenarioStore)
};
```

**Returns:**

```typescript
type ExpressScenarist<T extends ScenaristScenarios> = {
  config: ScenaristConfig; // Resolved configuration (endpoints, headers, etc.)
  middleware: Router; // Express middleware (includes test ID extraction + scenario endpoints)
  switchScenario: (
    testId: string,
    scenarioId: keyof T,
    variant?: string,
  ) => ScenaristResult<void, Error>;
  getActiveScenario: (testId: string) => ActiveScenario | undefined;
  getScenarioById: (scenarioId: string) => ScenaristScenario | undefined;
  listScenarios: () => ReadonlyArray<ScenaristScenario>;
  clearScenario: (testId: string) => void;
  start: () => void; // Start MSW server
  stop: () => Promise<void>; // Stop MSW server
};
```

**Example:**

```typescript
const scenarios = {
  default: defaultScenario,
  success: successScenario,
  error: errorScenario,
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios,
  strictMode: false,
});

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
  .post("/__scenario__")
  .set("x-scenarist-test-id", "test-123")
  .send({ scenario: "user-logged-in" });
```

#### `GET /__scenario__` - Get Active Scenario

**Response (200):**

```typescript
{
  testId: string;
  scenarioId: string;
  scenarioName?: string;
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
  .get("/__scenario__")
  .set("x-scenarist-test-id", "test-123");

expect(response.status).toBe(200);
expect(response.body.scenarioId).toBe("success");

// Before setting a scenario
const response2 = await request(app)
  .get("/__scenario__")
  .set("x-scenarist-test-id", "new-test");

expect(response2.status).toBe(404);
expect(response2.body.error).toBe("No active scenario for this test ID");
```

## Core Capabilities

Scenarist provides 20+ powerful features for scenario-based testing. All capabilities work seamlessly with Express via automatic test ID propagation.

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

Each request can include an `x-scenarist-test-id` header. Scenarist uses this to isolate scenarios, enabling concurrent tests with different backend states:

```typescript
// Test 1 uses scenario A
await request(app).get("/api/data").set("x-scenarist-test-id", "test-1"); // Uses scenario A

// Test 2 uses scenario B (runs concurrently!)
await request(app).get("/api/data").set("x-scenarist-test-id", "test-2"); // Uses scenario B
```

### Automatic Test ID Propagation

**Express advantage:** Unlike frameworks without middleware (like Next.js), Express uses **AsyncLocalStorage** to automatically propagate test IDs throughout the request lifecycle.

**What this means:**

- Middleware extracts test ID from `x-scenarist-test-id` header **once**
- Test ID stored in AsyncLocalStorage for the request duration
- MSW handlers automatically access test ID from AsyncLocalStorage
- **No manual header forwarding needed** when making external API calls

**Example - No manual forwarding:**

```typescript
// routes/products.ts
app.get("/api/products", async (req, res) => {
  // Test ID automatically available to MSW via AsyncLocalStorage
  // No need to manually forward headers!
  const response = await fetch("http://external-api.com/products");
  const products = await response.json();
  res.json(products);
});
```

**Compare to Next.js** (which requires manual forwarding):

```typescript
// Next.js - MUST manually forward headers
const response = await fetch("http://external-api.com/products", {
  headers: {
    ...getScenaristHeaders(req), // Required!
  },
});
```

**Express - NO manual forwarding needed** (AsyncLocalStorage handles it):

```typescript
// Express - AsyncLocalStorage propagates automatically
const response = await fetch("http://external-api.com/products");
// MSW handlers receive test ID from AsyncLocalStorage
```

**Why this works:**

- Express middleware runs before all routes
- Middleware extracts `x-scenarist-test-id` and stores in AsyncLocalStorage
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

- Test ID extraction from `x-scenarist-test-id` header (stored in AsyncLocalStorage)
- Scenario control endpoints (`/__scenario__`)
- All wired together - just add `app.use(scenarist.middleware)`

You never see MSW code - it's all handled internally.

### Default Scenario Fallback

If a mock isn't found in the active scenario, Scenarist automatically falls back to the `'default'` scenario (enforced via schema validation):

```typescript
const scenarios = {
  default: {
    // REQUIRED - must have 'default' key
    id: "default",
    name: "Default Happy Path",
    description: "Base responses for all APIs",
    mocks: [
      {
        method: "GET",
        url: "*/api/users",
        response: { status: 200, body: [] },
      },
      {
        method: "GET",
        url: "*/api/orders",
        response: { status: 200, body: [] },
      },
    ],
  },
  userError: {
    id: "user-error",
    name: "User API Error",
    mocks: [
      {
        method: "GET",
        url: "*/api/users",
        response: { status: 500, body: { error: "Server error" } },
      },
      // Orders endpoint falls back to default scenario
    ],
  },
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios, // 'default' key is validated at runtime
});
```

## Type-Safe Scenario IDs

The new API provides full type safety with TypeScript autocomplete for scenario IDs:

```typescript
// scenarios.ts - define scenarios with type constraint
import type { ScenaristScenarios } from "@scenarist/express-adapter";

export const scenarios = {
  default: defaultScenario,
  success: successScenario,
  githubNotFound: githubNotFoundScenario,
  weatherError: weatherErrorScenario,
  stripeFailure: stripeFailureScenario,
} as const satisfies ScenaristScenarios;

// setup.ts - create scenarist with type parameter
import { scenarios } from "./scenarios";

export const scenarist = createScenarist({
  enabled: true,
  scenarios, // ✅ Autocomplete + type-checked!
});

// test.ts - type-safe scenario switching
scenarist.switchScenario("test-123", "success"); // ✅ Autocomplete works!
scenarist.switchScenario("test-123", "invalid-name"); // ❌ TypeScript error!

await request(app)
  .post(scenarist.config.endpoints.setScenario)
  .set(SCENARIST_TEST_ID_HEADER, "test-123")
  .send({ scenario: "success" }); // ✅ Type-safe!
```

**Benefits:**

- ✅ Autocomplete for scenario IDs in your editor
- ✅ Refactor-safe (rename propagates everywhere)
- ✅ Compile-time errors for typos
- ✅ Single source of truth

## Common Patterns

### Pattern 1: Test Helpers

Create helper functions to reduce boilerplate:

```typescript
// test/helpers.ts
import request from "supertest";
import { app } from "../src/app";

export const setScenario = async (
  testId: string,
  scenario: string,
  variant?: string,
) => {
  await request(app)
    .post("/__scenario__")
    .set("x-scenarist-test-id", testId)
    .send({ scenario, variant });
};

export const makeRequest = (testId: string) => {
  return request(app).set("x-scenarist-test-id", testId);
};
```

**Usage:**

```typescript
import { setScenario, makeRequest } from "./helpers";

test("payment flow", async () => {
  const testId = "payment-test";
  await setScenario(testId, "payment-success");

  const response = await makeRequest(testId).post("/api/charge");
  expect(response.status).toBe(200);
});
```

### Pattern 2: Unique Test IDs

Generate unique test IDs automatically:

```typescript
import { randomUUID } from "crypto";

describe("API Tests", () => {
  let testId: string;

  beforeEach(() => {
    testId = randomUUID();
  });

  it("should process payment", async () => {
    await setScenario(testId, "payment-success");
    const response = await makeRequest(testId).post("/api/charge");
    expect(response.status).toBe(200);
  });
});
```

### Pattern 3: Development Workflows

Enable scenario switching during development:

```typescript
const scenarist = createScenarist({
  enabled:
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  scenarios,
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
  enabled: process.env.NODE_ENV === "test",
  scenarios,
  strictMode: true, // Fail if any unmocked request
});

// Development and test
const scenarist = createScenarist({
  enabled:
    process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development",
  scenarios,
  strictMode: false, // Allow passthrough to real APIs
});

// Opt-in with environment variable
const scenarist = createScenarist({
  enabled: process.env.ENABLE_MOCKING === "true",
  scenarios,
  strictMode: false,
});
```

### Custom Headers and Endpoints

```typescript
const scenarist = createScenarist({
  enabled: true,
  scenarios,
  headers: {
    testId: "x-my-test-id",
  },
  endpoints: {
    setScenario: "/api/scenarios/set",
    getScenario: "/api/scenarios/active",
  },
});
```

## Production Tree-Shaking

Scenarist is designed to be **completely eliminated from production bundles** when `NODE_ENV=production`. The implementation automatically disables itself and returns `undefined`, allowing bundlers to remove all Scenarist and MSW code through tree-shaking.

### Unbundled Deployments (Most Express Apps) ✅

**For most Express applications** that deploy unbundled code directly to production (the standard pattern), tree-shaking works **automatically with zero configuration**:

```bash
# Deploy your application
NODE_ENV=production node src/server.js
```

**How it works:**

1. `process.env.NODE_ENV === 'production'` evaluates to `true` at runtime
2. `createScenarist()` returns `undefined` without loading dependencies
3. MSW and all Scenarist code **never loads into memory**
4. Zero performance impact, zero bundle bloat

**This is the default use case** - most Express applications don't bundle their server code.

### Bundled Deployments (esbuild, webpack, Vite, rollup)

**For teams that bundle their Express server code**, additional bundler configuration is required to enable complete tree-shaking.

**Why configuration is needed:**

Scenarist uses **conditional package.json exports** to provide a production-specific entry point with zero dependencies:

```json
{
  "exports": {
    ".": {
      "production": "./dist/setup/production.js", // Zero imports
      "default": "./dist/index.js" // Full implementation
    }
  }
}
```

The `"production"` condition is a **custom condition** (not a Node.js built-in like `"import"` or `"require"`). Bundlers must be explicitly configured to recognize it.

**Without configuration:**

- MSW code included in bundle (~320kb)
- Code never executes (safe)
- Wastes bandwidth

**With configuration:**

- MSW code completely eliminated
- Bundle size reduced by ~52% (618kb → 298kb)
- Optimal production deployment

### Bundler Configuration

#### esbuild

Add the `--conditions=production` flag:

```json
{
  "scripts": {
    "build": "esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --define:process.env.NODE_ENV='\"production\"' --conditions=production"
  }
}
```

#### webpack

Add `conditionNames` to resolve configuration:

```javascript
// webpack.config.js
module.exports = {
  mode: "production",
  resolve: {
    conditionNames: ["production", "import", "require"],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
  ],
};
```

#### Vite

Add `conditions` to resolve configuration:

```javascript
// vite.config.js
export default {
  resolve: {
    conditions: ["production"],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
};
```

#### rollup

Add `exportConditions` to node-resolve plugin:

```javascript
// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

export default {
  plugins: [
    resolve({
      exportConditions: ["production"],
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
  ],
};
```

### Verifying Tree-Shaking

The Express example app includes a verification script you can adapt:

```json
{
  "scripts": {
    "build:production": "esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --external:express --define:process.env.NODE_ENV='\"production\"' --minify --conditions=production",
    "verify:treeshaking": "pnpm build:production && ! grep -rE '(setupWorker|startWorker|http\\.(get|post|put|delete|patch)|HttpResponse\\.json)' dist/"
  },
  "devDependencies": {
    "esbuild": "^0.27.0"
  }
}
```

**Run verification:**

```bash
pnpm verify:treeshaking
```

**Success output:**

```
dist/server.js  298.4kb

✨ Done in 13ms
```

The script checks that MSW-specific implementation patterns (`setupWorker`, `HttpResponse.json`, etc.) are **not present** in the production bundle.

### Bundle Size Comparison

**Without tree-shaking configuration:**

- Bundle size: ~618kb
- Includes: Application + Zod + MSW + Scenarist
- Status: Code included but never executes

**With tree-shaking configuration:**

- Bundle size: ~298kb (52% reduction)
- Includes: Application + Zod only
- Status: MSW and Scenarist completely eliminated

### Trade-Offs

| Deployment Type                  | Configuration Required | Tree-Shaking | Bundle Impact              |
| -------------------------------- | ---------------------- | ------------ | -------------------------- |
| **Unbundled** (standard Express) | ✅ None                | ✅ Automatic | ✅ Zero (code never loads) |
| **Bundled** without config       | ❌ None                | ❌ Partial   | ⚠️ ~320kb dead code        |
| **Bundled** with config          | ✅ One line            | ✅ Complete  | ✅ Zero (eliminated)       |

**Recommendation:**

- If you're deploying unbundled code: No action needed ✅
- If you're bundling: Add the one-line bundler configuration for optimal bundle size

## Troubleshooting

### Scenarios switch but requests aren't mocked

**Problem:** Scenario endpoints work but external API calls go to real endpoints.

**Solution:** Ensure you've called `scenarist.start()` before tests and `scenarist.stop()` after:

```typescript
beforeAll(() => scenarist.start()); // Starts MSW server
afterAll(() => scenarist.stop()); // Stops MSW server
```

### Tests see each other's scenarios

**Problem:** Different tests are seeing each other's active scenarios.

**Solution:** Ensure you're sending the `x-scenarist-test-id` header with **every** request:

```typescript
// ❌ Wrong - missing header on second request
await setScenario("test-1", "my-scenario");
const response = await request(app).get("/api/data"); // No test ID!

// ✅ Correct - header on all requests
await setScenario("test-1", "my-scenario");
const response = await request(app)
  .get("/api/data")
  .set("x-scenarist-test-id", "test-1");
```

### Scenario not found error

**Problem:** `Scenario not found` when setting scenario.

**Solution:** Ensure the scenario ID exists in your scenarios object:

```typescript
const scenarios = {
  default: defaultScenario,
  myScenario: myScenario, // ✅ Registered
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

await setScenario("test-1", "myScenario"); // ✅ Works
await setScenario("test-1", "unknown"); // ❌ Error: Scenario not found
```

## TypeScript

This package is written in TypeScript and includes full type definitions.

**Exported Types:**

```typescript
// Adapter-specific types
import type {
  ExpressAdapterOptions,
  ExpressScenarist,
} from "@scenarist/express-adapter";

// Core types (re-exported for convenience)
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
} from "@scenarist/express-adapter";
```

**Note:** All core types are re-exported from `@scenarist/express-adapter`, so you only need one import path for all Scenarist types.

## Examples

See the [**Express Example App**](../../apps/express-example) for a complete working example demonstrating:

- ✅ **Runtime scenario switching** - Change API behavior without restart
- ✅ **Test ID isolation** - 20 tests with concurrent scenarios
- ✅ **Default fallback** - Partial scenarios automatically falling back
- ✅ **Real API integration** - Actual Express routes calling external APIs
- ✅ **Multiple scenarios** - Success, errors, timeouts, mixed results

The example includes:

- Complete Express application with GitHub, Weather, and Stripe API integrations
- 7 different scenario definitions
- 20 passing scenario-based tests demonstrating all features
- Comprehensive documentation and usage patterns

## Documentation

📖 **[Full Documentation](https://scenarist.io)** - Complete guides, API reference, and examples.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management
- **[@scenarist/msw-adapter](../msw-adapter)** - MSW integration (used internally)

**Note:** The MSW adapter is used internally by this package. Users of `@scenarist/express-adapter` don't need to interact with it directly.
