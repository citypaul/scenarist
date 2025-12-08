# Plan: Issue 209 - Add Authentication Flow Example

## Overview

Add an authentication flow example to the Next.js App Router example app demonstrating:
- Protected routes with server-side auth checks
- Login page with redirect handling
- Auth scenarios for testing authenticated/unauthenticated states
- Integration with existing Scenarist patterns

## Status

- [x] Analyze existing patterns and codebase structure
- [ ] Write Playwright tests (TDD RED phase)
- [ ] Add auth scenarios
- [ ] Create auth helper (`lib/auth.ts`)
- [ ] Create protected layout (`app/protected/layout.tsx`)
- [ ] Create protected page (`app/protected/page.tsx`)
- [ ] Create login page (`app/login/page.tsx`)
- [ ] Final verification and cleanup

## Design Decisions

### 1. Auth Flow Architecture

**External API Pattern:** Following existing patterns, auth will call an external auth service that MSW can intercept.

```
Browser → /protected → Server Component → lib/auth.ts → External Auth API
                                                              ↓
                                                        MSW Intercepts
                                                              ↓
                                                        Scenarist Mock
```

**Auth Check Endpoint:** `http://localhost:3001/auth/me`
- Returns user object if authenticated
- Returns 401 if not authenticated

**Why this approach:**
- Follows existing pattern (all external API calls go through MSW)
- Enables scenario-based testing
- Same code path in test and production

### 2. Scenarios to Add

```typescript
// Authenticated user scenario
export const authenticatedUserScenario: ScenaristScenario = {
  id: 'authenticatedUser',
  name: 'Authenticated User',
  description: 'User is authenticated with valid session',
  mocks: [
    {
      method: 'GET',
      url: 'http://localhost:3001/auth/me',
      response: {
        status: 200,
        body: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    },
  ],
};

// Unauthenticated user scenario
export const unauthenticatedUserScenario: ScenaristScenario = {
  id: 'unauthenticatedUser',
  name: 'Unauthenticated User',
  description: 'User is not authenticated',
  mocks: [
    {
      method: 'GET',
      url: 'http://localhost:3001/auth/me',
      response: {
        status: 401,
        body: {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
      },
    },
  ],
};
```

### 3. File Structure

```
app/
├── login/
│   └── page.tsx          # Login page (shows when unauthenticated)
├── protected/
│   ├── layout.tsx        # Auth check wrapper (redirects if unauthenticated)
│   └── page.tsx          # Protected content (dashboard)

lib/
├── auth.ts               # Auth helper (calls external API)
├── scenarios.ts          # Add new scenarios here
└── scenarios-auth.ts     # (optional) Separate file for auth scenarios
```

### 4. Auth Helper Design

```typescript
// lib/auth.ts
type User = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
};

type AuthResult =
  | { authenticated: true; user: User }
  | { authenticated: false; error: string };

export const checkAuth = async (
  headers: Headers
): Promise<AuthResult> => {
  const response = await fetch('http://localhost:3001/auth/me', {
    headers: {
      ...getScenaristHeadersFromHeaders(headers),
      // Pass auth cookie/token if present
    },
  });

  if (!response.ok) {
    return { authenticated: false, error: 'Unauthorized' };
  }

  const user = await response.json();
  return { authenticated: true, user };
};
```

### 5. Protected Layout Design

```typescript
// app/protected/layout.tsx
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const authResult = await checkAuth(headersList);

  if (!authResult.authenticated) {
    redirect('/login?from=/protected');
  }

  return <>{children}</>;
}
```

### 6. Test Cases

**Test File:** `tests/playwright/auth-flows.spec.ts`

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Protected route shows content when authenticated | `authenticatedUser` | User sees dashboard content |
| Protected route redirects to login when unauthenticated | `unauthenticatedUser` | Redirects to `/login?from=/protected` |
| Login page shows login form | `unauthenticatedUser` | Shows login form |
| Login page shows redirect message | `unauthenticatedUser` | Shows "please log in to continue" |

## TDD Approach

### Phase 1: RED - Write Failing Tests

1. Create `tests/playwright/auth-flows.spec.ts` with all test cases
2. Tests will fail because routes/scenarios don't exist

### Phase 2: GREEN - Minimal Implementation

1. Add scenarios to `lib/scenarios.ts`
2. Create `lib/auth.ts` helper
3. Create `app/login/page.tsx`
4. Create `app/protected/layout.tsx` and `page.tsx`
5. Each step followed by running tests

### Phase 3: REFACTOR - Clean Up

1. Extract shared types/helpers if needed
2. Ensure consistent patterns with existing code
3. Update repository seed data if needed

## Commit Strategy

Small, atomic commits following TDD:

1. `test(auth): add failing tests for auth flow (RED)`
2. `feat(auth): add authenticatedUser and unauthenticatedUser scenarios`
3. `feat(auth): add auth helper calling external API`
4. `feat(auth): add login page`
5. `feat(auth): add protected route with auth check`
6. `refactor(auth): extract shared types` (if needed)
7. `docs: update plan with completion status`

## Open Questions

1. **Cookie handling:** Should we pass auth cookies through? For this example, we'll rely purely on the mock returning authenticated/unauthenticated based on scenario - no actual cookies needed.

2. **Login form submission:** Should login actually work? For this example, the login page will be static - demonstrating the redirect flow is the goal, not actual login functionality.

## Progress Log

### 2024-XX-XX - Initial Planning
- Analyzed existing codebase patterns
- Designed auth flow architecture
- Created this plan document
