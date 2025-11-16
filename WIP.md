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

## Critical Architectural Insight: Declarative > Serializable

**Date**: 2025-01-16
**Decision**: Support BOTH native RegExp objects AND serialized form in schemas

### The Realization

During Phase 2.5 planning, we realized our "serialization constraint" was actually about **declarative patterns vs imperative functions**, not JSON serializability itself.

**The Real Rule:**
- ✅ Declarative patterns (RegExp, string patterns) - Allowed
- ❌ Imperative functions (closures, callbacks) - Not allowed

### Why This Change

**RegExp is declarative:**
- Describes WHAT to match, not HOW
- No closures or hidden behavior
- No side effects
- Inspectable and analyzable
- Matches MSW v1 API exactly (better DX)

**Functions are imperative:**
- Hidden behavior in closures
- Cannot inspect or serialize
- Side effects possible
- Breaks architectural guarantees

### The Trade-off

**Before (strict JSON):**
```typescript
// Only serialized form allowed
{ url: { regex: { source: '/users/\\d+', flags: '' } } }
```

**After (declarative):**
```typescript
// BOTH forms allowed
{ url: /\/users\/\d+/ }  // ✅ Native RegExp (better DX)
{ url: { regex: { source: '/users/\\d+' } } }  // ✅ Serialized form (for JSON storage)
```

### Why This Is Better

1. **95% Use Case**: Most users don't need JSON storage
   - They write scenarios in TypeScript
   - Native RegExp is more readable
   - Matches MSW v1 API exactly
   - Less verbose, better autocomplete

2. **5% Use Case**: Those who need JSON storage can still use serialized form
   - File-based scenarios: Use serialized form
   - Database scenarios: Use serialized form
   - API scenarios: Use serialized form
   - **We support both**, not just one

3. **ReDoS Protection Still Works**:
   - Same validation logic applies to both forms
   - Native RegExp converted to serialized internally
   - Timeout protection identical
   - Security guarantees maintained

### What Doesn't Change

- ❌ Still NO arbitrary functions: `url: (req) => req.pathname.startsWith('/api/')`
- ❌ Still NO closures with hidden state
- ❌ Still NO imperative logic in mocks
- ✅ Still maintain architectural guarantees
- ✅ Still JSON-serializable (serialized form available)

### Implementation Impact

**Schema accepts either:**
```typescript
const UrlPatternSchema = z.union([
  z.string(),           // Exact match
  z.instanceof(RegExp), // Native RegExp (NEW)
  z.object({            // Serialized form (existing)
    regex: SerializedRegexSchema
  })
]);
```

**Internally normalized to serialized form for validation and matching.**

### Lesson Learned

**Constraints should enforce INTENT, not FORM.**

- Intent: Declarative patterns (inspectable, no side effects)
- Form: JSON-serializable (implementation detail)

RegExp satisfies the intent (declarative) even if not directly JSON-serializable. The serialized form exists for those who need it, but native RegExp provides better DX for the majority.

**This is the right architectural decision: optimize for the common case (95%) while supporting the edge case (5%).**

---

## Current Focus

**Phase 2.5**: URL Matching Strategies (In Progress)

**Status**: Planning Complete - Ready for Implementation

**Tests Passing**: 265/265 ✅ (Phase 2 complete)

## Phase 2.5: URL Matching - Simplified Approach

**Context:** URL matching extends Phase 2 string strategies to URL patterns, with native RegExp support for MSW v1 compatibility.

### Design Decisions (Finalized)

**Decision 1: URL Format = Pathname**
- Match against pathname only (no query string in `url` field itself)
- Query string IS reconstructed for matching (to support `match.url` with query patterns)
- Examples:
  - Request: `GET /api/users?page=2`
  - `url` field value: `/api/users` (pathname only)
  - `match.url` matches against: `/api/users?page=2` (pathname + query for flexibility)

**Decision 2: Hash Fragments Stripped**
- Hash fragments (`#section`) never sent to server (HTTP reality)
- Stripped before matching
- Example: `/page#section` → match against `/page`

**Decision 3: URL Encoding**
- Support both decoded and encoded forms
- Match against actual request value (as-is)
- Example: Request `/users/john%20doe` → match against `/users/john%20doe`

**Decision 4: `url` Field Always Required**
- Every mock MUST have a `url` field
- Use `'*'` for global/catch-all matching
- Prevents ambiguity about what's being matched

**Decision 5: Match Against Resolved URLs**
- Match against actual request values, not patterns
- Path params already extracted by MSW
- Example: Pattern `/users/:id` + Request `/users/123` → match against `/users/123`

**Decision 6: Native RegExp Support (NEW)**
- `url` field accepts: `string | RegExp`
- `match.url` accepts: `MatchValue` (including RegExp)
- ReDoS protection applies to both forms
- Examples:
  ```typescript
  // Native RegExp (better DX)
  { url: /\/users\/\d+/ }

  // Serialized form (JSON storage)
  { url: { regex: { source: '/users/\\d+' } } }
  ```

### Current State

**The `url` field in mock definition:**
- String patterns: `url: '/users'` (exact match)
- Path params: `url: '/users/:id'` (MSW pattern)
- Glob patterns: `url: '/api/*'` (MSW wildcard)
- RegExp (NEW): `url: /\/api\/v\d+\//` (native)
- RegExp serialized (NEW): `url: { regex: { source: '/api/v\\d+/' } }`

**The `match.url` field (NEW):**
- All Phase 2 strategies: contains, startsWith, endsWith, equals
- Regex support: Native RegExp OR serialized form
- Matches against pathname (with query reconstructed)

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

### Implementation Phases

**Phase 2.5.1: Schema Updates (Support RegExp Type)**
- Update `ScenaristMockSchema` to accept `url: string | RegExp | SerializedRegex`
- Add `MatchValueSchema` with RegExp support
- Add ReDoS validation for RegExp patterns
- Update type definitions to match schema

**Phase 2.5.2: URL Matching Logic**
- Extend `matchesCriteria` to accept `url` in context
- Add `match.url` matching with all Phase 2 strategies
- Normalize RegExp to serialized form for validation
- Add specificity calculation for URL matches

**Phase 2.5.3: Integration Tests**
- Test all URL routing patterns (exact, path params, glob, RegExp)
- Test all matching strategies on URLs
- Test combinations of routing + matching
- Verify MSW compatibility

**Phase 2.5.4: Example Apps**
- Add URL matching examples to Next.js example
- Add RegExp patterns to scenarios
- Update Bruno tests with URL matching scenarios

**Phase 2.5.5: Documentation**
- Update matching strategies reference
- Add RegExp pattern examples
- Document native vs serialized forms
- Update migration guide

### Schema and Type Updates

**1. Update `ScenaristMockSchema` to accept RegExp in `url` field:**
```typescript
// packages/core/src/schemas/scenarist-mock.ts
export const ScenaristMockSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.union([
    z.string(),           // Exact string
    z.instanceof(RegExp), // Native RegExp (NEW)
    z.object({            // Serialized RegExp
      regex: SerializedRegexSchema
    })
  ]),
  // ... rest of schema
});
```

**2. Add `url` field to `MatchCriteriaSchema`:**
```typescript
// packages/core/src/schemas/match-criteria.ts
export const MatchCriteriaSchema = z.object({
  url: MatchValueSchema.optional(),  // ✅ NEW: URL matching
  headers: z.record(z.string(), MatchValueSchema).optional(),
  query: z.record(z.string(), MatchValueSchema).optional(),
  body: z.record(z.string(), MatchValueSchema).optional(),
});
```

**3. Extend `MatchValueSchema` to support RegExp:**
```typescript
// packages/core/src/schemas/match-value.ts
export const MatchValueSchema = z.union([
  z.string(),  // Exact match (backward compatible)
  z.object({
    equals: z.string(),
  }),
  z.object({
    contains: z.string(),
  }),
  z.object({
    startsWith: z.string(),
  }),
  z.object({
    endsWith: z.string(),
  }),
  z.object({
    regex: z.union([
      z.instanceof(RegExp),        // Native RegExp (NEW)
      SerializedRegexSchema        // Serialized form
    ])
  }),
]);
```

**Impact:** Non-breaking changes (optional fields, existing schemas valid)

### Implementation Updates

**Update `matchesCriteria` to support URL matching:**
```typescript
// packages/core/src/domain/match-criteria.ts
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

**Extend `matchesValue` to handle RegExp:**
```typescript
// packages/core/src/domain/match-value.ts
export const matchesValue = (actual: string, expected: MatchValue): boolean => {
  // String literal = exact match (backward compatible)
  if (typeof expected === 'string') {
    return actual === expected;
  }

  // Native RegExp (NEW)
  if (expected instanceof RegExp) {
    return expected.test(actual);
  }

  // Discriminated union handling
  if ('equals' in expected) {
    return actual === expected.equals;
  }
  if ('contains' in expected) {
    return actual.includes(expected.contains);
  }
  if ('startsWith' in expected) {
    return actual.startsWith(expected.startsWith);
  }
  if ('endsWith' in expected) {
    return actual.endsWith(expected.endsWith);
  }
  if ('regex' in expected) {
    // Normalize to RegExp
    const regex = expected.regex instanceof RegExp
      ? expected.regex
      : new RegExp(expected.regex.source, expected.regex.flags);
    return regex.test(actual);
  }

  return false;
};
```

### Testing Strategy (Simplified)

**Phase 2.5 follows same pattern as Phase 2 (string matching strategies).**

With design decisions finalized, URL matching is straightforward:
- Match against pathname (with query reconstructed for `match.url`)
- Native RegExp support (convert to serialized internally)
- ReDoS protection applies to all RegExp forms

**Test Files:**

1. **Unit Tests** (`packages/core/tests/match-criteria-url.test.ts`)
   - URL exact match (string literal)
   - URL contains substring
   - URL starts with prefix
   - URL ends with suffix
   - URL regex match (native RegExp)
   - URL regex match (serialized form)
   - URL matching combined with header/query/body
   - Specificity calculation with URL matches
   - Edge cases: encoded URLs, special characters, query strings

2. **Integration Tests** (`packages/core/tests/response-selector-url.test.ts`)
   - String patterns in `url` field
   - Native RegExp in `url` field
   - Serialized RegExp in `url` field
   - `match.url` with all strategies
   - Combinations of `url` + `match.url`

3. **MSW Adapter Tests** (`packages/msw-adapter/tests/url-matching.test.ts`)
   - MSW with RegExp URL patterns
   - Scenarist URL matching on top of MSW routing
   - Verify pathname extraction works correctly

4. **E2E Tests** (`apps/nextjs-app-router-example/tests/playwright/url-matching-atdd.spec.ts`)
   - Real-world URL matching scenarios
   - RegExp patterns in practice
   - Verify MSW v1 compatibility

**Estimated Test Count:**
- Unit tests: ~25 tests (URL matching strategies)
- Integration tests: ~20 tests (response selection)
- MSW adapter: ~15 tests (routing integration)
- E2E tests: ~8 tests (ATDD scenarios)
- **Total: ~68 tests** (bringing total from 265 → ~333)

**Why Simplified (vs original 53-75 estimate):**
- Design decisions eliminate ambiguity
- No complex routing interaction testing needed
- Match against resolved URLs (not patterns)
- Native RegExp support reduces duplication

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

## Next Steps (Phase 2.5 - Ready to Implement)

**Planning Complete** ✅ - Design decisions finalized, architecture simplified

**Implementation Steps:**

**Phase 2.5.1: Schema Updates (TDD)**
1. Write failing tests for RegExp in `url` field
2. Update `ScenaristMockSchema` to accept `string | RegExp | SerializedRegex`
3. Update `MatchValueSchema` to support native RegExp
4. Add ReDoS validation
5. Verify tests pass

**Phase 2.5.2: URL Matching Logic (TDD)**
1. Write failing tests for `match.url` strategies
2. Extend `matchesCriteria` to accept `url` in context
3. Update `matchesValue` to handle RegExp
4. Add specificity calculation for URL matches
5. Verify tests pass

**Phase 2.5.3: Integration Tests (TDD)**
1. Write failing tests for routing + matching combinations
2. Test all URL patterns (exact, path params, glob, RegExp)
3. Test MSW compatibility
4. Verify adapters pass URL correctly
5. Verify tests pass

**Phase 2.5.4: Example Apps**
1. Add URL matching scenarios to Next.js example
2. Add RegExp patterns to scenarios
3. Update Bruno tests with URL matching
4. Verify E2E tests pass

**Phase 2.5.5: Documentation**
1. Update matching strategies reference
2. Add RegExp pattern examples
3. Document native vs serialized forms
4. Update migration guide
5. Update CLAUDE.md learnings

**Estimated Effort:**
- Schema updates: 0.5 days (~25 tests)
- URL matching logic: 1 day (~20 tests)
- Integration tests: 1 day (~15 tests)
- Example apps + E2E: 0.5 days (~8 tests)
- Documentation: 0.5 days
- **Total: 3.5 days** (simplified from 5-8 days)

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

### 2025-01-16 - Session 2
**Duration**: 1 hour
**Completed**:
- **CRITICAL ARCHITECTURAL DECISION**: Declarative > Serializable
- Support BOTH native RegExp AND serialized form
- Planning complete for Phase 2.5 (URL matching)
- Design decisions finalized (6 key decisions documented)
- Implementation plan simplified (3.5 days, ~68 tests)

**Key Insight**:
The "serialization constraint" was actually about **declarative patterns** vs **imperative functions**, not JSON serializability itself. RegExp is declarative (describes WHAT to match, no closures/side effects), so it's allowed. Functions are imperative (hidden behavior), so they're not.

**Trade-off Accepted**:
- 95% use case: Native RegExp (better DX, matches MSW v1 API)
- 5% use case: Serialized form still supported (for JSON storage)
- Both forms supported, not either/or

**Design Decisions Made**:
1. URL format = pathname (query reconstructed for matching)
2. Hash fragments stripped (HTTP reality)
3. URL encoding supported (both decoded and encoded)
4. `url` field always required (use `'*'` for global)
5. Match against resolved URLs (not patterns)
6. Native RegExp support (NEW - architectural shift)

**Next Session**:
- Start Phase 2.5.1: Schema updates with RegExp support
- Follow strict TDD (RED → GREEN → REFACTOR)
- Target: ~25 tests for schema validation

**Architectural Learnings**:
- Constraints should enforce INTENT (declarative), not FORM (JSON)
- Optimize for common case (95%) while supporting edge case (5%)
- RegExp satisfies declarative intent even if not directly JSON-serializable
- The serialized form exists for those who need it
