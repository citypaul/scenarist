# @scenarist/msw-adapter

Framework-agnostic MSW integration for Scenarist.

## What is Scenarist?

**Scenarist** enables concurrent E2E tests to run with different backend states by switching mock scenarios at runtime via test IDs. This package provides the MSW integration layer that makes it all work.

**The big picture:**

```
Your App → Scenarist Adapter (Express/Next.js) → MSW Adapter → MSW → Intercepted HTTP
```

**What this package does:**

Converts Scenarist's serializable `ScenaristMock` data into MSW `HttpHandler` instances at runtime, enabling Scenarist to work with any Node.js framework.

**Status:** ✅ Stable - Used by all Scenarist adapters (Express, Next.js, etc.)

## Why Use This Package?

**Framework-Agnostic**
- Works with Express, Fastify, Next.js, Remix, any Node.js framework
- Zero framework dependencies (except MSW types)
- Build custom adapters for any framework

**Serializable Mocks**
- Mock definitions are pure JSON (no functions)
- Store in Redis for distributed testing
- Version control scenarios as files
- Share scenarios across teams

**Powerful Matching**
- URL patterns: exact, wildcards (`*/api/*`), path params (`/users/:id`)
- Request content matching: body, headers, query params
- Specificity-based selection
- Dynamic responses based on request content

**Complete MSW Integration**
- Single dynamic handler routes to correct scenario
- Automatic test ID isolation
- Default scenario fallback
- Strict mode for unmocked requests

## What is this package?

The MSW adapter is the bridge between Scenarist's serializable mock definitions and MSW's HTTP interception. It provides:

1. **URL Matching** - Converts URL patterns (with wildcards and path params) into MSW-compatible matchers
2. **Mock Matching** - Finds the right mock definition for incoming requests (with request content matching)
3. **Response Building** - Transforms `ScenaristMock` into MSW `HttpResponse`
4. **Dynamic Handler** - Creates a single MSW handler that routes based on active scenarios

## Core Capabilities

This adapter implements all 25 Scenarist capabilities:

### Request Matching (6 capabilities)
- **Body matching** (partial match) - Match on request body fields
- **Header matching** (exact, case-insensitive) - Match on header values
- **Query matching** (exact) - Match on query parameters
- **Combined matching** - Combine body + headers + query
- **Specificity-based selection** - Most specific mock wins
- **Fallback mocks** - Mocks without criteria act as catch-all

### Response Sequences (4 capabilities)
- **Single responses** - Return same response every time
- **Response sequences** - Ordered responses for polling scenarios
- **Repeat modes** - `last`, `cycle`, `none` behaviors
- **Sequence exhaustion** - Skip exhausted sequences to fallback

### Stateful Mocks (6 capabilities)
- **State capture** - Extract values from requests
- **State injection** - Inject state into responses via templates
- **Array append** - Syntax: `stateKey[]` for arrays
- **Nested paths** - Dot notation: `user.profile.name`
- **State isolation** - Per test ID isolation
- **State reset** - Fresh state on scenario switch

### URL Patterns (3 capabilities)
- **Exact matches** - `https://api.example.com/users`
- **Wildcards** - `*/api/*`, `https://*/users`
- **Path parameters** - `/users/:id`, `/posts/:postId/comments/:commentId`

### MSW Integration (6 capabilities)
- **Dynamic handler generation** - Single handler routes at runtime
- **Response building** - Status codes, JSON bodies, headers, delays
- **Default scenario fallback** - Falls back to "default" scenario
- **Strict mode** - Fail on unmocked requests
- **Test ID isolation** - Separate state per test ID
- **Framework-agnostic** - Works with any Node.js framework

## Features

- ✅ **URL pattern matching** - Exact matches, glob patterns (`*/api/*`), path parameters (`/users/:id`)
- ✅ **Request content matching** - Body, headers, query with specificity-based selection
- ✅ **Dynamic MSW handler generation** - Single handler routes to correct scenario at runtime
- ✅ **Response building** - Status codes, JSON bodies, headers, delays, state injection
- ✅ **Sequences and state** - Polling scenarios and stateful mocks fully supported
- ✅ **Default scenario fallback** - Falls back to "default" scenario when mock not found
- ✅ **Framework-agnostic** - Works with Express, Fastify, Next.js, Remix, any Node.js framework

## Internal Package

⚠️ **This is an internal package used by framework adapters.**

You typically don't install or use this directly. Instead, use a framework-specific adapter:

- **[@scenarist/express-adapter](../express-adapter)** - For Express applications
- **@scenarist/fastify-adapter** - Coming soon
- **@scenarist/nextjs-adapter** - Coming soon

## How It Works

### 1. URL Matching

Converts string patterns into MSW-compatible URL matchers:

```typescript
import { matchesUrl } from '@scenarist/msw-adapter';

matchesUrl('https://api.github.com/users/octocat', 'GET', 'https://api.github.com/users/:username');
// Returns: { matches: true, params: { username: 'octocat' } }

matchesUrl('https://api.stripe.com/v1/charges', 'POST', '*/v1/charges');
// Returns: { matches: true, params: {} }
```

**Supported patterns:**
- Exact: `https://api.example.com/users`
- Wildcards: `*/api/*`, `https://*/users`
- Path params: `/users/:id`, `/posts/:postId/comments/:commentId`

### 2. Mock Matching

Finds the right mock for a request:

```typescript
import { findMatchingMock } from '@scenarist/msw-adapter';

const mocks: ScenaristMock[] = [
  { method: 'GET', url: '/users/:id', response: { status: 200, body: {...} } },
  { method: 'POST', url: '/users', response: { status: 201, body: {...} } },
];

const mock = findMatchingMock(mocks, 'GET', 'https://api.example.com/users/123');
// Returns the first mock (matches /users/:id)
```

### 3. Response Building

Converts `ScenaristMock` to MSW `HttpResponse`:

```typescript
import { buildResponse } from '@scenarist/msw-adapter';

const mockDef: ScenaristMock = {
  method: 'GET',
  url: '/api/user',
  response: {
    status: 200,
    body: { id: '123', name: 'John' },
    headers: { 'X-Custom': 'value' },
    delay: 100,
  },
};

const response = await buildResponse(mockDef);
// Returns MSW HttpResponse with status, body, headers, and delay
```

### 4. Dynamic Handler

The core integration - a single MSW handler that routes dynamically:

```typescript
import { createDynamicHandler } from '@scenarist/msw-adapter';
import { setupServer } from 'msw/node';

const handler = createDynamicHandler({
  getTestId: () => testIdStorage.getStore() ?? 'default-test',
  getActiveScenario: (testId) => manager.getActiveScenario(testId),
  getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
  strictMode: false,
});

const server = setupServer(handler);
server.listen();
```

**How it works:**
1. Gets test ID from AsyncLocalStorage (or other context)
2. Looks up active scenario for that test ID
3. Finds matching mock in active scenario
4. Falls back to "default" scenario if not found
5. Returns mocked response or passthrough

## Architecture

This package is designed to be framework-agnostic. Framework adapters (Express, Fastify, etc.) handle:

- Test ID extraction (from headers, context, etc.)
- Scenario management (switching, retrieving)
- Middleware integration

The MSW adapter handles:

- URL matching and pattern conversion
- Mock finding and selection
- Response building
- MSW handler creation

## API Reference

### URL Matching

```typescript
export const matchesUrl = (
  requestUrl: string,
  method: string,
  pattern: string
): { matches: boolean; params: Record<string, string> };
```

### Mock Matching

```typescript
export const findMatchingMock = (
  mocks: ReadonlyArray<ScenaristMock>,
  method: string,
  url: string
): ScenaristMock | undefined;
```

### Response Building

```typescript
export const buildResponse = (
  mockDef: ScenaristMock
): Promise<HttpResponse>;
```

### Dynamic Handler

```typescript
export type DynamicHandlerOptions = {
  readonly getTestId: () => string;
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;
  readonly getScenarioDefinition: (scenarioId: string) => ScenaristScenario | undefined;
  readonly strictMode: boolean;
};

export const createDynamicHandler = (
  options: DynamicHandlerOptions
): HttpHandler;
```

## TypeScript

Full TypeScript support with strict mode enabled.

**Exported types:**
```typescript
import type {
  DynamicHandlerOptions,
} from '@scenarist/msw-adapter';
```

## Testing

This package has comprehensive test coverage:

- ✅ URL matching (exact, glob, path params)
- ✅ Mock matching (method, URL, precedence)
- ✅ Response building (status, body, headers, delays)
- ✅ Dynamic handler (scenarios, fallback, strict mode)
- ✅ **31 tests passing**

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT

## Related Packages

- **[@scenarist/core](../core)** - Core scenario management
- **[@scenarist/express-adapter](../express-adapter)** - Express integration (uses this package)
