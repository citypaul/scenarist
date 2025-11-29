# @scenarist/msw-adapter

**⚠️ INTERNAL PACKAGE - DO NOT INSTALL DIRECTLY**

This package is an internal implementation detail of Scenarist and is **NOT published to npm**. It exists as a workspace dependency used by framework adapters.

## Why is this package private?

**You should install a framework adapter instead:**

- ✅ `@scenarist/express-adapter` - For Express applications
- ✅ `@scenarist/nextjs-adapter` - For Next.js applications
- ✅ `@scenarist/core` - For building custom adapters

**This package is private because:**

1. **Not user-facing** - Users never import from `@scenarist/msw-adapter` directly
2. **Implementation detail** - Provides MSW integration layer used internally by framework adapters
3. **Prevents confusion** - Publishing would mislead users into thinking they should install it
4. **Version coupling** - Framework adapters control which msw-adapter version they use
5. **Simpler maintenance** - Internal packages don't need semver/breaking change coordination
6. **Cleaner API surface** - Framework adapters ARE the public API, msw-adapter is hidden complexity

**Dependency structure:**

```
Your App
  ├─ @scenarist/express-adapter (public, install this!)
  │   └─ @scenarist/msw-adapter (private, workspace:*)
  │       └─ @scenarist/core (public)
  │
  └─ @scenarist/nextjs-adapter (public, install this!)
      └─ @scenarist/msw-adapter (private, workspace:*)
          └─ @scenarist/core (public)
```

---

## What is Scenarist?

**Scenarist** enables concurrent tests to run with different backend states by switching mock scenarios at runtime via test IDs. Your real application code executes while external API responses are controlled by scenarios. This package provides the MSW integration layer that makes it all work.

**The big picture:**

```
Your App → Scenarist Adapter (Express/Next.js) → MSW Adapter → MSW → Intercepted HTTP
```

**What this package does:**

Converts Scenarist's serializable `ScenaristMock` data into MSW `HttpHandler` instances at runtime, enabling Scenarist to work with any Node.js framework.

**Status:** ✅ Stable - Used internally by all Scenarist framework adapters

---

## For Framework Adapter Developers

If you're building a custom framework adapter for Scenarist, this package provides the MSW integration you need. Otherwise, you should use one of the existing public adapters listed above.

## What does this package provide?

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

### URL Patterns (4 capabilities)

- **Exact matches** - `https://api.example.com/users`
- **Wildcards** - `*/api/*`, `https://*/users`
- **Path parameters** - `/users/:id`, `/posts/:postId/comments/:commentId`
- **Native RegExp** - `/\/api\/v\d+\//`, `/\/users\/\d+$/` (weak comparison per MSW behavior)

### MSW Integration (6 capabilities)

- **Dynamic handler generation** - Single handler routes at runtime
- **Response building** - Status codes, JSON bodies, headers, delays
- **Automatic default fallback** - Collects default + active scenario mocks together
- **Strict mode** - Fail on unmocked requests
- **Test ID isolation** - Separate state per test ID
- **Framework-agnostic** - Works with any Node.js framework

## Features

- ✅ **URL pattern matching** - Exact matches, glob patterns (`*/api/*`), path parameters (`/users/:id`)
- ✅ **Request content matching** - Body, headers, query with specificity-based selection
- ✅ **Dynamic MSW handler generation** - Single handler routes to correct scenario at runtime
- ✅ **Response building** - Status codes, JSON bodies, headers, delays, state injection
- ✅ **Sequences and state** - Polling scenarios and stateful mocks fully supported
- ✅ **Automatic default fallback** - Collects default + active scenario mocks, uses specificity to select best match
- ✅ **Framework-agnostic** - Works with Express, Next.js, and any Node.js framework via HTTP-level interception

## Internal Package

⚠️ **This is an internal package used by framework adapters.**

You typically don't install or use this directly. Instead, use a framework-specific adapter:

- **[@scenarist/express-adapter](../../packages/express-adapter)** - For Express applications
- **[@scenarist/nextjs-adapter](../../packages/nextjs-adapter)** - For Next.js applications (App Router + Pages Router)

## How It Works

### 1. URL Matching

Converts string patterns into MSW-compatible URL matchers:

```typescript
import { matchesUrl } from "@scenarist/msw-adapter";

matchesUrl(
  "https://api.github.com/users/octocat",
  "GET",
  "https://api.github.com/users/:username",
);
// Returns: { matches: true, params: { username: 'octocat' } }

matchesUrl("https://api.stripe.com/v1/charges", "POST", "*/v1/charges");
// Returns: { matches: true, params: {} }
```

**Supported patterns (three types with different hostname matching):**

**1. Pathname-only patterns** (origin-agnostic - match ANY hostname)

- Path params: `/users/:id`, `/posts/:postId/comments/:commentId`
- Exact: `/api/users`
- Wildcards: `/api/*`, `*/users/*`

**2. Full URL patterns** (hostname-specific - match ONLY specified hostname)

- Exact: `https://api.example.com/users`
- Path params: `https://api.example.com/users/:id`
- Wildcards: `https://*/users`, `https://api.example.com/*`

**3. Native RegExp** (origin-agnostic - MSW weak comparison)

- `/\/api\/v\d+\//` (matches /api/v1/, /api/v2/, etc.)
- `/\/users\/\d+$/` (matches /users/123 at any origin)

**IMPORTANT:** If you specify a hostname in a full URL pattern, it WILL be matched. Choose pathname patterns for environment-agnostic mocks, full URL patterns when hostname matters.

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
import { buildResponse } from "@scenarist/msw-adapter";

const mockDef: ScenaristMock = {
  method: "GET",
  url: "/api/user",
  response: {
    status: 200,
    body: { id: "123", name: "John" },
    headers: { "X-Custom": "value" },
    delay: 100,
  },
};

const response = await buildResponse(mockDef);
// Returns MSW HttpResponse with status, body, headers, and delay
```

### 4. Dynamic Handler

The core integration - a single MSW handler that routes dynamically:

```typescript
import { createDynamicHandler } from "@scenarist/msw-adapter";
import { setupServer } from "msw/node";

const handler = createDynamicHandler({
  getTestId: () => testIdStorage.getStore() ?? "default-test",
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
3. **Collects mocks from BOTH default AND active scenario** for matching URL + method
4. Uses specificity-based selection to choose best match
5. Active scenario mocks (with match criteria) override default mocks (no criteria)
6. Returns mocked response or passthrough (if no match found)

**Key insight:** Default scenario mocks are ALWAYS collected first, then active scenario mocks are added. The specificity algorithm (from `ResponseSelector`) chooses the most specific match. This means specialized scenarios only need to define what changes - everything else automatically falls back to default.

## Architecture

This package is designed to be framework-agnostic. Framework adapters (Express, Next.js, etc.) handle:

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
import type { DynamicHandlerOptions } from "@scenarist/msw-adapter";
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
