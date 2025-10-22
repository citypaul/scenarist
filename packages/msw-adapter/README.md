# @scenarist/msw-adapter

Framework-agnostic MSW integration for Scenarist.

This package converts serializable `MockDefinition` data into MSW `HttpHandler` instances at runtime, enabling Scenarist to work with any Node.js framework.

**Status:** ✅ Stable

## What is this?

The MSW adapter is the bridge between Scenarist's serializable mock definitions and MSW's HTTP interception. It provides:

1. **URL Matching** - Converts URL patterns (with wildcards and path params) into MSW-compatible matchers
2. **Mock Matching** - Finds the right mock definition for incoming requests
3. **Response Building** - Transforms `MockDefinition` into MSW `HttpResponse`
4. **Dynamic Handler** - Creates a single MSW handler that routes based on active scenarios

## Features

- ✅ **URL pattern matching** - Exact matches, glob patterns (`*/api/*`), path parameters (`/users/:id`)
- ✅ **Dynamic MSW handler generation** - Single handler routes to correct scenario at runtime
- ✅ **Response building** - Status codes, JSON bodies, headers, delays
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

const mocks: MockDefinition[] = [
  { method: 'GET', url: '/users/:id', response: { status: 200, body: {...} } },
  { method: 'POST', url: '/users', response: { status: 201, body: {...} } },
];

const mock = findMatchingMock(mocks, 'GET', 'https://api.example.com/users/123');
// Returns the first mock (matches /users/:id)
```

### 3. Response Building

Converts `MockDefinition` to MSW `HttpResponse`:

```typescript
import { buildResponse } from '@scenarist/msw-adapter';

const mockDef: MockDefinition = {
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
  mocks: ReadonlyArray<MockDefinition>,
  method: string,
  url: string
): MockDefinition | undefined;
```

### Response Building

```typescript
export const buildResponse = (
  mockDef: MockDefinition
): Promise<HttpResponse>;
```

### Dynamic Handler

```typescript
export type DynamicHandlerOptions = {
  readonly getTestId: () => string;
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;
  readonly getScenarioDefinition: (scenarioId: string) => ScenarioDefinition | undefined;
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
