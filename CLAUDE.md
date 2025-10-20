# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scenarist** is a hexagonal architecture library for managing MSW (Mock Service Worker) mock scenarios in E2E testing environments. It enables concurrent tests to run with different backend states via test IDs, allowing runtime scenario switching without application restarts.

**Current Status**: The repository is freshly initialized with Turborepo. The actual packages (core, adapters, etc.) are not yet implemented. The full implementation plan is in `SCENARIST_IMPLEMENTATION_PLAN.md`.

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
export const createScenarioManager = (
  store: ScenarioStore,
  config: ScenaristConfig,
): ScenarioManager => {
  const scenarioRegistry = new Map<string, ScenarioDefinition>();  // ❌ Hardcoded!
  // ...
};

// ✅ CORRECT - Injecting both ports
export const createScenarioManager = ({
  registry,  // ✅ Injected
  store,     // ✅ Injected
  config,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
  config: ScenaristConfig;
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
├── core/                    # The hexagon (zero dependencies)
│   ├── src/
│   │   ├── domain/          # Business logic (implementations)
│   │   ├── ports/           # Interfaces (contracts) - use `interface`
│   │   └── types/           # Data structures - use `type` with `readonly`
│   └── tests/               # Behavior-driven tests
├── in-memory-store/         # ScenarioStore adapter (Map-based)
├── express-adapter/         # Express middleware adapter
└── playwright-helpers/      # Playwright utilities (future)
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

- **`SCENARIST_IMPLEMENTATION_PLAN.md`**: Complete implementation roadmap with detailed specs for all packages, phases, and architecture decisions
- **`turbo.json`**: Turborepo task pipeline configuration
- **`pnpm-workspace.yaml`**: Workspace package definitions
- **Root `package.json`**: Workspace-level scripts

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

## Anti-Patterns to Avoid

### In Core Package
- ❌ Importing framework-specific code (Express, Fastify, etc.)
- ❌ Using classes for ports (use `interface`)
- ❌ Using interfaces for types (use `type` with `readonly`)
- ❌ Mutable data structures

### In Tests
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

## Future Roadmap

See `SCENARIST_IMPLEMENTATION_PLAN.md` for complete roadmap. Key phases:

- **Phase 1**: Project setup (completed)
- **Phase 2**: Core package (types, ports, domain logic)
- **Phase 3**: In-memory store adapter
- **Phase 4**: Express adapter
- **Phase 5**: Documentation
- **Phase 6**: CI/CD
- **Phase 7**: Release to npm

Future versions may include: Fastify adapter, Redis store, visual debugger, Next.js support.
