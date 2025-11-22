# CLAUDE.md

This file provides guidance to Claude Code when working with this repository. For detailed implementation history and architectural deep-dives, see the linked documentation.

## Project Overview

**Scenarist** is a hexagonal architecture library for MSW-based mock scenarios in E2E testing. It enables concurrent tests with different backend states via test IDs, allowing runtime scenario switching without application restarts.

**Status:** Production-ready v1.0 candidate. 314 tests passing across all packages with 100% coverage. TypeScript strict mode enforced throughout.

**Key Capabilities:**
- Runtime scenario switching (no app restarts)
- Test ID isolation (concurrent tests with different states)
- Request content matching (body/headers/query/regex)
- Response sequences (polling, state machines)
- Stateful mocks (capture/inject state)
- Production tree-shaking (0kb in production bundles)

## Architecture Quick Reference

**Hexagonal (Ports & Adapters):** Core domain has zero framework dependencies. Adapters translate between frameworks and core.

```
User App → Adapter (Express/Next.js) → Core (Domain Logic) → Ports (Interfaces) → Implementations
```

**Key Principles:**
- Ports = `interface` (behavior contracts)
- Types = `type` with `readonly` (data structures)
- Schemas = Zod at trust boundaries (validation)
- Dependency Injection throughout (ports injected, never created internally)

**For details:** See [Hexagonal Architecture Guide](docs/architecture/hexagonal-architecture.md) and ADR-0011 (Domain Constants Location).

## Essential Commands

```bash
# Build all packages
pnpm build

# Run tests (all packages)
pnpm test

# Run tests in watch mode
cd packages/core && pnpm test:watch

# Type check
pnpm check-types

# Lint
pnpm lint

# Build/test specific package
pnpm build --filter=@scenarist/core
pnpm test --filter=@scenarist/express-adapter
```

## TDD Requirements (NON-NEGOTIABLE)

Every line of production code must be written in response to a failing test.

**RED → GREEN → REFACTOR:**
1. **RED:** Write failing test for desired behavior
2. **GREEN:** Write minimum code to pass
3. **REFACTOR:** Assess if refactoring adds value (commit before refactoring)

**Git history must show TDD compliance.** For detailed workflow, see [TDD Process Guide](docs/workflow/tdd-process.md).

**Common violations to avoid:**
- Writing production code without failing test first
- Speculative code ("just in case" logic)
- Batching multiple tests before making first pass
- Skipping refactoring assessment

## Critical Patterns

### 1. Declarative Over Imperative (ADR-0013, ADR-0016)

Scenario definitions must be **declarative patterns**, not imperative functions.

```typescript
// ✅ CORRECT - Declarative
{
  match: { headers: { 'x-tier': 'premium' } },
  response: { status: 200, body: { tier: 'premium' } }
}

// ❌ WRONG - Imperative
{
  shouldMatch: (req) => req.headers['x-tier'] === 'premium',  // Function!
  respond: (req) => ({ status: 200, body: { tier: 'premium' } })
}
```

**Why:** Declarative = inspectable, composable, testable. Imperative = hidden logic, not analyzable.

**Allowed patterns:**
- Primitives, objects, arrays
- Native RegExp (ADR-0016)
- Template strings
- Match criteria objects

**Not allowed:**
- Functions with closures
- Callbacks
- Side effects

### 2. Dependency Injection (Always)

Domain logic must NEVER create port implementations internally.

```typescript
// ✅ CORRECT - Ports injected
export const createScenarioManager = ({
  registry,  // Injected
  store,     // Injected
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
}): ScenarioManager => {
  return {
    registerScenario(def) {
      registry.register(def);  // Use injected port
    }
  };
};

// ❌ WRONG - Creating implementation internally
export const createScenarioManager = ({
  store,
}: {
  store: ScenarioStore;
}): ScenarioManager => {
  const registry = new Map();  // ❌ Hardcoded implementation!
  // ...
};
```

### 3. Test Isolation via Factory Functions

Never use `let` or `beforeEach` in tests. Use factory functions for fresh state.

```typescript
// ✅ CORRECT
const createTestSetup = () => ({
  registry: createTestRegistry(),
  store: createTestStore(),
  manager: createScenarioManager({ registry, store }),
});

it('does something', () => {
  const { manager } = createTestSetup();  // Fresh state
  // ...
});

// ❌ WRONG
let manager: ScenarioManager;
beforeEach(() => {
  manager = createScenarioManager(...);  // Shared mutable state
});
```

### 4. Schemas Belong in Core (Never Adapters)

Schemas define domain validation rules → always in core, never duplicated in adapters.

```typescript
// ✅ CORRECT
// packages/core/src/schemas/scenario-requests.ts
export const ScenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});

// ✅ CORRECT - Adapters import from core
// packages/express-adapter/src/endpoints.ts
import { ScenarioRequestSchema } from '@scenarist/core';

// ❌ WRONG - Schema defined in adapter
const scenarioRequestSchema = z.object({...});  // Duplication!
```

**See ADR-0011** for domain constants location guidance.

## Critical Anti-Patterns

### Top 10 to Avoid

1. **No `any` types** - Use `unknown` if type truly unknown
2. **No type assertions** without justification - `as Type` indicates type system failure
3. **No data mutation** - Arrays: use `[...arr, item]` not `arr.push(item)`. Objects: use `{...obj, key: val}` not `obj.key = val`
4. **No `let` in tests** - Use factory functions for test data
5. **No imperative functions in scenarios** - Use declarative patterns only
6. **No port creation in domain** - Always inject dependencies
7. **No schemas in adapters** - Schemas belong in core
8. **No nested if/else** - Use early returns or guard clauses
9. **No comments** - Code should be self-documenting through naming
10. **No production code without failing test** - TDD is non-negotiable

## Architectural Decision Records (ADRs)

### When to Consult ADRs

**Scenario Definitions:**
- ADR-0013: Why scenarios must be declarative (not functions)
- ADR-0016: Native RegExp support in declarative patterns
- ADR-0001: Why scenarios must be serializable (historical context)

**Testing Strategy:**
- ADR-0003: Four-layer testing approach (when to mock vs real dependencies)
- ADR-0006: When adapters can use real framework dependencies (thin adapter exception - rare!)
- ADR-0004: Why composition tests aren't needed (orthogonal features)

**API Design:**
- ADR-0008: Type-safe scenario IDs via upfront registration
- ADR-0009: Upfront scenario registration vs on-demand
- ADR-0010: Default scenario key convention (`'default'` enforced)
- ADR-0007: Framework-specific header helpers (why adapters differ)

**State Management:**
- ADR-0005: Sequence/state reset on scenario switch (idempotency)
- ADR-0012: Template replacement returns undefined for missing state
- ADR-0015: Sequences preferred over referer routing hacks

**Domain Organization:**
- ADR-0011: Where to put domain constants (core vs adapters)
- ADR-0014: Build-time variant generation analysis

**Decision Tree - "Where should this go?"**
```
Is it a scenario definition concern?
├─ YES → Check ADR-0013 (declarative), ADR-0016 (RegExp), ADR-0001 (serializable)
└─ NO → Is it about testing?
    ├─ YES → Check ADR-0003 (testing layers), ADR-0006 (thin adapters)
    └─ NO → Is it about state/sequences?
        ├─ YES → Check ADR-0005 (reset), ADR-0012 (templates), ADR-0015 (sequences)
        └─ NO → Is it about API design?
            ├─ YES → Check ADR-0008 (type-safe IDs), ADR-0009 (registration), ADR-0010 (default)
            └─ NO → Check ADR-0011 (domain organization)
```

**Full ADR catalog:** See [docs/adrs/README.md](docs/adrs/README.md)

## Package Structure

```
packages/
├── core/                    # The hexagon (zero framework deps)
│   ├── src/ports/           # Interfaces (use `interface`)
│   ├── src/types/           # Data structures (use `type` + `readonly`)
│   ├── src/schemas/         # Zod schemas (validation at trust boundaries)
│   ├── src/domain/          # Business logic
│   └── src/adapters/        # Default implementations (InMemory*)
├── msw-adapter/             # MSW integration (framework-agnostic)
├── express-adapter/         # Express middleware
├── nextjs-adapter/          # Next.js App/Pages Router
├── playwright-helpers/      # Playwright test utilities
├── eslint-config/           # Shared linting
└── typescript-config/       # Shared TypeScript config

apps/
├── express-example/         # Express app with E2E tests
├── nextjs-app-router-example/  # Next.js App Router example
├── nextjs-pages-router-example/ # Next.js Pages Router example
└── docs/                    # Documentation site (Astro/Starlight)
```

## Production Tree-Shaking

Each adapter has `production.ts` with zero imports → 100% elimination in production bundles.

**Conditional exports pattern:**
```json
{
  "exports": {
    ".": {
      "production": "./dist/setup/production.js",  // Returns undefined
      "default": "./dist/index.js"                 // Full implementation
    }
  }
}
```

**Verification:**
```bash
! grep -rE '(setupWorker|HttpResponse\.json)' dist/
```

**Why core doesn't need production.ts:** When adapter has production.ts, core is never imported. Conditional exports are package-scoped, not transitive.

**For details:** See [Production Tree-Shaking Investigation](docs/implementation-history/production-tree-shaking.md)

## TypeScript Configuration

**Non-negotiable:**
- `strict: true` everywhere (including tests)
- No `any` types (use `unknown`)
- No `@ts-ignore` without justification
- `noUnusedLocals`, `noUnusedParameters`: `true`

**Type vs Interface:**
- Data structures: `type` with `readonly`
- Behavior contracts (ports): `interface`

## Current Status & Next Steps

**Completed:**
- ✅ Core packages with 100% test coverage
- ✅ Express adapter with production tree-shaking
- ✅ Next.js adapters (App Router + Pages Router)
- ✅ Dynamic response system (matching, sequences, state)
- ✅ Production safety (tree-shaking verified)

**Next (Production Readiness):**
- ⏳ Set up Changesets workflow
- ⏳ Publish v1.0 to npm
- ⏳ Performance benchmarking
- ⏳ Security audit

**For detailed roadmap:** See [Production Readiness Assessment](docs/production-readiness-assessment.md)

## Implementation History

Detailed implementation learnings have been moved to preserve context efficiency. See:

- [Implementation History Index](docs/implementation-history/README.md) - Chronological implementation phases
- [Architecture Deep-Dives](docs/architecture/) - Hexagonal architecture, declarative patterns, DI
- [Investigations](docs/investigations/) - MSW behavior, Next.js quirks, tree-shaking analysis
- [Migrations](docs/migrations/) - API migration guides

## Key Files Reference

- **CLAUDE.md** (this file) - Quick reference for Claude Code
- **README.md** - User-facing project README
- **turbo.json** - Turborepo task pipeline
- **pnpm-workspace.yaml** - Workspace packages
- **docs/adrs/** - Architectural Decision Records
- **docs/production-readiness-assessment.md** - v1.0 readiness checklist
