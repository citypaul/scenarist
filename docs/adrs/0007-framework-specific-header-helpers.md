# ADR-0007: Framework-Specific Header Forwarding Helpers

**Status**: Accepted

**Date**: 2025-11-02

**Authors**: Claude Code

**Tags**: architecture, adapters, api-design, header-forwarding

## Context

When implementing the Next.js Pages Router example app, we discovered that API routes need to forward the `x-scenarist-test-id` header when making external API calls. This allows Scenarist's MSW integration to intercept requests with the correct scenario context.

**The Problem:**

In frameworks without middleware support (like Next.js Pages Router), routes must manually propagate Scenarist headers:

```typescript
// pages/api/products.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Need to forward x-scenarist-test-id header to external API
  const response = await fetch('http://localhost:3001/api/products', {
    headers: {
      'x-scenarist-test-id': req.headers['x-scenarist-test-id'] || 'default-test',
    },
  });
  // ...
}
```

This pattern will be needed in:
- Next.js Pages Router API routes
- Next.js App Router Server Actions (when making external calls)
- Any framework without middleware/AsyncLocalStorage for context propagation

**The Question:**

Should we create:
1. **Core utility** - Framework-agnostic helper in `@scenarist/core`
2. **Framework-specific helpers** - One helper per adapter package

## Decision

We will implement **framework-specific header forwarding helpers** in each adapter package.

Each adapter will export a `getScenaristHeaders()` function that:
- Accepts framework-specific request object + Scenarist instance
- Extracts test ID from configured header
- Returns headers object ready to spread into `fetch()` options

## Alternatives Considered

### Alternative 1: Core Utility Function

**Implementation:**

```typescript
// @scenarist/core
export const getScenaristHeaders = <TRequest>(
  request: TRequest,
  extractHeaders: (req: TRequest) => Record<string, string | string[] | undefined>,
  config: ScenaristConfig,
): Record<string, string> => {
  const headers = extractHeaders(request);
  const headerValue = headers[config.testIdHeaderName.toLowerCase()];
  const testId = (Array.isArray(headerValue) ? headerValue[0] : headerValue) || config.defaultTestId;
  return { [config.testIdHeaderName]: testId };
};

// Usage in Next.js adapter
import { getScenaristHeaders } from '@scenarist/core';
const headers = getScenaristHeaders(
  req,
  (r) => r.headers,
  scenarist.config,
);
```

**Pros:**
- Single implementation (no code duplication)
- Consistent behavior across all frameworks
- Centralized maintenance

**Cons:**
- Complex generic type signature (`<TRequest>`)
- Requires passing extraction function (boilerplate for users)
- Type assertions needed or complex type constraints
- Core package couples to adapter concerns
- Doesn't match framework idioms (Express doesn't need this, Next.js does)

**Why Rejected:**

Framework request types are fundamentally different:
- Express: `Request` with `headers: IncomingHttpHeaders`
- Next.js: `NextApiRequest` with `headers: Partial<IncomingHttpHeaders>`
- Future frameworks will have their own types (Fastify, Hono, etc.)

A core utility would need to handle all possible request types via:
- Complex type unions (`TRequest extends ExpressRequest | NextApiRequest | ...`)
- Type assertions (`as NextApiRequest`)
- Generic abstractions that leak framework details into core

This violates hexagonal architecture - **core should be framework-agnostic**.

### Alternative 2: Framework-Specific Helpers ✅ CHOSEN

**Implementation:**

```typescript
// @scenarist/nextjs-adapter/pages
export const getScenaristHeaders = (
  req: NextApiRequest,
  scenarist: ScenaristInstance,
): Record<string, string> => {
  const { testIdHeaderName, defaultTestId } = scenarist.config;
  const headerValue = req.headers[testIdHeaderName.toLowerCase()];
  const testId = (Array.isArray(headerValue) ? headerValue[0] : headerValue) || defaultTestId;
  return { [testIdHeaderName]: testId };
};

// Usage
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
const response = await fetch('http://api.com/data', {
  headers: {
    ...getScenaristHeaders(req, scenarist),
    'x-app-header': 'value',
  },
});
```

**Pros:**
- ✅ Type-safe without assertions
- ✅ Simple, clear API for each framework
- ✅ No core package dependency on framework types
- ✅ Each adapter can optimize for its framework's idioms
- ✅ Matches existing pattern (RequestContext is framework-specific)
- ✅ Framework authors understand their own request types best

**Cons:**
- ❌ Structural code duplication (~3 lines per adapter)
- ❌ Pattern must be documented for new adapter authors
- ❌ Changes to header extraction logic need updating multiple adapters

**Why Chosen:**

1. **Framework Request Types Fundamentally Differ:**
   - Each framework has different header representations
   - Express: `string | string[] | undefined`
   - Next.js: `string | string[] | undefined` (but different type structure)
   - Future frameworks: may use different patterns entirely

2. **Minimal Code Duplication:**
   - Actual logic is ~3 lines:
     ```typescript
     const headerValue = req.headers[headerName.toLowerCase()];
     const testId = (Array.isArray(headerValue) ? headerValue[0] : headerValue) || defaultTestId;
     return { [headerName]: testId };
     ```
   - This is **structural duplication** not **knowledge duplication**
   - Each framework implements the same **pattern**, not the same **business logic**

3. **No Abstraction Overhead:**
   - Framework-specific helpers are immediately type-safe
   - No generics, no type assertions, no complex constraints
   - Simple API: `getScenaristHeaders(req, scenarist)`

4. **Different Test ID Propagation Patterns:**
   - **Express**: Uses AsyncLocalStorage → middleware extracts test ID once → routes don't manually forward
   - **Next.js Pages**: No middleware support → routes must manually forward via `getScenaristHeaders()`
   - **Next.js App Router**: RSC context → different pattern needed (future)
   - Each framework has fundamentally different architecture for request context

5. **Consistent with Existing Patterns:**
   - Every adapter already implements framework-specific `RequestContext`
   - Header forwarding helpers follow the same pattern
   - Users expect framework-specific APIs in adapters

### Alternative 3: No Helper (Users DIY)

**Implementation:**

```typescript
// User code - no helper provided
const testId = (Array.isArray(req.headers['x-scenarist-test-id'])
  ? req.headers['x-scenarist-test-id'][0]
  : req.headers['x-scenarist-test-id']) || 'default-test';

const response = await fetch('http://api.com/data', {
  headers: { 'x-scenarist-test-id': testId },
});
```

**Pros:**
- No code to maintain
- Maximum flexibility for users

**Cons:**
- Boilerplate in every route
- Users must understand header array handling
- Easy to forget or get wrong
- Doesn't respect configured `testIdHeaderName` or `defaultTestId`

**Why Rejected:**

This is a common need (forwarding context to external APIs). Providing a helper:
- Reduces boilerplate
- Ensures correctness
- Documents the pattern
- Respects Scenarist configuration

## Consequences

### Positive

✅ **Type safety without complexity** - Each helper uses framework's native request type

✅ **Simple, ergonomic API** - No generics, no callbacks, no type assertions:
```typescript
headers: { ...getScenaristHeaders(req, scenarist) }
```

✅ **Framework-optimized** - Each adapter can use framework idioms (e.g., Express doesn't need this, Next.js does)

✅ **Maintains hexagonal architecture** - Core stays framework-agnostic, adapters handle framework specifics

✅ **Consistent pattern** - Matches how `RequestContext` is already implemented (framework-specific)

✅ **Self-documenting** - Import path tells you which framework: `@scenarist/nextjs-adapter/pages`

### Negative

❌ **Structural code duplication** - ~3 lines of similar logic per adapter

❌ **Pattern documentation required** - New adapter authors need guidance

❌ **Multi-adapter updates** - Changing header extraction requires updating all adapters

### Neutral

⚖️ **Trade-off accepted** - Slight duplication for better type safety, simpler API, and framework optimization

## Implementation Notes

### Pattern for New Adapters

When creating a new framework adapter, include header forwarding helper:

```typescript
// packages/{framework}-adapter/src/helpers.ts
import type { FrameworkRequest } from 'framework';
import type { ScenaristInstance } from '@scenarist/core';

/**
 * Extracts Scenarist headers from framework request for forwarding to external APIs.
 *
 * @example
 * ```typescript
 * const response = await fetch('http://api.com/data', {
 *   headers: {
 *     ...getScenaristHeaders(req, scenarist),
 *     'content-type': 'application/json',
 *   },
 * });
 * ```
 */
export const getScenaristHeaders = (
  req: FrameworkRequest,
  scenarist: ScenaristInstance,
): Record<string, string> => {
  const { testIdHeaderName, defaultTestId } = scenarist.config;
  const headerValue = req.headers[testIdHeaderName.toLowerCase()];
  const testId = (Array.isArray(headerValue) ? headerValue[0] : headerValue) || defaultTestId;
  return { [testIdHeaderName]: testId };
};
```

### Testing Strategy

Each adapter's helper should have behavior tests:

```typescript
describe('getScenaristHeaders', () => {
  it('should extract test ID from request headers', () => {
    const req = createMockRequest({ headers: { 'x-scenarist-test-id': 'test-123' } });
    const scenarist = createMockScenarist({ testIdHeaderName: 'x-scenarist-test-id' });

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-scenarist-test-id': 'test-123' });
  });

  it('should handle header as string array', () => {
    const req = createMockRequest({ headers: { 'x-scenarist-test-id': ['test-123', 'test-456'] } });
    const scenarist = createMockScenarist({ testIdHeaderName: 'x-scenarist-test-id' });

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-scenarist-test-id': 'test-123' });
  });

  it('should use default test ID when header missing', () => {
    const req = createMockRequest({ headers: {} });
    const scenarist = createMockScenarist({
      testIdHeaderName: 'x-scenarist-test-id',
      defaultTestId: 'default-test',
    });

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-scenarist-test-id': 'default-test' });
  });

  it('should respect configured header name', () => {
    const req = createMockRequest({ headers: { 'x-custom-id': 'test-789' } });
    const scenarist = createMockScenarist({ testIdHeaderName: 'x-custom-id' });

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-custom-id': 'test-789' });
  });
});
```

### Documentation Pattern

Include in adapter README under "Making External API Calls" section:

```markdown
## Making External API Calls

When your API routes need to make calls to external APIs (or other services mocked by Scenarist), you must forward the Scenarist headers so MSW can intercept with the correct scenario.

Use the `getScenaristHeaders()` helper:

\`\`\`typescript
import { getScenaristHeaders } from '@scenarist/{framework}-adapter';

export default async function handler(req, res) {
  const response = await fetch('http://external-api.com/data', {
    headers: {
      ...getScenaristHeaders(req, scenarist),
      'content-type': 'application/json',
    },
  });

  const data = await response.json();
  res.json(data);
}
\`\`\`

This ensures the `x-scenarist-test-id` header (or your configured test ID header) is forwarded, allowing Scenarist to apply the correct scenario for your test.
```

### When Helper is NOT Needed

Some frameworks don't need this helper:

- **Express** (with AsyncLocalStorage middleware) - Context automatically available
- **Any framework with global middleware** - Test ID extracted once, available everywhere

Document this in the adapter README:

```markdown
## Note on Header Forwarding

Express adapter uses AsyncLocalStorage to propagate test ID context automatically. You do NOT need to manually forward headers when making external API calls - the test ID is available to MSW handlers via the context.

If you're making calls to services outside the MSW boundary, you can access the test ID via:

\`\`\`typescript
import { getTestId } from '@scenarist/express-adapter';

const testId = getTestId(); // Available in any request context
\`\`\`
```

## Examples

### Next.js Pages Router

```typescript
// pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
import { scenarist } from '@/lib/scenarist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Forward Scenarist headers to external API
  const response = await fetch('http://localhost:3001/api/products', {
    headers: {
      ...getScenaristHeaders(req, scenarist),
      'content-type': 'application/json',
    },
  });

  const products = await response.json();
  res.json(products);
}
```

### Express (No Helper Needed)

```typescript
// routes/products.ts
import { Router } from 'express';

const router = Router();

// Middleware extracts test ID, AsyncLocalStorage makes it available
router.get('/api/products', async (req, res) => {
  // MSW handlers automatically receive test ID from AsyncLocalStorage
  const response = await fetch('http://localhost:3001/api/products');
  const products = await response.json();
  res.json(products);
});

export default router;
```

### Future: Fastify

```typescript
// routes/products.ts
import { getScenaristHeaders } from '@scenarist/fastify-adapter';

fastify.get('/api/products', async (request, reply) => {
  const response = await fetch('http://localhost:3001/api/products', {
    headers: {
      ...getScenaristHeaders(request, scenarist),
      'content-type': 'application/json',
    },
  });

  const products = await response.json();
  return products;
});
```

## Related Decisions

- [ADR-0001: Serializable Scenario Definitions](0001-serializable-scenario-definitions.md) - Core must stay framework-agnostic
- [ADR-0003: Testing Strategy](0003-testing-strategy.md) - Framework-specific helpers tested in adapters
- [ADR-0006: Thin Adapters with Real Integration Tests](0006-thin-adapters-real-integration-tests.md) - Pattern for adapter implementations

## Related Files

- `/packages/nextjs-adapter/src/pages/helpers.ts` - Next.js Pages Router implementation
- `/packages/nextjs-adapter/tests/pages/helpers.test.ts` - Behavior tests
- `/packages/express-adapter/src/middleware/test-id-middleware.ts` - Express AsyncLocalStorage pattern (why Express doesn't need helper)
- `/packages/express-adapter/src/context/express-request-context.ts` - Framework-specific RequestContext (parallel pattern)

## References

- [Next.js API Routes Documentation](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Express AsyncLocalStorage Middleware Pattern](https://nodejs.org/api/async_context.html)
- [Hexagonal Architecture - Framework Independence](https://alistair.cockburn.us/hexagonal-architecture/)
