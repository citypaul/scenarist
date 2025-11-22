# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scenarist** is a hexagonal architecture library for managing MSW (Mock Service Worker) mock scenarios in E2E testing environments. It enables concurrent tests to run with different backend states via test IDs, allowing runtime scenario switching without application restarts.

**Current Status**: All core packages implemented and tested! The hexagonal architecture is complete with:

**Core Package** (`packages/core`)
- ✅ All types and ports defined (declarative, immutable)
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

## Recent Changes

**`defaultScenarioId` Removed (Nov 2025):** The `defaultScenarioId` configuration parameter has been removed per ADR-0010. The 'default' scenario key is now enforced via Zod schema validation, eliminating the need for configuration. All adapters now hardcode the `'default'` literal for fallback behavior.

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
export const ScenaristScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  mocks: z.array(ScenaristMockSchema),
});

// ✅ CORE - Domain validation (mock structure)
export const ScenaristMockSchema = z.object({
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
  const scenarioRegistry = new Map<string, ScenaristScenario>();  // ❌ Hardcoded!
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
│   │   ├── conversion/      # ScenaristMock → HttpResponse conversion
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

**Testing strategy**:
- **Four-layer approach**: See [ADR-0003: Testing Strategy](docs/adrs/0003-testing-strategy.md)
- **Layer 2 (Adapter tests)**: **DEFAULT = mock external dependencies**
  - Most adapters mock framework Request/Response objects (Express, Next.js, etc.)
  - Fast, focused tests for translation logic only
  - See ADR-0003 for rationale and detailed examples
- **Thin adapter exception**: [ADR-0006](docs/adrs/0006-thin-adapters-real-integration-tests.md) documents when to use real dependencies
  - **Only for adapters with single responsibility meeting 4 other strict criteria**
  - **Current rate: 1/4 adapters (25%) - target ≤10%**
  - **When in doubt, use mocks** (general rule applies to 90%+ of adapters)
  - Exception is narrow and rare - requires ALL 5 criteria

**When creating new adapters**: Default to mocking. Only check ADR-0006 if adapter has genuinely single responsibility and is direct API wrapper.

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

### TDD Evidence in Commit History

**Default Expectation**: Commit history should show clear RED → GREEN → REFACTOR progression.

**Rare Exceptions** where TDD evidence may not be linearly visible in commits:

1. **Multi-Session Work**: Feature spans multiple development sessions
   - Work done with TDD in each session
   - Commits organized for PR clarity rather than strict TDD phases
   - **Evidence**: Tests exist, all passing, implementation matches test requirements

2. **Context Continuation**: Resuming from previous work
   - Original RED phase done in previous session/commit
   - Current work continues from that point
   - **Evidence**: Reference to RED commit in PR description

3. **Refactoring Commits**: Large refactors after GREEN
   - Multiple small refactors combined into single commit
   - All tests remained green throughout
   - **Evidence**: Commit message notes "refactor only, no behavior change"

**When Exception Applies**, document in PR:
- Reference original failing test commit (RED phase)
- Show current test status (all passing)
- Explain why commits don't show linear TDD
- Provide test output as evidence

**Example Valid Exception**:
```
PR Description:
"Phase 3 Shopping Cart implementation.

RED phase: commit c925187 (added failing tests)
GREEN phase: commits 5e0055b, 9a246d0 (implementation + bug fixes)
REFACTOR: commit 11dbd1a (test isolation improvements)

Test Evidence:
✅ 4/4 tests passing (7.7s with 4 workers)
```

**Important**: Exception is for EVIDENCE presentation, not TDD practice. TDD process must still be followed - these are cases where commit history doesn't perfectly reflect the process that was actually followed.

## Key Architecture Decisions

### Test Isolation via Test IDs
- Each test sends an `x-test-id` header (configurable)
- Different tests can run different scenarios concurrently
- Scenarios are stored per test ID in ScenarioStore
- Default test ID: `'default-test'` (when header absent)

### Result Type Pattern
Prefer `ScenaristResult<T, E>` types over exceptions for expected errors:

```typescript
type ScenaristResult<T, E = Error> =
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
- **Coverage verification REQUIRED** - claims must be verified before review/approval
- PRs focused on single feature or fix
- Include behavior description (not implementation details)

#### Coverage Verification - CRITICAL

**NEVER trust coverage claims without verification.** Always run coverage yourself before approving PRs.

**Before approving any PR claiming "100% coverage":**

1. Check out the branch
2. Run coverage verification:
   ```bash
   cd packages/[package-name]
   pnpm exec vitest run --coverage
   ```
3. Verify ALL metrics hit 100%:
   - Lines: 100% ✅
   - Statements: 100% ✅
   - Branches: 100% ✅
   - Functions: 100% ✅

**Red Flags:**
- ❌ PR claims "100% coverage" but you haven't verified
- ❌ Coverage summary shows <100% on any metric
- ❌ "Uncovered Line #s" column shows line numbers
- ❌ Coverage gaps without explicit exception documentation

**Example - Coverage Violation:**

```
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------|---------|----------|---------|---------|-------------------
All files      |   97.11 |    93.97 |   81.81 |   97.11 |
setup.ts       |   95.23 |      100 |      60 |   95.23 | 45-48, 52-55
context.ts     |     100 |      100 |     100 |     100 |
endpoints.ts   |     100 |      100 |     100 |     100 |

❌ This is NOT 100% coverage
❌ Functions: 81.81% (should be 100%)
❌ Lines: 97.11% (should be 100%)
❌ setup.ts has uncovered lines 45-48, 52-55
```

**When coverage drops, ask:** "What business behavior am I not testing?" not "What line am I missing?" Add tests for behavior, coverage follows naturally.

#### 100% Coverage Exceptions

**Default Rule:** 100% coverage required. No exceptions without explicit approval and documentation.

**Requesting an Exception:**

1. **Document in package README** explaining:
   - Current coverage metrics
   - WHY 100% cannot be achieved in this package
   - WHERE the missing coverage will come from

2. **Get explicit approval** from project maintainer

3. **Document in CLAUDE.md** under "Test Coverage: 100% Required"

**Current Exceptions:**
- Next.js Adapter: 86% function coverage (documented in `/packages/nextjs-adapter/README.md`)

**Remember:** The burden of proof is on the requester. 100% is the default expectation.

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

- Scenarios are declarative definitions (not MSW handlers directly)
- `ScenaristMock` types are converted to MSW `HttpHandler` at runtime
- Handlers are applied dynamically based on active scenario
- Test ID isolation allows different handlers per test
- Mocks can be enabled/disabled per request via `x-mock-enabled` header
- Native RegExp supported for pattern matching (ADR-0016)

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

### Test Coverage: 100% Required

**NON-NEGOTIABLE RULE**: All packages must maintain 100% test coverage (lines, statements, branches, functions).

**Explicit Exceptions:**

Exceptions to the 100% rule require explicit documentation and justification. As of now:

- **Next.js Adapter**: 86% function coverage in adapter package (explicit exception)
  - **Reason**: Arrow functions in `createDynamicHandler()` only execute during HTTP requests
  - **Resolution**: Phase 0 integration tests will achieve 100% combined coverage
  - **Documented in**: packages/nextjs-adapter/README.md

**If you need to request an exception:**
1. Document why 100% cannot be achieved in the package
2. Explain where the remaining coverage will come from
3. Get explicit approval
4. Document the exception clearly

**Default assumption: 100% coverage required, no exceptions.**

### TypeScript Strict Mode Forces Good Architecture

The `noUnusedParameters` rule caught that `config` wasn't being used in `ScenarioManager`, leading us to discover it didn't belong there. This is strict mode working as intended - if a parameter isn't used, question whether it should exist.

### Production Tree-Shaking with Conditional Exports

**CRITICAL INSIGHT**: Dynamic imports alone are insufficient for tree-shaking in bundled applications. Conditional package.json exports are required for complete MSW code elimination.

**The Problem:**

Initial implementation used dynamic imports with environment checks:

```typescript
// setup-scenarist.ts
export const createScenarist = async (options) => {
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }
  const { createScenaristImpl } = await import('./impl.js');
  return createScenaristImpl(options);
};
```

**Why this doesn't work with bundlers:**
- Bundlers (esbuild, webpack, rollup, vite) treat dynamic imports as code-splitting boundaries
- Even with `--define:process.env.NODE_ENV='"production"'`, bundlers include the dynamically imported module
- Result: 618kb bundle including all MSW code (never executed, but still present)

**The Solution: Conditional Package.json Exports**

Created separate production entry point with **zero imports**:

```typescript
// production.ts
export const createScenarist = async (_options) => {
  return undefined;  // No imports, no dependencies
};
```

Updated package.json with conditional exports:

```json
{
  "exports": {
    ".": {
      "production": "./dist/setup/production.js",  // Zero dependencies
      "default": "./dist/index.js"                 // Full implementation
    }
  }
}
```

**Results:**
- ✅ Bundle size: 618kb → 298kb (52% reduction)
- ✅ Zero MSW code in production bundle
- ✅ Complete tree-shaking achieved

**Deployment Models:**

1. **Unbundled Express apps** (most common): Tree-shaking automatic ✅
   - `NODE_ENV=production node server.js`
   - Dynamic imports never execute
   - MSW code never loads into memory
   - **Zero configuration required**

2. **Bundled deployments**: Requires bundler configuration
   - esbuild: `--conditions=production`
   - webpack: `resolve.conditionNames: ['production']`
   - vite: `resolve.conditions: ['production']`
   - rollup: `exportConditions: ['production']`

**Why "production" is a custom condition:**

Built-in Node.js conditions:
- `import` - ESM imports
- `require` - CommonJS require
- `node` - Node.js environment
- `default` - Fallback

Custom conditions (like "production"):
- Must be explicitly recognized by bundler via configuration
- Not automatically applied
- Enables different entry points for different build targets

**Verification Script:**

```json
{
  "scripts": {
    "build:production": "esbuild --bundle --conditions=production --define:process.env.NODE_ENV='\"production\"'",
    "verify:treeshaking": "pnpm build:production && ! grep -rE '(setupWorker|HttpResponse\\.json)' dist/"
  }
}
```

Integrated into Turborepo pipeline:

```json
{
  "tasks": {
    "verify:treeshaking": {
      "dependsOn": ["build"],
      "outputs": ["dist/**"]
    }
  }
}
```

**Key Lessons:**
1. Dynamic imports ≠ tree-shaking in bundlers
2. Conditional exports enable true code elimination
3. "production" condition requires explicit bundler configuration
4. Unbundled deployments work automatically (most Express apps)
5. Verification scripts prevent regression

**For user documentation, see:** [Express Adapter README - Production Tree-Shaking](packages/express-adapter/README.md#production-tree-shaking)

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

## Critical Architectural Insight: Declarative Patterns Over Imperative Functions

**CRITICAL LEARNING**: When designing scenario definitions, enforce **declarative patterns** over imperative functions. This forces explicit, inspectable, composable scenarios that are easier to reason about and maintain.

**Note**: This section previously emphasized "serialization" as the primary constraint. **ADR-0016** refined this understanding: the real constraint is **declarative patterns**, not JSON serializability. Native RegExp is now supported because it's declarative pattern matching, even though it's not JSON-serializable.

### The Problem We Discovered

Initial design had `Scenario` containing MSW's `HttpHandler`:

```typescript
// ❌ IMPERATIVE - Contains functions, closures, hidden logic
type Scenario = {
  readonly name: string;
  readonly mocks: ReadonlyArray<HttpHandler>; // MSW type with functions
};
```

**This broke the architectural goals:**
- Scenarios contained **imperative functions** with hidden logic
- Behavior was **not inspectable** without execution
- Patterns were **not composable** (function closures)
- Tests couldn't **validate scenarios** without running them
- No way to **visualize** or **analyze** scenario behavior

The scenarios were **imperative black boxes** - no way to understand what they did without executing them.

### The Solution: Declarative Definitions

Separate **declarative definitions** (data patterns) from **runtime handlers** (behavior):

```typescript
// ✅ DECLARATIVE - Explicit patterns, no hidden logic
type ScenaristScenario = {
  readonly id: string;
  readonly name: string;
  readonly mocks: ReadonlyArray<ScenaristMock>; // Declarative patterns
};

type ScenaristMock = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly url: string | RegExp; // String OR native RegExp (ADR-0016)
  readonly response: {
    readonly status: number;
    readonly body?: unknown; // Plain data or template strings
    readonly headers?: Record<string, string>;
    readonly delay?: number;
  };
};
```

**At runtime**, convert definitions to MSW handlers:

```typescript
const toMSWHandler = (def: ScenaristMock): HttpHandler => {
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

Now the scenarios are **genuinely useful**:

- ✅ **Explicit** - Match criteria visible in scenario definition
- ✅ **Inspectable** - Can analyze scenarios without executing them
- ✅ **Composable** - Combine match + sequence + state transparently
- ✅ **Testable** - Validate scenario structure before running tests
- ✅ **Maintainable** - Clear what each scenario does
- ✅ **Side benefit**: Most scenarios CAN be stored as JSON (when not using native RegExp)

### The General Principle

**When designing scenario APIs:**

1. **Ask**: "Is this declarative (WHAT to do) or imperative (HOW to do it)?"
2. **Declarative patterns** → Allowed (strings, RegExp, objects, arrays)
3. **Imperative functions** → Not allowed (closures, hidden logic, side effects)

**Declarative patterns (ALLOWED):**
- ✅ Primitives (string, number, boolean, null)
- ✅ Plain objects and arrays
- ✅ Native RegExp (declarative pattern matching - ADR-0016)
- ✅ Template strings (`{{state.value}}`)
- ✅ Match criteria objects (`{ headers: { 'x-tier': 'premium' } }`)

**Imperative functions (NOT ALLOWED):**
- ❌ Functions with closures
- ❌ Arrow functions with logic
- ❌ Class instances with methods
- ❌ Callbacks that capture external scope
- ❌ Any code with hidden side effects

**This applies to all declarative API design, not just Scenarist.**

### Config Must Also Be Declarative

**CRITICAL**: The same declarative principle applies to `ScenaristConfig`. Config should be plain data, not functions.

**Initial mistake:** Config had `enabled: boolean | (() => boolean)` which violated the declarative pattern.

```typescript
// ❌ WRONG - Function in config (imperative, not inspectable)
type ScenaristConfig = {
  readonly enabled: boolean | (() => boolean);  // Hidden logic!
};

const config = buildConfig({
  enabled: () => process.env.NODE_ENV !== 'production'  // Function closure!
});
```

**The fix:** Config must only contain plain data. Evaluate expressions BEFORE creating config.

```typescript
// ✅ CORRECT - Plain boolean (declarative, inspectable)
type ScenaristConfig = {
  readonly enabled: boolean;
};

const config = buildConfig({
  enabled: process.env.NODE_ENV !== 'production'  // Evaluated first!
});
```

**Why this matters:**
- Config is **inspectable** (can see all values without execution)
- Config is **explicit** (no hidden behavior in functions)
- Config is **testable** (can validate structure before use)
- **Side benefit**: Config CAN be stored in `.scenaristrc.json` files if needed

**The principle:** ALL data structures in ports and domain should use declarative patterns. Prefer plain data over functions.

### The Real Value: Constraints Force Better Design

**CRITICAL REFRAMING**: The declarative constraint's primary value is NOT enabling JSON storage (though that's a nice side benefit). It's that the constraint **forces explicit, inspectable, composable API design**, which leads to clearer, more maintainable scenarios.

**The Initial Justification (Incomplete):**

When we first enforced the constraint, we framed it as "JSON serializability" and justified it as enabling storage:
- Redis for distributed testing
- File system for version control
- Remote APIs for centralized scenarios
- Databases for persistence

**The Challenge:**

During design review, a simple question exposed the incomplete reasoning: "Is there another way we could solve the load balancing problem with cookies though?"

Answer: Yes. Cookies can solve session stickiness without Redis. The storage justification was over-engineered.

**The Deeper Insight (ADR-0016):**

The real constraint is **declarative patterns**, not JSON serializability. This became clear when we needed to support native RegExp (not JSON-serializable, but perfectly declarative).

**How Declarative Constraint Drove Better Patterns:**

Each phase of development hit the declarative constraint and was forced to find better solutions:

**Phase 1 - Request Content Matching:**
```typescript
// ❌ IMPERATIVE - Hidden logic in function
{
  method: 'GET',
  url: '/api/products',
  shouldMatch: (request) => request.headers['x-user-tier'] === 'premium'  // Function!
}

// ✅ DECLARATIVE - Explicit pattern
{
  method: 'GET',
  url: '/api/products',
  match: {  // Pattern-based, explicit
    headers: { 'x-user-tier': 'premium' }
  }
}
```

**Why declarative is better:**
- Logic is VISIBLE in the scenario definition
- No hidden behavior in function closures
- Can be inspected, logged, validated
- Enables tooling (scenario visualizers, validators)
- Easier to reason about and debug

**Phase 2 - Response Sequences:**
```typescript
// ❌ IMPERATIVE - Hidden state management
{
  method: 'GET',
  url: '/api/status',
  respond: (request) => {
    const referer = request.headers.referer;
    if (isFirstVisit(referer)) {
      return { status: 200, body: { state: 'pending' } };
    } else if (isSecondVisit(referer)) {
      return { status: 200, body: { state: 'processing' } };
    } else {
      return { status: 200, body: { state: 'complete' } };
    }
  }
}

// ✅ DECLARATIVE - Explicit sequence
{
  method: 'GET',
  url: '/api/status',
  sequence: {  // Pattern-based progression
    responses: [
      { status: 200, body: { state: 'pending' } },
      { status: 200, body: { state: 'processing' } },
      { status: 200, body: { state: 'complete' } },
    ],
    repeat: 'last'
  }
}
```

**Why declarative is better:**
- Polling progression is EXPLICIT, not implicit
- Sequence is clear at a glance
- No hidden state management in closures
- Can visualize the flow easily
- Test assertions match sequence structure

**Phase 3 - Stateful Mocks:**
```typescript
// ❌ IMPERATIVE - Hidden state access
{
  method: 'GET',
  url: '/api/cart',
  respond: (request) => {
    const cartItems = getStateFromSomewhere(request);
    return {
      status: 200,
      body: {
        items: cartItems,  // Runtime variable reference
        total: calculateTotal(cartItems)  // Function call
      }
    };
  }
}

// ✅ DECLARATIVE - Explicit templates
{
  method: 'GET',
  url: '/api/cart',
  response: {
    status: 200,
    body: {
      items: '{{state.cartItems}}',  // Template, not function
      total: '{{state.cartTotal}}'
    }
  },
  captureState: {  // Explicit state capture
    cartTotal: 'body.total'
  }
}
```

**Why declarative is better:**
- State dependencies are VISIBLE in scenario
- Templates document what state is used
- No hidden side effects in functions
- Can validate state keys exist
- Clear separation: capture vs inject

**The Pattern Recognition:**

This is the same principle as React's constraint:

**React forces declarative UI:**
```typescript
// ❌ CAN'T DO - Imperative DOM manipulation
function updateUI() {
  const div = document.getElementById('counter');
  div.innerHTML = `Count: ${count}`;  // Manual DOM updates
}

// ✅ FORCED TO DO - Declarative component
function Counter() {
  return <div>Count: {count}</div>;  // Describe desired state
}
```

**Why React's constraint is valuable:**
- Not because DOM manipulation is impossible
- Because declarative UI is clearer
- Easier to reason about state → UI relationship
- Enables composition and reusability

**Same principle applies to Scenarist:**
- Not because imperative functions are impossible to implement
- Because declarative scenarios are clearer and more maintainable
- Easier to reason about request → response relationship
- Enables composition (match + sequence + state + RegExp patterns)

**The Lesson:**

When you encounter a constraint that feels limiting:

1. **Don't immediately fight it** - explore what it forces you toward
2. **Look for patterns** - constraints often guide toward better abstractions
3. **Question initial justifications** - the real value might be different than you think (we thought it was "JSON serializability" but it's actually "declarative patterns")
4. **Embrace declarative over imperative** - explicit patterns beat hidden logic

**False Justification Danger:**

We initially over-engineered the storage justification:
- "Need distributed testing across load-balanced servers"
- "Must store scenarios in Redis/databases"
- Complex solution for hypothetical problem (most users never need this)

**Simple question exposed this:**
- "Could we use cookies for session stickiness?"
- Answer: Yes, cookies solve it simply
- Storage justification crumbled

**But the constraint was still valuable:**
- Not for storage capabilities (side benefit, not the goal)
- For declarative design patterns (the real value)
- The "why" (storage) was wrong, but the "what" (declarative) was right
- **ADR-0016 refined this**: The real constraint is declarative patterns, not JSON serializability

**Important:** Revisit your assumptions when challenged. The real value of a decision might be different than your initial reasoning. We thought we wanted "JSON serializability" but we actually wanted "declarative patterns".

**This applies beyond Scenarist:**
- Type systems constrain but force clearer code
- Immutability constraints force functional patterns
- Pure functions force explicit dependencies
- Declarative UI (React) forces explicit state → UI mappings
- Constraints guide toward better architectures

**The principle:** Constraints aren't just limitations. They're **design guides** that push you toward clearer, more maintainable patterns. When a constraint feels painful, ask "What pattern is this forcing me toward?" The answer is often better than what you would have built without it.

**For Scenarist specifically:** The declarative constraint (no imperative functions) is the real principle. JSON serializability was a proxy for this, but ADR-0016 refined it: declarative patterns (including native RegExp) are what matters, not storage capabilities.

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
- ✅ Next.js adapter package (Pages Router)
- ✅ Playwright helpers package
- ✅ **Dynamic Response System - Phase 1: Request Content Matching (PR #24)**
  - Request body matching (partial match)
  - Request headers matching (exact match)
  - Request query parameters matching (exact match)
  - Specificity-based selection algorithm
  - Combined matching (body + headers + query)
  - Fallback mocks (no match criteria)
- ✅ **Dynamic Response System - Phase 2: Response Sequences (PR #25)**
  - Ordered sequences of responses for polling scenarios
  - Repeat modes (last/cycle/none)
  - Sequence exhaustion and fallback
  - Match + Sequence composition
  - Idempotent sequence reset
- ✅ **Dynamic Response System - Phase 3: Stateful Mocks (PRs #30-#34)**
  - Capture state from requests via `captureState`
  - Inject state into responses via `{{state.key}}` templates
  - Array append syntax `stateKey[]`
  - Nested path support `state.user.profile.name`
  - State reset on scenario switch
  - Test ID isolation for parallel tests
- ✅ TypeScript strict mode throughout
- ✅ Core functionality documentation
- ✅ 281 tests passing across all packages (100% coverage in core)

**String Matching Strategies:**
- ✅ **Regex Support for Match Criteria** (PR #96 - Completed 2025-11-16)
  - 5 matching strategies: equals, contains, startsWith, endsWith, regex
  - ReDoS protection with validation using `redos-detector`
  - Test parity achieved across all 3 example apps (App Router, Pages Router, Express)
  - 27 total string matching tests (9 per app)
  - 291 total tests passing (264 core + 27 string matching)
  - Documentation updated: core README, core-functionality.md, external docs (capabilities.mdx)
  - Code refactored following CLAUDE.md principles (functional composition, data-driven config)
  - Supported regex flags documented: i, m, s, u, v, g, y

**URL Matching Phase 2.5: Path Parameters**
- ✅ **MSW path-to-regexp Compatibility** (Completed 2025-11-17)
  - Delegates to path-to-regexp v6 (same library as MSW 2.x)
  - Automatic MSW parity for parameter extraction
  - Support for all path-to-regexp patterns:
    - Simple parameters: `/users/:id` → `{id: '123'}`
    - Multiple parameters: `/users/:userId/posts/:postId` → `{userId: 'alice', postId: '42'}`
    - Optional parameters: `/files/:filename?` matches `/files` or `/files/doc.txt`
    - Repeating parameters: `/files/:path+` → `{path: ['folder','subfolder','file.txt']}`
    - Custom regex: `/orders/:id(\\d+)` matches numeric IDs only
  - Template support: `{{params.userId}}` injects extracted parameters
  - 17 integration tests passing (10 URL matching + 7 path parameters)
  - 306 core tests passing (85 url-matcher unit tests)
  - Critical fix: Manual URL parsing preserves path-to-regexp syntax (`?`, `+`, etc.)
  - Pattern conflicts resolved using "last match wins" rule

**Future Enhancements:**
- 🔜 **Template Helper Registry** ([Issue #87](https://github.com/citypaul/scenarist/issues/87))
  - Dynamic value generation (UUID, timestamps, hashes)
  - Predefined helpers with type safety
  - See `docs/plans/template-helpers-implementation.md`
- 🔜 Additional framework adapters (Fastify, Koa, Hapi)
- 🔜 Additional storage adapters (Redis, PostgreSQL)
- 🔜 Visual debugger for scenarios
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
export const githubPollingScenario: ScenaristScenario = { ... };
export const weatherCycleScenario: ScenaristScenario = { ... };
export const paymentLimitedScenario: ScenaristScenario = { ... };

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

## Phase 3: Stateful Mocks with RSC - Critical Bugs Discovered (PR #62)

**Completed:** 2025-11-09 (commits 4a08ad1, 6272b3e)

### Context: RSC Examples for Documentation

While implementing React Server Component examples to validate Scenarist's value proposition ("Test Next.js App Router without Jest"), we discovered **two critical bugs** that were blocking stateful mocks with RSC.

**Goal:** Prove that Scenarist can test RSC with stateful mocks (shopping cart state capture/injection).

**Test Suite:**
- Products RSC: 5 tests (request matching with tier-based pricing)
- Polling RSC: 5 tests (sequences with polling progression)
- Cart Server RSC: 5 tests (stateful mocks with state capture/injection)

**Initial Status:** 10/15 passing (Products + Polling working, Cart 0/5 failing)

### Bug #1: Playwright page.request Header Propagation

**Problem:** POST requests to `/api/cart/add` returned intermittent 500 errors, while GET requests worked fine.

**Symptoms:**
```
POST /api/cart/add 200 in 511ms   ← SUCCESS (sometimes)
POST /api/cart/add 500 in 563ms   ← FAILURE (sometimes)
```

**How We Discovered It:**

1. **Observed inconsistent behavior** - Same test, different results per run
2. **Added MSW debug logging:**
   ```typescript
   server.events.on('request:start', ({ request }) => {
     console.log('[MSW] Intercepted:', request.method, request.url);
   });
   ```
3. **Saw POST requests intercepted** but not matching scenarios (500 fallback)
4. **Consulted MSW official documentation** (user requested: "/mcp" + "read the official docs")
5. **Root cause discovered:** `page.request.post()` uses **Playwright's separate API request context**
   - Doesn't inherit headers from `page.setExtraHTTPHeaders()`
   - x-test-id header missing from API requests
   - MSW couldn't match requests to scenarios → 500 fallback

**Impact Beyond Scenarist:**

This is a **Playwright-specific limitation** that affects ANY test using the `page.request` API for POST/PUT/PATCH operations that need headers propagated from page context. Not specific to Scenarist - would break ANY scenario-based testing with `page.request`.

**The Fix (commit 4a08ad1):**

Modified `switchScenario` to **return testId** so tests can explicitly include it:

```typescript
// packages/playwright-helpers/src/switch-scenario.ts
export const switchScenario = async (
  page: Page,
  scenarioId: string,
  options: SwitchScenarioOptions,
): Promise<string> => {  // Changed from Promise<void>
  // ... existing setup code ...

  await page.setExtraHTTPHeaders({ [testIdHeader]: testId });

  // Return test ID for explicit use in page.request calls
  return testId;  // ✅ Now consumers can use it
};
```

Updated all cart tests to explicitly include header:

```typescript
// apps/nextjs-app-router-example/tests/playwright/cart-server-rsc.spec.ts
test('should display cart item after adding product', async ({ page, switchScenario }) => {
  const testId = await switchScenario(page, 'cartWithState');  // ✅ Capture testId

  // page.request uses separate context - must explicitly include x-test-id
  const response = await page.request.post('http://localhost:3002/api/cart/add', {
    headers: {
      'Content-Type': 'application/json',
      'x-test-id': testId,  // ✅ Explicit header propagation
    },
    data: { productId: 'prod-1' },
  });

  expect(response.ok()).toBe(true);

  await page.goto('/cart-server');
  await expect(page.getByText('Product A')).toBeVisible();
});
```

**Result:** Cart POST requests now work consistently. Test status: 10/15 → 15/15 ✅ (but see Bug #2)

**Lesson:** When using `page.request` API in Playwright:
- **Never assume headers propagate** from `page.setExtraHTTPHeaders()`
- **Always explicitly include** headers needed for routing/matching
- **Document this limitation** for adapter consumers
- **MSW debug logging** (`request:start` event) is invaluable for diagnosing request interception issues

### Bug #2: Template Replacement Returning Unreplaced Strings

**Problem:** After fixing Bug #1, cart tests passed but showed bizarre output: "Unknown Product ({)", "Unknown Product (s)", "Unknown Product (t)", etc.

**How We Discovered It:**

1. **POST requests now working** (Bug #1 fixed) but cart showing wrong data
2. **Inspected rendered output** - individual characters displayed as separate products
3. **Traced through `aggregateCartItems()`** - discovered it was iterating over a STRING:
   ```typescript
   const aggregateCartItems = (productIds: ReadonlyArray<string>) => {
     for (const id of productIds) {  // ❌ productIds is STRING, not ARRAY
       // Iterates: '{', '{', 's', 't', 'a', 't', 'e', '.', 'c', 'a', 'r', 't', 'I', 't', 'e', 'm', 's', '}', '}'
     }
   }
   ```
4. **Checked state capture** - State WAS being captured correctly (`cartItems: ['prod-1']`)
5. **Checked template injection** - Template `"{{state.cartItems}}"` wasn't being replaced
6. **Investigated core** - `/packages/core/src/domain/template-replacement.ts:21`
7. **Root cause:** Pure templates (entire value is a template) returned **unreplaced template string** instead of `undefined` when state key didn't exist:
   ```typescript
   // Line 21 (BEFORE FIX)
   return stateValue !== undefined ? stateValue : value;  // ❌ Returns "{{state.cartItems}}" string
   ```

**Impact:** Applications using pure templates (`"{{state.items}}"` not `"Items: {{state.items}}"`) had to add **defensive type checking**:

```typescript
// ❌ APPLICATION WORKAROUND (should not be needed)
const aggregateCartItems = (productIds: ReadonlyArray<string> | string) => {
  // Handle unreplaced template (when state doesn't exist yet)
  if (typeof productIds === 'string') {
    return [];  // Defensive check for template string
  }

  // ... rest of logic
};
```

This **breaks the abstraction** - applications shouldn't need to know about template implementation details.

**The Fix (commit 6272b3e - TDD RED-GREEN-REFACTOR):**

User feedback: *"If you need to fix something fundamental, let's prove it here, but if that's the case, it should be fixed properly in core, with the correct tests. Let's commit in a working state, but then let's fix in core with all the tests, and then remove the code that fixed it here and prove it works properly."*

**TDD Process:**

**RED Phase** - Updated test to expect undefined behavior:
```typescript
// packages/core/tests/template-replacement.test.ts
it('should return undefined when pure template state key is missing', () => {
  const value = '{{state.nonexistent}}';
  const state = {};

  const result = applyTemplates(value, state);

  expect(result).toBeUndefined();  // ✅ Desired behavior
  // Was: expect(result).toBe('{{state.nonexistent}}')  // ❌ Old (wrong) behavior
});
```

Test failed as expected: `AssertionError: expected '{{state.nonexistent}}' to be undefined`

**GREEN Phase** - Fixed implementation:
```typescript
// packages/core/src/domain/template-replacement.ts line 21
// BEFORE:
return stateValue !== undefined ? stateValue : value;

// AFTER:
return stateValue !== undefined ? stateValue : undefined;  // ✅ Return undefined for missing state
```

**REFACTOR Phase** - Removed application workaround:
```typescript
// apps/nextjs-app-router-example/app/cart-server/page.tsx

// BEFORE (with workaround):
type CartResponse = {
  readonly items: ReadonlyArray<string> | string; // Array or unreplaced template string
};

const aggregateCartItems = (productIds: ReadonlyArray<string> | string) => {
  if (typeof productIds === 'string') {
    return [];  // Defensive workaround
  }
  // ...
};

// AFTER (clean abstraction):
type CartResponse = {
  readonly items?: ReadonlyArray<string>; // Optional array (undefined when state missing)
};

const aggregateCartItems = (productIds?: ReadonlyArray<string>) => {
  if (!productIds || productIds.length === 0) {
    return [];  // ✅ Normal optional handling
  }
  // ...
};
```

**Verification:**
- ✅ All 159 core tests passing (19 template tests, up from 18)
- ✅ Workaround removed from application code
- ✅ All 15 RSC tests passing with clean abstractions

**Result:** Products 5/5 ✅ | Polling 5/5 ✅ | Cart 5/5 ✅

**Lesson:** When template replacement encounters missing state in pure templates:
- **Return undefined** (not unreplaced template string)
- **Pure templates** (`"{{state.items}}"`) should return raw value OR undefined
- **Mixed templates** (`"Items: {{state.items}}"`) keep template string (graceful degradation in text)
- **Fix in core, not in application** - don't leak implementation details to consumers
- **TDD discipline** - RED (failing test) → GREEN (fix) → REFACTOR (remove workarounds)

### Why These Bugs Matter

**Both bugs were discovered through real-world usage:**

1. **Bug #1 (Playwright headers):** Would break ANY test using `page.request` API with scenario-based routing - not Scenarist-specific
2. **Bug #2 (Template undefined):** Would break ANY application using pure templates with optional state - fundamental flaw

**Investigation demonstrates:**
- ✅ TDD methodology (RED-GREEN-REFACTOR cycle)
- ✅ "Fix in core, not in application" principle
- ✅ Deep debugging (MSW event listeners, type tracing)
- ✅ Consulting official documentation
- ✅ Type-safe error handling (undefined vs string union)
- ✅ Removing workarounds to prove fix

**User's Request Fulfilled:**

> "Let's commit in a working state, but then let's fix in core with all the tests, and then remove the code that fixed it here and prove it works properly."

1. ✅ Committed working state with workaround (4a08ad1)
2. ✅ Fixed in core with proper tests (6272b3e)
3. ✅ Removed workaround from application
4. ✅ Proved it works: 15/15 RSC tests passing

### Files Changed

**Core Package:**
- `packages/core/src/domain/template-replacement.ts` - Return undefined for missing state (line 21)
- `packages/core/tests/template-replacement.test.ts` - Test updated (TDD RED phase)

**Playwright Helpers:**
- `packages/playwright-helpers/src/switch-scenario.ts` - Return testId (Bug #1 fix)
- `packages/playwright-helpers/src/fixtures.ts` - Propagate testId return

**Next.js App Router Example:**
- `app/products-server/page.tsx` - Products RSC example
- `app/polling/page.tsx` - Polling RSC example
- `app/cart-server/page.tsx` - Cart RSC example (workaround removed)
- `lib/scenarios.ts` - RSC scenarios with stateful mocks
- `tests/playwright/products-rsc.spec.ts` - 5 tests ✅
- `tests/playwright/polling-rsc.spec.ts` - 5 tests ✅
- `tests/playwright/cart-server-rsc.spec.ts` - 5 tests ✅ (explicit headers)
- `tests/playwright/globalSetup.ts` - MSW server startup
- `tests/playwright/globalTeardown.ts` - MSW server cleanup

**Documentation:**
- Added PR comment documenting both bugs and fixes
- Added this section to CLAUDE.md

### Value Proposition Validated

**All RSC Success Criteria Met:**

**Code:**
- ✅ 3 working server components (Products, Polling, Cart)
- ✅ 15 Playwright tests passing in parallel
- ✅ No Jest, no spawning Next.js instances
- ✅ Runtime scenario switching works
- ✅ All examples copy-paste ready
- ✅ Stateful mocks working with RSC

**Claims Proven:**
- ✅ "Test Next.js App Router without spawning new instances"
- ✅ "No Jest issues with RSC"
- ✅ "Runtime scenario switching"
- ✅ "Parallel test execution with test ID isolation"
- ✅ "Stateful mocks work with Server Components"

**Ready for documentation site integration.**

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

## Acquisition.Web Analysis: Pattern Recognition and Feature Gaps

**Date:** 2025-11-13
**Status:** Analysis Complete - Features Identified and Planned

### Context

Deep analysis of `/Users/paulhammond/workspace/Acquisition.Web` scenarios and Playwright tests to:
1. Understand real-world MSW scenario patterns
2. Identify gaps between Acquisition.Web capabilities and Scenarist
3. Convert existing patterns to Scenarist approach
4. Plan missing features

### Critical Architectural Insight: Routing Hacks vs. Explicit State

**FUNDAMENTAL REALIZATION:** Most apparent "gaps" in Scenarist are NOT missing features—they're **compensations for implicit state management in tests**.

**The Pattern Recognition:**

Acquisition.Web uses dynamic mock logic (path params, referer checking, UUID generation) primarily as **routing mechanisms to return different data from the same endpoint under different conditions**.

**Example from `onlineJourneyLogin.ts`:**
```typescript
http.get(`${UNIFIED_API_URL}/applications/:id`, async ({ request }) => {
  const { remixHeadersParsed } = await getRemixMetaInformation(request);

  // Using referer as implicit state routing
  if (remixHeadersParsed['referer'].includes('/apply-sign') ||
      remixHeadersParsed['referer'].includes('/penny-drop')) {
    return HttpResponse.json({ state: 'appComplete' });
  }

  return HttpResponse.json({ state: 'quoteAccept' });
});
```

**Why this is a hack:**
- Referer header = implicit state (browser navigation history)
- Tests rely on browser navigation order
- No explicit scenario declaration
- Hard to reason about which response you'll get

**Scenarist approach (better):**
```typescript
// Explicit scenarios
const appCompleteScenario = {
  mocks: [{
    method: 'GET',
    url: '/applications/:id',
    response: { status: 200, body: { state: 'appComplete' } }
  }]
};

const quoteAcceptScenario = {
  mocks: [{
    method: 'GET',
    url: '/applications/:id',
    response: { status: 200, body: { state: 'quoteAccept' } }
  }]
};

// Test explicitly switches scenarios
await switchScenario('appCompleteScenario');
```

### True Gaps vs. False Gaps

**TRUE gaps (need addressing):**

1. ✅ **Regex support** - Legitimate need for pattern matching
   - **Example:** `referer.includes('/apply-sign')` → `referer.regex.source: '/apply-sign|/penny-drop'`
   - **Solution:** [Issue #86](https://github.com/citypaul/scenarist/issues/86)
   - **Plan:** `docs/plans/regex-support-implementation.md`

2. ✅ **Template helpers** - Legitimate need for dynamic IDs/timestamps
   - **Example:** `id: v4()` → `id: '{{uuid()}}'`
   - **Solution:** [Issue #87](https://github.com/citypaul/scenarist/issues/87)
   - **Plan:** `docs/plans/template-helpers-implementation.md`

**FALSE gaps (design features in disguise):**

1. ❌ **Path param extraction** - Tests don't actually validate `response.id === request.id`
   - **Reality:** Tests just need application state data
   - **Scenarist solution:** Static IDs + state capture works fine

2. ❌ **Variant system** - DRY optimization that sacrifices clarity
   - **Reality:** 12 variants per scenario = 12 separate scenarios in Scenarist
   - **Scenarist solution:** Explicit scenarios are more readable

3. ❌ **Referer routing** - Using browser navigation as implicit state
   - **Reality:** Should be explicit scenario switching
   - **Scenarist solution:** `switchScenario()` before navigation

4. ❌ **UUID generation** - Tests don't validate UUID format
   - **Reality:** Tests need stable references, not cryptographically secure IDs
   - **Scenarist solution:** Static IDs work fine (but template helpers add convenience)

### Key Learnings

**1. Implicit vs. Explicit State Management**

Acquisition.Web pattern:
```typescript
// State inferred from request properties
if (body.accountId === '12345') return standardUser;
if (headers.referer.includes('/premium')) return premiumUser;
if (path.params.id.startsWith('app-')) return application;
```

Scenarist pattern (better):
```typescript
// State explicitly declared via scenario switching
await switchScenario('standardUserScenario');
await switchScenario('premiumUserScenario');
await switchScenario('applicationScenario');
```

**Why explicit is better:**
- ✅ Clear intent in test code
- ✅ No coupling to navigation order
- ✅ Easy to reason about active state
- ✅ Better test isolation

**2. The Variant System Trade-off**

Acquisition.Web uses a `createScenario((variant) => {...})` pattern to DRY up similar scenarios:

```typescript
export const onlineJourneyLoginScenarios = createScenario((variant) => ({
  name: 'Online journey login',
  loginVariants,  // 12 variants
  mocks: [/* shared mocks with variant interpolation */]
}));
```

**Pros:**
- Less duplication
- Centralized mock definitions

**Cons:**
- Requires understanding variant system
- Less explicit about what each scenario does
- Harder to modify individual scenarios
- Variant names scattered across test files

**Scenarist approach:** Separate scenario definitions
- More explicit (each scenario stands alone)
- Easier to understand individual scenarios
- Easier to modify without affecting others
- Yes, more duplication, but **clarity > DRY**

**3. Declarative Patterns Enable Better Architecture**

Acquisition.Web allows arbitrary functions in mocks:
```typescript
http.post('/applications/:id/proofs', ({ request, params }) => {
  const docId = v4();  // Runtime function call
  const appId = params.id;  // Runtime parameter extraction
  return HttpResponse.json({ id: docId, applicationId: appId });
});
```

**Problem:** Imperative functions hide logic, not inspectable, not composable

Scenarist constraints:
- ✅ Scenarios use declarative patterns (explicit, inspectable)
- ✅ Match criteria visible in scenario definition
- ✅ Templates show state dependencies
- ✅ RegExp patterns for URL matching (ADR-0016)
- ✅ Side benefit: Most scenarios CAN be stored as JSON (when not using native RegExp)

**Trade-off accepted:** Less dynamic mock logic, but **clarity > flexibility**

### Analysis Document

**File:** `docs/analysis/acquisition-web-scenario-analysis.md`

**Contents:**
- 800-line comprehensive analysis
- All 19 Acquisition.Web scenarios documented
- Pattern-by-pattern comparison
- Conversion examples
- Coverage estimate: 85%

**Key sections:**
1. Convertible Patterns (13 identified)
2. Fundamental Gaps (2 true gaps, 3 false gaps)
3. Specific Scenario Analysis (all 19 scenarios)
4. Critical Insights (routing hacks revelation)
5. Recommendations (prioritized feature list)

### Implementation Plans Created

**1. Regex Support (`docs/plans/regex-support-implementation.md`)**

**Phases:**
- Phase 1: Schema definition with ReDoS protection
- Phase 2: String matching functions (contains, startsWith, endsWith)
- Phase 3: Regex matching with timeout protection
- Phase 4: Integration and documentation

**Security measures:**
- `redos-detector` package for pattern validation
- Timeout protection (100ms limit)
- Zod schema validation
- Safe flag characters only

**API:**
```typescript
{
  match: {
    headers: {
      referer: {
        regex: { source: '/apply-sign|/penny-drop', flags: 'i' }
      }
    }
  }
}
```

**2. Template Helper Registry (`docs/plans/template-helpers-implementation.md`)**

**Phases:**
- Phase 1: Template parsing and detection
- Phase 2: Helper registry infrastructure
- Phase 3: Built-in helpers implementation
- Phase 4: Custom helper registration API
- Phase 5: State integration

**Built-in helpers:**
- `uuid()` - Generate UUID v4
- `iso8601(offset?)` - Timestamp with optional offset
- `random(min, max)` - Random integer
- `sha256(value)` - SHA-256 hash
- `base64(value)` - Base64 encoding
- `counter(key?)` - Sequential counter per test ID

**API:**
```typescript
{
  response: {
    body: {
      id: '{{uuid()}}',
      timestamp: '{{iso8601()}}',
      expiresAt: '{{iso8601(+7days)}}',
      hash: '{{sha256(state.fileName)}}',
    }
  }
}
```

**Custom helpers:**
```typescript
scenarist.registerHelper('customId', (prefix: string) => {
  return `${prefix}-${Date.now()}`;
});
```

### GitHub Issues Created

- **[Issue #86](https://github.com/citypaul/scenarist/issues/86):** Regex Support for Match Criteria
  - Priority: P1 - High Value, Low Risk
  - 5 matching strategies (equals, contains, startsWith, endsWith, regex)
  - ReDoS protection, timeout guards
  - JSON-serializable

- **[Issue #87](https://github.com/citypaul/scenarist/issues/87):** Template Helper Registry for Dynamic Value Generation
  - Priority: P2 - Medium Priority (depends on Phase 3 state system)
  - 6 built-in helpers + custom registration
  - Type-safe helper definitions
  - Test ID isolation

### Files Created/Modified

**Analysis:**
- `docs/analysis/acquisition-web-scenario-analysis.md` (NEW - 800 lines)

**Research:**
- `docs/research/regex-and-template-helpers-research.md` (NEW - comprehensive research)

**Plans:**
- `docs/plans/regex-support-implementation.md` (NEW - 4-phase TDD plan)
- `docs/plans/template-helpers-implementation.md` (NEW - 5-phase TDD plan)

**Documentation:**
- `CLAUDE.md` (UPDATED - this section)

### Serialization Research Findings

**Regex Serialization: ✅ SAFE**
```typescript
const SerializedRegexSchema = z.object({
  source: z.string().min(1).refine(s => isRegexSafe(s).safe),
  flags: z.string().regex(/^[gimsuvy]*$/).default(''),
});

// Serialize
const serialized = { source: '/apply-.*/', flags: 'i' };

// Deserialize
const regex = new RegExp(serialized.source, serialized.flags);
```

**Function Serialization: ⚠️ EXTREMELY DANGEROUS**

Approaches considered:
1. `Function.prototype.toString()` + `eval()` → ❌ Security nightmare
2. Closure serialization → ❌ Impossible (loses scope)
3. VM sandboxing → ❌ Still requires eval
4. Template helpers → ✅ SAFE (predefined functions)

**Why template helpers are the right approach:**
- ✅ No arbitrary code execution
- ✅ JSON-serializable (template strings)
- ✅ Type-safe (predefined signatures)
- ✅ Security auditable (finite set of helpers)
- ❌ Less flexible than arbitrary functions (acceptable trade-off)

### Test Conversion Analysis: Can Scenarist Replace Acquisition.Web?

**Document:** `docs/analysis/can-scenarist-replace-acquisition-web.md`

**Ultra-thinking finding:** After analyzing all 64+ Playwright test files to understand actual test behavior (not just scenario definitions), discovered **Scenarist can handle 100% of Acquisition.Web patterns**.

**Critical Discovery: The Real Problem is Progressive State in Multi-Page Journeys**

Tests don't just set a scenario and navigate to one page - they navigate through **4-7 page linear journeys** where:
1. Scenario is set ONCE at the beginning
2. Test navigates: `/login` → `/apply-sign` → `/penny-drop` → `/verify`
3. **SAME API endpoint (`GET /applications/:id`) is called 4 times**
4. Each call needs **different response** based on journey progress

**Example Pattern:**
```typescript
await setTestScenario('onlineJourneyLogin', variant: 'mobile_transfer_accept');

await page.goto('/login');              // GET /applications/:id → {state: 'quoteAccept'}
await page.goto('/apply-sign');         // GET /applications/:id → {state: 'appComplete'}
await page.goto('/penny-drop');         // GET /applications/:id → {state: 'appComplete'}
await page.goto('/penny-drop/verify');  // GET /applications/:id → {state: 'appComplete'}
```

**Why the referer routing hack exists:**
```typescript
http.get('/applications/:id', async ({ request }) => {
  const { remixHeadersParsed } = await getRemixMetaInformation(request);

  // HACK: Use referer to determine which page is calling
  if (remixHeadersParsed['referer'].includes('/apply-sign') ||
      remixHeadersParsed['referer'].includes('/penny-drop')) {
    return HttpResponse.json({ state: 'appComplete' });  // Signed state
  }

  return HttpResponse.json({ state: 'quoteAccept' });  // Initial state
});
```

**This is NOT implicit state - this is PROGRESSIVE STATE without sequences!**

**How Scenarist Handles This (3 Superior Approaches):**

1. **Response Sequences (Phase 2)** - BEST for linear journeys
   ```typescript
   {
     method: 'GET',
     url: '/applications/:id',
     sequence: {
       responses: [
         { status: 200, body: { state: 'quoteAccept' } },    // 1st call
         { status: 200, body: { state: 'appComplete' } },    // 2nd+ calls
       ],
       repeat: 'last'
     }
   }
   ```

2. **Explicit Mid-Journey Scenario Switching** - CLEAREST intent
   ```typescript
   await switchScenario('loginInitial');
   await page.goto('/login');  // quoteAccept

   await switchScenario('loginSigned');
   await page.goto('/apply-sign');  // appComplete
   ```

3. **Stateful Mocks (Phase 3)** - MODELS real backend
   ```typescript
   {
     method: 'POST',
     url: '/applications/:id/signature',
     captureState: { applicationState: { from: 'body', path: 'newState' } }
   },
   {
     method: 'GET',
     url: '/applications/:id',
     response: { status: 200, body: { state: '{{state.applicationState}}' } }
   }
   ```

**Test Pattern Distribution (64+ files analyzed):**
- 48 linear multi-page journeys → Response Sequences ✅
- 16 scenario variations → Separate explicit scenarios ✅
- 12 state progressions → Stateful mocks ✅
- 5 mid-journey failures → Explicit scenario switching ✅
- 3 API-only tests → Direct mocking ✅

**Coverage:**
- **Immediate (current features):** 85% convertible
- **After Issue #86 (regex):** 95% convertible
- **After Issue #87 (templates):** 100% convertible

**Key Insight Validated:** Tests don't actually care about:
- Real UUIDs (static IDs work fine)
- Path param echo (tests don't validate it)
- Exact referer URLs (tests validate page content, not routing)

Tests care about:
- Journey progression (can user complete the flow?)
- State transitions (does state change correctly?)
- UI rendering (are the right elements visible?)

**Scenarist focuses on test intent (journey, state) rather than implementation details (referer strings, dynamic IDs).**

### Next Steps

1. ✅ **GitHub issues created** (#86 and #87)
2. ✅ **Test conversion analysis complete** (100% coverage confirmed)
3. ⏳ **Implement regex support** (follow `docs/plans/regex-support-implementation.md`)
4. ⏳ **Implement template helpers** (follow `docs/plans/template-helpers-implementation.md`)
5. ⏳ **Convert sample Acquisition.Web tests** as proof-of-concept
6. ⏳ **Update documentation** with conversion examples

### Key Architectural Lessons

1. **Explicit > Implicit:** Explicit scenario switching beats implicit routing hacks
2. **Clarity > DRY:** Separate scenarios beat variant system for readability
3. **Declarative > Imperative:** Declarative patterns (ADR-0016) beat arbitrary functions - clearer, inspectable, composable
4. **Security First:** Validate regex patterns, no eval, timeout protection
5. **Type Safety:** Zod schemas at trust boundaries, TypeScript strict mode throughout
6. **Side Benefit (Not Goal):** Most scenarios CAN be JSON-serializable when not using native RegExp - enables storage but that's not why we enforce declarative patterns

**This analysis validates Scenarist's architectural decisions while identifying two legitimate feature gaps that will be addressed in upcoming releases.**

## API Migration: registerScenario → scenarios Object

**Date:** 2025-11-02
**Status:** Migration Complete - All packages updated

### Migration Summary

The Scenarist API evolved from a register-on-demand pattern to an upfront declaration pattern:

**OLD API (register-on-demand):**
```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: scenarioObject,  // REQUIRED - passed directly
});

scenarist.registerScenario(otherScenario);  // Add scenarios after creation
scenarist.registerScenarios([more, scenarios]);
```

**NEW API (upfront declaration):**
```typescript
const scenarios = {
  default: defaultScenario,
  other: otherScenario,
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios,  // All scenarios declared upfront
  defaultScenarioId: 'default',  // ID reference, not object
});
```

### Why the Migration (Design Rationale)

**Problem with Old API:**
- `defaultScenario` mixed concerns: both required parameter AND first scenario
- Runtime registration meant scenarios could be incomplete at test time
- No type-safe scenario ID autocomplete (IDs came from anywhere)
- Scenarios scattered across setup code

**Benefits of New API:**
- ✅ All scenarios declared in one place (single source of truth)
- ✅ Type-safe scenario IDs: `scenarist.switchScenario('test-123', 'premiumUser')` with autocomplete
- ✅ Upfront validation: all scenarios exist at creation time (impossible state prevented)
- ✅ Clearer intent: scenarios object makes it obvious what's available
- ✅ Better error messages: can validate scenario IDs at compile time (no typos)
- ✅ Easier testing: test setup is declarative, not procedural

### Common Migration Patterns

#### Pattern 1: Single-File Scenario Definition (Recommended)

Create a centralized scenarios file:

```typescript
// src/scenarios.ts
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/core';

export const defaultScenario: ScenaristScenario = {
  id: 'default',
  name: 'Default Scenario',
  // ...
};

export const premiumScenario: ScenaristScenario = {
  id: 'premium',
  name: 'Premium User',
  // ...
};

export const scenarios = {
  default: defaultScenario,
  premium: premiumScenario,
} as const satisfies ScenaristScenarios;
```

Then use in server setup:

```typescript
// src/server.ts
import { scenarios } from './scenarios.js';

const scenarist = createScenarist({
  enabled: true,
  scenarios,
});
```

**Benefits:**
- Single definition location
- Easy to find all available scenarios
- Type-safe imports throughout codebase
- Clear dependency: scenarios → server setup

#### Pattern 2: Multi-File with Barrel Export

For large projects, organize by domain:

```typescript
// src/scenarios/payment.ts
export const stripeCreditCard: ScenaristScenario = { /* ... */ };
export const stripeDeclined: ScenaristScenario = { /* ... */ };

// src/scenarios/github.ts
export const githubSuccess: ScenaristScenario = { /* ... */ };
export const githubNotFound: ScenaristScenario = { /* ... */ };

// src/scenarios/index.ts - Barrel file
import type { ScenaristScenarios } from '@scenarist/core';
import { stripeCreditCard, stripeDeclined } from './payment.js';
import { githubSuccess, githubNotFound } from './github.js';

const defaultScenario: ScenaristScenario = { /* ... */ };

export const scenarios = {
  default: defaultScenario,
  stripeCreditCard,
  stripeDeclined,
  githubSuccess,
  githubNotFound,
} as const satisfies ScenaristScenarios;
```

**Benefits:**
- Organized by domain
- Scales to many scenarios
- Still single import point

### Critical Gotcha: Scenario ID Mismatches

#### Problem: Scenario definition ID vs object key mismatch

The most common migration error:

```typescript
// ❌ WRONG - ID doesn't match key
export const scenarios = {
  auth: {  // KEY is 'auth'
    id: 'authentication',  // ID is 'authentication'
    name: 'Auth Scenario',
    // ...
  },
} as const satisfies ScenaristScenarios;

// Later in tests:
scenarist.switchScenario('test-123', 'auth');  // Which one? Uses key!
// But ScenarioManager looks up scenarioId='auth' in registry
// Registry registered with ID='authentication'
// Result: Scenario not found!
```

**Root Cause:** Two different ID systems:
- **Object key** (property name): used in TypeScript types and API calls
- **Scenario ID** (definition.id field): used in registration and lookup

**The Rule:** Keys and IDs MUST match:

```typescript
// ✅ CORRECT - Key and ID are identical
export const scenarios = {
  authentication: {  // KEY is 'authentication'
    id: 'authentication',  // ID is 'authentication' (matches!)
    name: 'Auth Scenario',
    // ...
  },
} as const satisfies ScenaristScenarios;

scenarist.switchScenario('test-123', 'authentication');  // Works!
```

**Why This Requirement Exists:**
1. `ScenarioIds<typeof scenarios>` extracts keys from object
2. TypeScript ensures you pass a valid key
3. But that key must match the scenario's internal ID for registry lookup
4. Otherwise the scenario is registered but unreferenceable

**Detection:** This only fails at runtime, when `switchScenario` returns `{ success: false }`. Add a validation test:

```typescript
it('should have matching keys and IDs', () => {
  Object.entries(scenarios).forEach(([key, scenario]) => {
    expect(scenario.id).toBe(key);
  });
});
```

### Edge Cases Discovered During Migration

#### Edge Case 1: TypeScript Type Safety at Boundaries

**Scenario:** Adding new scenarios to object but forgetting to update registration

**OLD API issue:** Compile time didn't catch this
- New scenario defined in object
- Forgot to call `registerScenario()`
- At test time: scenario ID recognized but definition not found

**NEW API advantage:** Automatic validation
```typescript
const scenarios = {
  default: { id: 'default', /* ... */ },
  premium: { id: 'premium', /* ... */ },  // Added this
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  scenarios,  // ✅ Automatically registered
});
```

No additional registration needed - all scenarios in object are automatically registered.

#### Edge Case 2: Empty Scenarios Object

**Scenario:** What if scenarios object is empty?

```typescript
const scenarios = {} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  scenarios,
  defaultScenarioId: 'default',  // ❌ Doesn't exist!
});
```

**Gotcha:** TypeScript doesn't validate `defaultScenarioId` exists in scenarios object

**The Fix:** Either add validation or rely on explicit test:

```typescript
it('should have defaultScenarioId in scenarios', () => {
  const scenarioIds = Object.keys(scenarios);
  expect(scenarioIds).toContain(scenarist.config.defaultScenarioId);
});
```

#### Edge Case 3: Dynamic Scenario ID Strings

**Scenario:** Temptation to parameterize scenario IDs

```typescript
// ❌ WRONG - Breaks type safety
const SCENARIO_IDS = {
  DEFAULT: 'default',
  PREMIUM: 'premium',
};

const scenarios = {
  [SCENARIO_IDS.DEFAULT]: { id: SCENARIO_IDS.DEFAULT, /* ... */ },
  [SCENARIO_IDS.PREMIUM]: { id: SCENARIO_IDS.PREMIUM, /* ... */ },
};

scenarist.switchScenario('test-123', SCENARIO_IDS.DEFAULT);  // Accepted but not type-safe
```

**Why This Fails:**
- TypeScript doesn't track computed keys in type inference
- `as const satisfies ScenaristScenarios` can't extract types from computed keys
- No autocomplete, no compile-time validation

**The Pattern:** Use literal keys instead:

```typescript
// ✅ CORRECT - Literal keys enable type inference
const scenarios = {
  default: { id: 'default', /* ... */ },
  premium: { id: 'premium', /* ... */ },
} as const satisfies ScenaristScenarios;

// If you need constants, derive them from scenarios:
const SCENARIO_IDS = {
  DEFAULT: 'default' as const,
  PREMIUM: 'premium' as const,
};
```

### Testing Strategy After Migration

**Old API Testing Pattern:**
```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: mockDefaultScenario,
});
scenarist.registerScenario(mockOtherScenario);

// Test scenario registration
expect(() => scenarist.getScenarioById('other')).toBeDefined();
```

**New API Testing Pattern:**
```typescript
const testScenarios = {
  default: mockDefaultScenario,
  other: mockOtherScenario,
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios: testScenarios,
});

// Scenarios automatically registered - no registration tests needed
expect(scenarist.listScenarios()).toHaveLength(2);
```

**Key Difference:**
- ❌ No need to test registration (automatic)
- ✅ Test that scenarios object matches test data
- ✅ Test that defaultScenarioId exists in scenarios

### Benefits Realized Post-Migration

#### Benefit 1: Type-Safe Scenario Switching

```typescript
// TypeScript autocomplete works!
scenarist.switchScenario('test-123', 'default');      // ✅ Autocomplete shows 'default'
scenarist.switchScenario('test-123', 'typohere');     // ❌ Compile error

// In test setups:
await request(app)
  .post(scenarist.config.endpoints.setScenario)
  .set(scenarist.config.headers.testId, 'test-123')
  .send({ scenario: 'premium' });  // ✅ String literal, type-checked
```

#### Benefit 2: Clearer Intent

Old code:
```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: SomeScenarioObject,
});
// Later... where's the default scenario stored? In defaultScenario property.
// What other scenarios are available? Unknown without reading all registration calls.
```

New code:
```typescript
const scenarios = {
  default: defaultScenario,
  premium: premiumScenario,
  error: errorScenario,
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios,  // ✅ Crystal clear: these are ALL available scenarios
});
```

#### Benefit 3: Single Source of Truth

All scenarios centralized in one file = easier maintenance:
```typescript
// Want to find all scenarios? One file.
// Want to add a new scenario? One file.
// Want to see what scenarios are available? One file.

Object.keys(scenarios)  // Automatically has all scenario IDs
```

#### Benefit 4: Prevention of Impossible States

Old API allowed:
```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: scenarioA,
});
// Later, test tries to use scenario B that was never registered
scenarist.switchScenario('test-123', 'scenarioB');  // Runtime error
```

New API prevents this:
```typescript
const scenarios = {
  a: scenarioA,
  b: scenarioB,
} as const satisfies ScenaristScenarios;

scenarist.switchScenario('test-123', 'scenarioC');  // ✅ Compile error! 'scenarioC' not in scenarios
```

### Migration Checklist

When migrating existing code:

- [ ] Create centralized scenarios file (or use barrel export pattern)
- [ ] Group all scenario definitions
- [ ] Create scenarios object with `as const satisfies ScenaristScenarios`
- [ ] Ensure all scenario definition IDs match object keys
- [ ] Replace `defaultScenario` parameter with `scenarios` object
- [ ] Replace `defaultScenario` property with `defaultScenarioId` reference
- [ ] Remove all `registerScenario()` and `registerScenarios()` calls
- [ ] Update tests: remove registration test assertions
- [ ] Add test validating defaultScenarioId exists in scenarios
- [ ] Test that `listScenarios()` returns all scenarios from object
- [ ] Verify TypeScript autocomplete in IDE
- [ ] Update any dynamic scenario ID generation (use literal keys)

### Documentation Impact

**For New Users:**
- Example apps show scenarios object pattern
- API docs emphasize upfront declaration
- TypeScript types guide toward correct usage

**For Existing Users:**
- Migration guide with before/after examples
- Common gotchas section (key/ID mismatch)
- Testing strategy changes documented
- Deprecation note on old API (if ever supported)

### Architectural Insight: Upfront vs On-Demand

This migration reflects a shift in thinking:

**On-Demand Model** (Old):
- Flexible: add scenarios anytime
- Risky: incomplete scenario sets at test time
- Procedural: registration scattered across code
- Runtime errors: scenario not found

**Upfront Declaration Model** (New):
- Type-safe: all scenarios known at compile time
- Predictable: impossible states prevented
- Declarative: single source of truth
- Compile errors: bad scenario IDs caught immediately

**Pattern Recognition:** This same pattern appears in many TypeScript patterns:
- Component props → registered before component mounts
- Routes → declared before server starts
- Permissions → enumerated upfront, not granted on-demand

The new Scenarist API follows the same principle: declare contracts upfront, validate at compile time, execute at runtime with confidence.

## Phase 8: Next.js App Router - Learnings (App Example)

### TDD Violation: All Code in Single Commit

**Date:** 2025-11-07
**Context:** Implementing App Router products page and `getScenaristHeaders` helper

**Problem:** Committed all tests and implementation together in single commit (666a954)
- E2E tests for products page
- Component implementations (TierSelector, ProductCard, page.tsx)
- API route handler (app/api/products/route.ts)
- Helper function (packages/nextjs-adapter/src/app/helpers.ts)
- No unit tests for helper function
- No evidence of RED → GREEN → REFACTOR cycle in git history

**Root Cause:** Implementation pressure led to skipping fundamental TDD process
- Focused on "getting it done" rather than proving TDD adherence
- Helper function seemed "simple enough" to not need tests
- E2E tests passing gave false confidence
- Forgot that git history must demonstrate TDD, not just final working state

**Detection:** TDD Guardian agent flagged CRITICAL violation
- No failing test before implementation
- Helper function with 0% test coverage
- Claim of TDD in commit message without evidence
- All work batched into single commit

**Fix Applied (Commits c35bd5a, f018a73):**

1. **RED Phase (c35bd5a):**
   - Created `packages/nextjs-adapter/tests/app/helpers.test.ts`
   - Temporarily moved implementation to `.backup` to verify RED
   - Ran tests - confirmed FAILED (file not found)
   - Committed with note: "test(nextjs-adapter/app): add unit tests for getScenaristHeaders helper (RED - retroactive fix)"

2. **GREEN Phase (f018a73):**
   - Restored implementation file
   - Fixed test setup (added required default scenario)
   - Ran tests - confirmed PASSED (6/6 tests)
   - Committed with note: "feat(nextjs-adapter/app): implement getScenaristHeaders helper (GREEN - retroactive fix)"

**Test Coverage Added:**
- Extract test ID from request header
- Use default test ID when header missing
- Respect custom header name from config
- Handle lowercase header names
- Return object with single header entry
- Use default when header value is empty string

**Key Lessons:**

1. **No Exceptions for "Simple" Code**
   - Even trivial helpers need tests first
   - Simplicity is not an excuse to skip TDD
   - Tests document behavior regardless of complexity

2. **Git History is Proof**
   - Working code ≠ TDD compliance
   - Must demonstrate RED → GREEN in commits
   - Single commit with tests + impl = NOT TDD

3. **E2E Tests Don't Replace Unit Tests**
   - E2E tests passed but helper had 0% unit coverage
   - Unit tests verify helper behavior in isolation
   - E2E tests verify integration, not implementation details

4. **Retroactive Fixes Are Possible But Costly**
   - Had to fabricate RED state by removing implementation
   - Lost development flow and context
   - More work than doing it right the first time
   - Should have been caught before commit

**Prevention:**
- ✅ Run TDD Guardian before requesting review
- ✅ Check coverage before committing (not after)
- ✅ Never commit without failing test first
- ✅ Separate commits for RED, GREEN, REFACTOR
- ✅ Challenge yourself: "Can I prove TDD from git log?"

**Pattern Recognition:**
This is the SAME violation documented in Phase 2 (PR #26):
- Writing speculative code without tests
- Claiming TDD without evidence
- Having to retrofit tests after implementation

**The lesson keeps repeating: TDD is non-negotiable. No shortcuts, no exceptions.**

## URL Matching Phase 2.5: Path Parameters - Critical Learnings

**Completed:** 2025-11-17
**Status:** All tests passing (17 integration + 306 core)
**Context:** Implementing MSW path-to-regexp compatibility for parameter extraction

### User Feedback: Backward Compatibility is NOT a Concern

**CRITICAL GUIDANCE:** During this work, the user provided explicit feedback:

> "Backward compatability is NOT a thing for us - we care about having a clean and consistent API, but we have NO REAL USERS yet, so we don't need backwards compatability with anything. We are free to change our API as much as we want at the moment (so long as it remains declarative as per our project rules)"

**Key Principles:**
- ✅ Focus on clean, declarative API design
- ✅ Make breaking changes if they improve the API
- ✅ Prioritize consistency over backward compatibility
- ❌ Don't constrain design to maintain compatibility with non-existent users
- ❌ Don't add complexity for backward compatibility

**This applies to ALL future work** - we're pre-1.0, optimizing for the best possible API.

### Critical Bug #1: URL Constructor Corrupts path-to-regexp Syntax

**Problem:** The `new URL()` constructor treats special characters as URL components, corrupting path-to-regexp patterns.

**Example:**
```typescript
// Input pattern
const pattern = 'http://localhost:3001/api/files/:filename?';

// Using URL constructor (WRONG)
const url = new URL(pattern);
url.pathname;  // '/api/files/:filename' ❌ (lost the ?)

// Manual regex parsing (CORRECT)
const match = /^https?:\/\/[^/]+(\/.*)?$/.exec(pattern);
const pathname = match[1];  // '/api/files/:filename?' ✅ (preserved ?)
```

**Why It Matters:**
- `?` in path-to-regexp means "optional parameter"
- URL constructor treats `?` as query string delimiter
- Result: Optional parameters break entirely

**The Fix:**
```typescript
/**
 * Extract pathname from URL string, or return as-is if not a valid URL.
 *
 * CRITICAL: Handles path-to-regexp syntax (`:param`, `?`, `+`, `(regex)`)
 * The URL constructor treats `?` as query string delimiter, which breaks optional params.
 */
const extractPathnameOrReturnAsIs = (url: string): string => {
  const urlPattern = /^https?:\/\/[^/]+(\/.*)?$/;
  const match = urlPattern.exec(url);

  if (match) {
    return match[1] || '/';
  }

  return url;  // Already a pathname
};
```

**Affected Patterns:**
- `:filename?` → Optional parameters
- `:path+` → Repeating parameters
- `:id(\\d+)` → Custom regex parameters

**Files Changed:**
- `packages/msw-adapter/src/matching/url-matcher.ts:26-39`

**Tests Proving Fix:**
- All 85 url-matcher unit tests pass
- All 7 path parameter integration tests pass

### Critical Bug #2: Pattern Conflicts with Repeating Parameters

**Problem:** The repeating parameter pattern `:path+` matches BOTH single segments AND multiple segments, causing conflicts with simple parameter patterns.

**Example:**
```typescript
// Two mocks for /api/files/
const mocks = [
  {
    method: 'GET',
    url: '/api/files/:filename',  // Simple parameter
    response: { /* fallback */ }
  },
  {
    method: 'GET',
    url: '/api/files/:path+',  // Repeating parameter
    response: { /* nested paths */ }
  }
];

// Request: /api/files/readme.txt
// Both patterns match!
// ':filename' → {filename: 'readme.txt'}
// ':path+' → {path: ['readme.txt']}  (single-element array)

// Due to "last match wins" → repeating mock wins
// Result: Wrong mock selected for single-segment files
```

**Why path-to-regexp Works This Way:**
- `:path+` means "one or MORE segments"
- Single segment = valid match (one segment satisfies "one or more")
- No distinction between single and multiple segments in pattern

**The Fix:** Use different URL endpoints to avoid conflicts
```typescript
// Before (conflict)
{
  url: '/api/files/:filename',  // Fallback
},
{
  url: '/api/files/:path+',  // Repeating - conflicts!
}

// After (no conflict)
{
  url: '/api/files/:filename',  // Fallback for single files
},
{
  url: '/api/paths/:path+',  // Different endpoint for nested paths
}
```

**Files Changed:**
- `apps/nextjs-app-router-example/lib/scenarios.ts:805-818`
- `apps/nextjs-app-router-example/app/url-matching/page.tsx:227`

**Test Results:**
- Before: 6/17 URL matching tests passing (endsWith fallback failing)
- After: 17/17 URL matching tests passing ✅

### Pattern: "Last Match Wins" for Equal Specificity

**Rule:** When multiple mocks have equal specificity (both 0, both 1, etc.), the LAST mock in the array wins.

**Why This Matters:**
```typescript
// Fallback should come BEFORE more specific mocks
const mocks = [
  // Fallback (specificity = 0)
  {
    method: 'GET',
    url: '/api/orders/:orderId',
    response: { status: 'unknown' }
  },
  // Custom regex (specificity = 0, but more selective pattern)
  {
    method: 'GET',
    url: '/api/orders/:orderId(\\d+)',
    response: { status: 'processing' }
  }
];

// Request: /api/orders/12345
// Both match (numeric ID), both have specificity = 0
// Last match wins → custom regex response returned ✅
```

**Counter-Example (Wrong Order):**
```typescript
const mocks = [
  // Custom regex FIRST (wrong!)
  {
    method: 'GET',
    url: '/api/orders/:orderId(\\d+)',
    response: { status: 'processing' }
  },
  // Fallback LAST (overwrites custom regex)
  {
    method: 'GET',
    url: '/api/orders/:orderId',
    response: { status: 'unknown' }
  }
];

// Request: /api/orders/12345
// Both match, both specificity = 0
// Last match wins → fallback response returned ❌ (wrong!)
```

**Best Practice:** Order mocks from general → specific
1. Fallback mocks (no conditions)
2. Conditional mocks (match criteria)
3. Mocks with narrow patterns (custom regex, etc.)

### Optional Parameter Handling: Two-Mock Approach

**Problem:** Template replacement returns `undefined` when parameter is absent, which gets omitted from JSON. Cannot conditionally inject static defaults.

**Original Attempt (Doesn't Work):**
```typescript
{
  method: 'GET',
  url: '/api/files/:filename?',  // Optional
  response: {
    body: {
      filename: '{{params.filename}}',  // undefined when absent
      path: '/files/{{params.filename}}',  // undefined when absent
      exists: true
    }
  }
}

// Request: /api/file-optional (no filename)
// Result: {exists: true} ❌ (filename and path omitted)
```

**Solution: Split Into Two Mocks**
```typescript
// Mock 1: When parameter is present (more specific)
{
  method: 'GET',
  url: '/api/file-optional/:filename',  // WITHOUT ? - requires param
  response: {
    body: {
      filename: '{{params.filename}}',  // Injected
      path: '/file-optional/{{params.filename}}',
      exists: true
    }
  }
},

// Mock 2: When parameter is absent (fallback)
{
  method: 'GET',
  url: '/api/file-optional',  // Exact match, no param
  response: {
    body: {
      filename: 'default.txt',  // Static default
      path: '/file-optional/default.txt',
      exists: true
    }
  }
}

// Request: /api/file-optional/document.txt
// Matches Mock 1 → {filename: 'document.txt', path: '/file-optional/document.txt', exists: true} ✅

// Request: /api/file-optional
// Matches Mock 2 → {filename: 'default.txt', path: '/file-optional/default.txt', exists: true} ✅
```

**Why This Works:**
- Mock 1 requires parameter (no `?`), only matches when present
- Mock 2 is exact match, only matches when absent
- No overlap, no "last match wins" needed
- Templates work correctly (parameter guaranteed present in Mock 1)

### Key Architectural Insights

1. **Delegate to Canonical Libraries**
   - Using path-to-regexp v6 (same as MSW 2.x)
   - Automatic MSW parity without manual sync
   - Bug fixes in upstream benefit us automatically

2. **Preserve Input Fidelity**
   - Don't transform user input (URL parsing)
   - Preserve special characters exactly as written
   - Manual parsing when standard library corrupts data

3. **URL Pattern Conflicts Are Inevitable**
   - Multiple patterns can match same URL
   - Order matters for equal specificity
   - Clear documentation prevents user confusion

4. **Template Limitations Require Workarounds**
   - Cannot conditionally inject defaults
   - Two-mock pattern is acceptable trade-off
   - Still maintains declarative API

### Files Modified

**Core Package:**
- `packages/msw-adapter/src/matching/url-matcher.ts` - Manual URL parsing fix

**Example App:**
- `apps/nextjs-app-router-example/lib/scenarios.ts` - URL pattern fixes
- `apps/nextjs-app-router-example/app/url-matching/page.tsx` - Rendering fixes
- `apps/nextjs-app-router-example/tests/playwright/url-matching.spec.ts` - Integration tests

**Documentation:**
- `CLAUDE.md` - This section

### Test Results

**Before:**
- Path parameter tests: 0/7 passing (all failing)
- URL matching tests: 6/17 passing
- Core tests: 306/306 passing

**After:**
- Path parameter tests: 7/7 passing ✅
- URL matching tests: 17/17 passing ✅
- Core tests: 306/306 passing ✅

**Total:** 323 tests passing (17 integration + 306 core)

## Automatic Default Fallback - Critical Learnings

**Implemented:** 2025-11-11
**Status:** Complete - All documentation updated
**Plan Document:** `docs/plans/automatic-default-fallback.md`

### Feature Overview

Active scenarios now **automatically fall back to default scenario mocks**. When switching to a specialized scenario, Scenarist collects mocks from BOTH default AND active scenarios, then uses specificity-based selection to choose the best match.

**Before (manual fallback):**
```typescript
export const premiumUserScenario: ScenaristScenario = {
  id: 'premium-user',
  mocks: [
    // Override: Premium products
    {
      method: 'GET',
      url: '/api/products',
      match: { headers: { 'x-user-tier': 'premium' } },
      response: { status: 200, body: buildProducts('premium') }
    },
    // DUPLICATION: Had to explicitly add fallback
    {
      method: 'GET',
      url: '/api/products',
      response: { status: 200, body: buildProducts('standard') }
    }
  ]
};
```

**After (automatic fallback):**
```typescript
export const defaultScenario: ScenaristScenario = {
  id: 'default',
  mocks: [
    {
      method: 'GET',
      url: '/api/products',
      response: { status: 200, body: buildProducts('standard') }  // Baseline
    }
  ]
};

export const premiumUserScenario: ScenaristScenario = {
  id: 'premium-user',
  mocks: [
    // Only define what changes - fallback automatic!
    {
      method: 'GET',
      url: '/api/products',
      match: { headers: { 'x-user-tier': 'premium' } },
      response: { status: 200, body: buildProducts('premium') }
    }
  ]
};
```

### Key Architectural Decision: Last Fallback Wins

**Problem:** With automatic fallback, default AND active scenarios both contribute mocks. When BOTH have fallback mocks (specificity = 0), which wins?

**Solution:** **Last fallback wins** (last mock in collected array wins for specificity = 0)

**Why this matters:**

Without this rule, default fallbacks would ALWAYS win over active scenario fallbacks (because default is collected first). This would break the ability for active scenarios to provide their own catch-all responses.

**Implementation in ResponseSelector:**
```typescript
// For mocks with specificity > 0: First match wins
if (bestMatch.mock && bestMatch.specificity > 0) {
  return bestMatch;
}

// For fallback mocks (specificity = 0): Last match wins
// This allows active scenario fallbacks to override default fallbacks
for (let i = mocks.length - 1; i >= 0; i--) {
  const mock = mocks[i];
  if (!mock.match) {  // Fallback mock
    return mock;
  }
}
```

**Example:**
```typescript
// Collected mocks for GET /api/data:
const mocks = [
  // From default scenario
  { method: 'GET', url: '/api/data', response: { status: 200, body: { tier: 'standard' } } },
  // From active scenario
  { method: 'GET', url: '/api/data', response: { status: 200, body: { tier: 'premium' } } }
];

// Both have specificity = 0 (no match criteria)
// Last fallback wins → active scenario response returned
```

**This enables the default + override pattern without requiring match criteria on fallbacks.**

### Critical Gotcha: Next.js Module Duplication

**Problem Discovered:** Playwright tests were intermittently failing with:
- `[MSW] Multiple handlers with the same URL` warnings
- JSON-server 500 errors (MSW passthrough to non-existent server)
- Scenarios not switching properly
- Different tests getting wrong responses

**Root Cause:** Next.js can load the same module multiple times, causing module duplication. If users wrap `createScenarist()` in a function, each function call creates a NEW MSW server instance, leading to handler conflicts.

**The Wrong Pattern (causes duplication):**
```typescript
// ❌ WRONG - Creates new instance each time
export function getScenarist() {
  return createScenarist({ enabled: true, scenarios });
}

// Each import that calls getScenarist() creates a new MSW server!
```

**The Correct Pattern (singleton):**
```typescript
// ✅ CORRECT - Single exported constant
export const scenarist = createScenarist({ enabled: true, scenarios });

// All imports share the same instance, even if module loads twice
```

**Why Singleton Protection Works:**

Inside `createScenarist()`, there's a singleton guard:
```typescript
const SCENARIST_INSTANCES = new Map<string, ScenaristInstance>();

export const createScenarist = (config) => {
  const key = JSON.stringify(config);

  if (SCENARIST_INSTANCES.has(key)) {
    return SCENARIST_INSTANCES.get(key)!;  // Return existing
  }

  const instance = /* create new instance */;
  SCENARIST_INSTANCES.set(key, instance);
  return instance;
};
```

**But this ONLY works if you export a constant:**
- `export const scenarist = createScenarist(...)` → Called once, singleton works ✅
- `export function getScenarist() { return createScenarist(...) }` → Called N times, singleton bypassed ❌

**Detection:**
- MSW warnings in console
- Intermittent test failures (different results on reruns)
- Multiple scenario switches affecting each other

**The Fix:**
Always use `export const scenarist = createScenarist(...)` pattern. Never wrap in a function.

### Documentation Updates Applied

**Docs Site (`apps/docs/src/content/docs/`):**
1. **`introduction/default-mocks.mdx`**
   - Updated "Override Behavior" → "Automatic Fallback Behavior"
   - Added explanation of default-first collection
   - Updated "Tiebreaker: First Match Wins" → "Tiebreaker Rules" (with last fallback wins)
   - Added concrete examples showing automatic fallback in action
   - Explained specificity-based override mechanism

2. **`frameworks/nextjs-app-router/getting-started.mdx`**
   - Added "CRITICAL: Singleton Pattern Required" warning
   - Showed wrong patterns (function wrapper, default export)
   - Showed correct pattern (export const)
   - Explained Next.js module duplication issue
   - Listed symptoms of violation (MSW warnings, 500 errors)

**Package READMEs:**
3. **`packages/core/README.md`**
   - Updated "Specificity-based selection" with tie-breaking rules
   - Added "Last fallback wins enables override pattern"
   - Updated "Default scenario fallback" → "Automatic default scenario fallback"
   - Explained default + active collection

4. **`packages/msw-adapter/README.md`**
   - Updated "Default scenario fallback" → "Automatic default fallback"
   - Updated "How it works" section in Dynamic Handler
   - Added explanation: "Default mocks ALWAYS collected first"
   - Documented specificity-based selection algorithm

5. **`packages/nextjs-adapter/README.md`**
   - Added "CRITICAL: Singleton Pattern Required" warning in Quick Start
   - Showed anti-patterns and symptoms
   - Explained module duplication gotcha
   - Updated "Default scenario fallback" → "Automatic default fallback"

**Plans:**
6. **Moved** `docs/wip/automatic-default-fallback.md` → `docs/plans/automatic-default-fallback.md`

### Why This Design Was Chosen

**Familiar Pattern:** Default + override is common across programming:
- CSS: Default styles + specific overrides
- Environment variables: Default values + environment-specific overrides
- TypeScript: Default props + specific props

**Reduces Duplication:** Don't repeat fallback mocks in every specialized scenario.

**Fail-Safe:** Always have a response (prevent MSW passthrough to real APIs).

**Better Mental Model:** "Default = safety net, Scenario = variations"

**Leverages Existing Architecture:** Specificity-based selection (Phase 1) already existed. Adding default-first collection to `getMocksFromScenarios` enables automatic override without new logic in `ResponseSelector`.

**This is architectural leverage** - new feature emerges from existing design by composing two simple changes:
1. Collect default mocks first (MSW adapter)
2. Last fallback wins (ResponseSelector tie-breaking)

### Files Modified

**Core Changes:**
- `packages/core/src/domain/response-selector.ts` - Added last fallback wins tie-breaking logic
- `packages/core/tests/response-selector.test.ts` - Added test for last fallback wins behavior

**MSW Adapter:**
- `packages/msw-adapter/src/handlers/dynamic-handler.ts` - Changed `getMocksFromScenarios` to collect default first
- `packages/msw-adapter/tests/dynamic-handler.test.ts` - Updated tests for default-first behavior

**Next.js Adapter (Singleton):**
- `packages/nextjs-adapter/src/app/setup.ts` - Added singleton guard to `createScenarist`
- `packages/nextjs-adapter/src/pages/setup.ts` - Added singleton guard to `createScenarist`

**Documentation (6 files):**
- `apps/docs/src/content/docs/introduction/default-mocks.mdx` - Updated automatic fallback explanation
- `apps/docs/src/content/docs/frameworks/nextjs-app-router/getting-started.mdx` - Added singleton warning
- `packages/core/README.md` - Updated capability descriptions
- `packages/msw-adapter/README.md` - Updated dynamic handler explanation
- `packages/nextjs-adapter/README.md` - Added singleton warning and updated capabilities
- `docs/plans/automatic-default-fallback.md` - Moved from wip/

### Key Lessons

1. **Default-first collection + last fallback wins = automatic override**
   - Simple compositional change
   - Leverages existing specificity algorithm
   - No new complexity in ResponseSelector

2. **Module duplication is a Next.js-specific concern**
   - Not all frameworks have this issue
   - Singleton pattern is defensive programming
   - Export pattern matters: `const` vs `function`

3. **Tie-breaking rules must consider use case**
   - First match wins: Good for match criteria (specificity > 0)
   - Last match wins: Good for fallbacks (enables override)
   - Different rules for different specificity levels

4. **Documentation is part of "done"**
   - Feature incomplete without docs
   - Must update: docs site, READMEs, plans, CLAUDE.md
   - Each document serves different audience (users, maintainers, future devs)

5. **Gotchas must be documented prominently**
   - Singleton pattern is non-obvious
   - Next.js module duplication is framework-specific
   - Warning boxes and examples prevent user confusion

## Specificity Bug: Sequences vs Match Criteria - Critical Fix

**Implemented:** 2025-11-11
**Status:** Complete - All tests passing (159 unit + 35 Playwright)

### Bug Discovery

**Symptom:** Payment sequence test (repeat: 'none') immediately returned rate limit error (429) instead of first sequence response (ch_1 pending).

**Root Cause:** Sequences without match criteria were treated as fallback mocks with specificity 0, causing them to be overwritten by simple response fallbacks due to "last fallback wins" logic.

**Initial Investigation:**
```typescript
// Payment sequence scenario:
{
  method: "POST",
  url: "http://localhost:3001/payments",
  sequence: {  // Mock 0: No match criteria
    responses: [
      { status: 200, body: { id: "ch_1", status: "pending" } },
      { status: 200, body: { id: "ch_2", status: "pending" } },
      { status: 200, body: { id: "ch_3", status: "succeeded" } },
    ],
    repeat: "none",
  },
},
{
  method: "POST",
  url: "http://localhost:3001/payments",
  response: {  // Mock 1: No match criteria, rate limit fallback
    status: 429,
    body: { error: { message: "Rate limit exceeded" } },
  },
}

// Both mocks have specificity 0
// "Last fallback wins" → Mock 1 overwrites Mock 0
// MSW returns 429 instead of sequence!
```

### First Fix Attempt: Give Sequences Priority

**Solution:** Modified `response-selector.ts:87` to give sequences specificity 1:

```typescript
const fallbackSpecificity = mock.sequence ? 1 : 0;
```

**Result:** Payment test started passing! MSW returned 200 instead of 429.

### Second Bug: Unit Test Failure

**Problem:** Unit test "should work correctly with match criteria and specificity" failed:
- Expected: 'premium'
- Received: 'generic'

**Test Setup:**
```typescript
const mocks = [
  // Mock 0: Generic sequence (no match criteria)
  {
    method: "POST",
    url: "/api/process",
    sequence: { responses: [...] },  // Specificity: 1
  },
  // Mock 1: Premium sequence (WITH match criteria)
  {
    method: "POST",
    url: "/api/process",
    match: { body: { tier: "premium" } },
    sequence: { responses: [...] },  // Specificity: 1 (100 base + 1 field = 101 expected!)
  },
];
```

**Problem:** With first fix, Mock 0 (no match, sequence) got specificity 1. Mock 1 (match criteria with 1 field) also got specificity 1. They're equal, so Mock 0 (processed first) won instead of Mock 1.

### Final Fix: Separate Specificity Ranges

**Solution:** Use separate priority ranges to guarantee correct selection:

```typescript
// packages/core/src/domain/response-selector.ts:72
if (mock.match) {
  // Match criteria always have higher priority than fallbacks
  // Base specificity of 100 ensures even 1 field (100+1=101) beats any fallback (max 1)
  const specificity = 100 + calculateSpecificity(mock.match);

  if (!bestMatch || specificity > bestMatch.specificity) {
    bestMatch = { mock, mockIndex, specificity };
  }
}
```

**Specificity Ranges:**
1. **Match criteria mocks:** 101+ (100 base + field count)
2. **Fallback sequences:** 1
3. **Simple fallback responses:** 0

**Guarantees:**
- ✅ Mocks with match criteria ALWAYS win over fallbacks
- ✅ Sequence fallbacks take priority over simple response fallbacks
- ✅ No conflicts between match criteria and sequence features

### Test Results

**Before Fix:**
- Playwright: 34/35 passing (payment sequence failing)
- Unit tests: 158/159 passing (specificity test failing)

**After Fix:**
- Playwright: 35/35 passing ✅
- Unit tests: 159/159 passing ✅

### Files Modified

**Core Package:**
- `packages/core/src/domain/response-selector.ts:72` - Added base specificity of 100 for match criteria
- Lines 72-78 updated with new specificity calculation and comments

**Documentation:**
- `docs/core-functionality.md` - Updated specificity section with priority ranges
- `CLAUDE.md` - Added this section

### Key Lessons

1. **Separate Priority Ranges Prevent Conflicts**
   - Don't mix different feature types in same specificity range
   - Match criteria (conditional behavior) vs sequences (stateful behavior) need separation
   - Use large gaps (100) to avoid future conflicts

2. **Specificity = 0 is Ambiguous**
   - Both simple fallbacks and sequences were using 0
   - Created conflict when both present
   - Solution: Give sequences higher priority (1 > 0)

3. **Unit Tests Catch Edge Cases**
   - Playwright tests passed with first fix
   - Unit test revealed conflict between match + sequence
   - Different test types catch different bugs

4. **Base Specificity Pattern**
   - Base 100 for conditional logic (match criteria)
   - Base 1-10 for stateful features (sequences, state)
   - Base 0 for simple fallbacks
   - Leaves room for future features

5. **Test Both Positive and Negative Cases**
   - Payment test: sequences work (positive)
   - Unit test: sequences don't override matches (negative)
   - Both needed to catch the bug

### Architectural Insight

The specificity system uses **semantic ranges** not just numeric scores:

| Range | Feature | Example Specificity |
|-------|---------|---------------------|
| 100+ | Conditional logic (match criteria) | 101 (1 field), 102 (2 fields), 103 (3 fields) |
| 1-99 | Stateful features (sequences, future) | 1 (sequence fallback) |
| 0 | Simple fallbacks | 0 (simple response) |

This architecture prevents feature conflicts and maintains clean separation of concerns. Each feature type gets its own range, guaranteeing correct priority regardless of field counts or combinations.

## PR Review Fixes: Singleton Architecture & Test Coverage

**Implemented:** 2025-11-11
**Status:** Complete - All tests passing (51 core + 25 Next.js adapter + 35 Playwright)
**Context:** PR review identified 4 critical issues that needed addressing

### Issue #1: Singleton Guard Belongs in Adapter, Not Application

**Problem:** Application code (`apps/nextjs-app-router-example/lib/scenarist.ts`) implemented global singleton pattern - this violates hexagonal architecture.

**Why It's Wrong:**
- Application layer shouldn't handle infrastructure concerns
- Singleton logic IS adapter responsibility (per CLAUDE.md guidelines)
- Redundant with adapter's existing MSW/registry/store singletons
- Forces ALL applications to implement same pattern (boilerplate)

**Root Cause:** Next.js module duplication causes `createScenarist()` to be called multiple times:
- Next.js bundling can duplicate modules across chunks
- Each module evaluation creates new instance
- Without singleton guard: DuplicateScenarioError when scenarios re-register
- See: [Next.js Discussion #68572](https://github.com/vercel/next.js/discussions/68572)

**The Fix (commit 84f5fb3):**

Added singleton guard in `packages/nextjs-adapter/src/app/setup.ts`:

```typescript
declare global {
  var __scenarist_instance: AppScenarist | undefined;
}

export const createScenarist = (options: AppAdapterOptions): AppScenarist => {
  // Singleton guard - return existing instance if already created
  if (global.__scenarist_instance) {
    return global.__scenarist_instance;
  }

  // ... create instance ...

  global.__scenarist_instance = instance;
  return instance;
};
```

Application code simplified to:

```typescript
// ✅ CORRECT - Simple const export, adapter handles singleton
export const scenarist = createScenarist({
  enabled: true,
  scenarios,
});
```

**Why This Architecture:**
- ✅ Adapter layer handles infrastructure concerns (singleton management)
- ✅ Application layer stays simple (`export const`)
- ✅ Consistent with Express adapter pattern
- ✅ Single source of truth for singleton logic
- ✅ Users don't need to understand Next.js module duplication

### Issue #2: Simplify Specificity Condition

**Problem:** Redundant condition in `response-selector.ts:89-90`:

```typescript
// ❌ WRONG - Explicitly checks both > and ===
if (!bestMatch || fallbackSpecificity > bestMatch.specificity ||
    (fallbackSpecificity === bestMatch.specificity)) {
```

**Fix (commit fa49e43):**

```typescript
// ✅ CORRECT - >= is clearer and logically equivalent
if (!bestMatch || fallbackSpecificity >= bestMatch.specificity) {
```

**Why:** Condition always updates when `>=`, so checking equality separately was redundant.

### Issue #3: Missing Test for Sequence Fallback Tie-Breaking

**Problem:** No test for TWO sequences with no match criteria (both specificity 1).

**Why It Matters:** Tests proved simple fallbacks (specificity 0) use last-wins, but didn't prove sequence fallbacks (specificity 1) also use last-wins.

**Fix (commit a0c5743):**

Added test in `packages/core/tests/response-selector.test.ts`:

```typescript
it('should return last sequence fallback when multiple sequence fallbacks exist', () => {
  const mocks = [
    {
      method: 'GET',
      url: '/api/status',
      sequence: {
        responses: [
          { status: 200, body: { status: 'pending', source: 'first-sequence' } },
          { status: 200, body: { status: 'complete', source: 'first-sequence' } },
        ],
        repeat: 'last',
      },
    },
    {
      method: 'GET',
      url: '/api/status',
      sequence: {
        responses: [
          { status: 200, body: { status: 'processing', source: 'second-sequence' } },
          { status: 200, body: { status: 'done', source: 'second-sequence' } },
        ],
        repeat: 'last',
      },
    },
  ];

  const result = selector.selectResponse('test-1', 'default-scenario', context, mocks);

  // Last sequence fallback wins
  expect(result.data.body).toEqual({ status: 'processing', source: 'second-sequence' });
});
```

**Result:** Test count 51 (up from 50), 100% coverage maintained.

### Issue #4: Missing Tests for Adapter Singleton Guard

**CRITICAL TDD VIOLATION:** Added singleton guard in commit 84f5fb3 without tests!

**Fix (commit 16a0d73):**

Added 5 comprehensive tests in `packages/nextjs-adapter/tests/app/app-setup.test.ts`:

1. **Same instance returned:** Verifies `createScenarist()` called twice returns same object reference
2. **Prevents DuplicateScenarioError:** Without singleton, second call would throw when re-registering scenarios
3. **Shared registry:** Both instances see same scenarios
4. **Shared store:** Scenario switches visible across instances
5. **First config wins:** Subsequent calls with different config return first instance (config ignored)

**Key Learning:** Tests for custom configs needed `clearAllGlobals()` before each test:

```typescript
const clearAllGlobals = () => {
  delete (global as any).__scenarist_instance;
  delete (global as any).__scenarist_registry;
  delete (global as any).__scenarist_store;
  delete (global as any).__scenarist_msw_started;
};

it('should respect custom header name from config', () => {
  clearAllGlobals(); // ✅ CRITICAL - allows fresh instance with different config
  const scenarist = createScenarist({
    enabled: true,
    scenarios: testScenarios,
    headers: { testId: 'x-custom-test-id' },
  });
  // Test custom config works...
});
```

**Result:** Test count 25 (up from 20), all passing.

### Authoritative Sources

**Next.js Module Duplication:**
- [GitHub Discussion #68572](https://github.com/vercel/next.js/discussions/68572) - Canonical approach to singletons in Next.js
- Root cause: Next.js bundling can duplicate modules across chunks, breaking Node.js module caching
- Solution: Use `globalThis` or `global` to ensure single instance across all chunks

**Key Quote from Discussion:**
> "globalThis.instance = globalThis.instance || { db: new DBConnection() }"
>
> This technique ensures that despite multiple bundled copies of your singleton file, all references point to the same memory location through the global object.

### Why Scenarist Handles This For You

**The Problem Next.js Users Face:**
- Module duplication is non-obvious framework-specific behavior
- Requires understanding Next.js bundling internals
- Easy to forget and causes confusing errors
- Every library/application needs to implement same pattern

**How Scenarist Solves It:**
- ✅ Singleton guard built into adapter (`createScenarist()`)
- ✅ Users just `export const scenarist = createScenarist(...)`
- ✅ No global variable management in application code
- ✅ Works correctly out-of-the-box

**Anti-Pattern Prevented:**
```typescript
// ❌ WRONG - Function wrapper breaks singleton
export function getScenarist() {
  return createScenarist({ enabled: true, scenarios });
}
// Each call creates new MSW server → handler conflicts!
```

**Correct Pattern:**
```typescript
// ✅ CORRECT - Adapter handles singleton internally
export const scenarist = createScenarist({ enabled: true, scenarios });
// Module duplication? No problem - adapter returns same instance
```

### Files Modified

**Core Package:**
- `packages/core/src/domain/response-selector.ts:89` - Simplified condition to `>=`
- `packages/core/tests/response-selector.test.ts` - Added sequence fallback test

**Next.js Adapter:**
- `packages/nextjs-adapter/src/app/setup.ts` - Added `__scenarist_instance` singleton guard
- `packages/nextjs-adapter/tests/app/app-setup.test.ts` - Added 5 singleton tests + clearAllGlobals

**Application:**
- `apps/nextjs-app-router-example/lib/scenarist.ts` - Removed app-level singleton (adapter handles it)

### Key Lessons

1. **Singleton Logic Belongs in Adapter Layer**
   - Infrastructure concerns → adapter responsibility
   - Application code stays simple
   - Prevents boilerplate across all applications
   - Hexagonal architecture enforced

2. **TDD is Non-Negotiable - Even for "Simple" Code**
   - Singleton guard seemed simple → skipped tests
   - PR review caught the violation
   - Had to retroactively add tests (costly)
   - Lesson: NO code without tests, no exceptions

3. **Test Isolation Requires Cleanup**
   - Singletons persist across test runs
   - Must explicitly clear globals between tests
   - Without cleanup: tests interfere with each other
   - Pattern: `clearAllGlobals()` helper in each describe block

4. **Framework Quirks Should Be Hidden From Users**
   - Next.js module duplication is confusing
   - Most users don't understand Next.js bundling internals
   - Libraries should handle framework-specific issues
   - Good API: works correctly by default

5. **Document Edge Cases with Authoritative Sources**
   - Link to official discussions/issues
   - Explain WHY the pattern exists
   - Show what problems it prevents
   - Users trust official sources more than library docs

### Related Issue: Client-Side MSW + HMR

**Note:** There's a **separate** but related Next.js + MSW singleton issue: [MSW Examples PR #101](https://github.com/mswjs/examples/pull/101/files#diff-8c12b389f7663528d803c57e6fe92f1635c6bbeafcf9d1b3d069d8b31fc88471R5-R12)

**Their Problem:** Client-side MSW + HMR (Hot Module Replacement) = duplicate browser workers during development

**Our Problem:** Server-side MSW + module duplication = duplicate Node.js servers (dev and production)

**Different Contexts:**
- MSW PR: Browser worker, HMR re-imports, development only
- Scenarist: Node.js server, module chunk duplication, all environments

**Why Not Link in Public Docs:**
- Different problem (client vs server)
- Different cause (HMR vs bundling)
- Would confuse users about what Scenarist solves

**Key Takeaway:** MSW + Next.js has multiple singleton challenges depending on context. Scenarist specifically solves the server-side module duplication issue for App Router testing.
## Next.js Pages Router: MSW with getServerSideProps - Complete Investigation

**Date:** 2025-11-12
**Status:** Under Investigation - Root Cause Identified
**Context:** Implementing Playwright tests for Next.js Pages Router with getServerSideProps calling external APIs directly

### Background

The goal is to prove MSW can intercept external API calls made from getServerSideProps in Next.js Pages Router, similar to how it works with App Router (React Server Components). The test should verify that tier-based pricing works when getServerSideProps fetches directly from `http://localhost:3001/products`.

### Expected Behavior

**What should happen:**
1. Playwright test navigates to `/?tier=premium`
2. Next.js runs getServerSideProps on the server
3. getServerSideProps extracts `tier` query param and adds `'x-user-tier': 'premium'` header
4. Fetches from `http://localhost:3001/products` with premium tier header
5. MSW intercepts the request
6. MSW matches against premiumUserScenario mock (specificity > 0)
7. Returns premium pricing: Product A £99.99, Product B £149.99, Product C £79.99
8. Page renders with premium prices

### Actual Behavior

**What's actually happening:**
1. Playwright test navigates to `/?tier=premium`
2. Page loads and products render
3. BUT products show STANDARD pricing: Product A £149.99, Product B £199.99, Product C £99.99
4. Test fails expecting £99.99 but sees £149.99

### Root Cause Analysis

#### Investigation Timeline

**Step 1: Manual Testing**
Created `/tmp/test-msw.sh` to test with curl:
```bash
curl -s -H "x-test-id: test-premium" -H "x-user-tier: premium" "http://localhost:3000/?tier=premium" | grep -o "£[0-9.]\+"
```

**Result:** ✅ SUCCESS - Returns £99.99 (premium pricing)

**Conclusion:** MSW CAN intercept getServerSideProps fetches. The issue is Playwright-specific.

**Step 2: Examined Playwright Error Context**
Playwright's error-context.md shows the page snapshot:
```yaml
- article [ref=e26]:
  - generic [ref=e31]: £149.99   ← STANDARD price (expected £99.99)
  - generic [ref=e32]: standard   ← STANDARD tier
- article [ref=e34]:
  - generic [ref=e39]: £199.99   ← STANDARD price (expected £149.99)
  - generic [ref=e40]: standard   ← STANDARD tier
- article [ref=e42]:
  - generic [ref=e47]: £99.99    ← STANDARD price (expected £79.99)
  - generic [ref=e48]: standard   ← STANDARD tier
```

**Key Finding:** Products ARE rendering, but with STANDARD pricing instead of PREMIUM pricing.

**Step 3: Traced Scenario Configuration**

Examined `lib/scenarios.ts`:

**Default Scenario (always active):**
```typescript
export const defaultScenario: ScenaristScenario = {
  id: "default",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {  // Fallback with NO match criteria (specificity = 0)
        status: 200,
        body: { products: buildProducts("standard") },
      },
    },
  ],
};
```

**Premium User Scenario (NOT active in test):**
```typescript
export const premiumUserScenario: ScenaristScenario = {
  id: "premiumUser",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {  // WITH match criteria (specificity = 1)
        headers: { "x-user-tier": "premium" },
      },
      response: {
        status: 200,
        body: { products: buildProducts("premium") },
      },
    },
  ],
};
```

**Step 4: Analyzed Test Code**

The failing test:
```typescript
test('should render premium products server-side', async ({ page }) => {
  // DON'T switch scenarios - rely on automatic default fallback + header matching
  // Default scenario is active, premium mock matches via x-user-tier header

  console.log('[TEST] Testing premium products WITHOUT explicit scenario switch');
  console.log('[TEST] Relying on automatic default fallback + header matching');

  await page.goto('/?tier=premium');

  const firstProduct = page.getByRole('article').first();
  await expect(firstProduct.getByText('£99.99')).toBeVisible();
});
```

**Critical Issue:** Test does NOT switch to premiumUserScenario!

### THE ROOT CAUSE

**The test has a fundamental misunderstanding of how automatic default fallback works.**

**How Automatic Default Fallback Actually Works:**
1. When you switch to scenario X, MSW collects mocks from BOTH:
   - Default scenario (collected first)
   - Scenario X (collected second)
2. Specificity-based selection chooses the best match
3. Specific mocks (with match criteria) override fallback mocks

**What the test is doing:**
1. NOT switching scenarios
2. Only default scenario is active
3. Default scenario only has standard pricing fallback (no match criteria)
4. No premium mock exists in active scenario collection
5. MSW returns standard pricing

**What the test THINKS it's doing:**
- Expecting ALL scenarios to be merged automatically
- Expecting premium mock to be available without switching
- Misunderstanding "automatic default fallback" as "all scenarios always active"

**Why manual curl works:**
```bash
curl -H "x-test-id: test-premium" ...
```
The `-H "x-test-id: test-premium"` header likely triggers scenario switching via some other mechanism (not shown in test code), which activates premiumUserScenario.

### Pricing Reference

**Premium Prices (buildProducts("premium")):**
- Product A (id=1): £99.99
- Product B (id=2): £149.99
- Product C (id=3): £79.99

**Standard Prices (buildProducts("standard")):**
- Product A (id=1): £149.99
- Product B (id=2): £199.99
- Product C (id=3): £99.99

**Test expectation:** Product A £99.99 (premium)
**Actual result:** Product A £149.99 (standard)

### Solution Options

#### Option 1: Switch to Premium Scenario (Recommended)

```typescript
test('should render premium products server-side', async ({ page, switchScenario }) => {
  // Switch to premiumUserScenario FIRST
  await switchScenario(page, 'premiumUser');

  // Now navigate - automatic default fallback will combine:
  // - Default scenario mocks (collected first)
  // - Premium scenario mocks (collected second, includes premium match)
  await page.goto('/?tier=premium');

  const firstProduct = page.getByRole('article').first();
  await expect(firstProduct.getByText('£99.99')).toBeVisible();
});
```

**Why this works:**
- Explicitly activates premiumUserScenario
- Automatic default fallback combines default + premium mocks
- Premium mock has specificity 1 (header match)
- Default mock has specificity 0 (no match)
- Specificity-based selection chooses premium mock

#### Option 2: Merge Premium Mock into Default Scenario

```typescript
export const defaultScenario: ScenaristScenario = {
  id: "default",
  mocks: [
    // Specific match for premium tier (specificity = 1)
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {
        headers: { "x-user-tier": "premium" },
      },
      response: {
        status: 200,
        body: { products: buildProducts("premium") },
      },
    },
    // Fallback for all other requests (specificity = 0)
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {
        status: 200,
        body: { products: buildProducts("standard") },
      },
    },
  ],
};
```

**Why this works:**
- Both mocks always present in default scenario
- No scenario switching needed
- Specificity-based selection chooses premium when header matches
- Falls back to standard when header doesn't match

**Trade-off:** Defeats the purpose of having separate scenarios. Better for simple use cases.

### Files Involved

**Test file:**
- `/apps/nextjs-pages-router-example/tests/playwright/products-server-side.spec.ts`

**Scenario definitions:**
- `/apps/nextjs-pages-router-example/lib/scenarios.ts`

**Product data:**
- `/apps/nextjs-pages-router-example/data/products.ts`

**getServerSideProps implementation:**
- `/apps/nextjs-pages-router-example/pages/index.tsx:178-220`

**MSW setup:**
- `/apps/nextjs-pages-router-example/lib/scenarist.ts` (auto-start)
- `/apps/nextjs-pages-router-example/tests/playwright/globalSetup.ts` (Playwright config)

**Manual test script:**
- `/tmp/test-msw.sh`

### Key Learnings

1. **Automatic Default Fallback ≠ All Scenarios Active**
   - Only applies when you switch to a specific scenario
   - Combines default + active scenario mocks
   - Does NOT merge all scenarios automatically

2. **Scenario Switching is Required**
   - Tests must explicitly switch to target scenario
   - Cannot rely on all mocks being available by default
   - Use `switchScenario(page, 'scenarioId')` before navigation

3. **Manual curl vs Playwright**
   - Manual curl with explicit headers can bypass scenario system
   - Playwright tests must follow scenario switching protocol
   - Different behavior because different entry points

4. **MSW IS Working**
   - Manual test proves MSW intercepts getServerSideProps fetches
   - Issue is test configuration, not MSW functionality
   - Architectural pattern is sound

5. **Specificity-Based Selection is Correct**
   - Premium mock (specificity 1) should override standard fallback (specificity 0)
   - But only if premium mock is in the active scenario collection
   - No mock = falls back to next available mock

### Next Steps

1. ✅ **Root cause identified** - Test not switching to premiumUserScenario
2. ⏳ **Fix test** - Add `switchScenario(page, 'premiumUser')` before navigation
3. ⏳ **Verify fix** - Confirm test passes with premium pricing
4. ⏳ **Update test comments** - Correct misunderstanding about automatic fallback
5. ⏳ **Document pattern** - Add to testing guidelines for Pages Router

### Architectural Validation

**This investigation VALIDATES the architectural decisions:**

✅ **MSW CAN intercept getServerSideProps fetches** - Proven by manual test
✅ **Specificity-based selection works correctly** - Premium > Standard when both present
✅ **Automatic default fallback works as designed** - Combines default + active scenario
✅ **Test ID isolation works** - Different tests can use different scenarios
✅ **No custom Express server needed** - Standard Next.js with MSW in lib/scenarist.ts
✅ **Dynamic handler pattern works** - Single handler with internal scenario lookup

**The only issue is test configuration, not architecture.**

### Debug Commands

**Run single test:**
```bash
cd apps/nextjs-pages-router-example
pnpm exec playwright test tests/playwright/products-server-side.spec.ts --grep "premium"
```

**Manual test (known working):**
```bash
cd apps/nextjs-pages-router-example
pnpm dev > /tmp/nextjs.log 2>&1 &
PID=$!
sleep 8
curl -s -H "x-test-id: test-premium" -H "x-user-tier: premium" "http://localhost:3000/?tier=premium" | grep -o "£[0-9.]\+" | head -3
kill $PID
```

**Check MSW logs:**
```bash
cat /tmp/nextjs.log | grep -E '\[MSW\]|\[Scenarist\]|\[getServerSideProps\]'
```

**View Playwright error context:**
```bash
find apps/nextjs-pages-router-example/test-results -name "error-context.md" | head -1 | xargs cat
```

### Conclusion

**Status:** Ready to fix
**Action:** Update test to call `switchScenario(page, 'premiumUser')` before `page.goto()`
**Expected outcome:** Test will pass with premium pricing (£99.99)
**Confidence level:** HIGH - Root cause definitively identified and solution validated by manual test

---

## CRITICAL UPDATE (2025-11-12): Pages Router MSW Investigation - Root Cause Found

### Status: BUG IDENTIFIED - Scenario Store Lookup Failing

After capturing server-side logs during Playwright test execution, the root cause has been definitively identified.

### The Bug

**Symptom:** Playwright tests for Next.js Pages Router fail to use switched scenarios, always falling back to default scenario.

**Root Cause:** `manager.getActiveScenario(testId)` returns `undefined` even though the scenario was successfully activated seconds earlier.

### Complete Evidence (from `/tmp/nextjs-server.log`)

**1. Scenario switch succeeds:**
```
[Scenario Endpoint POST] Scenario is now active for test ID: 7303a536b19f9ee3cc0a...
POST /api/__scenario__ 200 in 204ms
```

**2. Headers propagate correctly:**
```
[getServerSideProps] headers: { 'x-test-id': '7303a536b19f9ee3cc0a...', 'x-user-tier': 'premium' }
[getServerSideProps] tier param: premium
```

**3. MSW intercepts but fails scenario lookup:**
```
[MSW] testId extracted: 7303a536b19f9ee3cc0a...
[MSW] activeScenario: undefined  ← THE BUG
[MSW] scenarioId to use: default
[MSW] Number of mocks to evaluate: 1  ← Should be 2 (default + premiumUser)
```

### What's Working

- ✅ Scenario switch endpoint (POST /__scenario__ returns 200)
- ✅ Header propagation (testId reaches getServerSideProps)
- ✅ Query params (tier=premium extracted correctly)
- ✅ MSW interception (fetch to localhost:3001 intercepted)
- ✅ Test ID generation (unique UUID generated)

### What's Broken

- ❌ `ScenarioStore.get(testId)` returns undefined
- ❌ Causes MSW to fall back to default scenario
- ❌ Only default mocks evaluated (not default + active)
- ❌ Test sees standard pricing instead of premium

### Hypotheses to Investigate

1. **Store not persisting:** `switchScenario()` might not be calling `store.set()`
2. **TestId mismatch:** Possible whitespace/encoding differences in testId string
3. **Multiple store instances:** Different Next.js processes/workers with separate memory
4. **Race condition:** Unlikely (200ms between switch and fetch)

### Next Debugging Step

Add logging to `InMemoryScenarioStore` to see:
- If `set()` is being called when scenario is switched
- What keys are in the store when `get()` is called
- If testIds match exactly (character-by-character comparison)

### Files Involved

**Investigation documents:**
- `/docs/investigations/next-js-pages-router-msw-investigation.md` - Complete analysis
- `/docs/investigations/next-js-pages-router-status.md` - Current status summary
- `/tmp/nextjs-server.log` - Full server logs showing the bug

**Code to investigate:**
- `packages/core/src/adapters/in-memory-scenario-store.ts` - Store implementation
- `packages/core/src/domain/scenario-manager.ts` - switchScenario() implementation
- `packages/msw-adapter/src/handlers/dynamic-handler.ts` - Where getActiveScenario() is called
- `packages/nextjs-adapter/src/pages/setup.ts` - Next.js wrapper for switchScenario()

### Manual Test (Works)

```bash
curl -s -H "x-test-id: test-premium" -H "x-user-tier: premium" "http://localhost:3000/?tier=premium" | grep "£99.99"
# Returns: £99.99 (premium pricing) ✅
```

**Why manual test works:** Different code path or scenario storage mechanism. Need to compare.

### Key Insight

This is NOT an MSW configuration issue or header propagation issue. The architecture is sound. This is a scenario state management bug in how testId → ActiveScenario mapping is stored/retrieved.
