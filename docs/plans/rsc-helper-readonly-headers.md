# Implementation Plan: RSC Helper for ReadonlyHeaders

**Issue:** #102
**Branch:** `feature/rsc-helper-readonly-headers`
**Target:** v1.0
**Effort Estimate:** 2-3 hours

---

## Problem Statement

Next.js Server Components use `headers()` from `'next/headers'` which returns `ReadonlyHeaders`, not a `Request` object. The current Scenarist API only has `getHeaders(request: Request)`, forcing developers to create fake Request objects:

```typescript
// AWKWARD WORKAROUND (current)
const headersList = await headers();
const request = new Request('http://localhost', { headers: headersList });
const scenaristHeaders = scenarist.getHeaders(request);
```

This is confusing and suggests incomplete support for the primary Next.js pattern (Server Components in App Router).

---

## Solution

Add a new method `getHeadersFromReadonlyHeaders(headers: ReadonlyHeaders)` to the Next.js adapter that works directly with the headers object.

```typescript
// CLEAN API (proposed)
const headersList = await headers();
const scenaristHeaders = scenarist.getHeadersFromReadonlyHeaders(headersList);
```

---

## Implementation Plan (TDD)

### Phase 1: ATDD - Acceptance Test (RED)

**Status:** ✅ COMPLETE

Create end-to-end test in Next.js App Router example that demonstrates the problem and desired solution.

**Files:**
- `apps/nextjs-app-router-example/app/test-rsc-helper/page.tsx` - New RSC page ✅
- `apps/nextjs-app-router-example/tests/playwright/rsc-helper.spec.ts` - E2E test ✅

**Test scenario:**
1. Server Component calls external API with scenarist headers
2. Uses `headers()` from next/headers (not Request)
3. Attempts to call `scenarist.getHeadersFromReadonlyHeaders(headersList)`
4. Test fails because method doesn't exist

**Result:** Test fails with exact error: `scenarist.getHeadersFromReadonlyHeaders is not a function` ✅

This proves the need for the helper method.

### Phase 2: Unit Tests - Adapter (RED)

**Status:** ✅ COMPLETE

Add unit tests to Next.js adapter.

**File:** `packages/nextjs-adapter/tests/app/app-setup.test.ts` ✅

**Tests added:**
1. ✅ `getHeadersFromReadonlyHeaders` extracts test ID from ReadonlyHeaders
2. ✅ Uses default test ID when header missing
3. ✅ Respects custom header name from config
4. ✅ Handles lowercase header names (ReadonlyHeaders.get() is case-insensitive)
5. ✅ Returns object with single header entry

**Result:** All 5 tests fail with: `scenarist.getHeadersFromReadonlyHeaders is not a function` ✅

25 existing tests still pass. Ready for implementation (GREEN phase).

### Phase 3: Implementation (GREEN)

**Status:** ✅ COMPLETE

Implement the helper in Next.js adapter.

**File:** `packages/nextjs-adapter/src/app/setup.ts` ✅

**Implementation added:**
- Type definition in AppScenarist interface (lines 92-125) ✅
- Implementation in createScenarist function (lines 202-209) ✅
- Comprehensive JSDoc with examples ✅
- Uses structural typing `{ get(name: string): string | null }` for ReadonlyHeaders ✅

**Result:** All 30 unit tests passing (25 existing + 5 new) ✅

Method signature:
```typescript
getHeadersFromReadonlyHeaders: (headers: { get(name: string): string | null }) => Record<string, string>
```

### Phase 4: Integration (GREEN)

**Status:** ✅ COMPLETE

Update example app to use new helper.

**Files updated:**
- `apps/nextjs-app-router-example/app/test-rsc-helper/page.tsx` ✅
  - Removed @ts-expect-error comment
  - Using clean API with getHeadersFromReadonlyHeaders
- `apps/nextjs-app-router-example/app/hostname-matching/page.tsx` ✅
  - Removed workaround (fake Request creation)
  - Replaced all getHeaders(request) calls with getHeadersFromReadonlyHeaders(headersList)
- `apps/nextjs-app-router-example/tests/playwright/rsc-helper.spec.ts` ✅
  - Fixed test selectors for multiple products

**Result:** All tests passing ✅
- RSC helper test: 1/1 passing
- Hostname matching tests: 6/6 passing
- No workarounds needed, clean API throughout

### Phase 5: Documentation

**Status:** ✅ COMPLETE

**Files updated:**
1. ✅ `packages/nextjs-adapter/README.md` - Added Server Component example in "Making External API Calls" section
2. ✅ `apps/docs/src/content/docs/frameworks/nextjs-app-router/getting-started.mdx` - Added "Forwarding Headers to External APIs" section
3. ✅ All workaround comments removed in Phase 4

**Content added:**
- ✅ Both Route Handler pattern (Request) and Server Component pattern (ReadonlyHeaders) documented
- ✅ Clear guidance on when to use `getScenaristHeaders(request, scenarist)` vs `scenarist.getHeadersFromReadonlyHeaders(headersList)`
- ✅ Complete working examples for both patterns
- ✅ Explanation of why header forwarding matters

### Phase 6: Update GitHub Issue

**Status:** ✅ COMPLETE

**Actions:**
1. ✅ Commented on #102 with implementation summary (https://github.com/citypaul/scenarist/issues/102#issuecomment-3557339649)
2. ✅ PR created: #111 (https://github.com/citypaul/scenarist/pull/111)
3. ⏳ Issue will be closed when PR is merged

**Comment includes:**
- Complete implementation summary
- Test results (30/30 unit + 7/7 E2E passing)
- Workarounds removed
- Documentation added
- Usage examples
- Commit references

---

## Acceptance Criteria

- [x] E2E test demonstrates clean API (no fake Request) ✅
- [x] 5 unit tests for new helper (100% coverage) ✅
- [x] Type exports updated ✅
- [x] README examples updated ✅
- [x] Documentation site updated ✅
- [x] All workaround comments removed from examples ✅
- [x] All tests passing (unit + E2E) ✅ (30/30 unit + 7/7 E2E)
- [x] GitHub issue #102 updated ✅ (will be closed when PR merges)

---

## Testing Strategy

### ATDD Level (Playwright)
- Server Component fetches external API
- Uses ReadonlyHeaders directly
- Scenarist mock responds correctly
- Test verifies response data

### Unit Level (Vitest)
- Test ID extraction
- Default fallback
- Custom header names
- Case-insensitive matching
- Return value structure

### Integration Level
- Works in real Next.js Server Component
- No type errors
- Clean developer experience

---

## Timeline

1. **Phase 1-2 (RED):** 30 minutes - Write failing tests
2. **Phase 3 (GREEN):** 30 minutes - Implement helper
3. **Phase 4 (GREEN):** 30 minutes - Update examples
4. **Phase 5:** 30 minutes - Update documentation
5. **Phase 6:** 15 minutes - Update issue

**Total:** ~2.5 hours

---

## Status Updates

**2025-11-20 - Plan Created**
- Branch created: `feature/rsc-helper-readonly-headers`
- Starting Phase 1: ATDD test creation
