# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scenarist** is a hexagonal architecture library for managing MSW (Mock Service Worker) mock scenarios in E2E testing environments. It enables concurrent tests to run with different backend states via test IDs, allowing runtime scenario switching without application restarts.

**Current Status**: All core packages implemented and tested! The hexagonal architecture is complete with:

**Core Package** (`packages/core`)
- ✅ All types and ports defined (serializable, immutable)
- ✅ Domain logic implemented (`createScenarioManager`, `buildConfig`)
- ✅ Default adapters (`InMemoryScenarioRegistry`, `InMemoryScenarioStore`)
- ✅ 54 tests passing, 100% behavior coverage

**MSW Adapter** (`packages/msw-adapter`)
- ✅ URL pattern matching (exact, glob, path parameters)
- ✅ Mock definition → MSW handler conversion
- ✅ Dynamic handler with scenario fallback
- ✅ 31 tests passing, 100% coverage

**Express Adapter** (`packages/express-adapter`)
- ✅ Express middleware integration
- ✅ Test ID extraction via AsyncLocalStorage
- ✅ Scenario endpoints (GET/POST `/__scenario__`)
- ✅ 30 tests passing, 100% coverage

**Express Example App** (`apps/express-example`)
- ✅ Real-world Express application
- ✅ Multiple scenarios demonstrating usage
- ✅ E2E tests proving integration
- ✅ 27 tests passing

**Total: 142 tests passing across all packages** with TypeScript strict mode and full type safety.

## Essential Commands

```bash
# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Run tests in watch mode for a specific package
cd packages/core && pnpm test:watch

# Run a single test file
cd packages/core && pnpm test scenario-manager.test.ts

# Type check all packages
pnpm check-types

# Type check a specific package
cd packages/core && pnpm typecheck

# Lint all packages
pnpm lint

# Format code
pnpm format

# Development mode (watch mode)
pnpm dev

# Build/test a specific package using filters
pnpm build --filter=@scenarist/core
pnpm test --filter=@scenarist/express-adapter
```

## Architecture: Hexagonal (Ports & Adapters)

Scenarist follows **strict hexagonal architecture** to remain framework-agnostic:

### The Hexagon (Core Domain)
- **Location**: `packages/core/`
- **Zero framework dependencies** (except MSW types)
- **Pure TypeScript domain logic**
- Contains: types, ports (interfaces), and domain implementations

### Ports (Behavior Contracts)
- **Location**: `packages/core/src/ports/`
- **Always use `interface`** (not `type`)
- Define contracts that adapters must implement
- Examples: `ScenarioManager`, `ScenarioStore`, `RequestContext`

**Why interfaces for ports?**
- Signal implementation contracts clearly
- Better TypeScript errors when implementing
- Conventional in hexagonal architecture
- Class-friendly for adapter implementations

### Types (Data Structures)
- **Location**: `packages/core/src/types/`
- **Always use `type`** (not `interface`)
- Immutable data structures (use `readonly`)
- Examples: `Scenario`, `ActiveScenario`, `ScenaristConfig`

**Why types for data?**
- Emphasizes immutability
- Better for unions, intersections, mapped types
- Functional programming alignment
- Prevents accidental mutations

### Adapters (Framework Integrations)
- **Location**: Separate packages (e.g., `packages/express-adapter/`)
- Framework-specific implementations
- Implement port interfaces from core
- No adapter should depend on another adapter

### Dependency Injection Pattern

**CRITICAL**: Domain logic (implementations) must NEVER create port implementations internally.

**The Rule:**
- Ports (interfaces) are always injected as dependencies
- Never use `new` to create port implementations inside domain logic
- Factory functions accept ports via parameters (dependency injection)

**Example - ScenarioManager:**

```typescript
// ❌ WRONG - Creating implementation internally
export const createScenarioManager = ({
  store,
}: {
  store: ScenarioStore;
}): ScenarioManager => {
  const scenarioRegistry = new Map<string, ScenarioDefinition>();  // ❌ Hardcoded!
  // This breaks hexagonal architecture - only one registry implementation possible!
};

// ✅ CORRECT - Injecting both ports
export const createScenarioManager = ({
  registry,  // ✅ Injected
  store,     // ✅ Injected
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
}): ScenarioManager => {
  return {
    registerScenario(definition) {
      registry.register(definition);  // Delegate to injected port
    },
    switchScenario(testId, scenarioId, variantName) {
      const definition = registry.get(scenarioId);  // Use injected port
      if (!definition) {
        return { success: false, error: new Error('Not found') };
      }
      store.set(testId, { scenarioId, variantName });  // Use injected port
      return { success: true, data: undefined };
    },
    // ... other methods delegate to injected ports
  };
};
```

**Why This Matters:**
- ✅ Enables any port implementation (in-memory, Redis, files, remote)
- ✅ Testable (inject mocks for testing)
- ✅ True hexagonal architecture
- ✅ Follows dependency inversion principle
- ❌ Without injection: can only ever have one implementation (breaks architecture)

**ScenarioManager's Role:**
- Coordinator/facade between `ScenarioRegistry` and `ScenarioStore`
- Enforces business rules (e.g., can't activate non-existent scenarios)
- Provides unified API for scenario operations
- Delegates to injected ports, never creates them

## Package Structure

```
packages/
├── core/                    # The hexagon (✅ COMPLETE)
│   ├── src/
│   │   ├── adapters/        # Default adapters (InMemoryScenarioRegistry, InMemoryScenarioStore)
│   │   ├── domain/          # Business logic (createScenarioManager, buildConfig)
│   │   ├── ports/           # Interfaces (contracts) - use `interface`
│   │   └── types/           # Data structures - use `type` with `readonly`
│   ├── tests/               # Behavior-driven tests (54 tests, all passing)
│   └── dist/                # Built output (.js, .d.ts files)
├── msw-adapter/             # MSW integration (✅ COMPLETE)
│   ├── src/
│   │   ├── matching/        # URL and mock matching logic
│   │   ├── conversion/      # MockDefinition → HttpResponse conversion
│   │   └── handlers/        # Dynamic MSW handler factory
│   ├── tests/               # Behavior-driven tests (31 tests, all passing)
│   └── dist/                # Built output
├── express-adapter/         # Express middleware adapter (✅ COMPLETE)
│   ├── src/
│   │   ├── context/         # Express request context
│   │   ├── middleware/      # Test ID middleware (AsyncLocalStorage)
│   │   ├── endpoints/       # Scenario control endpoints
│   │   └── setup/           # createScenarist() factory
│   ├── tests/               # Integration tests (30 tests, all passing)
│   └── dist/                # Built output
├── eslint-config/           # Shared ESLint configuration
├── typescript-config/       # Shared TypeScript configuration
└── ui/                      # Shared UI components (if needed)

apps/
├── express-example/         # Sample Express app (✅ COMPLETE)
│   ├── src/
│   │   ├── routes/          # Example API routes
│   │   ├── scenarios.ts     # Scenario definitions
│   │   └── server.ts        # Express server setup
│   └── tests/               # E2E tests (27 tests, all passing)
├── docs/                    # Documentation site (Next.js)
└── web/                     # Web application (if needed)
```

## TypeScript Configuration

All packages use **TypeScript strict mode** with these non-negotiable settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- **No `any` types** - use `unknown` if truly unknown
- **No type assertions** (`as Type`) without clear justification
- **No `@ts-ignore`** without explicit comments explaining why
- These rules apply to **test code** as well as production code

## Test-Driven Development (TDD) - NON-NEGOTIABLE

**Every line of production code must be written in response to a failing test.**

### RED → GREEN → REFACTOR Cycle

1. **RED**: Write a failing test for desired behavior
2. **GREEN**: Write minimum code to make test pass
3. **REFACTOR**: Assess and improve if valuable (then commit)

### Testing Framework & Tools

- **Vitest** for all test execution
- Tests located in `packages/*/tests/` directories
- Test files: `*.test.ts`
- Run with: `pnpm test` (all) or `pnpm test:watch` (watch mode)

### Testing Principles

**Behavior-driven testing** (not "unit tests"):
- Test through public APIs only
- Treat implementation as black box
- No 1:1 mapping between test files and implementation files
- 100% coverage expected, but based on **business behavior**, not implementation details

**Example**: Validation code in `payment-validator.ts` gets 100% coverage by testing `processPayment()` behavior, not by directly testing validator functions.

### Test Data Patterns

Use factory functions with optional overrides:

```typescript
const getMockScenario = (overrides?: Partial<Scenario>): Scenario => {
  return {
    name: "Test Scenario",
    description: "Test description",
    devToolEnabled: false,
    mocks: [/* MSW handlers */],
    ...overrides,
  };
};
```

## Key Architecture Decisions

### Test Isolation via Test IDs
- Each test sends an `x-test-id` header (configurable)
- Different tests can run different scenarios concurrently
- Scenarios are stored per test ID in ScenarioStore
- Default test ID: `'default-test'` (when header absent)

### Result Type Pattern
Prefer `Result<T, E>` types over exceptions for expected errors:

```typescript
type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
```

### Immutability
- All data structures use `readonly`
- No data mutation in functions
- Return new objects instead of modifying

### Factory Pattern for Creation
Use factory functions (not classes) for creating domain objects:

```typescript
export const createScenarioManager = (
  store: ScenarioStore,
  config: ScenaristConfig,
): ScenarioManager => {
  // implementation
};
```

## Development Workflow

### Adding a New Feature

1. **Write failing test** - describe expected behavior
2. **Run test** - confirm it fails (`pnpm test:watch`)
3. **Implement minimum** - just enough to pass
4. **Run test** - confirm it passes
5. **Refactor if valuable** - improve code structure
6. **Commit** - with conventional commit message

### Commit Messages

Use conventional commits format:

```
feat: add scenario variant support
fix: correct test ID extraction from headers
refactor: extract scenario validation logic
test: add edge cases for scenario switching
docs: update architecture documentation
```

### Pull Requests

- All tests must pass
- All linting and type checks must pass
- PRs focused on single feature or fix
- Include behavior description (not implementation details)

## Important Files

- **`CLAUDE.md`**: This file - project guidance and architecture documentation
- **`README.md`**: Main project README for external users
- **`turbo.json`**: Turborepo task pipeline configuration
- **`pnpm-workspace.yaml`**: Workspace package definitions
- **Root `package.json`**: Workspace-level scripts
- **`docs/archive/SCENARIST_IMPLEMENTATION_PLAN.md`**: Historical implementation plan (archived)

## Turborepo Specifics

This is a **Turborepo monorepo** using **pnpm workspaces**.

### Task Dependencies

From `turbo.json`:
- `build` depends on `^build` (builds dependencies first)
- `test` depends on `build` (tests run after building)
- `lint` and `check-types` depend on upstream packages
- `dev` has no cache (runs in watch mode)

### Working with Packages

```bash
# Install dependency in a specific package
cd packages/core && pnpm add msw

# Install dev dependency in workspace root
pnpm add -Dw vitest

# Build only core and its dependencies
pnpm build --filter=@scenarist/core

# Run tests for express-adapter and its dependencies
pnpm test --filter=@scenarist/express-adapter
```

## Code Style

### Functional Programming Principles

- **Pure functions** wherever possible
- **No data mutation** - immutable updates only
- **Composition** over complex logic
- Use array methods (`map`, `filter`, `reduce`) over loops
- Early returns instead of nested if/else

### No Comments (Code Should Be Self-Documenting)

Code should be clear through naming and structure. Comments indicate unclear code.

**Exception**: JSDoc for public APIs when generating documentation.

### Options Objects Over Positional Parameters

Default to options objects for function parameters:

```typescript
// Prefer this:
const createPayment = (options: CreatePaymentOptions): Payment => {
  const { amount, currency, cardId } = options;
  // ...
};

// Over this:
const createPayment = (amount: number, currency: string, cardId: string): Payment => {
  // ...
};
```

## MSW Integration

Scenarist is built on **MSW (Mock Service Worker) v2.x**:

- Scenarios are serializable definitions (not MSW handlers directly)
- `MockDefinition` types are converted to MSW `HttpHandler` at runtime
- Handlers are applied dynamically based on active scenario
- Test ID isolation allows different handlers per test
- Mocks can be enabled/disabled per request via `x-mock-enabled` header

## Package Dependencies

### Core Package
- **Zero framework dependencies** (only MSW types)
- Must remain pure TypeScript
- Other packages depend on this

### Adapter Packages
- Depend on `@scenarist/core`
- Have peer dependencies on their frameworks (e.g., Express)
- Independent of each other

## Version Management

Uses **Changesets** for version management:

```bash
# Create a changeset (for versioning)
pnpm changeset

# Version packages (updates package.json versions)
pnpm changeset version

# Publish to npm (after building)
pnpm release
```

## Key Implementation Learnings

### Config Belongs in Adapters, Not Domain Logic

**CRITICAL INSIGHT**: During implementation, we discovered `ScenaristConfig` should NOT be passed to `createScenarioManager`.

**Why?**
- `ScenarioManager` is **pure domain logic** - coordinates registry and store
- `ScenaristConfig` contains **infrastructure concerns** (HTTP headers, endpoints, enabled flag)
- Config is needed by **adapters only**: middleware and `RequestContext` implementations

**Where Config IS Used:**
- ✅ `RequestContext` implementations - need config to know which headers to read
- ✅ Middleware - needs config for enabled flag and endpoint paths
- ✅ `buildConfig()` - helper to build complete config from partial input

**Where Config is NOT Used:**
- ❌ `ScenarioManager` - pure domain coordination
- ❌ `ScenarioRegistry` - just stores scenario definitions
- ❌ `ScenarioStore` - just stores active scenario references

**This maintains hexagonal architecture**: domain core remains infrastructure-agnostic.

### Test Pattern: No Mutation, Use Factory Functions

**CRITICAL PATTERN**: Never use `let` declarations or `beforeEach` in tests. Use functional factory patterns instead.

**❌ WRONG - Mutation with let:**
```typescript
describe('MyTest', () => {
  let manager: ScenarioManager;
  let store: ScenarioStore;

  beforeEach(() => {
    manager = createScenarioManager(...);
    store = createTestStore();
  });

  it('does something', () => {
    // Uses mutable state
  });
});
```

**✅ CORRECT - Factory function:**
```typescript
const createTestSetup = () => {
  const registry = createTestRegistry();
  const store = createTestStore();
  const manager = createScenarioManager({ registry, store });

  return { registry, store, manager };
};

describe('MyTest', () => {
  it('does something', () => {
    const { manager, store } = createTestSetup(); // Fresh dependencies
    // Test with isolated state
  });
});
```

**Benefits:**
- No shared mutable state between tests
- Each test gets fresh, isolated dependencies
- Can destructure only what's needed
- Aligns with functional programming principles
- Prevents test pollution and flakiness

### TypeScript Strict Mode Forces Good Architecture

The `noUnusedParameters` rule caught that `config` wasn't being used in `ScenarioManager`, leading us to discover it didn't belong there. This is strict mode working as intended - if a parameter isn't used, question whether it should exist.

## Anti-Patterns to Avoid

### In Core Package
- ❌ Importing framework-specific code (Express, Fastify, etc.)
- ❌ Using classes for ports (use `interface`)
- ❌ Using interfaces for types (use `type` with `readonly`)
- ❌ Mutable data structures

### In Tests
- ❌ Using `let` declarations or mutable state
- ❌ Using `beforeEach` for setup (use factory functions instead)
- ❌ Testing implementation details
- ❌ Mocking internal functions
- ❌ 1:1 test file to implementation file mapping
- ❌ Not testing business behavior

### General
- ❌ Writing production code without a failing test first
- ❌ Nested if/else statements (use early returns)
- ❌ Deep function nesting (max 2 levels)
- ❌ Any use of `any` type

## Critical Architectural Insight: Serialization

**CRITICAL LEARNING**: When designing ports that abstract storage/persistence, ensure the data types are actually serializable. Otherwise, the ports become "architectural theater"—interfaces that can only ever have one implementation.

### The Problem We Discovered

Initial design had `Scenario` containing MSW's `HttpHandler`:

```typescript
// ❌ NOT SERIALIZABLE - Contains functions, closures, regex
type Scenario = {
  readonly name: string;
  readonly mocks: ReadonlyArray<HttpHandler>; // MSW type with functions
};
```

**This broke the entire port architecture:**
- `ScenarioRegistry` port? **Useless** - only in-memory implementation possible
- `ScenarioStore` port? **Useless** - only in-memory implementation possible
- Redis adapter? **Impossible** - can't serialize functions
- File-based scenarios? **Impossible** - can't JSON.stringify functions
- Remote API? **Impossible** - can't send functions over HTTP

The ports were **architectural theater** - pretty interfaces that could never have multiple implementations.

### The Solution: Serializable Definitions

Separate **serializable definitions** (data) from **runtime handlers** (behavior):

```typescript
// ✅ SERIALIZABLE - Pure JSON data
type ScenarioDefinition = {
  readonly id: string;
  readonly name: string;
  readonly mocks: ReadonlyArray<MockDefinition>; // Plain data
};

type MockDefinition = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly url: string; // String, not regex
  readonly response: {
    readonly status: number;
    readonly body?: unknown; // Must be JSON-serializable
    readonly headers?: Record<string, string>;
    readonly delay?: number;
  };
};
```

**At runtime**, convert definitions to MSW handlers:

```typescript
const toMSWHandler = (def: MockDefinition): HttpHandler => {
  return http[def.method.toLowerCase()](def.url, async () => {
    if (def.response.delay) await delay(def.response.delay);
    return HttpResponse.json(def.response.body, {
      status: def.response.status,
      headers: def.response.headers,
    });
  });
};
```

### Benefits Unlocked

Now the ports are **genuinely useful**:

- ✅ `InMemoryScenarioRegistry` - Fast, for single process
- ✅ `RedisScenarioRegistry` - Distributed testing across processes
- ✅ `FileSystemScenarioRegistry` - Version control scenarios as JSON/YAML
- ✅ `RemoteScenarioRegistry` - Fetch scenarios from REST API
- ✅ `DatabaseScenarioRegistry` - Store in PostgreSQL/MongoDB

### The General Principle

**When designing abstraction ports:**

1. **Ask**: "Can this data be sent over a network?"
2. **If no**: You can only ever have one implementation (in-memory)
3. **If yes**: Multiple implementations are possible (Redis, files, remote, DB)

**Serializable means:**
- ✅ Primitives (string, number, boolean, null)
- ✅ Plain objects and arrays
- ✅ JSON-serializable data
- ❌ Functions, closures, or methods
- ❌ Regular expressions (convert to strings)
- ❌ Class instances with methods
- ❌ Symbols, undefined, or circular references

**This applies to all port-based architectures, not just Scenarist.**

### Config Must Also Be Serializable

**CRITICAL**: The same serialization principle applies to `ScenaristConfig`. Config must be serializable so it can be:
- ✅ Stored in files (JSON/YAML configuration)
- ✅ Sent over network (remote config service)
- ✅ Stored in databases or Redis
- ✅ Passed between processes

**Initial mistake:** Config had `enabled: boolean | (() => boolean)` which violated serialization.

```typescript
// ❌ WRONG - Function in config (not serializable)
type ScenaristConfig = {
  readonly enabled: boolean | (() => boolean);  // Can't JSON.stringify!
};

const config = buildConfig({
  enabled: () => process.env.NODE_ENV !== 'production'  // Function!
});
```

**The fix:** Config must only contain serializable data. Evaluate functions BEFORE creating config.

```typescript
// ✅ CORRECT - Only boolean (serializable)
type ScenaristConfig = {
  readonly enabled: boolean;
};

const config = buildConfig({
  enabled: process.env.NODE_ENV !== 'production'  // Evaluated first!
});
```

**Why this matters:**
- Config can now be stored in `.scenaristrc.json` files
- Config can be fetched from remote config service
- Config can be stored per-environment in a database
- Without serialization, config could only exist in-memory

**The principle:** ALL data structures in ports and domain must be serializable. No exceptions.

## Current Status & Next Steps

**Completed:**
- ✅ Core package with hexagonal architecture
- ✅ MSW adapter package (framework-agnostic)
- ✅ Express adapter package
- ✅ Express example application with E2E tests
- ✅ **Dynamic Response System - Phase 1: Request Content Matching (PR #24)**
  - Request body matching (partial match)
  - Request headers matching (exact match)
  - Request query parameters matching (exact match)
  - Specificity-based selection algorithm
  - 183 tests passing, 100% coverage maintained
- ✅ TypeScript strict mode throughout
- ✅ Core functionality documentation

**Future Enhancements:**
- 🔜 **Dynamic Response System - Phase 2: Response Sequences**
  - Ordered sequences of responses for polling scenarios
  - Repeat modes (last/cycle/none)
  - Sequence exhaustion and fallback
- 🔜 **Dynamic Response System - Phase 3: Stateful Mocks**
  - Capture state from requests
  - Inject state into responses via templates
  - State reset on scenario switch
- 🔜 Additional framework adapters (Fastify, Koa, Hono, Next.js)
- 🔜 Additional storage adapters (Redis, PostgreSQL)
- 🔜 Visual debugger for scenarios
- 🔜 Playwright helper utilities
- 🔜 Documentation site
- 🔜 npm package publication

## Phase 1 - Dynamic Response System Learnings

**Completed:** 2025-10-23 (PR #24)

### Key Architectural Insight: Specificity-Based Matching

**Initial Design:** First-match-wins (REQ-1.4 original)
- Mocks evaluated in order
- First mock with passing match criteria wins
- Created footgun: less specific mocks could shadow more specific ones
- Required users to carefully order mocks from most-specific to least-specific

**Improved Design:** Specificity-based matching (REQ-1.4 final)
- Calculate specificity score (body fields + headers + query params)
- Most specific mock wins regardless of position
- Order only matters as tiebreaker when specificity is equal
- More intuitive UX - users don't need to worry about ordering

**Why It Matters:**
- Initial requirement was technically correct but poor UX
- User feedback during implementation led to design improvement
- Better to catch these issues during implementation than after release
- Shows value of TDD + tight feedback loops with user/stakeholder

**Lesson:** When implementing matching/selection algorithms, consider specificity scoring over positional priority. More intuitive for users and prevents common gotchas.

### ResponseSelector as a Port

**Decision:** Make `ResponseSelector` an interface (port) instead of just a factory function

**Rationale:**
- Enables future implementations (sequence-aware, state-aware)
- Follows ports & adapters pattern consistently
- Allows test doubles for adapter testing
- Sets up architecture for Phases 2 & 3

**Implementation:**
- Created `packages/core/src/ports/driven/response-selector.ts`
- Moved from `domain/` to `ports/driven/` during PR review for architectural consistency
- Follows same pattern as `ScenarioRegistry` and `ScenarioStore`

**Lesson:** When creating domain services that will evolve (Phase 1 → Phase 2 → Phase 3), start with port interfaces even if you only have one implementation initially. Easier to do upfront than refactor later.

### Test Coverage and Behavior-Driven Testing

**Challenge:** Specificity-based matching introduced a branch that wasn't fully tested
- Coverage dropped from 100% to 98.66% (branches)
- Uncovered: logic for handling multiple fallback mocks

**Solution:** Added behavior-based tests
- "should return first fallback when multiple fallback mocks exist"
- "should prefer specific match over fallback mock"

**Key Principle:** Tests verify business behavior through public API, not implementation details
- Tests document expected tiebreaker behavior
- Tests are written as user scenarios, not code paths
- Implementation can change as long as behavior stays consistent

**Lesson:** When coverage drops, think "what business behavior am I not testing?" not "what line of code am I missing?". Add tests that document expected behavior, not tests that check implementation.

### Bruno Tests for E2E Documentation

**Pattern:** Use Bruno collections as executable documentation
- 10 tests created for Phase 1 (body/headers/query matching)
- Tests have clear descriptions and automated assertions
- Run via `bru run` in CI
- Serve dual purpose: docs for humans, regression tests for CI

**Structure:**
```
bruno/Dynamic Responses/
  Request Matching/
    0. Setup - Set Content Matching Scenario.bru
    1. Body Match - Premium Item.bru
    2. Body Match - Standard Item.bru
    3. Body Match - Fallback.bru
    ...
```

**Lesson:** Bruno tests should be selective (happy paths, key flows), not comprehensive (every edge case). Use Vitest for comprehensive coverage, Bruno for documentation + smoke tests.

### Port Location Consistency

**PR Feedback:** Move ResponseSelector interface from `domain/` to `ports/driven/`

**Rationale:**
- Ports define behavior contracts → should live in `ports/`
- Domain contains implementations → should live in `domain/`
- Follow established pattern: `ScenarioRegistry`, `ScenarioStore` are in `ports/driven/`
- Architectural consistency is valuable

**Result:**
- `packages/core/src/ports/driven/response-selector.ts` - Interface + error class
- `packages/core/src/domain/response-selector.ts` - Implementation (factory function)
- Exported from `packages/core/src/ports/index.ts`

**Lesson:** When creating new ports, check where existing similar ports live. Follow the established pattern for consistency. Don't deviate without clear rationale.

### Documentation Structure

**Challenge:** Adapter READMEs mixed adapter-specific and core concepts

**Solution:** Created `docs/core-functionality.md`
- Framework-agnostic explanation of core concepts
- Scenario definitions, mock definitions
- Request content matching, specificity-based selection
- Test isolation, hexagonal architecture
- Separate from adapter-specific documentation

**Benefits:**
- Users understand core concepts once, apply to any adapter
- Reduces duplication across adapter READMEs
- Clear separation: core concepts vs. framework integration
- Easier to maintain (update core docs in one place)

**Structure:**
```
docs/
  core-functionality.md        ← Framework-agnostic core concepts
  plans/dynamic-responses.md   ← Implementation plan
  adrs/0002-dynamic-response-system.md   ← Architectural decisions

packages/express-adapter/README.md   ← Express-specific usage
packages/fastify-adapter/README.md   ← Fastify-specific usage (future)
```

**Lesson:** Separate core domain documentation from adapter documentation. Core docs explain WHAT and WHY (concepts, architecture). Adapter docs explain HOW (framework integration, setup).
