# Scenarist 🎭

**Scenario-Based Testing for Modern Web Applications. Switch Backend States Instantly. Run Tests in Parallel.**

Test your Next.js Server Components, Express routes, and API handlers with controlled external API responses. No app restarts. No test conflicts. Built on MSW with runtime scenario management and test ID isolation.

Express and Next.js adapters available—your real application code runs, only external HTTP calls are mocked.

## What is Scenario-Based Testing?

**Scenario-based testing** is an integration testing approach where your real application code executes while external dependencies (third-party APIs, microservices) return controlled responses. Unlike true end-to-end tests that use zero mocks, scenario-based tests mock only the external services you don't control.

**The key distinction:**

| Testing Approach         | Your Code | External APIs | Best For                                          |
| ------------------------ | --------- | ------------- | ------------------------------------------------- |
| **Unit Tests**           | Mocked    | Mocked        | Isolated function logic                           |
| **Scenario-Based Tests** | Real      | Mocked        | Application behavior with controlled dependencies |
| **End-to-End Tests**     | Real      | Real          | Full system validation (production-like)          |

**Why "scenario-based"?** Because you define complete backend _scenarios_ (success, error, timeout, user tiers) and switch between them at runtime. Each test selects a scenario that describes the complete external API state, enabling comprehensive testing without external dependencies.

[![CI](https://img.shields.io/github/actions/workflow/status/citypaul/scenarist/ci.yml?branch=main&label=CI)](https://github.com/citypaul/scenarist/actions)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/citypaul/scenarist/badge)](https://securityscorecards.dev/viewer/?uri=github.com/citypaul/scenarist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docs](https://img.shields.io/badge/docs-scenarist.io-6366f1)](https://scenarist.io)

[![npm @scenarist/express-adapter](https://img.shields.io/npm/v/@scenarist/express-adapter.svg?label=@scenarist/express-adapter)](https://www.npmjs.com/package/@scenarist/express-adapter)
[![npm @scenarist/nextjs-adapter](https://img.shields.io/npm/v/@scenarist/nextjs-adapter.svg?label=@scenarist/nextjs-adapter)](https://www.npmjs.com/package/@scenarist/nextjs-adapter)
[![npm @scenarist/playwright-helpers](https://img.shields.io/npm/v/@scenarist/playwright-helpers.svg?label=@scenarist/playwright-helpers)](https://www.npmjs.com/package/@scenarist/playwright-helpers)

---

## 📖 Documentation

**Full documentation at [scenarist.io](https://scenarist.io)**

| Topic                       | Link                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Why Scenarist?**          | [scenarist.io/getting-started/why-scenarist](https://scenarist.io/getting-started/why-scenarist)                               |
| **Quick Start**             | [scenarist.io/getting-started/quick-start](https://scenarist.io/getting-started/quick-start)                                   |
| **Tool Comparison**         | [scenarist.io/comparison](https://scenarist.io/comparison)                                                                     |
| **Testing Philosophy**      | [scenarist.io/concepts/philosophy](https://scenarist.io/concepts/philosophy)                                                   |
| **Architecture**            | [scenarist.io/concepts/architecture](https://scenarist.io/concepts/architecture)                                               |
| **Express Guide**           | [scenarist.io/frameworks/express/getting-started](https://scenarist.io/frameworks/express/getting-started)                     |
| **Next.js App Router**      | [scenarist.io/frameworks/nextjs-app-router/getting-started](https://scenarist.io/frameworks/nextjs-app-router/getting-started) |
| **React Server Components** | [scenarist.io/frameworks/nextjs-app-router/rsc-guide](https://scenarist.io/frameworks/nextjs-app-router/rsc-guide)             |
| **Parallel Testing**        | [scenarist.io/testing/parallel-testing](https://scenarist.io/testing/parallel-testing)                                         |
| **Writing Scenarios**       | [scenarist.io/scenarios/basic-structure](https://scenarist.io/scenarios/basic-structure)                                       |
| **State-Aware Mocking**     | [scenarist.io/scenarios/state-aware-mocking](https://scenarist.io/scenarios/state-aware-mocking)                               |

---

## Test Your Real Application with Mocked External APIs

Scenarist lets you write **scenario-based tests** where **your actual application code executes**—Express routes, Next.js Server Components, API handlers, middleware, business logic—all of it runs for real. Only external HTTP calls to third-party services (Stripe, Auth0, SendGrid, AWS) are mocked.

### Why This Matters

Testing full-stack applications is hard:

- **End-to-end tests with real APIs** → Brittle, slow, expensive, hard to test edge cases
- **Traditional mocking** → Requires app restarts, tests conflict, framework lock-in
- **MSW alone** → No scenario management, manual setup per test

**Scenarist gives you scenario-based testing where your real code runs:**

✅ **Your application code executes** - Express routes, Next.js Server Components, middleware, business logic—all run for real
✅ **External APIs return what you need** - Control Stripe, Auth0, SendGrid responses per test scenario
✅ **Switch scenarios instantly** - Test success, errors, edge cases without restarting your app
✅ **Tests run in parallel** - Each test gets its own isolated scenario via unique test IDs
✅ **Express and Next.js adapters** - Works with Server Components, API routes, and traditional backends

### Framework Support

**Available Adapters:**

- **Express** - Full adapter with routes, middleware, error handlers
- **Next.js** - Full adapter for App Router + Pages Router, Server Components, Server Actions, API Routes

### Real Application, Real Tests

**Example 1: Express API**

```typescript
// Your actual Express route runs
app.post("/api/checkout", async (req, res) => {
  const { items, userId, tier } = req.body;

  // ✅ Your business logic ACTUALLY EXECUTES
  const total = calculateTotal(items, tier);
  const discount = tier === "premium" ? 0.2 : 0;

  // ✅ This external API call is mocked by Scenarist
  const payment = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}` },
    body: JSON.stringify({ amount: total * (1 - discount) }),
  });

  const result = await payment.json();
  res.json({ success: result.status === "succeeded" });
});
```

**Example 2: Next.js Server Component**

```typescript
// Your actual Next.js Server Component runs
export default async function CheckoutPage({ params }) {
  // ✅ Your rendering logic ACTUALLY EXECUTES

  // ✅ This external API call is mocked by Scenarist
  const userResponse = await fetch('https://api.auth0.com/userinfo', {
    headers: { 'Authorization': `Bearer ${cookies().get('token')}` },
  });
  const user = await userResponse.json();

  // ✅ This external API call is also mocked
  const productsResponse = await fetch('https://api.stripe.com/v1/products');
  const products = await productsResponse.json();

  return <CheckoutForm user={user} products={products} />;
}
```

**With Scenarist:**

- Your business logic executes (`calculateTotal`, validation, etc.)
- Your routing and middleware run
- Your Server Components render on the server
- Only **external HTTP API calls** (Stripe, Auth0, SendGrid) are mocked

**You're testing the actual application behavior**, not a fake simulation.

---

## The Problem

You want to thoroughly test your full-stack application, but you face impossible tradeoffs:

### The Pain Points

#### 1. **Scenario Switching Requires App Restarts**

```typescript
// ❌ Traditional approach - restart app for each scenario
test("payment succeeds", async ({ page }) => {
  // Start app with success mocks
  await startApp({ mocks: "success" });
  await page.goto("/payment");
  // Test happy path
  await stopApp();
});

test("payment fails", async ({ page }) => {
  // Restart app with error mocks
  await startApp({ mocks: "error" });
  await page.goto("/payment");
  // Test error handling
  await stopApp();
});
```

**Problems:**

- ⏰ Slow tests - restarting the server for each scenario
- 🐛 Flaky tests - startup timing issues
- 💸 Expensive CI - more compute time

#### 2. **Parallel Tests Conflict**

```typescript
// ❌ Tests running in parallel share the same mocks
test("user A sees success", async ({ page }) => {
  // Sets global mocks to "success"
  setGlobalMocks("success");
  await page.goto("/dashboard");
  // But test B might have changed the mocks!
});

test("user B sees error", async ({ page }) => {
  // Sets global mocks to "error"
  setGlobalMocks("error");
  // Now test A sees the error mocks too!
  await page.goto("/dashboard");
});
```

**Problems:**

- 🔀 Test isolation broken
- 🎲 Non-deterministic failures
- 🚫 Can't run tests in parallel

#### 3. **Framework Lock-In**

```typescript
// ❌ Your mocking logic is tightly coupled to Express
app.use((req, res, next) => {
  if (req.headers["mock-scenario"] === "error") {
    // Express-specific implementation
    // Can't reuse across different frameworks
  }
});
```

**Problems:**

- 🔒 Locked into one framework's request/response model
- 🔄 Code duplication across projects
- 📦 Can't extract to shared library

---

## The Solution: Scenario-Based Testing with Real Application Execution

**Scenarist** lets you test your real application—Express routes, Next.js Server Components, middleware, business logic—while controlling exactly what external APIs return.

**The key insight:** Your code runs for real. Only external HTTP calls (Stripe, Auth0, SendGrid) are mocked. Switch scenarios at runtime without restarting, and run hundreds of isolated tests in parallel.

**The Architecture:** Built on MSW (Mock Service Worker) and hexagonal design principles for framework independence and extensibility.

### Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Playwright Tests                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Test A      │  │  Test B      │  │  Test C      │              │
│  │  x-scenarist-test-id:  │  │  x-scenarist-test-id:  │  │  x-scenarist-test-id:  │              │
│  │    "A"       │  │    "B"       │  │    "C"       │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         ▼                  ▼                  ▼                       │
│  POST /__scenario__  POST /__scenario__  POST /__scenario__         │
│  { scenario: "success" }  { scenario: "error" }  { scenario: "timeout" }
└─────────────┬─────────────┬──────────────┬──────────────────────────┘
              │             │              │
              ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Scenarist Middleware                             │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Test ID Isolation                          │   │
│  │                                                               │   │
│  │  Map<test-id, scenario>                                      │   │
│  │  ├─ "A" → "success"  ──► Apply success mocks for Test A     │   │
│  │  ├─ "B" → "error"    ──► Apply error mocks for Test B       │   │
│  │  └─ "C" → "timeout"  ──► Apply timeout mocks for Test C     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 MSW Server Integration                       │   │
│  │                                                               │   │
│  │  server.use(...scenario.mocks) // Applied per test ID       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
                                                                    ▼
                                                            Your Application
                                                          (Express, Next.js)
```

### How It Works

```typescript
// ✅ With Scenarist - switch scenarios at runtime!
test("payment succeeds", async ({ page }) => {
  // Switch to success scenario - no restart needed!
  await page.request.post("http://localhost:3000/__scenario__", {
    headers: { "x-scenarist-test-id": "test-1" },
    data: { scenario: "payment-success" },
  });

  await page.goto("/payment");
  await expect(page.locator(".success-message")).toBeVisible();
});

test("payment fails", async ({ page }) => {
  // Switch to error scenario - runs in parallel with test above!
  await page.request.post("http://localhost:3000/__scenario__", {
    headers: { "x-scenarist-test-id": "test-2" },
    data: { scenario: "payment-error" },
  });

  await page.goto("/payment");
  await expect(page.locator(".error-message")).toBeVisible();
});

// Both tests run in parallel, each with their own isolated mocks! 🎉
```

---

## Key Features

### 🚀 Real Application Code Executes

Your complete application stack executes—Server Components, API routes, middleware, business logic. Test the real user experience, not mocked simulations. Perfect for Next.js Server Components, Express routes, and any Node.js application that calls external HTTP APIs.

### 🎯 Test Isolation with Parallel Execution

Each test gets its own isolated scenario via unique test IDs. Run 100+ tests in parallel without conflicts. Test success paths, error states, and edge cases simultaneously.

### ⚡ Instant Scenario Switching (No Restarts)

Switch between mock scenarios instantly without restarting your application. No more slow restarts between scenarios.

### 🎭 Mock External APIs Only

Mock third-party services (Stripe, Auth0, SendGrid, AWS) while your application code runs normally. Keep test complexity low by only mocking what you don't control.

### 🏗️ Framework Agnostic Architecture

Built with hexagonal architecture (ports & adapters). First-class adapters for Express and Next.js, with the core scenario management working at the HTTP level via MSW. One library for your entire stack.

### 📦 Type-Safe with Full TypeScript Support

Strict TypeScript types for scenarios, configs, and APIs. Catch errors at compile-time. Excellent IntelliSense and autocomplete support.

### 🔧 Next.js Multi-Process Handling (Solved)

Next.js has a [well-documented singleton problem](https://github.com/vercel/next.js/discussions/68572) where modules get bundled multiple times, breaking the singleton pattern. This causes [MSW integration issues](https://github.com/mswjs/msw/issues/1644) with multiple conflicting server instances. Scenarist's Next.js adapter includes built-in singleton protection using `globalThis` guards—you get a single, stable MSW instance regardless of how Next.js loads your modules. No manual workarounds required.

### 🎨 Scenario Variants for Data-Driven Testing

Parameterize scenarios with variants. Test the same flow with different user tiers, payment methods, or feature flags without duplicating scenario definitions.

### 🔌 Built on MSW (Mock Service Worker)

Leverage the power of MSW's battle-tested HTTP interception. Scenarist adds runtime management, test isolation, and framework adapters on top of MSW's solid foundation.

### 🧠 Stateful Mocks for Multi-Step Flows

Capture state from requests and inject it into subsequent responses. Perfect for testing shopping carts, multi-step forms, user sessions, and any flow where responses depend on previous requests. State is isolated per test ID for parallel execution.

### 🎯 Declarative Scenario Definitions

Scenarios are **declarative patterns**—they describe WHAT responses to return, not HOW to decide. No imperative functions hiding if/else logic. This makes scenarios inspectable, composable, and easy to maintain. Your test intent is always visible.

---

## Architecture

Scenarist uses **Hexagonal Architecture** (Ports & Adapters) for maximum flexibility:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                      🎯 CORE (The Hexagon)                           │
│                   Pure Domain Logic - No Dependencies                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Types (Data Structures)                                     │   │
│  │  • Scenario                                                  │   │
│  │  • ScenarioVariant                                           │   │
│  │  • ActiveScenario                                            │   │
│  │  • ScenaristConfig                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Ports (Interfaces - Behavior Contracts)                     │   │
│  │  • interface ScenarioManager                                 │   │
│  │  • interface ScenarioStore                                   │   │
│  │  • interface RequestContext                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Domain (Implementations)                                    │   │
│  │  • createScenarioManager()                                   │   │
│  │  • buildConfig()                                             │   │
│  │  • createScenario()                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────┬───────────────────────┬──────────────────────┘
                        │                       │
                        │                       │
        ┌───────────────▼─────────┐   ┌────────▼──────────────┐
        │                          │   │                        │
        │  📦 ADAPTERS (PRIMARY)   │   │ 📦 ADAPTERS (SECONDARY)│
        │  Drive the application   │   │  Driven by core        │
        │                          │   │                        │
        │  • Express Middleware    │   │  • InMemoryStore       │
        │  • Next.js Adapter       │   │  • MSW Integration     │
        │  • Playwright Helpers    │   │                        │
        │                          │   │                        │
        └──────────────────────────┘   └────────────────────────┘
```

### Why Hexagonal?

**Technology Independence**

- ✅ Core logic has zero framework dependencies
- ✅ Add new framework adapters without changing core
- ✅ Test domain logic without HTTP frameworks

**Clear Boundaries**

- ✅ Ports define explicit contracts
- ✅ Adapters can be developed independently
- ✅ Easy to understand and navigate codebase

**Extensibility**

- ✅ Add new framework adapters without touching core
- ✅ Extend scenario capabilities in core, all adapters benefit
- ✅ Community can contribute adapters

**Testability**

- ✅ Test core logic in isolation
- ✅ Test adapters against port contracts
- ✅ No mocking needed for pure domain tests

---

## Quick Start

### Installation

Choose your framework adapter:

**Express:**

```bash
# npm
npm install @scenarist/express-adapter msw

# pnpm
pnpm add @scenarist/express-adapter msw

# yarn
yarn add @scenarist/express-adapter msw
```

**Next.js:**

```bash
# npm
npm install @scenarist/nextjs-adapter msw

# pnpm
pnpm add @scenarist/nextjs-adapter msw

# yarn
yarn add @scenarist/nextjs-adapter msw
```

**Playwright Helpers (for scenario-based browser tests):**

```bash
# npm
npm install -D @scenarist/playwright-helpers

# pnpm
pnpm add -D @scenarist/playwright-helpers

# yarn
yarn add -D @scenarist/playwright-helpers
```

### Basic Setup

**1. Create your scenarios**

Scenarios are defined as declarative patterns (not MSW handlers with imperative functions):

```typescript
// scenarios/default.ts
import type { ScenaristScenario } from "@scenarist/express-adapter";

export const defaultScenario: ScenaristScenario = {
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
          id: "123",
          name: "John Doe",
          email: "john@example.com",
        },
      },
    },
    {
      method: "POST",
      url: "https://api.example.com/payment",
      response: {
        status: 200,
        body: {
          success: true,
          transactionId: "txn_123",
        },
      },
    },
  ],
};
```

```typescript
// scenarios/error-state.ts
import type { ScenaristScenario } from "@scenarist/express-adapter";

export const errorState: ScenaristScenario = {
  id: "error-state",
  name: "Error State",
  description: "API calls fail with errors",
  mocks: [
    {
      method: "GET",
      url: "https://api.example.com/user",
      response: {
        status: 404,
        body: { error: "User not found" },
      },
    },
    {
      method: "POST",
      url: "https://api.example.com/payment",
      response: {
        status: 400,
        body: { error: "Payment failed" },
      },
    },
  ],
};
```

**2. Set up your Express server**

```typescript
// server.ts
import express from "express";
import { createScenarist } from "@scenarist/express-adapter";
import type { ScenaristScenarios } from "@scenarist/express-adapter";
import { defaultScenario, errorState } from "./scenarios";

const app = express();
app.use(express.json());

// Create scenarios object
const scenarios = {
  default: defaultScenario,
  errorState: errorState,
} as const satisfies ScenaristScenarios;

// Create Scenarist instance (wires everything automatically)
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios, // All scenarios registered upfront
  strictMode: false,
});

// Add Scenarist middleware
if (process.env.NODE_ENV === "test") {
  app.use(scenarist.middleware);
}

// Your application routes
app.get("/api/profile", async (req, res) => {
  // This calls external API - MSW intercepts based on active scenario
  const response = await fetch("https://api.example.com/user");
  const user = await response.json();
  res.json(user);
});

export { app, scenarist };

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(3000, () => console.log("Server running on port 3000"));
}
```

**3. Write tests**

```typescript
// tests/payment.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, scenarist } from "../server";

describe("Payment Flow", () => {
  beforeAll(() => scenarist.start());
  afterAll(() => scenarist.stop());

  it("should return user data from default scenario", async () => {
    const response = await request(app)
      .get("/api/profile")
      .set("x-scenarist-test-id", "test-default");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("John Doe");
  });

  it("should return error when using error scenario", async () => {
    // Switch to error scenario
    await request(app)
      .post("/__scenario__")
      .set("x-scenarist-test-id", "test-error")
      .send({ scenario: "error-state" });

    // Make request - gets error response
    const response = await request(app)
      .get("/api/profile")
      .set("x-scenarist-test-id", "test-error");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found");
  });
});

// Both tests run in parallel! 🚀
```

---

## Advanced Features

### Custom Configuration

```typescript
const scenarios = {
  default: myDefaultScenario,
  success: mySuccessScenario,
  error: myErrorScenario,
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios,
  strictMode: false,

  // Customize header names
  headers: {
    testId: "x-my-test-id",
  },

  // Customize endpoint paths
  endpoints: {
    setScenario: "/api/test/scenario",
    getScenario: "/api/test/scenario",
  },
});
```

### Scenario Variants

You can pass optional variant names when switching scenarios:

```typescript
await request(app)
  .post("/__scenario__")
  .set("x-scenarist-test-id", "test-123")
  .send({
    scenario: "user-scenario",
    variant: "premium-tier", // Optional variant
  });
```

### Checking Active Scenario

```typescript
const response = await request(app)
  .get("/__scenario__")
  .set("x-scenarist-test-id", "test-123");

console.log(response.body);
// {
//   testId: 'test-123',
//   scenarioId: 'user-scenario',
//   scenarioName: 'User Scenario'
// }
```

### Stateful Mocks

Capture state from requests and inject it into responses for multi-step flows:

```typescript
// Define a scenario with state capture and injection
const shoppingCartScenario: ScenaristScenario = {
  id: "shopping-cart",
  name: "Shopping Cart",
  mocks: [
    {
      method: "POST",
      url: "https://api.store.com/cart/add",
      captureState: {
        "items[]": "body.item", // Append to array
      },
      response: {
        status: 200,
        body: { success: true },
      },
    },
    {
      method: "GET",
      url: "https://api.store.com/cart",
      response: {
        status: 200,
        body: {
          items: "{{state.items}}", // Inject captured items
          count: "{{state.items.length}}", // Inject array length
        },
      },
    },
  ],
};

// Use in tests
test("shopping cart accumulates items", async () => {
  await request(app)
    .post("/__scenario__")
    .set("x-scenarist-test-id", "cart-1")
    .send({ scenario: "shopping-cart" });

  // Add items
  await request(app)
    .post("/api/cart/add")
    .set("x-scenarist-test-id", "cart-1")
    .send({ item: "Apple" });

  await request(app)
    .post("/api/cart/add")
    .set("x-scenarist-test-id", "cart-1")
    .send({ item: "Banana" });

  // Get cart - state is injected
  const response = await request(app)
    .get("/api/cart")
    .set("x-scenarist-test-id", "cart-1");

  expect(response.body.items).toEqual(["Apple", "Banana"]);
  expect(response.body.count).toBe(2);
});
```

For more advanced usage patterns, see the [Express Adapter README](./packages/express-adapter/README.md), [Stateful Mocks Guide](./docs/stateful-mocks.md), or the [Express Example App](./apps/express-example/).

---

## Framework Support

### Express ✅

```typescript
import { createScenarist } from "@scenarist/express-adapter";

const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

app.use(scenarist.middleware);
```

See the [Express Adapter Documentation](./packages/express-adapter/README.md) for complete usage.

### Next.js ✅

```typescript
// Pages Router
import { createScenarist } from "@scenarist/nextjs-adapter/pages";

// App Router
import { createScenarist } from "@scenarist/nextjs-adapter/app";

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios,
});
```

See the [Next.js Adapter Documentation](./packages/nextjs-adapter/README.md) for complete usage.

### Playwright Helpers ✅

```typescript
// tests/fixtures.ts
import { withScenarios, expect } from "@scenarist/playwright-helpers";
import { scenarios } from "../lib/scenarios";

export const test = withScenarios(scenarios);
export { expect };
```

```typescript
// tests/my-test.spec.ts
import { test, expect } from "./fixtures";

test("my test", async ({ page, switchScenario }) => {
  await switchScenario(page, "premium-user");
  await page.goto("/dashboard");
  // ...
});
```

See the [Playwright Helpers Documentation](./packages/playwright-helpers/README.md) for complete usage.

---

## Parallel Test Example

Each test switches to a different scenario without restarting the application. Tests run in parallel with isolated state.

```typescript
test.describe("User Dashboard", () => {
  test("shows basic features for standard users", async ({ page }) => {
    await switchScenario(page, "user-standard");
    await page.goto("/dashboard");
    await expect(page.locator(".basic-features")).toBeVisible();
  });

  test("shows advanced features for premium users", async ({ page }) => {
    await switchScenario(page, "user-premium");
    await page.goto("/dashboard");
    await expect(page.locator(".advanced-features")).toBeVisible();
  });

  test("shows upgrade prompt for free users", async ({ page }) => {
    await switchScenario(page, "user-free");
    await page.goto("/dashboard");
    await expect(page.locator(".upgrade-prompt")).toBeVisible();
  });

  test("handles API errors gracefully", async ({ page }) => {
    await switchScenario(page, "api-error");
    await page.goto("/dashboard");
    await expect(page.locator(".error-message")).toBeVisible();
  });

  test("handles slow API responses", async ({ page }) => {
    await switchScenario(page, "api-slow");
    await page.goto("/dashboard");
    await expect(page.locator(".loading-spinner")).toBeVisible();
  });

  test("shows empty state for new users", async ({ page }) => {
    await switchScenario(page, "user-new");
    await page.goto("/dashboard");
    await expect(page.locator(".empty-state")).toBeVisible();
  });
});

// Helper function
async function switchScenario(page: Page, scenario: string) {
  await page.request.post("http://localhost:3000/__scenario__", {
    headers: { "x-scenarist-test-id": test.info().testId },
    data: { scenario },
  });
}
```

**Key benefits:**

- 🔀 **Parallel execution** - tests run simultaneously without conflicts
- ✅ **Isolated state** - each test has its own scenario via test ID
- 🚫 **No restarts** - switch scenarios at runtime

---

## Benefits Summary

### For Node.js Developers

✅ **Test Real Application Behavior**

- Your Express/Next.js code actually runs—including Server Components
- Middleware, routing, business logic—all execute normally
- Only external HTTP APIs are mocked (Stripe, Auth0, etc.)
- Catch integration bugs where components interact

✅ **Fast Test Development**

- Switch scenarios instantly
- No app restarts between tests
- Test all edge cases without setup overhead

✅ **Better Developer Experience**

- Type-safe APIs with excellent IntelliSense
- Clear error messages when scenarios fail
- Works with existing Playwright/Cypress tests

✅ **Framework Flexibility**

- Learn once, use with Express and Next.js
- Extensible architecture for additional frameworks
- Future-proof your testing strategy

### For Engineering Teams

✅ **Faster CI/CD**

- Tests run in parallel without conflicts
- No server restarts between scenarios
- Efficient use of CI resources

✅ **Ship with Confidence**

- Test more scenarios = fewer production bugs
- Cover edge cases you couldn't test before
- Real integration testing, not just units

✅ **Maintainable Test Suites**

- Centralized scenario definitions
- Reusable across all test files
- Easy refactoring when APIs change

✅ **Onboard Faster**

- New developers understand tests quickly
- Clear separation: your code vs. external APIs
- Comprehensive examples and documentation

### For the Modern Web Ecosystem

✅ **Supports Modern Full-Stack Frameworks**

- Full support for Next.js App Router and Pages Router
- Works with tRPC, GraphQL, REST
- Full support for Express

✅ **Open Source & Extensible**

- MIT licensed—use anywhere
- Hexagonal architecture—build custom adapters
- Growing community of contributors

✅ **Production Ready**

- 90%+ test coverage
- Built with strict TDD
- Battle-tested architectural patterns

---

## Comparison: Integration Testing Approaches

| Feature                       | Traditional Mocking  | MSW Without Scenarist | Scenarist (MSW + Management) | E2E with Real APIs |
| ----------------------------- | -------------------- | --------------------- | ---------------------------- | ------------------ |
| **Your App Code Runs**        | ✅ Yes               | ✅ Yes                | ✅ Yes                       | ✅ Yes             |
| **External HTTP APIs Mocked** | ✅ Yes               | ✅ Yes                | ✅ Yes                       | ❌ Real            |
| **Test Express/Next.js**      | ✅ Yes               | ✅ Yes                | ✅ Yes                       | ✅ Yes             |
| **Server Components**         | ⚠️ Complex mocking   | ✅ Yes                | ✅ Yes                       | ✅ Yes             |
| **Scenario Switching**        | ⚠️ Restart required  | ⚠️ Restart required   | ✅ Runtime                   | Manual setup       |
| **Parallel Test Isolation**   | ❌ Conflicts         | ❌ Conflicts          | ✅ Test ID isolation         | ❌ Very hard       |
| **Framework Adapters**        | ⚠️ DIY per framework | ⚠️ DIY per framework  | ✅ Built-in adapters         | ✅ Yes             |
| **Type Safety**               | ⚠️ Manual            | ⚠️ Manual             | ✅ Full TypeScript           | ✅ If typed        |
| **Flakiness**                 | ⚠️ Timing issues     | ⚠️ Timing issues      | ✅ Stable                    | ⚠️ Can be flaky    |
| **Setup Complexity**          | ⚠️ DIY               | ⚠️ DIY                | ✅ Declarative               | ⚠️ Complex         |

---

## Documentation

📖 **[Full Documentation](https://scenarist.io)** - Complete guides, API reference, and examples.

### Core Concepts

- **[Core Functionality Guide](./docs/core-functionality.md)** - Understanding Scenarist's domain logic (framework-agnostic)
  - Scenario definitions and mock definitions
  - Dynamic response system (request matching, response sequences, specificity-based selection)
  - Test isolation and architecture
  - Independent of any specific framework or adapter

- **[Stateful Mocks Guide](./docs/stateful-mocks.md)** - Complete guide to stateful mock testing
  - State capture from request body, headers, and query parameters
  - Template injection with type preservation
  - Multi-step flows (shopping carts, forms, sessions)
  - Advanced patterns and troubleshooting

- **[State API Reference](./docs/api-reference-state.md)** - Quick reference for state features
  - State capture syntax and examples
  - Template injection rules
  - Type preservation behavior
  - Complete API documentation

### Adapter Documentation

- **[Express Adapter README](./packages/express-adapter/README.md)** - Express-specific usage and setup
- **[Next.js Adapter README](./packages/nextjs-adapter/README.md)** - Next.js App Router and Pages Router setup
- **[Playwright Helpers README](./packages/playwright-helpers/README.md)** - Playwright test helpers
- **[MSW Adapter README](./internal/msw-adapter/README.md)** - MSW integration details (internal)

### Examples

**Internal Examples (`apps/`)** - Used for testing and verifying Scenarist features:

- **[Express Example App](./apps/express-example/)** - Complete working Express application with Scenarist
  - Scenario definitions: `src/scenarios.ts`
  - Integration tests: `tests/dynamic-matching.test.ts`, `tests/dynamic-sequences.test.ts`, `tests/stateful-scenarios.test.ts`
  - Bruno API tests: `bruno/Dynamic Responses/`

**Demo Apps (`demo/`)** - Consumer-facing examples that install Scenarist from npm:

- **[PayFlow Demo](./demo/payflow/)** - Payment integration demo showcasing all Scenarist features (used in promotional videos and blog posts)

### Planning & Architecture

- **[Dynamic Responses Plan](./docs/plans/dynamic-responses.md)** - Complete implementation plan and requirements
- **[ADR-0002: Dynamic Response System](./docs/adrs/0002-dynamic-response-system.md)** - Architectural decisions

---

## Contributing

Contributions welcome! This project follows Test-Driven Development (TDD) and hexagonal architecture principles.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/citypaul/scenarist.git
cd scenarist

# Install dependencies
pnpm install

# Run tests (TDD!)
pnpm test

# Build all packages
pnpm build

# Run tests in watch mode
pnpm test:watch
```

### Areas for Contribution

- 🔌 **Framework Adapters** - Fastify, Hono, Koa, Remix (see existing adapters as patterns)
- 📚 **Documentation** - Examples, tutorials, blog posts
- 🐛 **Bug Fixes** - Check our [issues](https://github.com/citypaul/scenarist/issues)
- ✨ **Features** - See existing packages for patterns

---

## Common Use Cases

### 🛒 E-Commerce: Test Checkout with Payment Provider Scenarios

```typescript
// Your real Express or Next.js API runs
// Only Stripe API is mocked

test('successful purchase flow', async ({ request }) => {
  await switchScenario(request, 'stripe-success');

  const response = await request.post('http://localhost:3000/api/checkout', {
    data: { items: [...], userId: '123' }
  });

  // Your Express route executed:
  // - Database queries ran
  // - Business logic (calculateTotal) ran
  // - Order creation happened
  // Only Stripe API call was mocked

  expect(response.status()).toBe(200);
});

test('declined card flow', async ({ request }) => {
  await switchScenario(request, 'stripe-declined');
  // Tests your error handling, user messaging, retry logic
});

test('3D Secure required flow', async ({ request }) => {
  await switchScenario(request, 'stripe-3ds-required');
  // Tests your 3D Secure redirect flow
});
```

### 🔐 Auth: Test Login/Signup with Auth Provider Scenarios

```typescript
// Your real Express or Next.js auth routes run
// Only Auth0/Clerk API is mocked

test("successful OAuth login", async ({ page }) => {
  await switchScenario(page, "auth0-success");
  // Tests your session creation, redirect logic, user setup
});

test("OAuth error handling", async ({ page }) => {
  await switchScenario(page, "auth0-error");
  // Tests your error UI, retry logic, fallback behavior
});

test("email verification flow", async ({ page }) => {
  await switchScenario(page, "auth0-verify-required");
  // Tests your verification UI and redirect handling
});
```

### 📧 Transactional Emails: Test Email Sending Scenarios

```typescript
// Your real Express or Next.js API runs
// Only SendGrid/Resend API is mocked

test("welcome email sent successfully", async ({ page }) => {
  await switchScenario(page, "sendgrid-success");
  // Tests your signup flow, email queueing, success messaging
});

test("email rate limit handling", async ({ page }) => {
  await switchScenario(page, "sendgrid-rate-limit");
  // Tests your rate limit error handling, retry logic
});
```

### 🤖 AI Features: Test OpenAI/Anthropic API Scenarios

```typescript
// Your real AI feature code runs
// Only OpenAI API is mocked

test("AI suggestion generation", async ({ page }) => {
  await switchScenario(page, "openai-success");
  // Tests your prompt engineering, response parsing, UI updates
});

test("AI timeout handling", async ({ page }) => {
  await switchScenario(page, "openai-timeout");
  // Tests your timeout handling, fallback behavior
});

test("AI content filtering", async ({ page }) => {
  await switchScenario(page, "openai-content-filtered");
  // Tests your content policy violation handling
});
```

### 🗄️ SaaS: Test Multi-Tenant Scenarios

```typescript
// Your real authorization logic runs
// Only external API calls are mocked

test("free tier limits", async ({ page }) => {
  await switchScenario(page, "user-free-tier");
  // Tests your feature gates, upgrade prompts, limit enforcement
});

test("premium tier features", async ({ page }) => {
  await switchScenario(page, "user-premium-tier");
  // Tests advanced features, no limits, premium UI elements
});

test("enterprise SSO login", async ({ page }) => {
  await switchScenario(page, "user-enterprise-sso");
  // Tests SSO flow, custom branding, enterprise features
});
```

---

## FAQ

**Q: Does my application really run, or is it mocked?**

A: **Your application really runs!** Whether it's Express routes or Next.js Server Components—all your application code executes normally. Only external API calls (Stripe, Auth0, AWS, etc.) are mocked by MSW. This is true integration testing.

**Q: Does this work with Express APIs?**

A: Absolutely! Express is a first-class citizen. Your Express routes, middleware, and error handlers all execute normally. Only outgoing HTTP calls to external services are intercepted and mocked.

**Q: What's the difference between this and regular MSW?**

A: MSW provides HTTP mocking. Scenarist adds:

- **Runtime scenario switching** (no app restarts)
- **Test isolation** via test IDs (parallel tests don't conflict)
- **Framework adapters** (Express, Next.js)
- **Type-safe scenario management** (TypeScript first)

Think of it as MSW + scenario management + test orchestration.

**Q: Can I use this with Next.js App Router?**

A: Yes! Scenarist works perfectly with Next.js 13+ App Router, Server Components, Server Actions, and the Pages Router. Your React Server Components execute normally, only external API calls are intercepted.

**Q: Does this work with Remix, Fastify, or other frameworks?**

A: We currently provide adapters for Express and Next.js. More are planned.

**Q: What about tRPC? Does my tRPC router execute?**

A: Yes! Your entire tRPC router, procedures, and middleware execute. Only calls to external services from within your procedures are mocked.

**Q: Can I use this in production?**

A: Scenarist is designed for testing/development. The middleware can be disabled in production via config (`enabled: process.env.NODE_ENV !== 'production'`).

**Q: Does this work with Playwright's built-in mocking?**

A: Yes! Scenarist provides server-side scenario management, which complements Playwright's client-side mocking. Use both together or just Scenarist.

**Q: Can I use this without Playwright?**

A: Absolutely! Scenarist works with Cypress, Puppeteer, Selenium, or any test framework that can make HTTP requests. Even `curl` works!

**Q: What about my database? Does Scenarist help with that?**

A: No. Scenarist only intercepts **external HTTP requests** (Stripe, Auth0, etc.). Database calls are not HTTP requests—they go directly to your database. If your app uses databases, use a test database or tools like Testcontainers. See our [Testing Database Apps](/guides/testing-database-apps) guide for strategies.

**Q: How fast is scenario switching?**

A: <100ms. Just an HTTP POST request. No app restart needed.

**Q: What's the performance overhead per request?**

A: ~1ms per request. Negligible impact on test execution time.

**Q: Does this work with TypeScript?**

A: Yes! Scenarist is written in TypeScript with strict mode. Full type safety for scenarios, configs, and APIs.

**Q: Can I mock GraphQL APIs?**

A: Yes! MSW supports GraphQL mocking. Define your GraphQL mocks in scenarios.

**Q: Does this work with monorepos (Nx, Turborepo)?**

A: Absolutely! Scenarist is built with Turborepo. Perfect for monorepo testing strategies.

**Q: What if I need to test with real external APIs sometimes?**

A: Set `enabled: false` to disable mocking globally, or use `strictMode: false` and create scenarios with selective mocks to allow passthrough for specific endpoints.

---

## Support

- 💬 [GitHub Discussions](https://github.com/citypaul/scenarist/discussions)
- 🐛 [Issue Tracker](https://github.com/citypaul/scenarist/issues)

---

## License

MIT © [Paul Hammond](https://github.com/citypaul)

---

## Acknowledgments

Built with:

- [MSW](https://mswjs.io/) - Mock Service Worker
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev/) - Testing framework
- [Turborepo](https://turbo.build/) - Monorepo tooling

Inspired by hexagonal architecture patterns and the testing community's need for better scenario-based testing tools.

---

## Star History

If you find Scenarist useful, please consider giving it a star ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=citypaul/scenarist&type=Date)](https://star-history.com/#citypaul/scenarist&Date)

---

**Made with ❤️ by the testing community**
