# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scenarist** is a hexagonal architecture library for managing MSW (Mock Service Worker) mock scenarios in E2E testing environments. It enables concurrent tests to run with different backend states via test IDs, allowing runtime scenario switching without application restarts.

**Current Status**: All core packages implemented and tested! The hexagonal architecture is complete with:

**Core Package** (`packages/core`)
- ✅ All types and ports defined (serializable, immutable)
- ✅ Domain logic implemented (`createScenarioManager`, `buildConfig`, `ResponseSelector`)
- ✅ Default adapters (`InMemoryScenarioRegistry`, `InMemoryScenarioStore`, `InMemoryStateManager`, `InMemorySequenceTracker`)
- ✅ Dynamic Response System: Phase 1-3 complete (request matching, sequences, stateful mocks)
- ✅ 157 tests passing, 100% behavior coverage

**MSW Adapter** (`packages/msw-adapter`)
- ✅ URL pattern matching (exact, glob, path parameters)
- ✅ Mock definition → MSW handler conversion
- ✅ Dynamic handler with scenario fallback and response selection
- ✅ 35 tests passing, 100% coverage

**Express Adapter** (`packages/express-adapter`)
- ✅ Express middleware integration
- ✅ Test ID extraction via AsyncLocalStorage
- ✅ Scenario endpoints (GET/POST `/__scenario__`)
- ✅ 40 tests passing, 100% coverage

**Express Example App** (`apps/express-example`)
- ✅ Real-world Express application
- ✅ Multiple scenarios demonstrating all features (matching, sequences, state)
- ✅ E2E tests proving integration
- ✅ Bruno test automation (133/133 assertions passing)
- ✅ 49 tests passing

**Total: 281 tests passing across all packages** with TypeScript strict mode and full type safety.

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

### Schemas (Validation & Domain Contracts)

**CRITICAL RULE**: Schemas ALWAYS belong in core, NEVER in adapters.

**Location**: `packages/core/src/schemas/`

**Why schemas belong in core:**
- Schemas define **domain validation rules** (business logic)
- Same schema across all adapters → NOT framework-specific
- Prevents duplication and multiple sources of truth
- Adapters are thin translation layers, not domain logic containers

#### Gotcha: Schema Duplication Across Adapters

**What Happened:**
During Next.js adapter development, we discovered `scenarioRequestSchema` was duplicated in 3 adapter files:
- `packages/express-adapter/src/endpoints/scenario-endpoints.ts`
- `packages/nextjs-adapter/src/pages/endpoints.ts`
- `packages/nextjs-adapter/src/app/endpoints.ts`

Each adapter defined the EXACT same Zod schema locally:
```typescript
const scenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});
```

**Why This Was Wrong:**
- ❌ Schema defines domain validation → belongs in CORE, not adapters
- ❌ Duplication creates multiple sources of truth
- ❌ Changes require updating 3 files instead of 1
- ❌ Violates hexagonal architecture (domain logic leaking into adapters)
- ❌ Breaks DRY principle at the knowledge level

**The Fix:**
1. Created `packages/core/src/schemas/scenario-requests.ts` with `ScenarioRequestSchema`
2. Created `packages/core/src/schemas/index.ts` barrel export
3. Updated `packages/core/src/index.ts` to export schemas
4. Added Zod to core package dependencies
5. All adapters now import `ScenarioRequestSchema` from `@scenarist/core`

```typescript
// ✅ CORRECT - Schema in core
// packages/core/src/schemas/scenario-requests.ts
export const ScenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});

export type ScenarioRequest = z.infer<typeof ScenarioRequestSchema>;

// ✅ CORRECT - Adapters import from core
// packages/express-adapter/src/endpoints/scenario-endpoints.ts
import { ScenarioRequestSchema } from '@scenarist/core';

const validated = ScenarioRequestSchema.parse(req.body);
```

```typescript
// ❌ WRONG - Schema defined in adapter
// packages/express-adapter/src/endpoints/scenario-endpoints.ts
const scenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});
```

#### Decision Framework: Does This Schema Belong in Core?

Ask these questions **in order**:

1. **Is this schema used by multiple adapters?**
   - YES → ✅ Schema belongs in CORE
   - NO → Continue

2. **Does it define domain validation rules (not framework-specific)?**
   - YES → ✅ Schema belongs in CORE
   - NO → Continue

3. **Is it part of the API contract for Scenarist?**
   - YES → ✅ Schema belongs in CORE
   - NO → Consider if it's truly adapter-specific

**Examples:**

```typescript
// ✅ CORE - Used by all adapters (scenario switching API)
export const ScenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});

// ✅ CORE - Domain validation (scenario definition structure)
export const ScenarioDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  mocks: z.array(MockDefinitionSchema),
});

// ✅ CORE - Domain validation (mock structure)
export const MockDefinitionSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  url: z.string().min(1),
  response: ResponseSchema.optional(),
  sequence: SequenceSchema.optional(),
});

// ❌ ADAPTER - Framework-specific (Express request validation)
// Only if it's truly Express-specific and not reusable
const expressRequestSchema = z.object({
  headers: z.record(z.string()),
  query: z.record(z.string()),
  // Express-specific fields
});
```

#### Red Flags to Watch For

**When working in adapters, watch for these warning signs:**

1. ❌ Defining Zod schemas in adapter files
2. ❌ Importing `zod` in adapter code (often means defining schema locally)
3. ❌ Similar validation logic across multiple adapters
4. ❌ Type definitions that aren't imported from core
5. ❌ Using `z.object()`, `z.string()`, etc. in adapter code

**When you see these, ask:** "Should this schema be in core?"

#### The Pattern: Schema-First Development in Core

**Correct pattern:**

```typescript
// 1. Define schema in core
// packages/core/src/schemas/my-domain-object.ts
import { z } from 'zod';

export const MyDomainObjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  value: z.number().positive(),
});

export type MyDomainObject = z.infer<typeof MyDomainObjectSchema>;

// 2. Export from barrel file
// packages/core/src/schemas/index.ts
export { MyDomainObjectSchema, type MyDomainObject } from './my-domain-object';

// 3. Export from package root
// packages/core/src/index.ts
export { MyDomainObjectSchema, type MyDomainObject } from './schemas';

// 4. Use in adapters
// packages/express-adapter/src/endpoints/my-endpoint.ts
import { MyDomainObjectSchema, type MyDomainObject } from '@scenarist/core';

export const createEndpoint = () => {
  return async (req, res) => {
    const validated = MyDomainObjectSchema.parse(req.body);
    // Use validated data
  };
};

// packages/nextjs-adapter/src/app/endpoints.ts
import { MyDomainObjectSchema } from '@scenarist/core';

export async function POST(request: Request) {
  const body = await request.json();
  const validated = MyDomainObjectSchema.parse(body);
  // Use validated data
}
```

**Key Benefits:**
- ✅ Single source of truth for validation
- ✅ Schema changes automatically propagate to all adapters
- ✅ Type safety maintained across all packages
- ✅ Hexagonal architecture preserved (domain in core, adapters thin)
- ✅ DRY principle at knowledge level

**Remember:** If validation logic is duplicated across adapters, it's domain knowledge that belongs in core.

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
│   │   ├── schemas/         # Zod schemas for validation (ScenarioRequestSchema, etc.)
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

### In Adapters
- ❌ Defining Zod schemas locally (schemas belong in core)
- ❌ Duplicating validation logic across adapters
- ❌ Containing domain logic (adapters should be thin translation layers)
- ❌ Depending on other adapters (only depend on core)

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

### Sequence Reset on Scenario Switch - Idempotency Fix

**Problem:** Bruno tests passed on first run (133/133 assertions) but failed on second run (117/133 assertions)

**Root Cause:** Sequences and state persisted across test runs
- SequenceTracker had no reset mechanism
- ScenarioManager didn't reset sequences on scenario switch
- Sequences advanced on each request but never reset
- Second test run started with advanced sequence positions

**Impact:**
- Bruno tests non-idempotent (different results on repeated runs)
- Manual testing unreliable (required server restart)
- Integration test failures when running multiple times
- Shopping cart accumulated items across runs (6 instead of 3)
- Payment sequences exhausted prematurely

**Solution: Implement Sequence Reset with Strict TDD**

**Phase 1 - Unit Tests (RED → GREEN):**
1. Created `packages/core/tests/in-memory-sequence-tracker.test.ts` with 7 comprehensive tests:
   - Basic reset (all positions cleared)
   - Test ID isolation (reset test-1 doesn't affect test-2)
   - Exhausted sequences reset to non-exhausted
   - Reset with no existing sequences (edge case)
   - Re-advancing after reset works
   - Multiple scenarios per test ID reset
   - Multiple mocks per scenario reset

2. Tests PASSED immediately (implementation existed from Phase 2 cleanup but wasn't used)

**Phase 2 - Integration Tests (RED → GREEN):**
3. Added 4 tests to `packages/core/tests/scenario-manager.test.ts`:
   - ScenarioManager calls sequenceTracker.reset() on successful scenario switch
   - Failed scenario switches don't reset sequences
   - Backward compatibility (optional sequenceTracker parameter)
   - Test ID isolation at manager level

4. Tests PASSED - implementation already correct

**Phase 3 - Implementation Verification:**
- Added `reset(testId)` method to SequenceTracker port interface
- Implemented in InMemorySequenceTracker (deletes all positions for test ID)
- ScenarioManager.switchScenario() calls `sequenceTracker.reset(testId)` after successful switch
- Express adapter injects sequenceTracker into ScenarioManager
- Reset happens AFTER scenario is set, before returning success

**Phase 4 - E2E Verification:**
- Bruno tests: 133/133 assertions ✓ PASS (first run)
- Bruno tests: 133/133 assertions ✓ PASS (second run) ← **Idempotency achieved!**
- All 281 Vitest tests passing across all packages
- 100% test coverage maintained

**Architectural Notes:**
- Consistent with state reset pattern (Phase 3)
- Dependency injection throughout (sequenceTracker injected, not created)
- Backward compatible (sequenceTracker is optional)
- Test ID isolation preserved

**Lesson Learned from Phase 2 TDD Violation:**

During Phase 2 initial implementation, `reset()` was added speculatively without tests and then deleted. The note said "not needed for Phase 2, belongs in Phase 3".

**This was WRONG.** Sequence reset is absolutely needed for Phase 2 to work correctly in real-world usage:
- Without reset, tests are non-idempotent
- Without reset, Bruno tests fail on second run
- Without reset, manual testing requires server restart
- Sequence reset is NOT a "Phase 3 feature" - it's a Phase 2 requirement for correctness

**The real lesson:** Don't assume features "belong" in future phases. If the current phase doesn't work correctly without a feature, implement it now with proper TDD. The idempotency issue was a Phase 2 bug that needed fixing before Phase 2 could be considered truly complete.

**Documentation Updated:**
- `docs/plans/dynamic-responses.md` - Added REQ-2.5 for sequence reset
- `docs/core-functionality.md` - Updated sequences from "future" to "implemented"
- `CLAUDE.md` - Added this section!
- All acceptance criteria updated to include idempotency

**Files Modified:**
- `packages/core/src/ports/driven/sequence-tracker.ts` - Added reset() to interface
- `packages/core/src/adapters/in-memory-sequence-tracker.ts` - Implemented reset()
- `packages/core/src/domain/scenario-manager.ts` - Wire up reset on scenario switch
- `packages/express-adapter/src/setup/setup-scenarist.ts` - Inject sequenceTracker
- `packages/core/tests/in-memory-sequence-tracker.test.ts` - NEW: 7 unit tests
- `packages/core/tests/scenario-manager.test.ts` - Added 4 integration tests

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

## Phase 2: Response Sequences - Learnings (PRs #25, #26, #27)

### TDD Violation and Coverage Cleanup

**Problem:** After initial implementation, test coverage was 94.71% instead of required 100%

**Root Cause:** Violated TDD by writing speculative/defensive code without tests first
- Added `reset()` method to SequenceTracker (not used, not tested)
- Added unreachable guard clauses for readonly array access
- Added defensive checks in code paths already protected by earlier logic
- Missing tests for default repeat mode and error cases

**Solution:** Deep analysis of every uncovered line
- **Deleted** `reset()` method - not needed for Phase 2, belongs in Phase 3
- **Deleted** unreachable guard clauses - readonly array access safe within loop bounds
- **Deleted** defensive exhaustion checks - matching phase already handles this
- **Added** 3 missing behavior tests:
  - Mock with neither response nor sequence (error case)
  - Sequence with empty responses array (error case)
  - Default repeat mode behavior (omitted field)

**Result:** 100% coverage restored (lines, statements, functions, branches)

**Key Lesson:** If code isn't driven by a failing test, don't write it. Every line must have a test that demanded its existence. Speculative code = untested code = bugs waiting to happen.

**TDD Process Reinforcement:**
1. RED: Write failing test for desired behavior
2. GREEN: Write MINIMUM code to pass (resist adding "just in case" logic)
3. REFACTOR: Clean up if valuable (not always needed)
4. REPEAT: Move to next behavior

**User Feedback Received:** "Poor test coverage here - this should not happen because we should be doing TDD. You need to ultrathink and solve the test coverage by deeply understanding what every line of code is doing..."

**Action Taken:** Analyzed every uncovered line, deleted speculative code, added missing behavior tests. This reinforced the discipline of strict TDD adherence.

### TypeScript Strict Mode with Readonly Arrays

**Challenge:** TypeScript strict null checks don't guarantee `readonly array[index]` is defined

**Error:** `error TS18048: 'mock' is possibly 'undefined'`

**Code:**
```typescript
for (let mockIndex = 0; mockIndex < mocks.length; mockIndex++) {
  const mock = mocks[mockIndex];  // TS error: possibly undefined
  if (!mock) {
    continue;
  }
  // ...
}
```

**Solution:** Non-null assertion with explanatory comment
```typescript
for (let mockIndex = 0; mockIndex < mocks.length; mockIndex++) {
  const mock = mocks[mockIndex]!;  // Index guaranteed in bounds by loop condition
  // ...
}
```

**Rationale:**
- Loop condition ensures index is in bounds
- Non-null assertion is safe here
- Comment explains WHY it's safe (not obvious to reader)
- Alternative (guard clause) was unreachable code

**Lesson:** Non-null assertions are acceptable when you can prove safety via surrounding logic. Always add comment explaining WHY it's safe. Prefer guard clauses for runtime safety, but when they're unreachable, use `!` with clear justification.

### Dependency Injection Signature Changes

**Challenge:** Adding `scenarioId` parameter to `ResponseSelector` broke MSW adapter

**Error:** `error TS2554: Expected 4 arguments, but got 3`

**Root Cause:** SequenceTracker needs `scenarioId` to build unique key: `${testId}:${scenarioId}:${mockIndex}`

**Solution:** Updated all adapter call sites
```typescript
// Before
const result = responseSelector.selectResponse(testId, context, mocks);

// After
const scenarioId = activeScenario?.scenarioId ?? options.defaultScenarioId;
const result = responseSelector.selectResponse(testId, scenarioId, context, mocks);
```

**Impact:** All adapters needed updating (MSW, Express)

**Lesson:** When adding parameters to port interfaces, expect to update all adapters. This is by design in hexagonal architecture - ports are contracts. Breaking changes propagate intentionally to ensure all implementations stay in sync.

### Sequence Isolation Per Test ID

**Key Decision:** Sequence positions tracked per `(testId, scenarioId, mockIndex)` tuple

**Rationale:**
- Different test IDs = independent sequence state
- Two tests using same scenario progress independently
- Enables parallel test execution without interference
- Consistent with existing test ID isolation pattern

**Implementation:**
```typescript
private getKey(testId: string, scenarioId: string, mockIndex: number): string {
  return `${testId}:${scenarioId}:${mockIndex}`;
}
```

**Test Coverage:** Added dedicated test "should maintain independent sequence positions for different test IDs"

**Lesson:** Test isolation is a first-class concern. When adding stateful features (sequences, state capture), always verify isolation per test ID. Add explicit tests demonstrating concurrent usage with independent state.

### Exhaustion Checking in Matching Phase

**Key Decision:** Skip exhausted sequences during URL matching, before selecting response

**Three-Phase Execution:**
1. **Match Phase** - Check if mock applies (URL, match criteria, exhaustion status)
2. **Select Phase** - Choose response from sequence or single response
3. **Transform Phase** - Apply state templates, delays, headers

**Why Exhaustion Checking Happens in Match Phase:**
- Exhausted sequences should fall through to next mock
- Match phase determines "does this mock apply?"
- Exhausted sequences don't apply (allow fallback)

**Implementation:**
```typescript
// In ResponseSelector.selectResponse (Match Phase)
for (let mockIndex = 0; mockIndex < mocks.length; mockIndex++) {
  const mock = mocks[mockIndex]!;

  // Skip exhausted sequences (repeat: 'none' that have been exhausted)
  if (mock.sequence && sequenceTracker) {
    const { exhausted } = sequenceTracker.getPosition(testId, scenarioId, mockIndex);
    if (exhausted) {
      continue; // Skip to next mock, allowing fallback to be selected
    }
  }

  // Continue with match criteria checking...
}
```

**Lesson:** Exhaustion is a matching concern, not a response selection concern. Design the three-phase model carefully - each phase has specific responsibilities. Don't mix concerns across phases.

### Integration Testing Strategy for Sequences

**Approach:** TDD at integration level (RED → GREEN)

**First Test (RED Phase):**
- Wrote integration test: GitHub polling scenario (pending → processing → complete)
- Test failed with 404 (SequenceTracker not wired up yet)
- Confirmed RED phase

**Implementation (GREEN Phase):**
- Wired up `InMemorySequenceTracker` in Express adapter
- Passed SequenceTracker to ResponseSelector via dependency injection
- Test passed

**Comprehensive Tests (Additional RED-GREEN Cycles):**
- Added repeat: 'cycle' test (weather cycling)
- Added repeat: 'none' + exhaustion test (payment rate limiting)
- Added test ID isolation test (concurrent tests)

**Result:** 44 total integration tests (4 for sequences)

**Lesson:** Integration tests follow same TDD cycle as unit tests. Write failing integration test first, then wire up dependencies to make it pass. Don't wire up infrastructure speculatively - let the test drive the integration.

### Bruno Tests for Manual Testing

**Pattern:** Bruno collections as manual testing documentation

**Structure:**
```
bruno/Dynamic Responses/Sequences/
  0. Setup - Set GitHub Polling Scenario.bru
  1. GitHub Polling - Call 1 (Pending).bru
  2. GitHub Polling - Call 2 (Processing).bru
  3. GitHub Polling - Call 3 (Complete).bru
  4. GitHub Polling - Call 4 (Still Complete).bru
  5. Setup - Set Weather Cycle Scenario.bru
  6. Weather Cycle - Call 1 (Sunny).bru
  7. Weather Cycle - Call 2 (Cloudy).bru
  8. Weather Cycle - Call 3 (Rainy).bru
  9. Weather Cycle - Call 4 (Back to Sunny).bru
  10. Setup - Set Payment Limited Scenario.bru
  11. Payment Limited - Call 1 (Pending 1).bru
  12. Payment Limited - Call 2 (Pending 2).bru
  13. Payment Limited - Call 3 (Succeeded).bru
  14. Payment Limited - Call 4 (Rate Limited).bru
```

**Benefits:**
- **Sequential execution** - Run in order to see progression
- **Clear naming** - Number prefix ensures order
- **Automated assertions** - Verify expected responses
- **Documentation** - Docs section explains behavior
- **Manual testing** - Click through to verify by hand

**Lesson:** Number Bruno tests (0. Setup, 1. First Call, 2. Second Call) when order matters. This makes sequential flows obvious and ensures correct execution order. Each test includes assertions for automation + docs for understanding.

### Scenario Registration Pattern

**Challenge:** New scenarios (githubPolling, weatherCycle, paymentLimited) needed registration

**Solution:** Leverage existing pattern
```typescript
// In scenarios.ts
export const githubPollingScenario: ScenarioDefinition = { ... };
export const weatherCycleScenario: ScenarioDefinition = { ... };
export const paymentLimitedScenario: ScenarioDefinition = { ... };

export const scenarios = {
  default: defaultScenario,
  success: successScenario,
  // ... existing scenarios
  githubPolling: githubPollingScenario,
  weatherCycle: weatherCycleScenario,
  paymentLimited: paymentLimitedScenario,
} as const;

// In server.ts
scenarist.registerScenarios(Object.values(scenarios));
```

**Benefit:** Adding new scenarios requires only:
1. Export scenario definition
2. Add to scenarios object
3. Auto-registered via `Object.values()`

**Lesson:** When adding new examples, follow established patterns. Check how existing examples are structured and registered. Don't invent new patterns unless there's clear value.

### Documentation Updates After Phase Completion

**Updated Files:**
- `docs/plans/dynamic-responses.md` - Marked Phase 2 as complete, updated task checklist
- `README.md` - Added sequence references to core docs and integration tests
- `CLAUDE.md` - Added Phase 2 learnings (this section!)

**Pattern:** After completing each phase:
1. Update plan document (status, task checklist, files changed)
2. Update high-level README (add new capabilities to feature list)
3. Update CLAUDE.md with learnings (capture gotchas for future work)
4. Link related PRs

**Lesson:** Documentation is part of "done". A phase isn't complete until docs are updated. Capture learnings immediately while they're fresh - future you (or next developer) will thank you.

### Test Coverage Gap: Match + Sequence Composition

**Discovery:** User asked critical question: "What happens when we combine `match` and `sequence`?"

**Existing Test Coverage:**
- ✅ Sequences advance when requests match criteria
- ✅ Multiple sequences on same URL work independently
- ✅ Specificity-based selection works with sequences

**CRITICAL GAP FOUND:**
- ❌ Missing explicit test: non-matching requests DON'T advance sequences

**Why This Matters:**
The existing test proved sequences advance when matching, but didn't prove they DON'T advance when not matching. This is a critical property that enables powerful use cases:

**Use Case Example:**
```typescript
// Premium-only onboarding sequence
{
  method: 'GET',
  url: '/api/onboarding/step',
  match: { headers: { 'x-tier': 'premium' } },
  sequence: {
    responses: [
      { status: 200, body: { step: 1, message: 'Welcome!' } },
      { status: 200, body: { step: 2, message: 'Configure...' } },
      { status: 200, body: { step: 3, message: 'Complete!' } },
    ],
    repeat: 'last',
  },
},
// Standard users get single response
{
  method: 'GET',
  url: '/api/onboarding/step',
  response: { status: 200, body: { step: 0, message: 'Upgrade to premium' } },
}
```

If non-matching requests advanced the sequence, the premium sequence would progress even for standard users, breaking the isolation.

**Implementation Behavior (Already Correct):**
From `response-selector.ts` lines 62-76:
```typescript
if (mock.match) {
  if (matchesCriteria(context, mock.match)) {
    // ... track as bestMatch
  }
  continue;  // ← Non-matching request skips mock entirely
}
```

Then later (lines 90-98):
```typescript
if (bestMatch) {
  const response = selectResponseFromMock(  // ← Only called for bestMatch
    testId,
    scenarioId,
    bestMatch.mockIndex,
    bestMatch.mock,
    sequenceTracker  // ← Sequence advances only when mock is selected
  );
```

**Correct Behavior:**
- Matching request → mock selected → `selectResponseFromMock()` called → sequence advances ✅
- Non-matching request → `continue` on line 75 → mock skipped → `selectResponseFromMock()` never called → sequence does NOT advance ✅

**Test Added:**
`"should NOT advance sequence when request doesn't match criteria"` in `response-selector.test.ts`

**Test Flow:**
1. Premium request (matches) → returns step 1 → advances to position 1
2. Standard request (doesn't match) → uses fallback → **sequence stays at position 1**
3. Premium request (matches) → returns step 2 (NOT step 3) → **proves non-matching request didn't advance**
4. Standard request (doesn't match) → uses fallback → **sequence stays at position 2**
5. Premium request (matches) → returns step 3 → **proves previous non-matching request didn't advance**

**Result:**
- ✅ Test passes GREEN (implementation already correct)
- ✅ 100% coverage maintained (85 tests, up from 84)
- ✅ Critical property now explicitly documented by test

**Documentation Status:**
- ✅ Already documented in `docs/plans/dynamic-responses.md` (REQ-4.1)
- ✅ Test now explicitly verifies documented behavior

**Key Lesson:** When implementing feature composition (match + sequence, match + state, etc.), don't just test the positive case ("feature works when combined"). Test the negative case too ("features don't interfere when they shouldn't"). The gap between "sequences advance when matching" and "sequences don't advance when not matching" seems obvious but must be explicitly tested. Edge cases at composition boundaries are where subtle bugs hide.

**Question Pattern:** User's question "what would happen if..." is gold for finding test coverage gaps. When feature composition is involved, always ask:
- What happens when both features apply?
- What happens when only one feature applies?
- What happens when neither feature applies?
- What happens when features should NOT interact?

## Phase 4: Why Dedicated Composition Tests Aren't Needed

**Date:** 2025-10-27
**Status:** Analysis Complete - No Implementation Required

### The Question

After completing Phases 1-3 (request matching, sequences, stateful mocks), should Phase 4 add dedicated tests for feature composition (Match + Sequence, Match + State, Sequence + State, all three together)?

### Deep Analysis from First Principles

**The Three-Phase Execution Model:**

Every request goes through three mandatory sequential phases:

```typescript
// Phase 1: MATCH (Which mock applies?)
for (mock in mocks) {
  if (mock.sequence && sequenceExhausted) continue;
  if (mock.match && !matchesCriteria(request, mock.match)) continue;
  trackBestMatch(mock);  // Specificity-based selection
}

// Phase 2: SELECT (Which response to return?)
if (bestMatch.sequence) {
  response = selectFromSequence(bestMatch, position);
  advancePosition(bestMatch);  // ONLY if mock matched
} else {
  response = bestMatch.response;
}

// Phase 3: TRANSFORM (Modify response based on state)
if (bestMatch.captureState) {
  captureValuesFromRequest(request, bestMatch.captureState);
}
if (responseContainsTemplates(response)) {
  response = injectStateIntoTemplates(response, state);
}

return response;
```

**Key Architectural Insight:**

The phases are **orthogonal** (independent and non-interfering):
- **Match** doesn't know about sequences or state
- **Select** doesn't know about match criteria or state
- **Transform** doesn't know about matching or sequences

They communicate through a **data pipeline**, not shared logic.

### Why Composition "Just Works"

Features compose correctly because they're designed as **independent pipeline stages:**

1. Each phase has **single responsibility**
2. Phases are **independently tested** (100% coverage each)
3. The **architecture enforces** correct composition
4. No new failure modes emerge from combination

**This is like testing Unix pipes:**
- If `cat` works, `grep` works, and `sort` works independently
- Then `cat | grep | sort` works by design of the pipe mechanism
- You don't need to test every combination of commands

### Analysis of Each "Composition"

**Match + Sequence:**
- Match phase gates whether sequence advances
- Already tested in PR #28 ✅
- This IS the edge case

**Match + State:**
- Match phase gates whether state captures
- Guaranteed by sequential execution
- If match fails → mock skipped → no capture
- No new failure mode

**Sequence + State:**
- Sequence selects response (Phase 2)
- State injects templates (Phase 3)
- No interaction - different phases
- No new failure mode

**Match + Sequence + State:**
- Match gates everything (Phase 1)
- Sequence selects (Phase 2)
- State injects (Phase 3)
- All interactions already tested

### The Only Meaningful Edge Case

**PR #28** tested that non-matching requests don't advance sequences. This is the ONLY place where phases interact beyond their defined boundaries (match gates sequence advancement).

All other "compositions" are just phases executing in sequence with no new edge cases.

### Conclusion

**Dedicated composition tests are unnecessary because:**

1. ✅ Architecture guarantees composition (three-phase model)
2. ✅ PR #28 tested the only edge case (match gates sequence)
3. ✅ Existing tests cover all phases (100% coverage maintained)
4. ✅ Phases are orthogonal (cannot interfere beyond what's tested)
5. ❌ Additional tests would be redundant (no new failure modes)
6. ❌ Maintenance burden without benefit (more tests, same coverage)

**Recommendation:**
- Mark Phase 4 as "✅ Covered by Architecture + PR #28"
- Document HOW features compose (user guide, not tests)
- Add targeted tests ONLY if composition bugs are found
- Don't add speculative tests for orthogonal features

**This is a critical architectural insight:** When designing systems with independent pipeline stages, test each stage thoroughly. Don't test all combinations - the architecture guarantees composition.

_For the formal decision rationale and conditions under which this decision should be revisited, see [ADR-0004: Why Composition Tests Are Unnecessary](docs/adrs/0004-why-composition-tests-unnecessary.md)._
