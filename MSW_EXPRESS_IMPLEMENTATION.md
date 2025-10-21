# MSW + Express Adapter Implementation Plan

**Status:** 🚧 In Progress
**Started:** 2025-10-21
**Current Phase:** Phase 6 - Express Adapter Package

---

## Progress Dashboard

| Phase | Status | PR | Completion |
|-------|--------|-----|-----------|
| Phase 1: Core Config Updates | ✅ Complete | [#8](https://github.com/citypaul/scenarist/pull/8) | 100% |
| Phase 2: MSW Adapter Package Setup | ✅ Complete | [#9](https://github.com/citypaul/scenarist/pull/9) | 100% |
| Phase 3: URL Matcher | ✅ Complete | [#10](https://github.com/citypaul/scenarist/pull/10) | 100% |
| Phase 4: Response Builder + Mock Matcher | ✅ Complete | [#11](https://github.com/citypaul/scenarist/pull/11) | 100% |
| Phase 5: Dynamic Handler | ✅ Complete | [#12](https://github.com/citypaul/scenarist/pull/12) | 100% |
| Phase 6: Express Adapter Package | 🚧 In Progress | - | 0% |
| Phase 7: Integration + Setup Helper | ⏸️ Pending | - | 0% |

**Legend:** 🔜 Next | 🚧 In Progress | ✅ Complete | ⏸️ Pending

---

## Architecture Overview

### Package Structure

```
packages/
├── core/                    # Domain logic (NO MSW dependency)
│   ├── types/               # ScenarioDefinition, MockDefinition, etc.
│   ├── ports/               # Interfaces (ScenarioManager, etc.)
│   └── domain/              # Business logic
│
├── msw-adapter/            # MSW integration (framework-agnostic) ⭐ NEW
│   ├── src/
│   │   ├── matching/
│   │   │   ├── url-matcher.ts         # Glob + path param matching
│   │   │   └── mock-matcher.ts        # Find matching MockDefinition
│   │   ├── conversion/
│   │   │   └── response-builder.ts    # MockDefinition → HttpResponse
│   │   ├── handlers/
│   │   │   └── dynamic-handler.ts     # Dynamic MSW handler factory
│   │   └── index.ts
│   └── tests/
│
└── express-adapter/        # Express-specific integration ⭐ NEW
    ├── src/
    │   ├── context/
    │   │   └── express-request-context.ts
    │   ├── middleware/
    │   │   └── test-id-middleware.ts
    │   ├── endpoints/
    │   │   └── scenario-endpoints.ts
    │   ├── setup/
    │   │   └── setup-scenarist.ts
    │   └── index.ts
    └── tests/
```

### Key Principles

1. **Users never see MSW** - They define `MockDefinition` (serializable data)
2. **Adapter converts at runtime** - `MockDefinition` → MSW `HttpHandler` dynamically
3. **Framework-agnostic core** - MSW conversion logic shared across all adapters
4. **Strict TDD** - Every line of code driven by a failing test
5. **Small PRs** - Each phase is independently testable and mergeable

### User Experience (Final API)

```typescript
import { createScenarist } from '@scenarist/express-adapter';

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV !== 'production',
  devToolsEnabled: true,  // Enables GET/POST /__scenario__
  strictMode: false       // Passthrough unmocked requests
});

// Users define serializable data (never MSW handlers!)
scenarist.registerScenario({
  id: 'stripe-success',
  name: 'Stripe Payment Success',
  description: 'All Stripe calls succeed',
  devToolEnabled: true,
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: { id: 'ch_123', status: 'succeeded' },
        delay: 100
      }
    }
  ]
});

// Express integration
const app = express();
app.use(scenarist.middleware);

// Lifecycle
beforeAll(() => scenarist.start());
afterAll(() => scenarist.stop());
```

---

## Phase 1: Core Config Updates

**Goal:** Add `strictMode` config option
**PR:** [#8](https://github.com/citypaul/scenarist/pull/8)
**Status:** ✅ Complete
**Actual Time:** ~30 minutes

### Acceptance Criteria

- [x] `ScenaristConfig` has `strictMode: boolean` field
- [x] `buildConfig()` applies correct default (`strictMode: false`)
- [x] All existing tests pass
- [x] New tests cover new field using `it.each` pattern
- [x] Documentation updated
- [x] 100% coverage maintained
- [x] Created GitHub issue #7 for future `devToolsEnabled` feature

### Files to Modify

#### 1. `packages/core/src/types/config.ts`

**TDD Checklist:**
- [x] Read current file
- [x] Write test: `strictMode` defaults to `false`
- [x] Write test: `strictMode` can be set to `true`
- [x] Implement: Add `strictMode` field to `ScenaristConfig`
- [x] Implement: Add field to `ScenaristConfigInput`
- [x] All tests pass ✅

**Changes:**
```typescript
export type ScenaristConfig = {
  readonly enabled: boolean;
  readonly devToolsEnabled: boolean;  // ⭐ NEW
  readonly strictMode: boolean;       // ⭐ NEW
  readonly headers: { /* ... */ };
  readonly endpoints: { /* ... */ };
  readonly defaultScenario: string;
  readonly defaultTestId: string;
};

export type ScenaristConfigInput = {
  readonly enabled: boolean;
  readonly devToolsEnabled?: boolean;  // ⭐ NEW
  readonly strictMode?: boolean;       // ⭐ NEW
  readonly headers?: Partial<ScenaristConfig['headers']>;
  readonly endpoints?: Partial<ScenaristConfig['endpoints']>;
  readonly defaultScenario?: string;
  readonly defaultTestId?: string;
};
```

#### 2. `packages/core/src/domain/config-builder.ts`

**TDD Checklist:**
- [ ] Read current file
- [ ] Write test: defaults `devToolsEnabled` to `false` when not provided
- [ ] Write test: uses provided `devToolsEnabled` value
- [ ] Write test: defaults `strictMode` to `false` when not provided
- [ ] Write test: uses provided `strictMode` value
- [ ] Implement: Add defaults in `buildConfig()`
- [ ] All tests pass ✅

**Changes:**
```typescript
export const buildConfig = (input: ScenaristConfigInput): ScenaristConfig => {
  return {
    enabled: input.enabled,
    devToolsEnabled: input.devToolsEnabled ?? false,  // ⭐ NEW
    strictMode: input.strictMode ?? false,             // ⭐ NEW
    headers: {
      testId: input.headers?.testId ?? 'x-test-id',
      mockEnabled: input.headers?.mockEnabled ?? 'x-mock-enabled',
    },
    endpoints: {
      setScenario: input.endpoints?.setScenario ?? '/__scenario__',
      getScenario: input.endpoints?.getScenario ?? '/__scenario__',
    },
    defaultScenario: input.defaultScenario ?? 'default',
    defaultTestId: input.defaultTestId ?? 'default-test',
  };
};
```

#### 3. `packages/core/tests/config-builder.test.ts`

**TDD Checklist:**
- [ ] Add test: `should default devToolsEnabled to false`
- [ ] Add test: `should allow overriding devToolsEnabled`
- [ ] Add test: `should default strictMode to false`
- [ ] Add test: `should allow overriding strictMode`
- [ ] All tests pass ✅

#### 4. `packages/core/README.md`

**Updates:**
- [ ] Document new config fields
- [ ] Add examples showing `devToolsEnabled` and `strictMode`

### PR Checklist

- [ ] All tests passing
- [ ] 100% coverage maintained
- [ ] Documentation updated (config.ts JSDoc, README)
- [ ] Build passes (`pnpm build`)
- [ ] Type check passes (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Commit message: `feat(core): add devToolsEnabled and strictMode config options`
- [ ] PR description explains new fields and use cases
- [ ] Update this plan file with PR link

### Learnings

**YAGNI Applied:** Decided to skip `devToolsEnabled` field for now since dev tools won't be in v1. Created GitHub issue #7 to track future implementation. Only added what we need (`strictMode`).

**Test Efficiency:** Used `it.each` to test multiple config properties efficiently, reducing duplication. Pattern: test both override value AND default value in same test case.

```typescript
it.each([
  { property: 'strictMode', value: true, default: false },
  // ... more properties
])('should allow overriding $property', ({ property, value, default: defaultValue }) => {
  // Tests both override and default in one test
});
```

**Config Clarity:** The `/__scenario__` endpoints are core functionality (always available for tests), NOT part of "dev tools". Dev tools would be optional visual debugging UI (separate feature).

**Quick Win:** Phase completed much faster than estimated (~30 min vs 1-2 hours) because we kept scope minimal and used efficient testing patterns.

---

## Phase 2: MSW Adapter Package Setup

**Goal:** Create package structure with build/test infrastructure
**PR:** #9
**Status:** ✅ Complete
**Estimated Time:** 1 hour
**Actual Time:** ~45 minutes

### Acceptance Criteria

- [x] Package builds successfully
- [x] Tests run (even if empty)
- [x] TypeScript strict mode enabled
- [x] Coverage reporting configured (100% threshold)
- [x] Package exports defined
- [x] Can be imported by other packages

### Files to Create

#### 1. `packages/msw-adapter/package.json`

```json
{
  "name": "@scenarist/msw-adapter",
  "version": "0.0.0",
  "description": "Framework-agnostic MSW integration for Scenarist",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@scenarist/core": "workspace:*",
    "path-to-regexp": "^6.2.1"
  },
  "peerDependencies": {
    "msw": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@vitest/coverage-v8": "^1.6.1",
    "msw": "^2.0.0",
    "typescript": "^5.3.3",
    "vitest": "^1.6.1"
  }
}
```

#### 2. `packages/msw-adapter/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### 3. `packages/msw-adapter/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/index.ts',
      ],
      include: [
        'src/**/*.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
```

#### 4. `packages/msw-adapter/src/index.ts`

```typescript
// Empty exports for now - will be filled in later phases
export type { } from './matching/url-matcher.js';
export type { } from './matching/mock-matcher.js';
export type { } from './conversion/response-builder.js';
export type { } from './handlers/dynamic-handler.js';
```

#### 5. `packages/msw-adapter/src/matching/url-matcher.ts`

```typescript
// Placeholder - will be implemented in Phase 3
export const matchesUrl = (pattern: string, url: string): boolean => {
  throw new Error('Not implemented');
};
```

#### 6. `packages/msw-adapter/tests/setup.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('MSW Adapter Package', () => {
  it('should load successfully', () => {
    expect(true).toBe(true);
  });
});
```

#### 7. `packages/msw-adapter/README.md`

```markdown
# @scenarist/msw-adapter

Framework-agnostic MSW integration for Scenarist.

This package converts serializable `MockDefinition` data into MSW `HttpHandler` instances at runtime.

**Status:** 🚧 In Development

## Features

- URL pattern matching (exact, glob, path parameters)
- Dynamic MSW handler generation
- Response building from MockDefinition
- Framework-agnostic (works with Express, Fastify, Next.js, etc.)

## Internal Package

This is an internal package used by framework adapters. You typically don't install this directly.
Instead, use a framework-specific adapter like `@scenarist/express-adapter`.
```

### PR Checklist

- [ ] Package builds: `pnpm --filter=@scenarist/msw-adapter build`
- [ ] Tests run: `pnpm --filter=@scenarist/msw-adapter test`
- [ ] Can import from other packages
- [ ] Added to root `pnpm-workspace.yaml` (if needed)
- [ ] Turbo pipeline configured (if needed)
- [ ] Commit message: `feat(msw-adapter): initialize package with build infrastructure`
- [ ] Update this plan file with PR link

### Learnings

**Scope Consistency:** While setting up the package, discovered that the monorepo was using `@repo` scope for internal packages. Renamed to `@scenarist` for consistency with the project (packages: `typescript-config`, `eslint-config`, `ui`). This improves clarity and aligns all packages under the same namespace.

**tsconfig Simplification:** Initially included all strict mode compiler options in the package tsconfig. Realized these should be inherited from the base config (`@scenarist/typescript-config/base.json`). Only output-specific options (`outDir`, `rootDir`, `declaration`) should be in package tsconfigs.

**Small Commits:** Followed "commit small and often" principle by splitting work into two commits:
1. Refactor commit for @repo→@scenarist rename
2. Feature commit for msw-adapter package setup

This makes the PR easier to review and provides clear rollback points.

---

## Phase 3: URL Matcher

**Goal:** Implement URL pattern matching (exact, glob, path params)
**PR:** #10
**Status:** ✅ Complete
**Estimated Time:** 2-3 hours
**Actual Time:** ~1.5 hours

### Acceptance Criteria

- [x] Exact string matching works
- [x] Glob patterns work (`https://api.example.com/users/*`)
- [x] Path parameters work (`https://api.example.com/users/:id`)
- [x] Parameter extraction works
- [x] Edge cases handled (path-only patterns)
- [x] 100% test coverage
- [x] All tests follow functional pattern (no `let`, no `beforeEach`)

### Implementation Strategy

**TDD Order:**
1. Exact string matching (simplest)
2. Glob patterns (`*` wildcard)
3. Path parameters (`:id` syntax)
4. Parameter extraction
5. Edge cases

### Files to Implement

#### 1. `packages/msw-adapter/src/matching/url-matcher.ts`

**TDD Checklist:**
- [ ] Write test: exact match returns true
- [ ] Write test: different URL returns false
- [ ] Implement: exact string comparison ✅
- [ ] Write test: glob pattern `*/users` matches `https://api.com/users`
- [ ] Write test: glob pattern `*/users/*` matches `https://api.com/users/123`
- [ ] Write test: glob pattern doesn't match when pattern differs
- [ ] Implement: glob matching using minimatch or custom logic ✅
- [ ] Write test: path param `/users/:id` matches `/users/123`
- [ ] Write test: path param `/users/:id` doesn't match `/users/123/posts`
- [ ] Write test: extracts params correctly `{ id: '123' }`
- [ ] Write test: multiple params `/users/:userId/posts/:postId`
- [ ] Implement: path parameter matching using path-to-regexp ✅
- [ ] Write test: handles trailing slashes consistently
- [ ] Write test: handles query parameters
- [ ] Write test: handles URL fragments
- [ ] Refactor: extract helpers, clean up ✅

**Type Definitions:**
```typescript
/**
 * Match result containing whether URL matched and any extracted parameters.
 */
export type UrlMatchResult = {
  readonly matches: boolean;
  readonly params?: Readonly<Record<string, string>>;
};

/**
 * Check if a request URL matches a mock definition URL pattern.
 *
 * Supports:
 * - Exact strings: 'https://api.example.com/users'
 * - Glob patterns: 'https://api.example.com/users/*'
 * - Path parameters: 'https://api.example.com/users/:id'
 *
 * @param pattern - URL pattern from MockDefinition
 * @param requestUrl - Actual request URL
 * @returns Match result with params if applicable
 */
export const matchesUrl = (
  pattern: string,
  requestUrl: string
): UrlMatchResult => {
  // Implementation
};
```

#### 2. `packages/msw-adapter/tests/url-matcher.test.ts`

**TDD Checklist:**
- [ ] Test suite: Exact string matching
  - [ ] Returns true for exact match
  - [ ] Returns false for different URL
  - [ ] Case-sensitive matching
  - [ ] Handles trailing slashes
- [ ] Test suite: Glob patterns
  - [ ] `*/users` matches any domain + /users
  - [ ] `*/users/*` matches /users/anything
  - [ ] `https://api.com/*` matches any path on that domain
  - [ ] Doesn't match when pattern differs
- [ ] Test suite: Path parameters
  - [ ] `/users/:id` matches `/users/123`
  - [ ] Extracts parameter: `{ id: '123' }`
  - [ ] Multiple params: `/users/:userId/posts/:postId`
  - [ ] Doesn't match extra segments
  - [ ] Handles numeric vs string params
- [ ] Test suite: Edge cases
  - [ ] Query parameters: `/users?page=1` vs `/users`
  - [ ] URL fragments: `/users#section`
  - [ ] Protocol handling: http vs https
  - [ ] Port numbers: `http://localhost:3000/users`

**Functional test pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { matchesUrl } from '../src/matching/url-matcher';

describe('URL Matcher', () => {
  describe('Exact string matching', () => {
    it('should return true for exact match', () => {
      const result = matchesUrl(
        'https://api.example.com/users',
        'https://api.example.com/users'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it('should return false for different URL', () => {
      const result = matchesUrl(
        'https://api.example.com/users',
        'https://api.example.com/posts'
      );

      expect(result.matches).toBe(false);
    });
  });

  // More test suites...
});
```

### PR Checklist

- [ ] All tests passing
- [ ] 100% coverage on url-matcher.ts
- [ ] No `let` or `beforeEach` in tests
- [ ] Edge cases documented
- [ ] Build passes
- [x] Commit message: `feat(msw-adapter): implement URL pattern matching`
- [x] Update this plan file with PR link

### Learnings

**path-to-regexp URL Handling:** The `path-to-regexp` library is designed for path patterns (like Express routes), not full URLs with protocols. Attempting to pass `https://api.example.com/users/:id` directly fails because it treats the `:` in `https://` as a parameter. Solution: Extract just the pathname using the URL API before matching, and only apply path-to-regexp when the pattern actually contains path parameters (detected by checking for `:` after removing protocol).

**TDD Small Steps:** Following strict TDD (exact → glob → path params) made implementation straightforward. Each pattern type built naturally on the previous, and having tests green between each increment provided confidence. Committing after each pattern type (3 commits total) made review easier.

**100% Coverage Achievement:** The catch block in `extractPath` wasn't initially covered. Adding a test for path-only patterns (`/users/:id` without full URL) exercised this code path and achieved 100% coverage.

**Self-Documenting Code Through Refactoring:** Initial implementation had inline comments explaining what code did. PR feedback highlighted that comments indicate unclear code. Refactoring solution: extract well-named helper functions (`extractPathnameOrReturnAsIs`, `hasPathParamsAfterProtocol`, `convertGlobToRegex`, etc.) that make intent clear through naming. Result: zero comments, same clarity.

**Immutability Over Mutation:** Initial parameter extraction used mutable object with for-loop (`params[key] = value`). Replaced with functional approach using `Object.fromEntries` + `filter`, maintaining 100% coverage while following immutable patterns.

---

## Phase 4: Response Builder + Mock Matcher

**Goal:** Convert MockDefinition to MSW HttpResponse and find matching mocks
**PR:** #11
**Status:** ✅ Complete
**Estimated Time:** 2-3 hours
**Actual Time:** ~2 hours

### Acceptance Criteria

- [ ] Can build HttpResponse from MockDefinition
- [ ] Status codes applied correctly
- [ ] Response bodies handled (JSON, text, etc.)
- [ ] Headers applied
- [ ] Delays work
- [ ] Can find matching mock from array of MockDefinitions
- [ ] Method matching works (GET, POST, etc.)
- [ ] URL matching works (uses url-matcher from Phase 3)
- [ ] Returns undefined when no match
- [ ] 100% test coverage

### Files to Implement

#### 1. `packages/msw-adapter/src/conversion/response-builder.ts`

**TDD Checklist:**
- [ ] Write test: builds response with status code
- [ ] Write test: includes JSON body
- [ ] Write test: includes custom headers
- [ ] Write test: applies delay
- [ ] Write test: handles undefined body
- [ ] Write test: handles text responses
- [ ] Write test: handles empty responses
- [ ] Implement: buildResponse function ✅
- [ ] Refactor: extract helpers ✅

**Implementation:**
```typescript
import { HttpResponse, delay as mswDelay } from 'msw';
import type { MockDefinition } from '@scenarist/core';

/**
 * Build an MSW HttpResponse from a MockDefinition.
 *
 * Converts serializable mock data into MSW response.
 */
export const buildResponse = async (
  mock: MockDefinition
): Promise<Response> => {
  // Apply delay if specified
  if (mock.response.delay) {
    await mswDelay(mock.response.delay);
  }

  // Build response
  return HttpResponse.json(mock.response.body, {
    status: mock.response.status,
    headers: mock.response.headers,
  });
};
```

#### 2. `packages/msw-adapter/src/matching/mock-matcher.ts`

**TDD Checklist:**
- [ ] Write test: finds mock matching method and URL
- [ ] Write test: returns undefined when no match
- [ ] Write test: returns first match when multiple match
- [ ] Write test: method matching is case-insensitive
- [ ] Write test: uses url-matcher for URL matching
- [ ] Write test: handles empty mocks array
- [ ] Implement: findMatchingMock function ✅
- [ ] Refactor: clean up ✅

**Implementation:**
```typescript
import type { MockDefinition, HttpMethod } from '@scenarist/core';
import { matchesUrl } from './url-matcher.js';

/**
 * Find the first MockDefinition that matches the request method and URL.
 *
 * @param mocks - Array of mock definitions to search
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - Request URL
 * @returns Matching mock or undefined
 */
export const findMatchingMock = (
  mocks: ReadonlyArray<MockDefinition>,
  method: string,
  url: string
): MockDefinition | undefined => {
  return mocks.find((mock) => {
    const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
    const urlMatch = matchesUrl(mock.url, url);
    return methodMatches && urlMatch.matches;
  });
};
```

#### 3. Tests

**TDD Checklist:**
- [ ] `tests/response-builder.test.ts` - All response building scenarios
- [ ] `tests/mock-matcher.test.ts` - All mock matching scenarios
- [ ] Follow functional test pattern (no `let`, no `beforeEach`)

### PR Checklist

- [ ] All tests passing
- [ ] 100% coverage
- [ ] Build passes
- [ ] Integration between url-matcher and mock-matcher works
- [ ] Commit message: `feat(msw-adapter): implement response builder and mock matcher`
- [ ] Update this plan file with PR link

### Learnings

**Type Assertion for MSW HttpResponse:** MSW's `HttpResponse.json()` expects a specific `JsonBodyType`, but our `MockDefinition` uses `unknown` for the body (to ensure JSON-serializability). Used `as never` type assertion to satisfy TypeScript while maintaining runtime safety. The body is guaranteed to be JSON-serializable by design.

**TDD Incremental Building:** Building both features in small increments (7 commits total) made the implementation straightforward. Each commit was a complete, working unit: status codes → JSON body → headers → delay for response builder, then basic matching → edge cases → URL patterns for mock matcher.

**Integration Through Composition:** The `findMatchingMock` function leveraged the existing `matchesUrl` function, demonstrating how well-tested, focused functions compose cleanly. No need to retest URL matching logic—just test the integration point.

**100% Coverage Through TDD:** Following strict TDD resulted in 100% coverage naturally. Every line of code was written in response to a failing test, so every line is covered. No need for "coverage hunting" at the end.

---

## Phase 5: Dynamic Handler

**Goal:** Create dynamic MSW handler with default scenario fallback pattern
**PR:** #12
**Status:** ✅ Complete
**Estimated Time:** 3-4 hours
**Actual Time:** ~2 hours

### Acceptance Criteria

- [ ] Creates single catch-all MSW handler
- [ ] Reads test ID from injected function
- [ ] Looks up active scenario for test ID
- [ ] Finds matching mock in active scenario first
- [ ] **Falls back to "default" scenario if mock not found in active scenario** ⭐
- [ ] **Uses "default" scenario when no active scenario set** ⭐
- [ ] Returns built response from whichever scenario had the mock
- [ ] Handles passthrough in non-strict mode (when no mock in default either)
- [ ] Returns error in strict mode when no mock in any scenario
- [ ] 100% test coverage including default scenario fallback

### Files to Implement

#### 1. `packages/msw-adapter/src/handlers/dynamic-handler.ts`

**TDD Checklist:**
- [ ] Write test: calls getTestId to get test ID
- [ ] Write test: looks up active scenario with test ID
- [ ] Write test: gets scenario definition
- [ ] Write test: finds matching mock in active scenario
- [ ] Write test: returns built response when mock found
- [ ] **Write test: falls back to default scenario when mock not in active scenario** ⭐
- [ ] **Write test: uses default scenario when no active scenario** ⭐
- [ ] **Write test: returns default mock when active scenario has no matching mock** ⭐
- [ ] Write test: passthrough when no mock in default either (non-strict mode)
- [ ] Write test: error when no mock in default either (strict mode)
- [ ] Write test: passthrough when default scenario not found
- [ ] Implement: createDynamicHandler factory ✅
- [ ] Refactor: extract logic, clean up ✅

**Type Definitions:**
```typescript
import type { HttpHandler } from 'msw';
import type { ActiveScenario, ScenarioDefinition } from '@scenarist/core';

export type DynamicHandlerOptions = {
  /**
   * Get the current test ID from AsyncLocalStorage or other context.
   */
  readonly getTestId: () => string;

  /**
   * Look up active scenario for a test ID.
   */
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;

  /**
   * Get scenario definition by ID.
   */
  readonly getScenarioDefinition: (scenarioId: string) => ScenarioDefinition | undefined;

  /**
   * Whether to enforce strict mode (error on unmocked requests).
   */
  readonly strictMode: boolean;
};

/**
 * Create a dynamic MSW handler that routes based on active scenarios.
 *
 * This is the core integration between Scenarist and MSW.
 * A single catch-all handler that:
 * 1. Reads test ID from context
 * 2. Looks up active scenario
 * 3. Finds matching mock
 * 4. Returns response or passthrough
 */
export const createDynamicHandler = (
  options: DynamicHandlerOptions
): HttpHandler => {
  // Implementation
};
```

**Implementation:**
```typescript
import { http, HttpResponse, passthrough } from 'msw';
import { findMatchingMock } from '../matching/mock-matcher.js';
import { buildResponse } from '../conversion/response-builder.js';
import type { MockDefinition } from '@scenarist/core';
import type { DynamicHandlerOptions } from './types.js';

export const createDynamicHandler = (
  options: DynamicHandlerOptions
): HttpHandler => {
  return http.all('*', async ({ request }) => {
    // 1. Get test ID
    const testId = options.getTestId();

    // 2. Look up active scenario (test-specific or default)
    const activeScenario = options.getActiveScenario(testId);

    // 3. Try to find mock in active scenario first
    let mock: MockDefinition | undefined;

    if (activeScenario) {
      const scenarioDefinition = options.getScenarioDefinition(activeScenario.scenarioId);
      if (scenarioDefinition) {
        mock = findMatchingMock(
          scenarioDefinition.mocks,
          request.method,
          request.url
        );
      }
    }

    // 4. If not found in active scenario, fall back to default scenario
    if (!mock) {
      const defaultScenario = options.getScenarioDefinition('default');
      if (defaultScenario) {
        mock = findMatchingMock(
          defaultScenario.mocks,
          request.method,
          request.url
        );
      }
    }

    // 5. If still no mock found, apply strictMode behavior
    if (!mock) {
      return options.strictMode
        ? HttpResponse.json(
            {
              error: 'No mock defined for this request',
              method: request.method,
              url: request.url,
              testId,
              scenarioId: activeScenario?.scenarioId ?? 'none'
            },
            { status: 501 }
          )
        : passthrough();
    }

    // 6. Build and return response
    return buildResponse(mock);
  });
};
```

#### 2. `packages/msw-adapter/tests/dynamic-handler.test.ts`

**TDD Checklist:**
- [ ] Test suite: Test ID retrieval
- [ ] Test suite: Active scenario lookup
- [ ] Test suite: Scenario definition lookup
- [ ] Test suite: Mock matching
- [ ] Test suite: Response building
- [ ] Test suite: Passthrough behavior
- [ ] Test suite: Strict mode errors
- [ ] Test suite: Edge cases (no scenario, no definition, no mock)
- [ ] Use functional test pattern with factory functions

**Test pattern:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { createDynamicHandler } from '../src/handlers/dynamic-handler';
import type { ActiveScenario, ScenarioDefinition } from '@scenarist/core';

const createTestSetup = (options: {
  testId?: string;
  activeScenario?: ActiveScenario;
  scenarioDefinition?: ScenarioDefinition;
  strictMode?: boolean;
}) => {
  const getTestId = vi.fn(() => options.testId ?? 'test-123');
  const getActiveScenario = vi.fn(() => options.activeScenario);
  const getScenarioDefinition = vi.fn(() => options.scenarioDefinition);

  const handler = createDynamicHandler({
    getTestId,
    getActiveScenario,
    getScenarioDefinition,
    strictMode: options.strictMode ?? false,
  });

  const server = setupServer(handler);

  return {
    handler,
    server,
    getTestId,
    getActiveScenario,
    getScenarioDefinition
  };
};

describe('Dynamic Handler', () => {
  it('should look up test ID and active scenario', async () => {
    const { server, getTestId, getActiveScenario } = createTestSetup({
      testId: 'test-123',
      activeScenario: { scenarioId: 'happy-path' },
    });

    server.listen();

    await fetch('https://api.example.com/test');

    expect(getTestId).toHaveBeenCalled();
    expect(getActiveScenario).toHaveBeenCalledWith('test-123');

    server.close();
  });

  // More tests...
});
```

#### 3. Update `packages/msw-adapter/src/index.ts`

Export all public APIs:
```typescript
export { matchesUrl } from './matching/url-matcher.js';
export { findMatchingMock } from './matching/mock-matcher.js';
export { buildResponse } from './conversion/response-builder.js';
export { createDynamicHandler } from './handlers/dynamic-handler.js';

export type { UrlMatchResult } from './matching/url-matcher.js';
export type { DynamicHandlerOptions } from './handlers/dynamic-handler.js';
```

### PR Checklist

- [ ] All tests passing
- [ ] 100% coverage
- [ ] Integration test with real MSW server
- [ ] Build passes
- [ ] Public API exported from index.ts
- [ ] Commit message: `feat(msw-adapter): implement dynamic MSW handler`
- [ ] Update this plan file with PR link

### Learnings

**Testing Passthrough Behavior:** MSW's `passthrough()` actually passes requests through to the real network, which means testing it requires handling real network errors. For test domains like `api.example.com`, passthrough will fail with network errors (ENOTFOUND). This is expected behavior - we verify passthrough by checking that the request throws (attempts real network call) rather than being intercepted.

**Default Scenario Pattern:** The default scenario fallback is a key architectural pattern. When an active scenario doesn't have a matching mock, falling back to 'default' scenario provides sensible baseline behavior. This allows tests to override only specific endpoints while relying on defaults for everything else.

**Strict vs Non-Strict Mode:** Strict mode (501 error) is useful for catching unexpected requests during development, while non-strict mode (passthrough) is useful for integration tests where some real API calls are acceptable.

**100% Coverage with TDD:** Following strict TDD resulted in 100% coverage with only 5 tests. Each test was written to verify a specific behavior (active scenario, default fallback, no scenario, passthrough, strict mode), and the implementation naturally covered all branches.

**CRITICAL: Avoid Mutable `let` Bindings (PR Feedback):** Initial implementation used `let mock;` with reassignment, violating functional programming principles. PR feedback caught this violation. Solution: Extract pure function `findMockInScenarios` that encapsulates the lookup logic using early returns and const bindings. This maintains immutability while expressing the same logic clearly.

**Unnecessary `vi.fn()` Usage (PR Feedback):** Initially used `vi.fn()` to create mock functions without any assertions on those mocks. User question "can you explain why vi.fn is needed" revealed the code smell: tests were focused on implementation (whether functions were called) instead of behavior (what outputs were returned). Solution: Replace all `vi.fn()` calls with plain arrow functions. Tests now verify pure behavior - given these inputs (scenarios, test ID), what response does the handler return?

**Factory Functions Improve Test Clarity (PR Feedback):** Initial tests had verbose inline `ScenarioDefinition` and `MockDefinition` objects (30+ lines per test), obscuring what was actually being tested. Solution: Create factory functions with sensible defaults and optional overrides (`createMock`, `createScenario`). Tests now clearly show intent - the test name combined with the factory calls immediately reveal what behavior is being verified. Reduced test file from ~210 lines to ~198 lines while improving readability.

**Testing Implementation vs. Behavior:** This phase reinforced the importance of testing behavior through public APIs. The handler's job is to return the correct response for a given request - not to call specific functions in a specific order. By removing mocks and focusing on outputs, tests became both clearer and more maintainable. If we refactor the internal lookup logic (which we did by extracting `findMockInScenarios`), the tests don't break because they're testing the contract, not the implementation.

---

## Phase 6: Express Adapter Package

**Goal:** Create Express-specific integration using msw-adapter
**PR:** TBD
**Status:** 🚧 In Progress
**Estimated Time:** 4-5 hours

### Acceptance Criteria

- [ ] Package builds and tests run
- [ ] ExpressRequestContext implements RequestContext port
- [ ] Test ID middleware with AsyncLocalStorage works
- [ ] Dev tool endpoints (GET/POST /__scenario__) work
- [ ] Endpoints respect devToolsEnabled config
- [ ] Integration with msw-adapter works
- [ ] 100% test coverage

### Package Structure

```
packages/express-adapter/
├── src/
│   ├── context/
│   │   └── express-request-context.ts
│   ├── middleware/
│   │   └── test-id-middleware.ts
│   ├── endpoints/
│   │   └── scenario-endpoints.ts
│   └── index.ts
├── tests/
│   ├── express-request-context.test.ts
│   ├── test-id-middleware.test.ts
│   ├── scenario-endpoints.test.ts
│   └── setup.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Files to Create

#### 1. `packages/express-adapter/package.json`

```json
{
  "name": "@scenarist/express-adapter",
  "version": "0.0.0",
  "description": "Express middleware adapter for Scenarist",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@scenarist/core": "workspace:*",
    "@scenarist/msw-adapter": "workspace:*"
  },
  "peerDependencies": {
    "express": "^4.18.0 || ^5.0.0",
    "msw": "^2.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "@types/supertest": "^6.0.2",
    "@vitest/coverage-v8": "^1.6.1",
    "express": "^4.18.2",
    "msw": "^2.0.0",
    "supertest": "^7.0.0",
    "typescript": "^5.3.3",
    "vitest": "^1.6.1"
  }
}
```

#### 2. `packages/express-adapter/src/context/express-request-context.ts`

**TDD Checklist:**
- [ ] Write test: getTestId() reads from header
- [ ] Write test: getTestId() uses default when header missing
- [ ] Write test: getTestId() handles array headers
- [ ] Write test: header names are case-insensitive
- [ ] Write test: isMockEnabled() reads header
- [ ] Write test: isMockEnabled() defaults to true
- [ ] Write test: getHeaders() returns all headers
- [ ] Write test: getHostname() returns hostname
- [ ] Implement: ExpressRequestContext class ✅
- [ ] Refactor: clean up ✅

**Implementation:**
```typescript
import type { Request } from 'express';
import type { RequestContext, ScenaristConfig } from '@scenarist/core';

export class ExpressRequestContext implements RequestContext {
  constructor(
    private readonly req: Request,
    private readonly config: ScenaristConfig
  ) {}

  getTestId(): string {
    const headerName = this.config.headers.testId.toLowerCase();
    const header = this.req.headers[headerName];

    if (typeof header === 'string') {
      return header;
    }

    if (Array.isArray(header) && header.length > 0) {
      return header[0];
    }

    return this.config.defaultTestId;
  }

  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers[headerName];

    // Default to true if header not present
    if (!header) {
      return true;
    }

    return header === 'true';
  }

  getHeaders(): Record<string, string | string[] | undefined> {
    return this.req.headers;
  }

  getHostname(): string {
    return this.req.hostname;
  }
}
```

#### 3. `packages/express-adapter/src/middleware/test-id-middleware.ts`

**TDD Checklist:**
- [ ] Write test: stores test ID in AsyncLocalStorage
- [ ] Write test: extracts test ID from request
- [ ] Write test: uses default test ID when header missing
- [ ] Write test: calls next()
- [ ] Write test: handles errors
- [ ] Implement: middleware factory ✅
- [ ] Export AsyncLocalStorage for handler access ✅

**Implementation:**
```typescript
import { AsyncLocalStorage } from 'async_hooks';
import type { Request, Response, NextFunction } from 'express';
import type { ScenaristConfig } from '@scenarist/core';
import { ExpressRequestContext } from '../context/express-request-context.js';

export const testIdStorage = new AsyncLocalStorage<string>();

export const createTestIdMiddleware = (config: ScenaristConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();

    testIdStorage.run(testId, () => {
      next();
    });
  };
};
```

#### 4. `packages/express-adapter/src/endpoints/scenario-endpoints.ts`

**TDD Checklist:**
- [ ] Write test: POST /__scenario__ sets scenario
- [ ] Write test: POST validates request body with Zod
- [ ] Write test: POST returns 400 for invalid scenario
- [ ] Write test: POST returns 400 for validation errors
- [ ] Write test: POST extracts test ID from request
- [ ] Write test: GET /__scenario__ returns active scenario
- [ ] Write test: GET returns 404 when no scenario active
- [ ] Write test: GET extracts test ID from request
- [ ] Write test: endpoints not created when devToolsEnabled is false
- [ ] Implement: createScenarioEndpoints router factory ✅

**Implementation:**
```typescript
import { Router } from 'express';
import { z } from 'zod';
import type { ScenarioManager, ScenaristConfig } from '@scenarist/core';
import { ExpressRequestContext } from '../context/express-request-context.js';

const scenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});

export const createScenarioEndpoints = (
  manager: ScenarioManager,
  config: ScenaristConfig
): Router | null => {
  if (!config.devToolsEnabled) {
    return null;
  }

  const router = Router();

  // POST /__scenario__ - Set scenario
  router.post(config.endpoints.setScenario, (req, res) => {
    try {
      const { scenario, variant } = scenarioRequestSchema.parse(req.body);
      const context = new ExpressRequestContext(req, config);
      const testId = context.getTestId();

      const result = manager.switchScenario(testId, scenario, variant);

      if (!result.success) {
        return res.status(400).json({
          error: result.error.message,
        });
      }

      return res.status(200).json({
        success: true,
        testId,
        scenario,
        variant,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request body',
          details: error.errors,
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  // GET /__scenario__ - Get current scenario
  router.get(config.endpoints.getScenario, (req, res) => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();
    const activeScenario = manager.getActiveScenario(testId);

    if (!activeScenario) {
      return res.status(404).json({
        error: 'No active scenario for this test ID',
        testId,
      });
    }

    const scenarioDefinition = manager.getScenarioById(activeScenario.scenarioId);

    return res.status(200).json({
      testId,
      scenarioId: activeScenario.scenarioId,
      scenarioName: scenarioDefinition?.name,
      variantName: activeScenario.variantName,
    });
  });

  return router;
};
```

#### 5. Tests

**TDD Checklist:**
- [ ] `tests/express-request-context.test.ts` - Full RequestContext coverage
- [ ] `tests/test-id-middleware.test.ts` - AsyncLocalStorage coverage
- [ ] `tests/scenario-endpoints.test.ts` - All endpoint scenarios with supertest
- [ ] All tests use functional pattern (no `let`, no `beforeEach`)

### PR Checklist

- [ ] All tests passing
- [ ] 100% coverage
- [ ] Build passes
- [ ] Can be imported successfully
- [ ] Integration with @scenarist/msw-adapter works
- [ ] Commit message: `feat(express-adapter): implement Express middleware and endpoints`
- [ ] Update this plan file with PR link

### Learnings

_(To be filled after completion)_

---

## Phase 7: Integration + Setup Helper

**Goal:** Wire everything together with convenience API and full E2E tests
**PR:** TBD
**Status:** ⏸️ Pending
**Estimated Time:** 3-4 hours

### Acceptance Criteria

- [ ] `createScenarist()` factory wires everything together
- [ ] Returns middleware, lifecycle methods, and manager methods
- [ ] Full E2E test with Express app making external API calls
- [ ] Tests verify scenarios work end-to-end
- [ ] Tests verify test ID isolation
- [ ] README with complete examples
- [ ] Documentation updated

### Files to Implement

#### 1. `packages/express-adapter/src/setup/setup-scenarist.ts`

**TDD Checklist:**
- [ ] Write test: creates manager with default registry/store
- [ ] Write test: uses injected registry/store if provided
- [ ] Write test: creates MSW server
- [ ] Write test: creates dynamic handler with correct options
- [ ] Write test: creates middleware
- [ ] Write test: creates endpoints when devToolsEnabled
- [ ] Write test: doesn't create endpoints when devToolsEnabled is false
- [ ] Write test: start() starts MSW server
- [ ] Write test: stop() stops MSW server
- [ ] Write test: exposes all manager methods
- [ ] Implement: createScenarist factory ✅

**Implementation:**
```typescript
import { setupServer } from 'msw/node';
import {
  createScenarioManager,
  buildConfig,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  type ScenaristConfig,
  type ScenarioManager,
  type ScenarioRegistry,
  type ScenarioStore,
  type ScenarioDefinition,
  type Result,
} from '@scenarist/core';
import { createDynamicHandler } from '@scenarist/msw-adapter';
import { Router } from 'express';
import { testIdStorage } from '../middleware/test-id-middleware.js';
import { createTestIdMiddleware } from '../middleware/test-id-middleware.js';
import { createScenarioEndpoints } from '../endpoints/scenario-endpoints.js';

export type CreateScenaristOptions = {
  readonly enabled: boolean;
  readonly devToolsEnabled?: boolean;
  readonly strictMode?: boolean;
  readonly headers?: {
    readonly testId?: string;
    readonly mockEnabled?: string;
  };
  readonly endpoints?: {
    readonly setScenario?: string;
    readonly getScenario?: string;
  };
  readonly defaultTestId?: string;
  readonly defaultScenario?: string;
  readonly registry?: ScenarioRegistry;
  readonly store?: ScenarioStore;
  readonly msw?: {
    readonly onUnhandledRequest?: 'warn' | 'error' | 'bypass';
    readonly quiet?: boolean;
  };
};

export type Scenarist = {
  readonly middleware: Router;
  readonly registerScenario: (definition: ScenarioDefinition) => void;
  readonly switchScenario: (
    testId: string,
    scenarioId: string,
    variantName?: string
  ) => Result<void, Error>;
  readonly getActiveScenario: ScenarioManager['getActiveScenario'];
  readonly listScenarios: ScenarioManager['listScenarios'];
  readonly clearScenario: ScenarioManager['clearScenario'];
  readonly getScenarioById: ScenarioManager['getScenarioById'];
  readonly start: () => void;
  readonly stop: () => Promise<void>;
  readonly server: ReturnType<typeof setupServer>;
};

export const createScenarist = (options: CreateScenaristOptions): Scenarist => {
  // Build config
  const config = buildConfig(options);

  // Create or use provided registry/store
  const registry = options.registry ?? new InMemoryScenarioRegistry();
  const store = options.store ?? new InMemoryScenarioStore();

  // Create scenario manager
  const manager = createScenarioManager({ registry, store });

  // Create dynamic MSW handler
  const dynamicHandler = createDynamicHandler({
    getTestId: () => testIdStorage.getStore() ?? config.defaultTestId,
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
  });

  // Create MSW server
  const server = setupServer(dynamicHandler);

  // Create Express middleware router
  const middleware = Router();

  // Add test ID middleware
  middleware.use(createTestIdMiddleware(config));

  // Add scenario endpoints if dev tools enabled
  const endpoints = createScenarioEndpoints(manager, config);
  if (endpoints) {
    middleware.use(endpoints);
  }

  return {
    middleware,
    registerScenario: manager.registerScenario.bind(manager),
    switchScenario: manager.switchScenario.bind(manager),
    getActiveScenario: manager.getActiveScenario.bind(manager),
    listScenarios: manager.listScenarios.bind(manager),
    clearScenario: manager.clearScenario.bind(manager),
    getScenarioById: manager.getScenarioById.bind(manager),
    start: () => server.listen(options.msw),
    stop: () => server.close(),
    server,
  };
};
```

#### 2. `packages/express-adapter/tests/integration.test.ts`

**TDD Checklist:**
- [ ] Test: Full E2E with Express app
- [ ] Test: Register scenario and switch via API
- [ ] Test: External API call gets mocked response
- [ ] Test: Different test IDs get different scenarios
- [ ] Test: Passthrough works in non-strict mode
- [ ] Test: Error in strict mode
- [ ] Test: Dev endpoints work when enabled
- [ ] Test: Dev endpoints don't exist when disabled
- [ ] Use functional test pattern

**Example test:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createScenarist } from '../src';

describe('Express Adapter Integration', () => {
  const createTestApp = () => {
    const scenarist = createScenarist({
      enabled: true,
      devToolsEnabled: true,
      strictMode: false,
    });

    // Register test scenario
    scenarist.registerScenario({
      id: 'stripe-success',
      name: 'Stripe Success',
      description: 'Stripe calls succeed',
      devToolEnabled: true,
      mocks: [
        {
          method: 'POST',
          url: 'https://api.stripe.com/v1/charges',
          response: {
            status: 200,
            body: { id: 'ch_123', status: 'succeeded' },
          },
        },
      ],
    });

    const app = express();
    app.use(express.json());
    app.use(scenarist.middleware);

    // Test route that calls external API
    app.post('/checkout', async (req, res) => {
      try {
        // This would normally call real Stripe API
        // MSW intercepts it and returns mock
        const response = await fetch('https://api.stripe.com/v1/charges', {
          method: 'POST',
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    return { app, scenarist };
  };

  it('should mock external API calls based on active scenario', async () => {
    const { app, scenarist } = createTestApp();

    scenarist.start();

    try {
      // Set scenario
      await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 'stripe-success' });

      // Make request that triggers external API call
      const response = await request(app)
        .post('/checkout')
        .set('x-test-id', 'test-123')
        .send({ amount: 1000 });

      // Verify mocked response
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('ch_123');
      expect(response.body.status).toBe('succeeded');
    } finally {
      await scenarist.stop();
    }
  });

  // More integration tests...
});
```

#### 3. `packages/express-adapter/README.md`

**Content:**
- Full API documentation
- Quick start guide
- Examples
- Troubleshooting
- MSW integration notes

#### 4. Update `packages/express-adapter/src/index.ts`

```typescript
export { createScenarist } from './setup/setup-scenarist.js';
export { ExpressRequestContext } from './context/express-request-context.js';
export { createTestIdMiddleware, testIdStorage } from './middleware/test-id-middleware.js';
export { createScenarioEndpoints } from './endpoints/scenario-endpoints.js';

export type { CreateScenaristOptions, Scenarist } from './setup/setup-scenarist.js';
```

### PR Checklist

- [ ] All tests passing (including integration tests)
- [ ] 100% coverage
- [ ] Build passes
- [ ] README complete with examples
- [ ] Root CLAUDE.md updated with learnings
- [ ] Update SCENARIST_IMPLEMENTATION_PLAN.md with status
- [ ] Commit message: `feat(express-adapter): add createScenarist setup helper and integration tests`
- [ ] Update this plan file with PR link and mark complete

### Learnings

_(To be filled after completion)_

---

## Post-Implementation

### Documentation Updates

- [ ] Update root README.md with Express adapter example
- [ ] Update CLAUDE.md with architecture learnings
- [ ] Create example app in `examples/express-basic/`
- [ ] Add troubleshooting guide

### Release Preparation

- [ ] All packages build successfully
- [ ] All tests passing
- [ ] 100% coverage across all packages
- [ ] Changesets created for each package
- [ ] CHANGELOG.md updated

---

## Architecture Decisions Log

### Decision 1: Default Scenario with Override Pattern

**Date:** 2025-10-21
**Decision:** Always require a "default" scenario that provides comprehensive happy-path responses. Test-specific scenarios SUPPLEMENT (not replace) the default scenario.

**Rationale:**
- Provides sensible fallback behavior without requiring every test to define all mocks
- Reduces duplication - test scenarios only define what they need to override
- Ensures consistent base behavior across tests
- Simplifies test scenario definitions

**Mock Resolution Algorithm (implemented in Dynamic Handler - Phase 5):**

```typescript
// Pseudo-code for mock resolution
function findMock(request, testId) {
  // 1. Get active scenario for this test (if any)
  const activeScenario = getActiveScenario(testId);

  // 2. Try to find mock in active scenario first
  if (activeScenario) {
    const mock = findMatchingMock(activeScenario.mocks, request);
    if (mock) return mock;  // Found in test scenario
  }

  // 3. Fall back to default scenario
  const defaultScenario = getScenarioById('default');
  const mock = findMatchingMock(defaultScenario.mocks, request);
  if (mock) return mock;  // Found in default scenario

  // 4. No mock found - apply strictMode behavior
  if (strictMode) {
    return error501();  // Strict: error on unmocked
  } else {
    return passthrough();  // Non-strict: passthrough to real API
  }
}
```

**Example:**

```typescript
// Default scenario - comprehensive happy path (REQUIRED)
scenarist.registerScenario({
  id: 'default',
  name: 'Default Happy Path',
  description: 'Base success responses for all endpoints',
  mocks: [
    { method: 'GET', url: '*/api/users', response: { status: 200, body: { users: [] } } },
    { method: 'POST', url: '*/api/users', response: { status: 201, body: { id: '123' } } },
    { method: 'GET', url: '*/api/orders', response: { status: 200, body: { orders: [] } } },
    { method: 'POST', url: '*/api/orders', response: { status: 201, body: { id: '456' } } }
  ]
});

// Test scenario - only overrides what it needs
scenarist.registerScenario({
  id: 'user-creation-fails',
  name: 'User Creation Fails',
  description: 'POST /users returns 400 error',
  mocks: [
    // Only override POST /users
    { method: 'POST', url: '*/api/users', response: { status: 400, body: { error: 'Email exists' } } }
    // GET /users, GET /orders, POST /orders all fall back to default scenario
  ]
});
```

**When test uses "user-creation-fails" scenario:**
- POST /api/users → 400 error (from test scenario)
- GET /api/users → 200 success (from DEFAULT scenario - fallback)
- GET /api/orders → 200 success (from DEFAULT scenario - fallback)
- POST /api/orders → 201 success (from DEFAULT scenario - fallback)

**Implementation Location:** This merge logic is implemented in the Dynamic Handler (Phase 5), not in core. Core only stores scenario references.

### Decision 2: Shared MSW Adapter Package

**Date:** 2025-10-21
**Decision:** Create separate `@scenarist/msw-adapter` package
**Rationale:**
- Avoid duplicating MSW conversion logic across framework adapters
- Enable consistent behavior across Express, Fastify, Next.js adapters
- Isolate MSW-specific logic from framework-specific logic
- Better testability

### Decision 3: AsyncLocalStorage for Test ID

**Date:** TBD
**Decision:** Use Node.js AsyncLocalStorage for test ID context
**Rationale:**
- Enables per-request isolation without modifying request objects
- Works seamlessly with async/await
- Thread-safe for concurrent requests
- Standard Node.js API (no external dependencies)

### Decision 4: Dynamic Single Handler vs. Multiple Handlers

**Date:** TBD
**Decision:** Single catch-all dynamic handler
**Rationale:**
- Simpler to manage (one handler vs. many)
- Easier to debug
- Better performance (no handler creation overhead)
- Enables true runtime scenario switching

---

## Testing Strategy

### Coverage Requirements

- **All packages:** 100% statement, branch, function, and line coverage
- **Enforcement:** Vitest thresholds fail build on < 100%
- **Exclusions:** Only type definitions, interfaces, and index re-exports

### Test Patterns

1. **Functional Test Pattern** (mandatory)
   - No `let` declarations
   - No `beforeEach` hooks
   - Factory functions for test setup
   - Each test isolated with fresh dependencies

2. **TDD Cycle** (mandatory)
   - RED: Write failing test first
   - GREEN: Implement minimum code to pass
   - REFACTOR: Clean up while keeping tests green
   - Commit after each phase

3. **Test Organization**
   - Test behavior, not implementation
   - Use descriptive test names
   - Group related tests in describe blocks
   - Test edge cases explicitly

---

## Common Issues & Solutions

_(To be filled as we encounter issues during implementation)_

---

## Glossary

- **MockDefinition:** Serializable data structure defining an HTTP mock (in core package)
- **HttpHandler:** MSW's runtime handler type (created by msw-adapter)
- **ScenarioDefinition:** Collection of MockDefinitions representing a test state
- **ActiveScenario:** Reference to which scenario is active for a test ID
- **Test ID:** Unique identifier for test isolation (passed via header)
- **Dynamic Handler:** Single MSW handler that routes based on active scenarios

---

**Last Updated:** 2025-10-21
**Next Update:** After Phase 1 completion
