# Hexagonal Architecture in Scenarist

## Overview

Scenarist uses hexagonal architecture (ports & adapters pattern) to remain completely framework-agnostic. The core domain has zero framework dependencies and communicates through well-defined interfaces.

## Structure

```
┌──────────────────────────────────────────────────┐
│              User Application                     │
└──────────────┬───────────────────────────────────┘
               │ imports
               ↓
┌──────────────────────────────────────────────────┐
│         Adapter (Express/Next.js)                 │
│  - Framework-specific integration                 │
│  - Middleware, request context                    │
│  - Translates between framework and core          │
└──────────────┬───────────────────────────────────┘
               │ depends on
               ↓
┌──────────────────────────────────────────────────┐
│         Core Domain (The Hexagon)                 │
│  - Zero framework dependencies                    │
│  - Pure TypeScript business logic                 │
│  - Defines ports (interfaces)                     │
│  - Domain: ScenarioManager, ResponseSelector      │
└──────────────┬───────────────────────────────────┘
               │ uses
               ↓
┌──────────────────────────────────────────────────┐
│         Ports (Interfaces)                        │
│  - ScenarioRegistry                               │
│  - ScenarioStore                                  │
│  - StateManager                                   │
│  - SequenceTracker                                │
│  - ResponseSelector                               │
└──────────────┬───────────────────────────────────┘
               │ implemented by
               ↓
┌──────────────────────────────────────────────────┐
│         Implementations                           │
│  - InMemoryScenarioRegistry                       │
│  - InMemoryScenarioStore                          │
│  - InMemoryStateManager                           │
│  - InMemorySequenceTracker                        │
│  - (Future: RedisStore, PostgresRegistry, etc.)   │
└──────────────────────────────────────────────────┘
```

## Key Principles

### 1. Dependency Direction

Dependencies flow INWARD only:

- Adapters depend on Core (✅)
- Core depends on Ports (✅)
- Ports have no dependencies (✅)
- Core NEVER depends on adapters (❌)

### 2. Port Definition

**Use `interface` for ports:**

```typescript
// ✅ CORRECT
export interface ScenarioStore {
  get(testId: string): ActiveScenario | undefined;
  set(testId: string, scenario: ActiveScenario): void;
  delete(testId: string): void;
}
```

**Use `type` for data:**

```typescript
// ✅ CORRECT
export type ActiveScenario = {
  readonly scenarioId: string;
  readonly variantName?: string;
};
```

### 3. Dependency Injection

Domain logic NEVER creates implementations. All ports are injected:

```typescript
// ✅ CORRECT
export const createScenarioManager = ({
  registry,
  store,
  stateManager,
  sequenceTracker,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
  stateManager: StateManager;
  sequenceTracker: SequenceTracker;
}): ScenarioManager => {
  // Use injected ports, never create them
};
```

### 4. Adapter Responsibilities

Adapters translate between frameworks and core:

**Express Adapter:**

- Extract test ID from request headers
- Provide Express middleware
- Create scenario control endpoints
- Handle AsyncLocalStorage context

**Next.js Adapter:**

- Extract test ID from Next.js request objects
- Handle App Router vs Pages Router differences
- Provide Next.js-specific helpers
- Manage singleton instances (Next.js module duplication)

**MSW Adapter:**

- Convert scenario definitions to MSW handlers
- Implement dynamic handler with fallback
- Match requests against active scenarios

## Package Structure

```
packages/core/
├── src/
│   ├── ports/           # Interfaces (behavior contracts)
│   │   ├── driven/      # Ports driven BY domain
│   │   │   ├── scenario-registry.ts
│   │   │   ├── scenario-store.ts
│   │   │   ├── state-manager.ts
│   │   │   └── sequence-tracker.ts
│   │   └── driving/     # Ports that drive domain
│   │       └── request-context.ts
│   ├── types/           # Data structures
│   │   ├── scenario.ts
│   │   ├── config.ts
│   │   └── result.ts
│   ├── schemas/         # Zod validation
│   │   └── scenario.ts
│   ├── domain/          # Business logic
│   │   ├── scenario-manager.ts
│   │   ├── response-selector.ts
│   │   └── config-builder.ts
│   └── adapters/        # Default implementations
│       ├── in-memory-scenario-registry.ts
│       ├── in-memory-scenario-store.ts
│       ├── in-memory-state-manager.ts
│       └── in-memory-sequence-tracker.ts
```

## Benefits

### 1. Framework Independence

Core logic works with ANY framework:

- Express
- Next.js
- Fastify
- Koa
- Hapi

Just implement a new adapter.

### 2. Testability

Core can be tested with no framework:

```typescript
const registry = createInMemoryScenarioRegistry();
const store = createInMemoryScenarioStore();
const manager = createScenarioManager({ registry, store });

// Pure domain testing, no HTTP needed
```

### 3. Swappable Implementations

Want Redis instead of in-memory?

```typescript
// Just swap the implementation
const store = createRedisScenarioStore({ client });
const manager = createScenarioManager({ registry, store });
```

### 4. Clear Boundaries

Each layer has specific responsibilities:

- Core: Business rules
- Ports: Contracts
- Adapters: Framework integration
- Implementations: Storage/infrastructure

## Anti-Patterns to Avoid

### ❌ Core Importing Adapter

```typescript
// ❌ WRONG
import { ExpressScenarist } from "@scenarist/express-adapter";
```

Core should never know about adapters.

### ❌ Creating Implementations in Domain

```typescript
// ❌ WRONG
export const createScenarioManager = () => {
  const store = new Map(); // Creating implementation!
  // ...
};
```

Always inject ports.

### ❌ Adapter Logic in Core

```typescript
// ❌ WRONG - In core domain
export const extractTestId = (req: Request) => {
  return req.headers["x-scenarist-test-id"]; // Express-specific!
};
```

Framework-specific logic belongs in adapters.

### ❌ Business Logic in Adapters

```typescript
// ❌ WRONG - In Express adapter
export const registerScenario = (scenario) => {
  if (!scenario.mocks.length) {
    // Business rule!
    throw new Error("Scenario must have mocks");
  }
};
```

Business rules belong in core domain.

## Related ADRs

- ADR-0011: Domain Constants Location (where to put shared constants)
- ADR-0003: Testing Strategy (how to test each layer)
- ADR-0006: Thin Adapters Real Integration Tests (when adapters can avoid mocks)

## See Also

- [Dependency Injection Pattern](dependency-injection.md)
- [Declarative Patterns](declarative-patterns.md)
- [Test Isolation](test-isolation.md)
