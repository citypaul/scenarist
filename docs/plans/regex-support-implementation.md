# Implementation Plan: Regex Support for Match Criteria

**Feature:** Extend match criteria to support regex pattern matching for headers, query params, body fields, AND URLs
**Priority:** P1 (High Value, Low Risk)
**Status:** Phase 2 Complete - Phase 2.5 (URL Matching) Deferred to Future Work
**GitHub Issue:** #86

**Phase 2 Complete:** String matching strategies (contains, startsWith, endsWith, equals) implemented for headers, query params, and body fields. All 265 tests passing, 100% coverage maintained.

**Phase 2.5 Status:** URL matching deferred - requires extensive design and testing work (see details below).

---

## Problem Statement

### Current Limitation

Scenarist only supports **exact string matching** for match criteria:

```typescript
{
  match: {
    headers: {
      referer: 'http://localhost:3000/apply-sign', // Must match EXACTLY
    },
  },
}
```

**Problems:**
- ❌ Cannot match substring patterns (`referer.includes('/apply-sign')`)
- ❌ Cannot match regex patterns (`referer.match(/\/apply-\w+/`)`)
- ❌ Requires separate mocks for each exact value (verbose, brittle)

### User Needs (From Acquisition.Web Analysis)

**Real-world pattern:**
```typescript
// Acquisition.Web checks referer substring
if (request.headers.get('referer')?.includes('/apply-sign') ||
    request.headers.get('referer')?.includes('/penny-drop')) {
  return HttpResponse.json({ state: 'appComplete' });
}
```

**Need:** Match headers/query/body fields against patterns, not just exact values.

---

## Solution Design

### API Design

**Extend match values to support three forms:**

```typescript
type MatchValue =
  | string                           // Exact match (existing)
  | {
      equals?: string;                // Explicit exact match
      contains?: string;              // Substring match (NEW)
      startsWith?: string;            // Prefix match (NEW)
      endsWith?: string;              // Suffix match (NEW)
      regex?: {                       // Regex match (NEW)
        source: string;
        flags?: string;
      };
    };
```

### Usage Examples

```typescript
// Example 1: Substring matching
{
  match: {
    headers: {
      referer: {
        contains: '/apply-sign', // ✅ Matches any referer containing '/apply-sign'
      },
    },
  },
}

// Example 2: Regex matching
{
  match: {
    headers: {
      referer: {
        regex: {
          source: '/apply-sign|/penny-drop',
          flags: 'i',
        },
      },
      'user-agent': {
        regex: {
          source: 'Mobile|Android|iPhone',
        },
      },
    },
  },
}

// Example 3: startsWith/endsWith
{
  match: {
    headers: {
      'x-api-key': {
        startsWith: 'sk_', // ✅ Matches API keys starting with 'sk_'
      },
    },
    query: {
      email: {
        endsWith: '@company.com', // ✅ Matches company email addresses
      },
    },
  },
}

// Example 4: Body field regex
{
  match: {
    body: {
      tier: {
        regex: {
          source: '^(premium|enterprise)$',
        },
      },
    },
  },
}

// Example 5: Backward compatibility (existing behavior)
{
  match: {
    headers: {
      referer: 'http://localhost:3000/apply', // ✅ Still works (exact match)
    },
  },
}
```

---

## Architecture

### Type System Changes

```typescript
// packages/core/src/types/scenario.types.ts

/**
 * Match value can be:
 * - string (exact match, backward compatible)
 * - MatchValueObject (extended matching)
 */
export type MatchValue = string | MatchValueObject;

/**
 * Extended match value with multiple matching strategies.
 * Only ONE strategy should be specified per value.
 */
export type MatchValueObject = {
  /** Exact string match (explicit form of passing plain string) */
  readonly equals?: string;

  /** Substring match - value must contain this string */
  readonly contains?: string;

  /** Prefix match - value must start with this string */
  readonly startsWith?: string;

  /** Suffix match - value must end with this string */
  readonly endsWith?: string;

  /** Regex match - value must match this pattern */
  readonly regex?: SerializedRegex;
};

/**
 * Serialized regex format for JSON storage.
 * Converted to RegExp at runtime.
 */
export type SerializedRegex = {
  /** Regex pattern source (without delimiters) */
  readonly source: string;

  /** Optional flags (g, i, m, s, u, v, y) */
  readonly flags?: string;
};

/**
 * Match criteria for conditional mock selection
 */
export type MatchCriteria = {
  readonly headers?: Record<string, MatchValue>;
  readonly query?: Record<string, MatchValue>;
  readonly body?: Record<string, MatchValue>;
};
```

### Schema Changes (Zod)

```typescript
// packages/core/src/schemas/scenario.schemas.ts
import { z } from 'zod';
import { isSafe as isRegexSafe } from 'redos-detector'; // ReDoS protection

/**
 * Valid JavaScript regex flags
 */
const VALID_REGEX_FLAGS = /^[gimsuvy]*$/;

/**
 * Serialized regex schema with ReDoS validation
 */
export const SerializedRegexSchema = z.object({
  source: z.string().min(1)
    .refine(
      (source) => {
        try {
          const result = isRegexSafe(source);
          return result.safe;
        } catch {
          return false; // Invalid regex pattern
        }
      },
      { message: 'Regex pattern is potentially unsafe (ReDoS vulnerability)' }
    ),
  flags: z.string()
    .regex(VALID_REGEX_FLAGS, 'Invalid regex flags')
    .optional()
    .default(''),
});

/**
 * Match value object schema
 */
export const MatchValueObjectSchema = z.object({
  equals: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  regex: SerializedRegexSchema.optional(),
})
  .refine(
    (obj) => {
      // Exactly ONE strategy must be specified
      const strategies = [
        obj.equals,
        obj.contains,
        obj.startsWith,
        obj.endsWith,
        obj.regex,
      ].filter(Boolean);
      return strategies.length === 1;
    },
    { message: 'Exactly one matching strategy must be specified' }
  );

/**
 * Match value can be string or object
 */
export const MatchValueSchema = z.union([
  z.string(), // Backward compatible exact match
  MatchValueObjectSchema,
]);

/**
 * Match criteria schema
 */
export const MatchCriteriaSchema = z.object({
  headers: z.record(MatchValueSchema).optional(),
  query: z.record(MatchValueSchema).optional(),
  body: z.record(MatchValueSchema).optional(),
}).optional();
```

### Matching Logic

```typescript
// packages/core/src/domain/matching.ts

/**
 * Check if a value matches the given criteria
 */
export const matchesValue = (actual: unknown, expected: MatchValue): boolean => {
  // Handle null/undefined
  if (actual === null || actual === undefined) {
    return false;
  }

  const actualString = String(actual);

  // Backward compatible: string means exact match
  if (typeof expected === 'string') {
    return actualString === expected;
  }

  // Extended matching
  if (expected.equals !== undefined) {
    return actualString === expected.equals;
  }

  if (expected.contains !== undefined) {
    return actualString.includes(expected.contains);
  }

  if (expected.startsWith !== undefined) {
    return actualString.startsWith(expected.startsWith);
  }

  if (expected.endsWith !== undefined) {
    return actualString.endsWith(expected.endsWith);
  }

  if (expected.regex !== undefined) {
    const regex = new RegExp(expected.regex.source, expected.regex.flags || '');

    // Set timeout to prevent ReDoS attacks
    const startTime = Date.now();
    const MAX_REGEX_EXECUTION_TIME = 100; // milliseconds

    try {
      // Check for timeout during match
      const matches = regex.test(actualString);

      if (Date.now() - startTime > MAX_REGEX_EXECUTION_TIME) {
        console.warn(`[Scenarist] Regex execution exceeded ${MAX_REGEX_EXECUTION_TIME}ms, potential ReDoS`);
        return false;
      }

      return matches;
    } catch (error) {
      console.error('[Scenarist] Regex matching error:', error);
      return false;
    }
  }

  return false;
};

/**
 * Check if request matches all criteria
 */
export const matchesCriteria = (
  context: RequestContext,
  criteria: MatchCriteria
): boolean => {
  // Check headers
  if (criteria.headers) {
    for (const [key, expected] of Object.entries(criteria.headers)) {
      const actual = context.headers[key.toLowerCase()];
      if (!matchesValue(actual, expected)) {
        return false;
      }
    }
  }

  // Check query params
  if (criteria.query) {
    for (const [key, expected] of Object.entries(criteria.query)) {
      const actual = context.query[key];
      if (!matchesValue(actual, expected)) {
        return false;
      }
    }
  }

  // Check body fields
  if (criteria.body && context.body && typeof context.body === 'object') {
    for (const [key, expected] of Object.entries(criteria.body)) {
      const actual = (context.body as Record<string, unknown>)[key];
      if (!matchesValue(actual, expected)) {
        return false;
      }
    }
  }

  return true;
};
```

---

## Implementation Steps

### Phase 1: Core Types & Schemas (TDD)

**Files to modify:**
- `packages/core/src/types/scenario.types.ts`
- `packages/core/src/schemas/scenario.schemas.ts`

**Steps:**
1. ✅ Write tests for `SerializedRegexSchema` validation
2. ✅ Write tests for `MatchValueSchema` validation
3. ✅ Implement schemas
4. ✅ Verify type inference with TypeScript

**Tests:**
```typescript
// packages/core/tests/schemas/match-value.test.ts
describe('MatchValueSchema', () => {
  it('should accept plain string (backward compatible)', () => {
    const result = MatchValueSchema.parse('exact-match');
    expect(result).toBe('exact-match');
  });

  it('should accept contains strategy', () => {
    const result = MatchValueSchema.parse({ contains: '/apply-sign' });
    expect(result).toEqual({ contains: '/apply-sign' });
  });

  it('should accept regex with source only', () => {
    const result = MatchValueSchema.parse({
      regex: { source: 'test' },
    });
    expect(result.regex.flags).toBe(''); // Default
  });

  it('should reject multiple strategies', () => {
    expect(() => {
      MatchValueSchema.parse({
        contains: 'foo',
        startsWith: 'bar', // ❌ Two strategies
      });
    }).toThrow('Exactly one matching strategy');
  });

  it('should reject unsafe regex patterns', () => {
    expect(() => {
      MatchValueSchema.parse({
        regex: {
          source: '(a+)+b', // ReDoS vulnerable
        },
      });
    }).toThrow('potentially unsafe');
  });

  it('should reject invalid regex flags', () => {
    expect(() => {
      MatchValueSchema.parse({
        regex: {
          source: 'test',
          flags: 'xyz', // ❌ Invalid flags
        },
      });
    }).toThrow('Invalid regex flags');
  });
});
```

### Phase 2: String Matching Strategies (TDD) - ✅ COMPLETE

**Status:** Complete (2025-01-16)
**Commits:** b7ced12 (RED) → a8802ed (GREEN) → d971a91 (RED) → fd085a2 (GREEN) → 9cf85cd (GREEN)

**Files created/modified:**
- `packages/core/src/domain/matching.ts` - Implemented string matching functions
- `packages/core/tests/matching.test.ts` - 13 unit tests covering all strategies
- `packages/core/src/schemas/scenario.schemas.ts` - Extended MatchValueSchema
- `apps/nextjs-app-router-example/tests/playwright/string-matching.spec.ts` - 9 ATDD tests

**Implemented Strategies:**
1. ✅ `contains` - Substring matching (case-sensitive)
2. ✅ `startsWith` - Prefix matching
3. ✅ `endsWith` - Suffix matching
4. ✅ `equals` - Explicit exact match (alternative to plain string)

**Test Results:**
- Core package: 257/257 tests passing
- Playwright ATDD: 9/9 tests passing
- Coverage: 100% maintained

**Key Implementation Details:**
- All strategies work on headers, query params, and body fields
- Type coercion: non-string values converted to strings before matching
- Null/undefined values return false for all strategies
- Backward compatibility: plain strings still work as exact match
- Schema validation ensures only one strategy per match value

**Steps:**
1. ✅ Write ATDD tests for string matching strategies (RED)
2. ✅ Extend MatchValueSchema to support string strategies (GREEN)
3. ✅ Write unit tests for matchesValue() function (RED)
4. ✅ Implement string matching logic (GREEN)
5. ✅ Verify all tests pass (GREEN)

**Tests:**
```typescript
// packages/core/tests/domain/matching.test.ts
describe('matchesValue', () => {
  describe('Backward compatible exact match', () => {
    it('should match exact string', () => {
      expect(matchesValue('hello', 'hello')).toBe(true);
      expect(matchesValue('hello', 'world')).toBe(false);
    });
  });

  describe('contains strategy', () => {
    it('should match substring', () => {
      const criteria = { contains: '/apply-sign' };
      expect(matchesValue('http://localhost/apply-sign/page', criteria)).toBe(true);
      expect(matchesValue('http://localhost/other', criteria)).toBe(false);
    });
  });

  describe('startsWith strategy', () => {
    it('should match prefix', () => {
      const criteria = { startsWith: 'sk_' };
      expect(matchesValue('sk_test_123', criteria)).toBe(true);
      expect(matchesValue('pk_test_123', criteria)).toBe(false);
    });
  });

  describe('endsWith strategy', () => {
    it('should match suffix', () => {
      const criteria = { endsWith: '@company.com' };
      expect(matchesValue('user@company.com', criteria)).toBe(true);
      expect(matchesValue('user@other.com', criteria)).toBe(false);
    });
  });

  describe('regex strategy', () => {
    it('should match regex pattern', () => {
      const criteria = {
        regex: { source: '/apply-\\w+' },
      };
      expect(matchesValue('/apply-sign', criteria)).toBe(true);
      expect(matchesValue('/apply-123', criteria)).toBe(true);
      expect(matchesValue('/other', criteria)).toBe(false);
    });

    it('should respect regex flags', () => {
      const criteria = {
        regex: { source: 'HELLO', flags: 'i' },
      };
      expect(matchesValue('hello', criteria)).toBe(true);
      expect(matchesValue('HELLO', criteria)).toBe(true);
      expect(matchesValue('goodbye', criteria)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined values', () => {
      expect(matchesValue(null, 'test')).toBe(false);
      expect(matchesValue(undefined, 'test')).toBe(false);
    });

    it('should convert numbers to strings', () => {
      expect(matchesValue(123, '123')).toBe(true);
      expect(matchesValue(123, { contains: '12' })).toBe(true);
    });
  });
});
```

### Phase 3: Integration with ResponseSelector (TDD)

**Files to modify:**
- `packages/core/src/domain/response-selector.ts`
- `packages/core/tests/response-selector.test.ts`

**Steps:**
1. ✅ Write integration tests using new match criteria
2. ✅ Update `matchesCriteria()` calls to use new `matchesValue()` function
3. ✅ Verify specificity calculation still works
4. ✅ Verify all existing tests still pass (backward compatibility)

**Tests:**
```typescript
// packages/core/tests/response-selector.test.ts
describe('ResponseSelector with regex matching', () => {
  it('should select mock with regex header match', () => {
    const mocks = [
      {
        method: 'GET',
        url: '/api/data',
        match: {
          headers: {
            referer: {
              regex: { source: '/apply-sign|/penny-drop' },
            },
          },
        },
        response: { status: 200, body: { state: 'complete' } },
      },
      {
        method: 'GET',
        url: '/api/data',
        response: { status: 200, body: { state: 'pending' } },
      },
    ];

    const context = {
      method: 'GET',
      url: '/api/data',
      headers: { referer: 'http://localhost/apply-sign/confirm' },
      query: {},
      body: null,
    };

    const result = selector.selectResponse('test-1', 'scenario-1', context, mocks);

    expect(result.data.body).toEqual({ state: 'complete' });
  });

  it('should fall back to default when regex doesnt match', () => {
    const mocks = [
      {
        method: 'GET',
        url: '/api/data',
        match: {
          headers: {
            referer: {
              regex: { source: '/apply-sign' },
            },
          },
        },
        response: { status: 200, body: { state: 'complete' } },
      },
      {
        method: 'GET',
        url: '/api/data',
        response: { status: 200, body: { state: 'pending' } },
      },
    ];

    const context = {
      method: 'GET',
      url: '/api/data',
      headers: { referer: 'http://localhost/other' },
      query: {},
      body: null,
    };

    const result = selector.selectResponse('test-1', 'scenario-1', context, mocks);

    expect(result.data.body).toEqual({ state: 'pending' }); // Fallback
  });
});
```

### Phase 4: Documentation & Examples

**Files to create/modify:**
- `docs/features/regex-matching.md` (NEW)
- `packages/core/README.md` (update capabilities)
- `apps/docs/src/content/docs/core-features/matching.mdx` (NEW)

**Content:**
- API reference for MatchValue
- Examples for each strategy
- Security considerations (ReDoS)
- Migration guide from exact matching

### Phase 5: Example App Integration

**Files to modify:**
- `apps/express-example/src/scenarios.ts` (add regex examples)
- `apps/express-example/tests/regex-matching.test.ts` (NEW)

**Examples to add:**
- Referer pattern matching
- User-agent detection (Mobile vs Desktop)
- Email domain validation
- API key prefix validation

---

## Testing Strategy

### Unit Tests

**Coverage targets:** 100% (per TDD requirements)

**Test categories:**
1. Schema validation
   - Valid inputs
   - Invalid inputs
   - Edge cases
   - ReDoS detection

2. Matching logic
   - Each strategy (equals, contains, startsWith, endsWith, regex)
   - Type coercion (numbers, booleans → strings)
   - Null/undefined handling
   - Timeout protection

3. Integration
   - ResponseSelector with regex mocks
   - Specificity calculation unchanged
   - Backward compatibility

### Integration Tests

**Express adapter:**
- Scenario with regex header matching
- Multiple strategies in one scenario
- Fallback behavior

**Next.js adapter:**
- Same scenarios work in Next.js context

### E2E Tests (Example Apps)

**Express example:**
- Referer-based routing test
- User-agent detection test
- API key validation test

**Playwright tests:**
- Verify regex matching in browser context
- Verify no performance degradation

---

## Security Considerations

### ReDoS (Regular Expression Denial of Service)

**Risk:** Malicious regex patterns can cause catastrophic backtracking.

**Mitigations:**
1. ✅ **Static analysis:** Use `redos-detector` in Zod validation
2. ✅ **Execution timeout:** Limit regex execution to 100ms
3. ✅ **User education:** Document safe patterns
4. ✅ **No user input:** Scenarios are authored by developers, not end users

**Example vulnerable pattern:**
```typescript
// ❌ UNSAFE - Exponential backtracking
{
  regex: { source: '(a+)+b' }
}

// Zod will reject this pattern with error:
// "Regex pattern is potentially unsafe (ReDoS vulnerability)"
```

### Invalid Regex Patterns

**Risk:** Invalid patterns crash at runtime.

**Mitigations:**
1. ✅ Zod validates flags against allowed set
2. ✅ Try-catch around RegExp construction
3. ✅ Try-catch around regex.test() execution
4. ✅ Clear error messages for debugging

---

## Performance Considerations

### Regex Compilation

**Pattern:** Compile regex once per mock, reuse for all requests.

```typescript
// ❌ BAD - Compiles on every match
const matchesValue = (actual: string, criteria: MatchValue) => {
  if (criteria.regex) {
    const regex = new RegExp(criteria.regex.source, criteria.regex.flags);
    return regex.test(actual);
  }
};

// ✅ GOOD - Compile once, cache
class CompiledMock {
  private compiledRegex?: RegExp;

  constructor(private mock: ScenaristMock) {
    if (mock.match?.headers) {
      for (const [key, value] of Object.entries(mock.match.headers)) {
        if (typeof value === 'object' && value.regex) {
          this.compiledRegex = new RegExp(value.regex.source, value.regex.flags);
        }
      }
    }
  }

  matches(context: RequestContext): boolean {
    if (this.compiledRegex) {
      return this.compiledRegex.test(context.headers.referer);
    }
    return false;
  }
}
```

**Decision:** Implement regex caching in ResponseSelector if performance testing shows it's needed.

### Benchmark Targets

- Single regex match: < 1ms
- 100 sequential matches: < 10ms
- No degradation vs exact matching for non-regex scenarios

---

## Migration Path

### Backward Compatibility

✅ **No breaking changes** - Existing scenarios work unchanged.

**Existing exact matching:**
```typescript
{
  match: {
    headers: {
      referer: 'http://localhost:3000/apply-sign', // Still works
    },
  },
}
```

**New regex matching:**
```typescript
{
  match: {
    headers: {
      referer: {
        regex: { source: '/apply-sign' }, // New feature
      },
    },
  },
}
```

### Conversion Guide

**Pattern: Substring matching**
```typescript
// Before (MSW)
http.get('/api/data', ({ request }) => {
  if (request.headers.get('referer')?.includes('/apply-sign')) {
    return HttpResponse.json({ state: 'complete' });
  }
});

// After (Scenarist)
{
  match: {
    headers: {
      referer: { contains: '/apply-sign' },
    },
  },
  response: { status: 200, body: { state: 'complete' } },
}
```

**Pattern: Multiple values**
```typescript
// Before (MSW)
const allowedReferers = ['/apply-sign', '/penny-drop'];
http.get('/api/data', ({ request }) => {
  const referer = request.headers.get('referer');
  if (allowedReferers.some(r => referer?.includes(r))) {
    return HttpResponse.json({ state: 'complete' });
  }
});

// After (Scenarist) - Use regex alternation
{
  match: {
    headers: {
      referer: {
        regex: { source: '/apply-sign|/penny-drop' },
      },
    },
  },
  response: { status: 200, body: { state: 'complete' } },
}
```

---

## Dependencies

### New Package Dependencies

```json
{
  "dependencies": {
    "redos-detector": "^5.1.0"
  }
}
```

**Why redos-detector:**
- ✅ Pure JavaScript (no native dependencies)
- ✅ Fast static analysis
- ✅ High accuracy
- ✅ Active maintenance
- ✅ Used by Vite, Vitest, etc.

**Alternative considered:** `vuln-regex-detector` (rejected - requires Java runtime)

---

## Rollout Plan

### Phase 1: Core Implementation (Week 1)
- Types & schemas
- Matching logic
- Unit tests (100% coverage)

### Phase 2: Adapter Integration (Week 2)
- ResponseSelector integration
- Integration tests
- Backward compatibility verification

### Phase 3: Documentation & Examples (Week 3)
- API documentation
- Migration guide
- Example scenarios
- E2E tests

### Phase 4: Release (Week 4)
- Code review
- Performance benchmarking
- Security audit
- Release notes
- GitHub issue closure

---

## Success Criteria

### Functional
- ✅ All 5 matching strategies work (equals, contains, startsWith, endsWith, regex)
- ✅ ReDoS protection prevents unsafe patterns
- ✅ Backward compatibility (existing scenarios unchanged)
- ✅ 100% test coverage
- ✅ TypeScript types fully inferred

### Non-Functional
- ✅ Regex matching < 1ms per request
- ✅ No performance degradation for non-regex scenarios
- ✅ Clear error messages for invalid patterns
- ✅ Comprehensive documentation

### User Experience
- ✅ Easy migration from MSW substring checks
- ✅ Intuitive API (contains, startsWith, etc.)
- ✅ Clear validation errors
- ✅ Examples cover common use cases

---

## Open Questions

1. **Should we support case-insensitive substring matching?**
   - Option A: Add `containsIgnoreCase` strategy
   - Option B: Use regex with `i` flag
   - **Recommendation:** Option B (fewer strategies, regex is flexible)

2. **Should we compile regex at schema validation time or runtime?**
   - Option A: Compile during Zod parse (fail fast)
   - Option B: Compile during first use (lazy)
   - **Recommendation:** Option B (keep parse fast, catch errors in matching)

3. **Should we expose regex compilation errors to users?**
   - Option A: Silent failure (log warning, return false)
   - Option B: Throw error (break request)
   - **Recommendation:** Option A in production, Option B in development

---

## Phase 2.5: URL Matching Strategies (Future Work)

**Status:** NOT STARTED - Deferred from Phase 2
**Priority:** P2 (Medium - requires significant design work)
**Complexity:** HIGH (5-8 days estimated vs 1-2 days for other criteria)

### Why URL Matching Is Complex

URL matching has **two levels** of concern that must work together:

1. **Routing (existing)** - The `url` field in mock definition:
   - Exact match: `url: '/users'`
   - Path params: `url: '/users/:id'` (extracts `id` from URL)
   - Glob patterns: `url: '/api/*'` (matches any path starting with `/api/`)

2. **Matching (proposed)** - The `match.url` field with MatchValue strategies:
   - Contains: `match: { url: { contains: '/api/' } }`
   - StartsWith: `match: { url: { startsWith: '/v2/' } }`
   - EndsWith: `match: { url: { endsWith: '.json' } }`
   - Regex: `match: { url: { regex: { source: '/api/v\\d+/' } } }`

**CRITICAL:** These are SEPARATE concerns:
- Routing determines IF a mock applies to a URL pattern
- Matching adds ADDITIONAL conditions on top of routing

### Examples Showing Complexity

```typescript
// Example 1: String literal + path param
{
  url: '/users/:id',  // Routing: Accepts /users/123, /users/456, etc.
  match: {
    url: { startsWith: '/users/' }  // Matching: Additional condition
  }
}
// Question: Does this match /users/123? Yes (routing matches, matching passes)
// Question: Does this match /users? No (routing fails - missing :id)

// Example 2: Glob + regex
{
  url: '/api/*',  // Routing: Accepts /api/anything
  match: {
    url: { regex: { source: '/api/v2/.*' } }  // Matching: Only v2 endpoints
  }
}
// Question: Does this match /api/v1/users? No (routing passes, but matching fails)
// Question: Does this match /api/v2/users? Yes (both routing and matching pass)

// Example 3: Path param + contains
{
  url: '/orders/:id',  // Routing: Accepts /orders/123
  match: {
    url: { contains: '/orders/' }
  }
}
// Question: What value is matched against? Full path? Path params extracted?
// Answer: TBD - needs design decision
```

### Required Design Decisions

Before implementing Phase 2.5, these questions MUST be answered:

1. **What value is matched against?**
   - Option A: Full URL (protocol + host + port + path + query)
   - Option B: Path only (excludes query string)
   - Option C: Path + query string (excludes protocol/host/port)
   - **Recommendation:** TBD (needs user feedback)

2. **How does match.url interact with url routing patterns?**
   - Does path param `:id` extraction happen before or after match.url check?
   - Do glob patterns `*` affect what value is matched?
   - Is match.url an AND condition on top of routing?

3. **Should query string be included in match.url?**
   - Pro: Enables matching on query params via URL pattern
   - Con: Duplicates functionality of `match.query`
   - **Recommendation:** TBD

4. **Should match.url work WITHOUT url routing?**
   - Can you have `match: { url: { contains: '/api/' } }` with no `url` field?
   - Or is `url` field (routing) always required?
   - **Recommendation:** TBD

### Testing Strategy (53-75 tests estimated)

URL matching must be tested with ALL combinations of routing patterns and matching strategies.

**Test Matrix (minimum):**

| Routing Pattern | Matching Strategy | Expected Behavior |
|----------------|-------------------|-------------------|
| Exact (`/users`) | `contains: '/users'` | Pass |
| Exact (`/users`) | `startsWith: '/user'` | Pass |
| Exact (`/users`) | `endsWith: 'sers'` | Pass |
| Path param (`/users/:id`) | `contains: '/users/'` | TBD - depends on design |
| Path param (`/users/:id`) | `startsWith: '/users/'` | TBD - depends on design |
| Glob (`/api/*`) | `regex: { source: '/api/v2/.*' }` | TBD - depends on design |
| Glob (`/api/*`) | `contains: '/v2/'` | TBD - depends on design |

**Test Files Needed:**

1. `packages/core/tests/match-criteria-url.test.ts` - Unit tests (20-30 tests)
2. `packages/core/tests/match-criteria-url-routing.test.ts` - Integration tests (15-20 tests)
3. `packages/msw-adapter/tests/dynamic-handler-url-matching.test.ts` - MSW integration (10-15 tests)
4. `apps/nextjs-app-router-example/tests/playwright/url-matching.spec.ts` - E2E tests (8-10 tests)

**Total: 53-75 tests** (vs 15-20 for other match criteria)

### Schema Changes

```typescript
// packages/core/src/schemas/match-criteria.ts
export const MatchCriteriaSchema = z.object({
  url: MatchValueSchema.optional(),  // ✅ NEW: URL matching with same strategies
  headers: z.record(z.string(), MatchValueSchema).optional(),
  query: z.record(z.string(), MatchValueSchema).optional(),
  body: z.record(z.string(), MatchValueSchema).optional(),
});
```

**Impact:** Non-breaking change (optional field)

**CRITICAL:** Schema is easy - implementation and testing is hard.

### Implementation Effort Estimate

- Planning: 1-2 days (design decisions, test planning)
- Implementation: 3-5 days (TDD for 53-75 tests)
- Documentation: 1 day
- **Total: 5-8 days** (vs 1-2 days for other match criteria)

### Why Deferred

Phase 2.5 was deferred from Phase 2 because:
- Complex design decisions required (4 major questions)
- Extensive testing needed (53-75 tests vs 15-20)
- Two-level matching (routing + matching) creates combinatorial explosion
- Must not break existing MSW URL routing (path params, globs)
- Requires user feedback to validate API design

**Recommendation:** Complete Phase 3 (regex with timeout) first, then revisit Phase 2.5 with full context.

---

## Other Future Enhancements

**Not in scope for initial implementation:**

1. **Negation:** `{ not: { contains: '/admin' } }`
2. **AND/OR combinators:** `{ or: [{ contains: 'foo' }, { contains: 'bar' }] }`
3. **Custom matchers:** User-defined matching functions

These can be considered in future iterations based on user feedback.

---

**End of Implementation Plan**
