# Issue 211: Add Error Boundary Example to App Router Example App

## Status: IN PROGRESS

## Overview

Create error.tsx with recovery functionality and test error scenarios using TDD.

## Requirements (from issue)

**Files to create:**
- `app/errors/page.tsx` - Page that can fail
- `app/errors/error.tsx` - Error boundary with retry
- `tests/playwright/error-boundaries.spec.ts` - Error handling tests
- Add scenario: `apiError`

## Implementation Plan

### Phase 1: Test Infrastructure (RED)
- [ ] **1.1** Add `apiError` scenario to `/lib/scenarios.ts`
- [ ] **1.2** Create `tests/playwright/error-boundaries.spec.ts` with failing tests

### Phase 2: Minimal Implementation (GREEN)
- [ ] **2.1** Create `/app/errors/page.tsx` - page that fetches from API
- [ ] **2.2** Create `/app/errors/error.tsx` - error boundary with retry
- [ ] **2.3** Create `/app/api/errors/route.ts` - API endpoint that can fail

### Phase 3: Refactor
- [ ] **3.1** Assess code for improvements (naming, structure, accessibility)
- [ ] **3.2** Ensure all patterns align with codebase conventions

## TDD Cycle Details

### RED Phase: Tests First

**Test 1: Error boundary renders when API fails**
```typescript
test("displays error boundary when API returns 500", async ({ page, switchScenario }) => {
  await switchScenario(page, "apiError");
  await page.goto("/errors");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText(/something went wrong/i)).toBeVisible();
});
```

**Test 2: Retry button triggers re-render**
```typescript
test("retry button allows recovery from error", async ({ page, switchScenario }) => {
  await switchScenario(page, "apiError");
  await page.goto("/errors");
  await expect(page.getByRole("alert")).toBeVisible();

  // Switch to default (working) scenario
  await switchScenario(page, "default");

  // Click retry
  await page.getByRole("button", { name: /try again/i }).click();

  // Should show success content
  await expect(page.getByRole("alert")).not.toBeVisible();
  await expect(page.getByText(/error demo data/i)).toBeVisible();
});
```

**Test 3: Page renders normally when API succeeds**
```typescript
test("displays content when API returns success", async ({ page, switchScenario }) => {
  await switchScenario(page, "default");
  await page.goto("/errors");
  await expect(page.getByText(/error demo data/i)).toBeVisible();
  await expect(page.getByRole("alert")).not.toBeVisible();
});
```

### GREEN Phase: Minimal Implementation

**Scenario Definition (`apiError`):**
```typescript
apiError: {
  mocks: [
    {
      url: "http://localhost:3001/errors",
      response: {
        status: 500,
        body: { error: "Internal server error" },
      },
    },
  ],
},
```

**Page Component (`/app/errors/page.tsx`):**
- Async Server Component
- Fetches from `/api/errors`
- Throws if response not ok
- Displays data on success

**Error Boundary (`/app/errors/error.tsx`):**
- "use client" component
- Receives `error` and `reset` props
- Displays error message with `role="alert"`
- Retry button calls `reset()`
- Accessible styling

**API Route (`/app/api/errors/route.ts`):**
- Fetches from external API (mocked by Scenarist)
- Propagates Scenarist headers
- Returns data or error response

## Architectural Decisions

### Why This Approach?

1. **Server Component + Error Boundary**: Demonstrates Next.js 13+ pattern where RSC throws errors and `error.tsx` catches them at route level

2. **Separate API Route**: Maintains pattern of BFF (Backend for Frontend) where API routes call external services (mocked by Scenarist)

3. **Retry via `reset()`**: Uses Next.js built-in error recovery mechanism

4. **Declarative Scenario**: Error scenario follows ADR-0013 (declarative patterns only)

## Patterns to Follow

From codebase exploration:
- Semantic HTML (`role="alert"`, `aria-live`)
- Immutable data patterns
- Header propagation via `getScenaristHeaders()`
- Factory functions for test data (if needed)
- No `any` types, strict TypeScript

## Progress Log

| Date | Phase | Task | Status |
|------|-------|------|--------|
| TBD | RED | Add apiError scenario | Pending |
| TBD | RED | Create failing tests | Pending |
| TBD | GREEN | Implement page.tsx | Pending |
| TBD | GREEN | Implement error.tsx | Pending |
| TBD | GREEN | Implement API route | Pending |
| TBD | REFACTOR | Assess improvements | Pending |

## Verification Checklist

- [ ] All Playwright tests pass
- [ ] TypeScript strict mode satisfied
- [ ] No `any` types
- [ ] Accessible error UI (`role="alert"`, retry button)
- [ ] Follows declarative scenario pattern (ADR-0013)
- [ ] Commits show TDD compliance (test before implementation)
