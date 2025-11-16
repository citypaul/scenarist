# WIP: Regex Support for Match Criteria

**Started**: 2025-01-16
**Status**: In Progress - Phase 2 Complete, URL Matching Requirement Identified
**Current Step**: Planning Phase 2.5 - URL Matching Strategies

## Goal

Extend match criteria to support flexible pattern matching (string strategies and regex) for headers, query params, body fields, AND URLs. This enables powerful scenario selection based on request patterns without hardcoded values.

## Overall Plan

1. ~~Phase 1: Schema definition with ReDoS protection~~ ✅ (Deferred - not needed for Phase 2)
2. ~~Phase 2: String matching strategies (contains, startsWith, endsWith, equals)~~ ✅ **COMPLETE**
3. **Phase 2.5: URL matching strategies** (Future Work - See details below)
4. Phase 3: Regex matching with timeout protection (Future)
5. Phase 4: Integration and documentation (Future)

## Phase 2 Status: COMPLETE ✅

**Completed**: 2025-01-16
**Status**: Phase 2 fully implemented and tested

**What Was Delivered:**
- ✅ String matching strategies (contains, startsWith, endsWith, equals)
- ✅ Works on headers, query params, and body fields
- ✅ Backward compatibility maintained (string literals still work)
- ✅ All tests passing: 265/265 (100% coverage)
- ✅ Documentation complete with comprehensive reference

**Important:** String literals (e.g., `'summer-sale'`) are still supported for backward compatibility - they perform exact match as before.

**Test Coverage:**
- Unit tests: 257/257 core tests
- Integration tests: All adapters tested
- E2E tests: 9/9 Playwright ATDD tests
- Coverage maintained at 100% across all packages

**Last Commit**: ccbdf98 - Added comprehensive matching strategies reference

## Current Focus

**Phase 2.5**: URL Matching Strategies (Future Work)

**Status**: NOT STARTED - Requires significant planning

**Tests Passing**: 265/265 ✅ (Phase 2 complete)

## Phase 2.5: URL Matching - Why This Is Complex

**Context:** After completing Phase 2 (string matching for headers/query/body), user identified that URL matching with the same strategies is equally important.

### Current State

**URL Matching has TWO levels:**

1. **Routing (existing)** - The `url` field in mock definition:
   - Exact match: `url: '/users'`
   - Path params: `url: '/users/:id'` (extracts `id` from URL)
   - Glob patterns: `url: '/api/*'` (matches any path starting with `/api/`)

2. **Matching (proposed)** - The `match.url` field with MatchValue strategies:
   - Contains: `match: { url: { contains: '/api/' } }`
   - StartsWith: `match: { url: { startsWith: '/v2/' } }`
   - EndsWith: `match: { url: { endsWith: '.json' } }`
   - Regex: `match: { url: { regex: { source: '/api/v\\d+/' } } }`

**CRITICAL:** These are SEPARATE concerns that must work together:
- Routing determines IF a mock applies to a URL pattern
- Matching adds ADDITIONAL conditions on top of routing

### Why This Is Complex

**Problem:** URL matching interacts with existing URL routing in non-obvious ways.

**Examples showing complexity:**

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

// Example 4: Exact routing + regex matching
{
  url: '/products',  // Routing: Only exact /products
  match: {
    url: { regex: { source: '/products\\?category=.*' } }  // Matching: With query string
  }
}
// Question: Is query string included in match.url check?
// Answer: TBD - needs design decision
```

### Use Cases (Simplified Examples)

```typescript
// Match any URL containing '/api/'
{
  method: 'GET',
  match: { url: { contains: '/api/' } },
  response: { status: 200, body: { source: 'api' } }
}

// Match URLs starting with a specific path
{
  method: 'POST',
  match: { url: { startsWith: '/v2/' } },
  response: { status: 200, body: { version: 'v2' } }
}

// Match URLs ending with file extension
{
  method: 'GET',
  match: { url: { endsWith: '.json' } },
  response: { status: 200, body: { type: 'json' } }
}
```

## What Needs to Change (Phase 2.5)

### Design Decisions Required BEFORE Implementation

**These questions MUST be answered with clear rationale:**

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

### 1. Schema Changes (`packages/core/src/schemas/match-criteria.ts`)

**Current:**
```typescript
export const MatchCriteriaSchema = z.object({
  headers: z.record(z.string(), MatchValueSchema).optional(),
  query: z.record(z.string(), MatchValueSchema).optional(),
  body: z.record(z.string(), MatchValueSchema).optional(),
});
```

**Proposed:**
```typescript
export const MatchCriteriaSchema = z.object({
  url: MatchValueSchema.optional(),  // ✅ NEW: URL matching with same strategies
  headers: z.record(z.string(), MatchValueSchema).optional(),
  query: z.record(z.string(), MatchValueSchema).optional(),
  body: z.record(z.string(), MatchValueSchema).optional(),
});
```

**Impact:** Non-breaking change (optional field, existing schemas valid)

**CRITICAL:** This is the EASY part. The hard part is implementation and testing.

### 2. Type Definitions (`packages/core/src/types/match-criteria.ts`)

**Update:**
```typescript
export type MatchCriteria = {
  readonly url?: MatchValue;  // ✅ NEW
  readonly headers?: Record<string, MatchValue>;
  readonly query?: Record<string, MatchValue>;
  readonly body?: Record<string, MatchValue>;
};
```

### 3. Implementation (`packages/core/src/domain/match-criteria.ts`)

**Current `matchesCriteria` function signature:**
```typescript
export const matchesCriteria = (
  context: { headers: Record<string, string>; query: Record<string, string>; body?: unknown },
  criteria: MatchCriteria,
): boolean => {
  // Only checks headers, query, body
};
```

**Proposed update:**
```typescript
export const matchesCriteria = (
  context: {
    url: string;  // ✅ NEW: Add URL to context
    headers: Record<string, string>;
    query: Record<string, string>;
    body?: unknown;
  },
  criteria: MatchCriteria,
): boolean => {
  // Check URL matching first (if criteria.url defined)
  if (criteria.url !== undefined) {
    if (!matchesValue(context.url, criteria.url)) {
      return false;  // Early exit if URL doesn't match
    }
  }

  // Existing header/query/body checks
  // ...
};
```

### 4. Testing Strategy (EXTENSIVE)

**Why This Is Very Involved:**

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

1. `packages/core/tests/match-criteria-url.test.ts` - Unit tests
   - URL exact match (equals strategy)
   - URL contains substring
   - URL starts with prefix
   - URL ends with suffix
   - URL matching combined with header/query/body matching
   - URL matching with specificity calculation
   - Edge cases: empty URL, special characters, encoded URLs

2. `packages/core/tests/match-criteria-url-routing.test.ts` - Integration tests
   - Exact routing + URL matching
   - Path param routing + URL matching
   - Glob routing + URL matching
   - All combinations from test matrix above

3. `packages/msw-adapter/tests/dynamic-handler-url-matching.test.ts` - MSW integration
   - MSW URL patterns + Scenarist match.url
   - Verify no conflicts between MSW routing and Scenarist matching

4. `apps/nextjs-app-router-example/tests/playwright/url-matching.spec.ts` - E2E tests
   - Real-world scenarios with URL matching
   - Verify correct mock selected based on URL patterns

**Estimated Test Count:**
- Unit tests: 20-30 tests
- Integration tests: 15-20 tests (all routing combinations)
- MSW adapter: 10-15 tests
- E2E tests: 8-10 tests
- **Total: 53-75 tests** (vs 15-20 for other match criteria)

**Why More Tests:**
- Two-level matching (routing + matching) creates combinatorial explosion
- Path params and globs have non-obvious interactions
- Query string inclusion decision affects many edge cases

### 5. Documentation

**Files to update:**
- `apps/docs/src/content/docs/capabilities/matching-strategies.mdx` - Add URL matching examples
- `docs/plans/regex-support-implementation.md` - Move URL matching from "Future" to Phase 2.5
- `packages/core/README.md` - Update match criteria examples
- `CLAUDE.md` - Document URL matching learnings (after implementation)

### 6. Integration Updates

**MSW Adapter:** No changes needed (passes full request context to matchesCriteria)

**Express Adapter:** Ensure request context includes URL
- Check `packages/express-adapter/src/context/request-context.ts`
- Likely already includes URL from `req.url`

**Next.js Adapter:** Ensure request context includes URL
- Check `packages/nextjs-adapter/src/app/context.ts` and `pages/context.ts`
- Likely already includes URL from Request object

## Next Steps (Phase 2.5 - Not Started)

**STOP:** Do NOT implement Phase 2.5 without completing planning first.

**Planning Phase (Required):**
1. **Answer design questions** - See "Design Decisions Required" section
2. **Define test matrix** - All routing + matching combinations
3. **Create test plan** - 53-75 tests estimated
4. **Get user feedback** - Validate use cases and API
5. **Document decision rationale** - Why each design choice was made

**Implementation Phase (After Planning):**
1. **Investigate current context implementations** - What URL is currently passed?
2. **Write failing tests** - RED phase (all routing combinations)
3. **Update schema** - Add `url?: MatchValueSchema` to MatchCriteria
4. **Update types** - Add `url?: MatchValue` to type
5. **Update matchesCriteria** - Add URL matching logic
6. **Run tests** - GREEN phase
7. **Add comprehensive tests** - Cover all strategies and routing patterns
8. **Update documentation** - Examples and reference
9. **Verify integration** - All adapters pass URL correctly
10. **Update plan** - Move from "Future" to "Implemented"

**Estimated Effort:**
- Planning: 1-2 days (design decisions, test planning)
- Implementation: 3-5 days (TDD for 53-75 tests)
- Documentation: 1 day
- **Total: 5-8 days** (vs 1-2 days for other match criteria)

## Agent Checkpoints

- [x] tdd-guardian: Phase 2 verified TDD compliance ✅
- [ ] **→ Invoke tdd-guardian** before committing Phase 2.5
- [x] ts-enforcer: No `any` types in Phase 2 ✅
- [ ] **→ Invoke ts-enforcer** after schema changes
- [x] refactor-scan: Phase 2 assessed ✅
- [ ] **→ Invoke refactor-scan** after GREEN phase
- [ ] learn: Document URL matching patterns after completion
- [ ] docs-guardian: Update all documentation after completion

## Blockers

None currently

## Technical Notes

**URL Matching Considerations:**
- URLs can be absolute (`http://example.com/api/users`) or relative (`/api/users`)
- Need to decide: match against full URL or path only?
- MSW already handles URL patterns - we're adding match criteria on top
- Specificity: URL match adds to specificity score (same as header/query/body)

**Decision Point:** Should we match against:
1. Full URL (includes protocol, host, port, path, query string)
2. Path only (excludes query string)
3. Path + query string (excludes protocol/host)

**Recommendation:** Match against **path + query string** (option 3)
- Consistent with how MSW url patterns work
- Protocol/host already handled by MSW url field
- Query string is part of resource identifier

**Example:**
```typescript
// URL: http://localhost:3000/api/users?page=2

// Mock definition
{
  method: 'GET',
  url: 'http://localhost:3000/api/users',  // MSW pattern (exact)
  match: {
    url: { contains: '/api/' }  // ✅ Matches "/api/users?page=2"
  }
}
```

## Session Log

### 2025-01-16 - Session 1
**Duration**: 2 hours
**Completed**:
- Phase 2 complete: String matching strategies (contains, startsWith, endsWith, equals)
- 265 tests passing, 100% coverage
- Documentation updated with comprehensive reference
- Commit ccbdf98: Added matching strategies table and examples

**Learned**:
- String matching strategies are universally applicable (headers, query, body, URL)
- TypeScript discriminated unions provide excellent type safety
- Documentation-driven examples help clarify complex features

**Next Session**:
- Investigate current URL context in adapters
- Start Phase 2.5: URL matching strategies
- Follow same TDD pattern as Phase 2 (RED → GREEN → REFACTOR)

**Agent Actions Taken**:
- ✅ tdd-guardian: Verified strict TDD adherence for Phase 2
- ✅ ts-enforcer: No `any` types, strict mode passing
- ✅ refactor-scan: Code quality assessed after GREEN
- ⏳ learn: Will document URL matching patterns after Phase 2.5
