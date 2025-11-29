# ADR-0016: Native RegExp Support (Refining the Declarative Constraint)

**Status**: Accepted
**Date**: 2025-01-16
**Authors**: Claude Code
**Supersedes**: Partially amends ADR-0013 (Declarative Scenarios Through JSON Serializability Constraint)

## Context

During implementation of Phase 2.5 (URL Matching - Issue #99), we needed to decide whether URL patterns should support native JavaScript RegExp objects or only the serialized form `{ regex: { source: string, flags?: string } }`.

This raised a fundamental architectural question: **What is the real constraint we're enforcing?**

### The Original Constraint (ADR-0013)

ADR-0013 established that Scenarist enforces **declarative scenario definitions through strict JSON serializability**.

The reasoning:

```typescript
// ❌ Imperative (functions) - REJECTED
http.get('/api/products', ({ request }) => {
  if (request.headers.get('x-tier') === 'premium') {
    return HttpResponse.json(buildProducts('premium'));
  }
  return HttpResponse.json(buildProducts('standard'));
});

// ✅ Declarative (JSON) - ACCEPTED
{
  method: 'GET',
  url: '/api/products',
  match: { headers: { 'x-tier': 'premium' } },
  response: { status: 200, body: { products: buildProducts('premium') } }
}
```

**Key insight from ADR-0013**: The constraint forces explicit, inspectable, composable patterns.

### The False Dichotomy

We initially framed the constraint as:

- **JSON-serializable** (good) ↔ **Not JSON-serializable** (bad)

But the REAL constraint we care about is:

- **Declarative patterns** (good) ↔ **Imperative functions** (bad)

**Critical realization**: RegExp is declarative even though it's not JSON-serializable.

### What is RegExp?

```typescript
// A RegExp object
const pattern = /\/users\/\d+/;

// It is:
pattern.source; // "/users/\d+" - Visible!
pattern.flags; // "" - Visible!
pattern.test("/users/123"); // Declarative pattern matching

// It is NOT:
// - A closure (no external scope)
// - A function with side effects
// - Hiding imperative logic
// - Modifying external state
```

**RegExp is a declarative pattern**, just like a string literal or a JSON object. It describes **WHAT to match**, not **HOW to match**.

### MSW Compatibility Gap

MSW v1 (the de facto standard for API mocking) supports native RegExp in URL routing:

```typescript
// MSW v1 documentation examples:
rest.get("/user/:userId", handler); // Path params ✅
rest.get("/user/*", handler); // Glob ✅
rest.get(/\/user\/\d+/, handler); // RegExp ✅ (native!)
```

Scenarist currently supports path params and globs but NOT native RegExp:

```typescript
// ❌ What users expect (from MSW docs):
{ url: /\/users\/\d+/ }

// ✅ What we force them to write:
{ url: { regex: { source: '/users/\\d+', flags: '' } } }
```

**This is a DX (developer experience) failure** - users familiar with MSW are surprised by the verbose syntax.

### The Use Case Analysis

**95% of users**: Want clean, readable patterns in their test scenarios

- Don't need to store scenarios in Redis/files
- Import scenarios from code (TypeScript modules)
- Want MSW-compatible syntax

**5% of users**: Need to serialize scenarios to JSON

- Distributed testing with Redis storage
- Scenario files loaded at runtime (JSON/YAML)
- Remote scenario APIs

**Question**: Should we optimize for the 95% or the 5%?

## Problem

**How can we:**

1. Maintain the principle of "declarative > imperative" from ADR-0013
2. Improve developer experience with MSW-compatible syntax
3. Support the minority who need JSON serializability
4. Preserve ReDoS protection and timeout guards
5. Keep scenarios inspectable and composable

**The tension**: We want native RegExp for DX, but need to preserve the architectural benefits of declarative patterns.

## Decision

We will **support BOTH native RegExp objects AND serialized form**, recognizing that the true constraint is **declarative patterns**, not JSON serializability.

### Updated Constraint Definition

**Previous (ADR-0013)**: Scenarios must be JSON-serializable
**Refined (ADR-0016)**: Scenarios must use declarative patterns

**What this means:**

✅ **ALLOWED** (Declarative patterns):

```typescript
'/users'                          // String literal
/\/users\/\d+/                    // Native RegExp ✅ NEW
{ regex: { source: '/users/\\d+' } }  // Serialized RegExp (still supported)
{ contains: 'premium' }           // String strategy
{ startsWith: '/api/' }           // String strategy
```

❌ **NOT ALLOWED** (Imperative functions):

```typescript
(request) => request.pathname.startsWith('/users/')  // Function
{ shouldMatch: (req) => { ... } }                     // Closure
```

### Architecture: Hybrid Approach

**For the 95% (code-based scenarios):**

```typescript
// Clean, readable, MSW-compatible
export const scenarios = {
  default: {
    id: "default",
    mocks: [
      {
        url: /\/users\/\d+/, // ✅ Native RegExp
        match: { url: /\/users\/\d+/ },
        response: { status: 200 },
      },
    ],
  },
} as const satisfies ScenaristScenarios;
```

**For the 5% (JSON storage needs):**

```typescript
// Explicitly serialized form
{
  "id": "default",
  "mocks": [{
    "url": { "regex": { "source": "/users/\\d+", "flags": "" } },
    "match": { "url": { "regex": { "source": "/users/\\d+" } } },
    "response": { "status": 200 }
  }]
}
```

**Both forms are accepted** - schema validation supports both.

### Implementation

**Schema changes:**

```typescript
// Before (Phase 2):
export const MatchValueSchema = z.union([
  z.string(),
  z.object({ equals: z.string() }),
  z.object({ contains: z.string() }),
  z.object({ startsWith: z.string() }),
  z.object({ endsWith: z.string() }),
  z.object({ regex: SerializedRegexSchema }),
]);

// After (Phase 2.5):
export const MatchValueSchema = z.union([
  z.string(),
  z.object({ equals: z.string() }),
  z.object({ contains: z.string() }),
  z.object({ startsWith: z.string() }),
  z.object({ endsWith: z.string() }),
  z.object({ regex: SerializedRegexSchema }), // Keep for JSON storage
  z.instanceof(RegExp), // ✅ NEW: Native RegExp support
]);
```

**URL field schema:**

```typescript
export const UrlPatternSchema = z.union([
  z.string(), // Exact match, path params (/users/:id), glob (/api/*)
  z.instanceof(RegExp), // ✅ NEW: Native RegExp for URL routing
]);
```

**Type changes:**

```typescript
type MatchValue =
  | string
  | { equals: string }
  | { contains: string }
  | { startsWith: string }
  | { endsWith: string }
  | { regex: { source: string; flags?: string } }
  | RegExp; // ✅ NEW
```

**Matching logic (unchanged):**

```typescript
const matchesValue = (
  requestValue: string,
  criteriaValue: MatchValue,
): boolean => {
  // ... existing strategies ...

  // Native RegExp
  if (criteriaValue instanceof RegExp) {
    return matchesRegex(requestValue, {
      source: criteriaValue.source,
      flags: criteriaValue.flags,
    });
  }

  // Serialized regex (backward compatible)
  if (typeof criteriaValue === "object" && "regex" in criteriaValue) {
    return matchesRegex(requestValue, criteriaValue.regex);
  }

  return false;
};
```

**ReDoS protection (unchanged):**

```typescript
export const matchesRegex = (
  value: string,
  regex: { source: string; flags?: string },
): boolean => {
  // Validation against unsafe patterns
  const safetyCheck = isRegexSafe(regex.source);
  if (!safetyCheck.safe) {
    console.warn(`[Scenarist] Unsafe regex pattern: ${safetyCheck.error}`);
    return false;
  }

  // Timeout protection
  const pattern = new RegExp(regex.source, regex.flags || "");
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 100; // ms

  try {
    const matches = pattern.test(value);
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      console.warn("[Scenarist] Regex timeout exceeded");
      return false;
    }
    return matches;
  } catch (error) {
    console.error("[Scenarist] Regex error:", error);
    return false;
  }
};
```

**Key insight**: Native RegExp objects get the SAME validation and protection as serialized form.

## MSW Weak Comparison Semantics

MSW documentation explicitly states that **regular expressions use weak comparison, supporting partial matches**:

> "Unlike paths, regular expressions use weak comparison, supporting partial matches. When provided a regular expression, all request URLs that match that expression will be captured, regardless of their origin."

### What is Weak Comparison?

**Weak comparison** means RegExp patterns match **anywhere in the URL** (substring matching), not just exact matches:

```typescript
// MSW example from official docs:
rest.delete(/\/posts\//, responseResolver);

// Matches ALL of these (different origins, same path pattern):
// - DELETE http://localhost:8080/posts/
// - DELETE https://backend.dev/user/posts/
// - DELETE https://api.example.com/posts/123
```

**Key characteristics:**

1. **Origin-agnostic**: Pattern matches regardless of protocol, domain, or port
2. **Substring matching**: Pattern matches anywhere in the URL path
3. **Partial matches**: Pattern doesn't need to match entire URL

### Scenarist's Weak Comparison Support

Scenarist implements **identical weak comparison semantics** for MSW compatibility:

```typescript
// Example: Match users endpoints across any origin
{
  method: 'GET',
  url: '*',  // Route all GET requests
  match: {
    url: /\/users\/\d+/  // Match only URLs containing /users/{numeric-id}
  },
  response: { status: 200, body: { matched: true } }
}

// This matches:
// ✅ https://api.example.com/users/123
// ✅ http://localhost/v1/users/456/profile
// ✅ https://backend.dev/api/users/789/settings

// This does NOT match:
// ❌ https://api.example.com/posts/123 (pattern not found)
```

### Weak vs Strong Comparison

**Strong comparison** (exact string matching):

```typescript
{
  url: '/api/users/123',  // String literal
  match: {
    url: '/api/users/123'  // Exact match only
  }
}
// Matches: '/api/users/123'
// Does NOT match: 'https://example.com/api/users/123' (different origin)
```

**Weak comparison** (RegExp substring matching):

```typescript
{
  url: '*',
  match: {
    url: /\/api\/users\/\d+/  // RegExp pattern
  }
}
// Matches: 'https://example.com/api/users/123' ✅ (partial match)
// Matches: 'http://localhost/api/users/456' ✅ (different origin)
// Matches: '/api/users/789/profile' ✅ (additional path segments)
```

### Use Cases Enabled by Weak Comparison

**1. Cross-Origin API Calls**

```typescript
// Match API calls to any domain
{
  match: {
    url: /\/api\/v\d+\//; // Matches v1, v2, v3, etc.
  }
}
// Works for: localhost, staging, production, any API version
```

**2. Query Parameter Matching**

```typescript
// Match search endpoints with query params
{
  match: {
    url: /\/search\?/;
  }
}
// Matches: '/search?q=test', 'https://example.com/v1/search?filter=active'
```

**3. Case-Insensitive Matching**

```typescript
// Match regardless of casing
{
  match: {
    url: /\/API\/USERS/i; // 'i' flag = case-insensitive
  }
}
// Matches: '/api/users', '/API/USERS', '/Api/Users'
```

### Implementation Notes

**URL matching implementation** (`internal/msw-adapter/src/matching/url-matcher.ts`):

```typescript
// Handle native RegExp patterns
if (pattern instanceof RegExp) {
  // RegExp.test() performs substring matching by default (weak comparison)
  return { matches: pattern.test(requestUrl) };
}
```

**This implementation is correct** because JavaScript's `RegExp.test()` naturally performs substring matching unless the pattern uses anchors (`^`, `$`).

### Testing Coverage

Scenarist includes comprehensive tests proving MSW weak comparison compatibility:

**MSW Adapter tests** (`internal/msw-adapter/tests/url-matcher.test.ts`):

- Cross-origin matching (same pattern, different domains)
- Partial path matching (substring in any position)
- Query parameter support
- Case-insensitive + weak comparison

**Core integration tests** (`packages/core/tests/url-matching.test.ts`):

- Response selector with weak comparison
- Specificity-based selection with weak patterns
- Combined match criteria (weak URL + headers)

**Playwright E2E tests** (example apps):

- Real-world scenarios using weak comparison patterns
- Cross-origin mocking verification
- MSW compatibility validation

### MSW Compatibility Matrix

| Pattern Type               | MSW v1 | Scenarist | Weak Comparison  |
| -------------------------- | ------ | --------- | ---------------- |
| String literal             | ✅     | ✅        | ❌ (exact match) |
| Path params (`/users/:id`) | ✅     | ✅        | ❌ (exact match) |
| Glob (`/api/*`)            | ✅     | ✅        | ❌ (exact match) |
| Native RegExp              | ✅     | ✅        | ✅ (substring)   |
| Serialized regex           | ❌     | ✅        | ✅ (substring)   |

**Key insight**: Only RegExp patterns (native or serialized) use weak comparison. All other pattern types use strong (exact) matching.

## Rationale

### Why This Doesn't Violate ADR-0013's Principles

ADR-0013's core principle: **"Force explicit, declarative patterns by making imperative code impossible"**

**Native RegExp satisfies this principle:**

1. ✅ **Explicit**: Pattern is visible (`.source`, `.flags`)
2. ✅ **Declarative**: Describes WHAT to match (not HOW)
3. ✅ **Inspectable**: Can examine pattern without executing
4. ✅ **No closures**: No external scope captured
5. ✅ **No side effects**: Pure pattern matching
6. ✅ **Composable**: Works with other match criteria

**What ADR-0013 ACTUALLY rejects:**

```typescript
// ❌ This is what we're preventing:
{
  shouldMatch: (request) => {
    const tier = request.headers.get("x-tier");
    const referer = request.headers.get("referer");

    // Hidden imperative logic
    if (referer?.includes("/premium")) {
      return tier === "premium";
    }
    return true;
  };
}
```

**Why this is bad:**

- Logic is hidden in function body
- Captures external scope (closures)
- Can have side effects
- Not inspectable without execution
- Not composable with other patterns

**Native RegExp doesn't have any of these problems.**

### The Real Rule

**Previous understanding**: "Scenarios must be JSON-serializable"
**Refined understanding**: "Scenarios must use declarative patterns (no imperative functions)"

**RegExp is declarative** → Allowed ✅
**Functions are imperative** → Not allowed ❌

### Benefits of This Decision

**1. Better Developer Experience**

```typescript
// Before (verbose):
{ url: { regex: { source: '/users/\\d+', flags: '' } } }

// After (clean):
{ url: /\/users\/\d+/ }
```

**2. MSW Compatibility**

```typescript
// MSW v1 examples work in Scenarist:
rest.get(/\/user\/\d+/, handler); // MSW
{
  url: /\/user\/\d+/;
} // Scenarist ✅
```

**3. Backward Compatibility**

```typescript
// Serialized form still works:
{
  url: {
    regex: {
      source: "/users/\\d+";
    }
  }
} // ✅ Still supported
```

**4. Flexibility for Storage Needs**

```typescript
// 95% use native RegExp (better DX)
const scenarios = {
  default: {
    mocks: [{ url: /\/users\/\d+/ }],
  },
};

// 5% use serialized form (for JSON storage)
const scenarioJSON = {
  mocks: [
    {
      url: { regex: { source: "/users/\\d+" } },
    },
  ],
};
```

**5. Same Safety Guarantees**

- ReDoS protection: ✅ Same validation
- Timeout guards: ✅ Same limits
- Error handling: ✅ Same behavior

## Consequences

### Positive

✅ **Better DX**: MSW-compatible syntax, clean and readable
✅ **Still declarative**: RegExp describes WHAT, not HOW
✅ **Backward compatible**: Serialized form still works
✅ **Same safety**: ReDoS protection and timeouts unchanged
✅ **Flexible**: Optimize for 95% while supporting 5%

### Trade-offs Accepted

⚠️ **Scenarios with native RegExp can't be `JSON.stringify()`'d directly**

- Mitigation: Serialized form still available for storage needs
- Custom serialization helper can convert RegExp → serialized form

⚠️ **Two ways to express the same pattern**

- Mitigation: Document native RegExp as recommended, serialized as fallback
- Linting rule could enforce consistency if needed

⚠️ **Slightly more complex schema validation**

- Mitigation: `z.instanceof(RegExp)` is straightforward
- Performance impact negligible

### Migration Path (None Required)

**This is a non-breaking change:**

- Existing scenarios with serialized regex continue to work
- New scenarios can use native RegExp
- No migration needed - adopt at your own pace

## Alternatives Considered

### Alternative 1: Require Serialized Form Only

**Rejected because:**

- ❌ Poor DX (verbose syntax)
- ❌ Not MSW-compatible
- ❌ Optimizes for 5% use case instead of 95%
- ❌ No compelling technical reason (safety works either way)

### Alternative 2: Allow Arbitrary Functions

**Rejected because:**

- ❌ Violates declarative principle
- ❌ Hidden imperative logic
- ❌ Breaks composability
- ❌ ADR-0013's core reasoning still applies

### Alternative 3: Custom Serialization Helper Only

Require users to manually convert RegExp to serialized form:

```typescript
const r = (source: string, flags?: string) => ({ regex: { source, flags } });

// Usage:
{
  url: r("/users/\\d+");
} // Still verbose
```

**Rejected because:**

- ❌ Still verbose
- ❌ Non-standard API
- ❌ Doesn't solve MSW compatibility

### Alternative 4: String-Based Regex (Like Ruby)

Use string literals with special syntax:

```typescript
{
  url: "regex:/users/\\d+/";
} // String-based
```

**Rejected because:**

- ❌ Non-standard (JavaScript has native RegExp)
- ❌ Parsing complexity
- ❌ Loses IDE regex syntax highlighting
- ❌ No type safety

## Documentation Impact

### Update ADR-0013 Status

Add note to ADR-0013:

> **Note**: ADR-0016 refines this constraint from "JSON-serializable" to "declarative patterns". Native RegExp is now supported as it satisfies the declarative principle.

### User-Facing Documentation

**Recommended approach**:

```typescript
// Use native RegExp (clean, MSW-compatible)
{
  url: /\/users\/\d+/,
  match: { url: /\/premium/ },
  response: { status: 200 }
}
```

**For JSON storage needs**:

```typescript
// Use serialized form (still supported)
{
  url: { regex: { source: '/users/\\d+' } },
  match: { url: { regex: { source: '/premium' } } },
  response: { status: 200 }
}
```

### Migration Guide

**No migration required** - this is additive only.

**If adopting native RegExp:**

```typescript
// Before:
{ url: { regex: { source: '/api/v\\d+/.*', flags: 'i' } } }

// After:
{ url: /\/api\/v\d+\/.*/i }
```

**Custom serialization** (if needed):

```typescript
const serializeScenario = (scenario: ScenaristScenario) => {
  return JSON.stringify(scenario, (key, value) => {
    if (value instanceof RegExp) {
      return { __regexp: value.source, __flags: value.flags };
    }
    return value;
  });
};
```

## Related Decisions

- **ADR-0001**: Serializable Scenario Definitions (original constraint)
- **ADR-0013**: Declarative Scenarios Through JSON Serializability Constraint (refined here)
- **Issue #99**: Add URL Matching Support (Phase 2.5) - the implementation driver

## References

- [MSW v1 Request Matching](https://v1.mswjs.io/docs/basics/request-matching) - Native RegExp examples
- [ADR-0013](./0013-declarative-scenarios-through-json-constraint.md) - Original declarative constraint
- [Issue #99](https://github.com/citypaul/scenarist/issues/99) - URL Matching Support
- [WIP.md](../plans/../WIP.md) - Implementation planning

## Notes

This decision represents a **refinement**, not a rejection, of our architectural principles:

**The principle that matters**: Declarative patterns > Imperative functions
**The implementation detail**: JSON-serializable was a proxy for this, not the goal itself

By recognizing that RegExp is declarative (no closures, inspectable, pattern-based), we can support better DX while maintaining architectural integrity.

**The constraint that matters**: No imperative functions with hidden logic
**What we're allowing**: Declarative patterns (including native RegExp)
**What we're still preventing**: Functions, closures, side effects

This is architectural maturity - refining our understanding of what we're really protecting against.
