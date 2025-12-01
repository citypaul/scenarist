# @scenarist/[framework]-adapter

[Framework] adapter for [Scenarist](https://github.com/citypaul/scenarist) - manage MSW mock scenarios in your [Framework] applications for testing and development.

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

## Why Use Scenarist with [Framework]?

**Runtime Scenario Switching**

- Change entire backend state with one API call
- No server restarts between tests
- Instant feedback during development

**True Parallel Testing**

- 100+ tests run concurrently with different scenarios
- Each test ID has isolated scenario state
- No conflicts, no serialization needed

**[Framework-Specific Advantage]**

- [Explain the unique benefit for this framework]
- [E.g., AsyncLocalStorage for Express, type-safe API routes for Next.js, etc.]

**Reusable Scenarios**

- Define scenarios once, use across all tests
- Version control your mock scenarios
- Share scenarios across teams

**Zero Boilerplate** (or appropriate messaging)

- [Explain setup complexity: one function call, or explicit wiring, etc.]
- [Highlight what's automated vs. manual]

## What is this package?

This package provides a complete [Framework] integration for Scenarist's scenario management system. [Describe what the adapter provides - middleware, plugins, endpoints, etc.]

- **Runtime scenario switching** via HTTP endpoints
- **Test isolation** using unique test IDs
- **Automatic MSW integration** for request interception
- **[Framework-specific feature]** - [Description]

## Installation

```bash
# npm
npm install --save-dev @scenarist/[framework]-adapter @scenarist/core msw

# pnpm
pnpm add -D @scenarist/[framework]-adapter @scenarist/core msw

# yarn
yarn add -D @scenarist/[framework]-adapter @scenarist/core msw
```

**Peer Dependencies:**

- `[framework]` [version range]
- `msw` ^2.0.0

## Quick Start (5 Minutes)

[Provide absolute minimal example to get started - 4 steps max]

### 1. Define One Scenario

```typescript
// [appropriate file location]
import type { ScenaristScenario } from "@scenarist/core";

export const successScenario: ScenaristScenario = {
  id: "success",
  name: "API Success",
  mocks: [
    {
      method: "GET",
      url: "https://api.example.com/user",
      response: { status: 200, body: { name: "Alice", role: "user" } },
    },
  ],
};
```

### 2. Create Scenarist Instance

```typescript
// [appropriate file location]
import { createScenarist } from "@scenarist/[framework]-adapter";
import { successScenario } from "./scenarios";

// Note: For Express adapter, createScenarist is async - use await
// Check your specific adapter documentation for sync/async behavior
export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  defaultScenario: successScenario,
});
```

### 3. [Framework-Specific Setup Step]

[Middleware registration, endpoint creation, plugin installation, etc.]

### 4. Use in Tests

```typescript
import { scenarist } from '@/lib/scenarist';

beforeAll(() => scenarist.start()); // Start MSW server
afterAll(() => scenarist.stop());   // Stop MSW server

it('fetches user successfully', async () => {
  // Set scenario for this test
  await [framework-specific scenario switching code]

  // Make request - MSW intercepts automatically
  const response = await [framework-specific request code]

  expect(response.status).toBe(200);
});
```

**That's it!** You've got runtime scenario switching.

**Next steps:**

- [Add more scenarios](#full-setup-guide) for different backend states
- [Use test helpers](#common-patterns) to reduce boilerplate
- [Learn about test isolation](#test-id-isolation) for parallel tests
- [See advanced features](../../docs/core-functionality.md) like request matching and sequences

---

## Core Capabilities

Scenarist provides 20+ powerful features for scenario-based testing. All capabilities work with [Framework].

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
    repeat: 'last'
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

---

## Full Setup Guide

[Comprehensive setup instructions with all options explained]

## API Reference

[Complete API documentation for adapter-specific APIs]

## Core Concepts

[Framework-specific explanations of key concepts]

### Test ID Isolation

[How test isolation works in this framework]

### [Framework-Specific Concept]

[Explain unique aspects - AsyncLocalStorage for Express, manual forwarding for Next.js, etc.]

## Common Patterns

[3-5 practical patterns with complete code examples]

## Configuration

[Environment-specific configs, custom headers, strictMode, etc.]

## Troubleshooting

[5-7 common issues with solutions]

## TypeScript

[Exported types and how to use them]

## Examples

See the [**[Framework] Example App**](../../apps/[framework]-example) for a complete working example.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management
- **[@scenarist/msw-adapter](../../internal/msw-adapter)** - MSW integration (used internally)

**Note:** The MSW adapter is used internally by this package. Users of `@scenarist/[framework]-adapter` don't need to interact with it directly.
