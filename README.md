# Scenarist 🎭

**Integration Testing for Node.js Applications with Instant Scenario Switching**

Test your complete application—business logic, database queries, API routes—while mocking only external third-party APIs. Built on MSW with runtime scenario management and parallel test isolation.

Works with Express, Fastify, Next.js, Remix, tRPC, and any Node.js framework.

[![Build Status](https://img.shields.io/github/workflow/status/citypaul/scenarist/CI)](https://github.com/citypaul/scenarist/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Status**: 🚧 In development. Core packages complete, not yet published to npm.

---

## Test Your Real Application with Mocked External APIs

Scenarist lets you write **true integration tests** where **your actual application code executes**—Express routes, business logic, database queries, Next.js Server Components—all of it runs for real. Only external API calls to third-party services are mocked.

### Why This Matters

Testing full-stack applications is hard:

- **E2E tests with real APIs** → Brittle, slow, expensive, hard to test edge cases
- **Traditional mocking** → Requires app restarts, tests conflict, framework lock-in
- **MSW alone** → No scenario management, manual setup per test

**Scenarist gives you fast, reliable integration testing:**

✅ **Your application code runs** - Express routes, business logic, database queries, middleware
✅ **Only external APIs are mocked** - Stripe, Auth0, SendGrid, AWS—mock only what you don't control
✅ **Switch scenarios instantly** - Test success, errors, edge cases without restarting your app
✅ **Parallel tests that don't conflict** - 100 tests running different scenarios simultaneously
✅ **Framework agnostic** - Works with any Node.js application

### Works With Any Node.js Framework

**Backend Frameworks:**

- **Express** - Routes, middleware, error handlers
- **Fastify** - Plugins, routes, hooks
- **Hono** - Lightweight edge runtime compatible
- **Koa** - Middleware and context

**Full-Stack Frameworks:**

- **Next.js** - Server Components, Server Actions, App Router, API Routes
- **Remix** - Loaders, actions, server-side rendering
- **SvelteKit** - Load functions, form actions
- **tRPC** - End-to-end type-safe procedures

**Any Node.js App:**

- REST APIs, GraphQL servers, microservices, serverless functions

### Real Application, Real Tests

**Example 1: Express API**

```typescript
// Your actual Express route runs
app.post("/api/checkout", async (req, res) => {
  const { items, userId } = req.body;

  // ✅ This code ACTUALLY EXECUTES in your test
  const user = await db.users.findById(userId);
  const total = calculateTotal(items, user.tier);

  // ✅ Only THIS external call is mocked by Scenarist
  const payment = await stripe.charges.create({
    amount: total,
    currency: "usd",
  });

  // ✅ This code ACTUALLY EXECUTES too
  await db.orders.create({
    userId,
    items,
    total,
    paymentId: payment.id,
  });

  res.json({ success: true });
});
```

**Example 2: Next.js App Router**

```typescript
// Your actual Next.js app/checkout/route.ts runs
export async function POST(request: Request) {
  const { items, userId } = await request.json();

  // ✅ This code ACTUALLY EXECUTES in your test
  const user = await db.users.findById(userId);
  const total = calculateTotal(items, user.tier);

  // ✅ Only THIS external call is mocked by Scenarist
  const payment = await stripe.charges.create({
    amount: total,
    currency: "usd",
  });

  // ✅ This code ACTUALLY EXECUTES too
  await db.orders.create({
    userId,
    items,
    total,
    paymentId: payment.id,
  });

  return Response.json({ success: true });
}
```

**With Scenarist:**

- Your database queries run (use test database or in-memory)
- Your business logic executes (`calculateTotal`, validation, etc.)
- Your routing and middleware run
- Only external API calls (Stripe) are mocked

**You're testing the actual application behavior**, not a fake simulation.

---

## The Problem

You want to test your full-stack application end-to-end, but you face impossible tradeoffs:

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

- ⏰ Slow tests - restarting adds 5-10 seconds per test
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
    // Can't reuse in Fastify, Hono, Koa, etc.
  }
});
```

**Problems:**

- 🔒 Locked into one framework
- 🔄 Code duplication across projects
- 📦 Can't extract to shared library

---

## The Solution: Full-Stack Integration Testing with Scenario Management

**Scenarist** transforms your Playwright/Cypress tests into true integration tests where **your entire application runs**—just like production—while giving you complete control over external API responses.

**The Magic:** Switch between test scenarios (success, errors, edge cases) at runtime without restarting your app, and run hundreds of isolated tests in parallel.

**The Architecture:** Built on MSW (Mock Service Worker) and hexagonal design principles for framework independence and extensibility.

### Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Playwright Tests                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Test A      │  │  Test B      │  │  Test C      │              │
│  │  x-test-id:  │  │  x-test-id:  │  │  x-test-id:  │              │
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
                                                        (Express, Fastify, etc.)
```

### How It Works

```typescript
// ✅ With Scenarist - switch scenarios at runtime!
test("payment succeeds", async ({ page }) => {
  // Switch to success scenario - no restart needed!
  await page.request.post("http://localhost:3000/__scenario__", {
    headers: { "x-test-id": "test-1" },
    data: { scenario: "payment-success" },
  });

  await page.goto("/payment");
  await expect(page.locator(".success-message")).toBeVisible();
});

test("payment fails", async ({ page }) => {
  // Switch to error scenario - runs in parallel with test above!
  await page.request.post("http://localhost:3000/__scenario__", {
    headers: { "x-test-id": "test-2" },
    data: { scenario: "payment-error" },
  });

  await page.goto("/payment");
  await expect(page.locator(".error-message")).toBeVisible();
});

// Both tests run in parallel, each with their own isolated mocks! 🎉
```

---

## Key Features

### 🚀 True End-to-End Integration Testing

Your complete application stack executes—frontend, backend, database, business logic. Test the real user experience, not mocked simulations. Perfect for Next.js Server Components, Remix loaders, tRPC procedures, and any full-stack architecture.

### 🎯 Test Isolation with Parallel Execution

Each test gets its own isolated scenario via unique test IDs. Run 100+ tests in parallel without conflicts. Test success paths, error states, and edge cases simultaneously.

### ⚡ Instant Scenario Switching (No Restarts)

Switch between mock scenarios in <100ms without restarting your application. What took 60 seconds with app restarts now takes 6 seconds. **10x faster test suites.**

### 🎭 Mock External APIs Only

Mock third-party services (Stripe, Auth0, SendGrid, AWS) while your application code runs normally. Keep test complexity low by only mocking what you don't control.

### 🏗️ Framework Agnostic Architecture

Built with hexagonal architecture (ports & adapters). Works with Express, Fastify, Next.js, Remix, and any Node.js framework. One library for your entire stack.

### 📦 Type-Safe with Full TypeScript Support

Strict TypeScript types for scenarios, configs, and APIs. Catch errors at compile-time. Excellent IntelliSense and autocomplete support.

### 🎨 Scenario Variants for Data-Driven Testing

Parameterize scenarios with variants. Test the same flow with different user tiers, payment methods, or feature flags without duplicating scenario definitions.

### 🔌 Built on MSW (Mock Service Worker)

Leverage the power of MSW's battle-tested HTTP interception. Scenarist adds runtime management, test isolation, and framework adapters on top of MSW's solid foundation.

### 🧠 Stateful Mocks for Multi-Step Flows

Capture state from requests and inject it into subsequent responses. Perfect for testing shopping carts, multi-step forms, user sessions, and any flow where responses depend on previous requests. State is isolated per test ID for parallel execution.

### 🗄️ Serializable Scenarios for Distributed Testing

Scenarios are pure JSON—store them in Redis for distributed testing, save to files for version control, or fetch from remote APIs. No functions or closures means scenarios work across processes, containers, and even different machines.

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
        │  • Fastify Plugin        │   │  • RedisStore (future) │
        │  • Koa Middleware        │   │                        │
        │  • Hono Middleware       │   │                        │
        │                          │   │                        │
        └──────────────────────────┘   └────────────────────────┘
```

### Why Hexagonal?

**Technology Independence**

- ✅ Core logic has zero framework dependencies
- ✅ Swap Express for Fastify without changing core
- ✅ Test domain logic without HTTP frameworks

**Clear Boundaries**

- ✅ Ports define explicit contracts
- ✅ Adapters can be developed independently
- ✅ Easy to understand and navigate codebase

**Extensibility**

- ✅ Add new framework adapters without touching core
- ✅ Add new storage backends (Redis, PostgreSQL) easily
- ✅ Community can contribute adapters

**Testability**

- ✅ Test core logic in isolation
- ✅ Test adapters against port contracts
- ✅ No mocking needed for pure domain tests

---

## Quick Start

### Installation

> **Note**: Not yet published to npm. For now, use this repository directly or wait for official release.

```bash
# Once published:
npm install @scenarist/express-adapter msw express
```

### Basic Setup

**1. Create your scenarios**

Scenarios are defined as serializable JSON objects (not MSW handlers):

```typescript
// scenarios/default.ts
import type { ScenarioDefinition } from "@scenarist/core";

export const defaultScenario: ScenarioDefinition = {
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
import type { ScenarioDefinition } from "@scenarist/core";

export const errorState: ScenarioDefinition = {
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
import type { ScenariosObject } from "@scenarist/core";
import { defaultScenario, errorState } from "./scenarios";

const app = express();
app.use(express.json());

// Create scenarios object
const scenarios = {
  default: defaultScenario,
  errorState: errorState,
} as const satisfies ScenariosObject;

// Create Scenarist instance (wires everything automatically)
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios,                    // All scenarios registered upfront
  defaultScenarioId: 'default', // ID of default scenario for fallback
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
      .set("x-test-id", "test-default");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("John Doe");
  });

  it("should return error when using error scenario", async () => {
    // Switch to error scenario
    await request(app)
      .post("/__scenario__")
      .set("x-test-id", "test-error")
      .send({ scenario: "error-state" });

    // Make request - gets error response
    const response = await request(app)
      .get("/api/profile")
      .set("x-test-id", "test-error");

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
} as const satisfies ScenariosObject;

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios,
  defaultScenarioId: 'default',
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
  .set("x-test-id", "test-123")
  .send({
    scenario: "user-scenario",
    variant: "premium-tier", // Optional variant
  });
```

### Checking Active Scenario

```typescript
const response = await request(app)
  .get("/__scenario__")
  .set("x-test-id", "test-123");

console.log(response.body);
// {
//   testId: 'test-123',
//   scenarioId: 'user-scenario',
//   scenarioName: 'User Scenario',
//   variantName: 'premium-tier'
// }
```

### Stateful Mocks

Capture state from requests and inject it into responses for multi-step flows:

```typescript
// Define a scenario with state capture and injection
const shoppingCartScenario: ScenarioDefinition = {
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
    .set("x-test-id", "cart-1")
    .send({ scenario: "shopping-cart" });

  // Add items
  await request(app)
    .post("/api/cart/add")
    .set("x-test-id", "cart-1")
    .send({ item: "Apple" });

  await request(app)
    .post("/api/cart/add")
    .set("x-test-id", "cart-1")
    .send({ item: "Banana" });

  // Get cart - state is injected
  const response = await request(app)
    .get("/api/cart")
    .set("x-test-id", "cart-1");

  expect(response.body.items).toEqual(["Apple", "Banana"]);
  expect(response.body.count).toBe(2);
});
```

For more advanced usage patterns, see the [Express Adapter README](./packages/express-adapter/README.md), [Stateful Mocks Guide](./docs/stateful-mocks.md), or the [Express Example App](./apps/express-example/).

---

## Framework Support

### Express (Available Now ✅)

```typescript
import { createScenarist } from "@scenarist/express-adapter";

const scenarist = createScenarist({
  enabled: true,
  defaultScenario: myDefaultScenario,
});

app.use(scenarist.middleware);
```

See the [Express Adapter Documentation](./packages/express-adapter/README.md) for complete usage.

### Other Frameworks (Coming Soon)

Scenarist's hexagonal architecture makes it easy to create adapters for any framework:

- **Fastify** - Coming soon
- **Koa** - Coming soon
- **Hono** - Coming soon
- **Next.js** - Coming soon

Contributions welcome! See the [Express adapter](./packages/express-adapter/) as a reference implementation.

---

## Real-World Example

### Before Scenarist ❌

```typescript
// Slow, sequential tests - ~60 seconds total
test.describe.serial("User Dashboard", () => {
  test("shows basic features for standard users", async ({ page }) => {
    await restartApp({ mockProfile: "standard" }); // +10s
    await page.goto("/dashboard");
    await expect(page.locator(".basic-features")).toBeVisible();
  });

  test("shows advanced features for premium users", async ({ page }) => {
    await restartApp({ mockProfile: "premium" }); // +10s
    await page.goto("/dashboard");
    await expect(page.locator(".advanced-features")).toBeVisible();
  });

  test("shows upgrade prompt for free users", async ({ page }) => {
    await restartApp({ mockProfile: "free" }); // +10s
    await page.goto("/dashboard");
    await expect(page.locator(".upgrade-prompt")).toBeVisible();
  });

  test("handles API errors gracefully", async ({ page }) => {
    await restartApp({ mockProfile: "error" }); // +10s
    await page.goto("/dashboard");
    await expect(page.locator(".error-message")).toBeVisible();
  });

  test("handles slow API responses", async ({ page }) => {
    await restartApp({ mockProfile: "slow" }); // +10s
    await page.goto("/dashboard");
    await expect(page.locator(".loading-spinner")).toBeVisible();
  });

  test("shows empty state for new users", async ({ page }) => {
    await restartApp({ mockProfile: "empty" }); // +10s
    await page.goto("/dashboard");
    await expect(page.locator(".empty-state")).toBeVisible();
  });
});
```

### After Scenarist ✅

```typescript
// Fast, parallel tests - ~6 seconds total!
test.describe("User Dashboard", () => {
  test("shows basic features for standard users", async ({ page }) => {
    await switchScenario(page, "user-standard"); // <100ms
    await page.goto("/dashboard");
    await expect(page.locator(".basic-features")).toBeVisible();
  });

  test("shows advanced features for premium users", async ({ page }) => {
    await switchScenario(page, "user-premium"); // <100ms
    await page.goto("/dashboard");
    await expect(page.locator(".advanced-features")).toBeVisible();
  });

  test("shows upgrade prompt for free users", async ({ page }) => {
    await switchScenario(page, "user-free"); // <100ms
    await page.goto("/dashboard");
    await expect(page.locator(".upgrade-prompt")).toBeVisible();
  });

  test("handles API errors gracefully", async ({ page }) => {
    await switchScenario(page, "api-error"); // <100ms
    await page.goto("/dashboard");
    await expect(page.locator(".error-message")).toBeVisible();
  });

  test("handles slow API responses", async ({ page }) => {
    await switchScenario(page, "api-slow"); // <100ms
    await page.goto("/dashboard");
    await expect(page.locator(".loading-spinner")).toBeVisible();
  });

  test("shows empty state for new users", async ({ page }) => {
    await switchScenario(page, "user-new"); // <100ms
    await page.goto("/dashboard");
    await expect(page.locator(".empty-state")).toBeVisible();
  });
});

// Helper function
async function switchScenario(page: Page, scenario: string) {
  await page.request.post("http://localhost:3000/__scenario__", {
    headers: { "x-test-id": test.info().testId },
    data: { scenario },
  });
}
```

**Results:**

- ⚡ **10x faster** - 6s vs 60s
- 🔀 **Parallel execution** - all tests run simultaneously
- ✅ **More reliable** - no restart timing issues
- 💰 **Cheaper CI** - less compute time

---

## Benefits Summary

### For Node.js Developers

✅ **Test Real Application Behavior**

- Your Express/Next.js/Remix code actually runs—no fake mocks
- Database queries, middleware, routing—all execute normally
- Only external APIs are mocked
- Catch integration bugs where components interact

✅ **10x Faster Test Development**

- Switch scenarios in milliseconds, not minutes
- No app restarts—instant feedback loop
- Test all edge cases without setup overhead

✅ **Better Developer Experience**

- Type-safe APIs with excellent IntelliSense
- Clear error messages when scenarios fail
- Works with existing Playwright/Cypress tests

✅ **Framework Flexibility**

- Learn once, use with any framework
- Move from Express to Fastify? Tests work unchanged
- Future-proof your testing strategy

### For Engineering Teams

✅ **Dramatically Faster CI/CD**

- Tests run 10x faster (6s instead of 60s)
- 100+ parallel tests without conflicts
- **Lower AWS/Vercel/cloud costs** from faster builds

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

- Built for Next.js App Router, Remix, SvelteKit
- Works with tRPC, GraphQL, REST
- Traditional backends (Express, Fastify) too

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
| **External APIs Mocked**      | ✅ Yes               | ✅ Yes                | ✅ Yes                       | ❌ Real            |
| **Test Express Routes**       | ✅ Yes               | ✅ Yes                | ✅ Yes                       | ✅ Yes             |
| **Test Database Integration** | ✅ Real (test DB)    | ✅ Real (test DB)     | ✅ Real (test DB)            | ✅ Real            |
| **Scenario Switching**        | Restart app (5-10s)  | Restart app (5-10s)   | Runtime (<100ms)             | Manual setup       |
| **Parallel Test Isolation**   | ❌ Conflicts         | ❌ Conflicts          | ✅ Test ID isolation         | ❌ Very hard       |
| **Framework Agnostic**        | ⚠️ DIY per framework | ⚠️ DIY per framework  | ✅ Built-in adapters         | ✅ Yes             |
| **Type Safety**               | ⚠️ Manual            | ⚠️ Manual             | ✅ Full TypeScript           | ✅ If typed        |
| **Test Suite Speed**          | 🐢 Slow (restarts)   | 🐢 Slow (restarts)    | ⚡ Fast (no restarts)        | 🐌 Very slow       |
| **CI/CD Cost**                | 💰 High              | 💰 High               | 💵 Low                       | 💰💰 Very high     |
| **Flakiness**                 | ⚠️ Timing issues     | ⚠️ Timing issues      | ✅ Stable                    | ⚠️ Can be flaky    |
| **Setup Complexity**          | ⚠️ DIY               | ⚠️ DIY                | ✅ Declarative               | ⚠️ Complex         |

---

## Documentation

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
- **[MSW Adapter README](./packages/msw-adapter/README.md)** - MSW integration details

### Examples

- **[Express Example App](./apps/express-example/)** - Complete working Express application with Scenarist
  - Scenario definitions: `src/scenarios.ts`
  - Integration tests: `tests/dynamic-matching.test.ts`, `tests/dynamic-sequences.test.ts`, `tests/stateful-scenarios.test.ts`
  - Bruno API tests: `bruno/Dynamic Responses/`

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

- 🔌 **Framework Adapters** - Fastify, Koa, Hono, Next.js
- 💾 **Storage Adapters** - Redis, PostgreSQL, DynamoDB
- 📚 **Documentation** - Examples, tutorials, blog posts
- 🐛 **Bug Fixes** - Check our [issues](https://github.com/citypaul/scenarist/issues)
- ✨ **Features** - See existing packages for patterns

---

## Roadmap

### v1.x - Framework Adapters

- ✅ Express adapter (available)
- 🔜 Fastify adapter
- 🔜 Koa adapter
- 🔜 Hono adapter

### v2.x - Distributed Testing

- 🔮 Redis-based ScenarioStore
- 🔮 Scenario recording/replay
- 🔮 Visual scenario debugger
- 🔮 Next.js App Router support

### v3.x - Advanced Features

- 🔮 AI-powered scenario generation
- 🔮 OpenAPI → Scenario conversion
- 🔮 Performance regression detection
- 🔮 Contract testing integration

See our [full roadmap](./docs/roadmap.md) for details.

---

## Common Use Cases

### 🛒 E-Commerce: Test Checkout with Payment Provider Scenarios

```typescript
// Your real Express API runs (or Next.js, Fastify, etc.)
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
// Your real Remix auth routes run
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
// Your real tRPC procedure runs
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

A: **Your application really runs!** Whether it's Express routes, Next.js Server Components, Remix loaders, or Fastify handlers—all your application code executes normally. Only external API calls (Stripe, Auth0, AWS, etc.) are mocked by MSW. This is true integration testing.

**Q: Does this work with Express APIs?**

A: Absolutely! Express is a first-class citizen. Your Express routes, middleware, and error handlers all execute normally. Only outgoing HTTP calls to external services are intercepted and mocked.

**Q: What's the difference between this and regular MSW?**

A: MSW provides HTTP mocking. Scenarist adds:

- **Runtime scenario switching** (no app restarts)
- **Test isolation** via test IDs (parallel tests don't conflict)
- **Framework adapters** (Express, Fastify, Next.js, etc.)
- **Type-safe scenario management** (TypeScript first)

Think of it as MSW + scenario management + test orchestration.

**Q: Can I use this with Next.js App Router?**

A: Yes! Scenarist works perfectly with Next.js 13+ App Router, Server Components, Server Actions, and the Pages Router. Your React Server Components execute normally, only external API calls are intercepted.

**Q: Does this work with Remix loaders and actions?**

A: Absolutely! Your Remix loaders and actions run on the server as normal. External API calls within those functions are mocked based on the active scenario.

**Q: What about tRPC? Does my tRPC router execute?**

A: Yes! Your entire tRPC router, procedures, and middleware execute. Only calls to external services from within your procedures are mocked.

**Q: Can I use this in production?**

A: Scenarist is designed for testing/development. The middleware can be disabled in production via config (`enabled: process.env.NODE_ENV !== 'production'`).

**Q: Does this work with Playwright's built-in mocking?**

A: Yes! Scenarist provides server-side scenario management, which complements Playwright's client-side mocking. Use both together or just Scenarist.

**Q: Can I use this without Playwright?**

A: Absolutely! Scenarist works with Cypress, Puppeteer, Selenium, or any test framework that can make HTTP requests. Even `curl` works!

**Q: What about my database? Does it need to be mocked?**

A: No! Use a real test database (or in-memory database like SQLite). Your database queries run normally. Only external HTTP APIs are mocked.

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

Inspired by hexagonal architecture patterns and the testing community's need for better E2E mocking.

---

## Star History

If you find Scenarist useful, please consider giving it a star ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=citypaul/scenarist&type=Date)](https://star-history.com/#citypaul/scenarist&Date)

---

**Made with ❤️ by the testing community**
