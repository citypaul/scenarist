# @scenarist/core

The core domain logic for Scenarist - a framework-agnostic library for managing MSW mock scenarios in E2E testing environments.

## What is Scenarist?

**Scenarist** enables concurrent E2E tests to run with different backend states by switching mock scenarios at runtime via test IDs. No application restarts needed, no complex per-test mocking, just simple scenario switching.

**Problem it solves:**

Testing multiple backend states (success, errors, loading, edge cases) traditionally requires:
- Restarting your app for each scenario
- Complex per-test MSW handler setup
- Serial test execution to avoid conflicts
- Brittle mocks duplicated across test files

**Scenarist's solution:**

Define scenarios once, switch at runtime via HTTP calls, run tests in parallel with complete isolation.

```typescript
// Define once
const errorScenario = { id: 'error', mocks: [{ method: 'GET', url: '*/api/*', response: { status: 500 } }] };

// Switch instantly
await switchScenario('test-1', 'error'); // Test 1 sees errors
await switchScenario('test-2', 'success'); // Test 2 sees success (parallel!)

// Tests run concurrently with different backend states
```

## Why Use Scenarist?

**Runtime Scenario Switching**
- Change entire backend state with one API call
- No server restarts between tests
- Instant feedback during development

**True Parallel Testing**
- 100+ tests run concurrently with different scenarios
- Each test ID has isolated scenario state
- No conflicts, no serialization needed

**Reusable Scenarios**
- Define scenarios once, use across all tests
- Version control your mock scenarios
- Share scenarios across teams

**Framework-Agnostic Core**
- Zero framework dependencies
- Works with Express, Fastify, Next.js, Remix, any framework
- Hexagonal architecture enables custom adapters

**Type-Safe & Tested**
- TypeScript strict mode throughout
- 100% test coverage
- Immutable, serializable data structures

## Architecture

This package contains the **hexagon** - pure TypeScript domain logic with zero framework dependencies (except MSW types).

### Package Structure

```
src/
├── types/       # Data structures (use `type` with `readonly`)
├── ports/       # Interfaces (use `interface` for behavior contracts)
├── domain/      # Business logic implementations
└── index.ts     # Public API exports
```

### Hexagonal Architecture Principles

**Types (Data Structures):**
- Defined with `type` keyword
- All properties are `readonly` for immutability
- Must be serializable (no functions, closures, or class instances)
- Examples: `ScenarioDefinition`, `ScenaristConfig`, `ActiveScenario`, `MockDefinition`

**Ports (Behavior Contracts):**
- Defined with `interface` keyword (domain ports) or `type` keyword (adapter contracts)
- Contracts that adapters must implement
- Domain ports: `ScenarioManager`, `ScenarioStore`, `RequestContext`
- Adapter contract: `ScenaristAdapter<TMiddleware>`, `BaseAdapterOptions`

**Domain (Implementations):**
- Pure TypeScript functions and factory patterns
- No framework dependencies
- Implements the core business logic

## Core Capabilities

Scenarist provides 20+ powerful features for E2E testing. All capabilities are framework-agnostic and available via any adapter (Express, Next.js, etc.).

### Request Matching (6 capabilities)

**1. Body matching (partial match)**
- Match requests based on request body fields
- Additional fields in request are ignored
- Perfect for testing different payload scenarios

**2. Header matching (exact match, case-insensitive)**
- Match requests based on header values
- Header names are case-insensitive
- Ideal for user tier testing (`x-user-tier: premium`)

**3. Query parameter matching (exact match)**
- Match requests based on query string parameters
- Enables different responses for filtered requests

**4. Combined matching (all criteria together)**
- Combine body + headers + query parameters
- ALL criteria must pass for mock to apply

**5. Specificity-based selection**
- Most specific mock wins regardless of position
- Calculated score: body fields + headers + query params
- No need to carefully order your mocks

**6. Fallback mocks**
- Mocks without match criteria act as catch-all
- Specific mocks always take precedence
- Perfect for default responses

### Response Sequences (4 capabilities)

**7. Single responses**
- Return same response every time
- Simplest mock definition

**8. Response sequences (ordered)**
- Return different response on each call
- Perfect for polling APIs (pending → processing → complete)

**9. Repeat modes (last, cycle, none)**
- `last`: Stay at final response forever
- `cycle`: Loop back to first response
- `none`: Mark as exhausted after last response

**10. Sequence exhaustion with fallback**
- Exhausted sequences (`repeat: none`) skip to next mock
- Enables rate limiting scenarios

### Stateful Mocks (6 capabilities)

**11. State capture from requests**
- Extract values from request body, headers, or query
- Store in per-test-ID state

**12. State injection via templates**
- Inject captured state into responses using `{{state.X}}`
- Dynamic responses based on earlier requests

**13. Array append support**
- Syntax: `stateKey[]` appends to array
- Perfect for shopping cart scenarios

**14. Nested state paths**
- Support dot notation: `user.profile.name`
- Both capture and injection support nesting

**15. State isolation per test ID**
- Each test ID has isolated state
- Parallel tests don't interfere

**16. State reset on scenario switch**
- State cleared when switching scenarios
- Fresh state for each scenario

### Core Features (4 capabilities)

**17. Multiple API mocking**
- Mock any number of external APIs
- Combine APIs in single scenario

**18. Default scenario fallback**
- Unmocked endpoints fall back to default scenario
- Define baseline responses once

**19. Test ID isolation (parallel tests)**
- Run 100+ tests concurrently
- Each test ID has isolated scenario/state

**20. Scenario switching at runtime**
- Change backend state with one HTTP call
- No application restart needed

### Additional Features

**21. Path parameters** (`/users/:id`)
**22. Wildcard URLs** (`*/api/*`)
**23. Response delays** (simulate slow networks)
**24. Custom headers** in responses
**25. Strict mode** (fail on unmocked requests)

## Current Status

**All Core Features Implemented** ✅

- ✅ **Phase 1: Request Content Matching** - Body/headers/query matching with specificity-based selection
- ✅ **Phase 2: Response Sequences** - Ordered sequences with repeat modes (last/cycle/none)
- ✅ **Phase 3: Stateful Mocks** - State capture, injection, reset on scenario switch
- ✅ **Integration**: Used by Express, Next.js, MSW adapters
- ✅ **Total: 281 tests passing** across all packages with 100% coverage

## Installation

This package is part of the Scenarist monorepo. Install dependencies from the root:

```bash
pnpm install
```

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm typecheck
```

## Usage

### Basic Setup

```typescript
import {
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  buildConfig,
  type ScenarioDefinition,
} from '@scenarist/core';

// 1. Define scenarios (serializable definitions)
const defaultScenario: ScenarioDefinition = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Baseline mocks for all APIs',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.example.com/users',
      response: {
        status: 200,
        body: { users: [] },
      },
    },
  ],
};

const happyPathScenario: ScenarioDefinition = {
  id: 'happy-path',
  name: 'Happy Path',
  description: 'All API calls succeed',
  devToolEnabled: true,
  mocks: [
    {
      method: 'GET',
      url: 'https://api.example.com/users',
      response: {
        status: 200,
        body: { users: [{ id: 1, name: 'Test User' }] },
      },
    },
  ],
};

// 2. Build configuration (all properties serializable)
const config = buildConfig({
  enabled: process.env.NODE_ENV !== 'production', // Evaluated first!
  defaultScenario: defaultScenario, // REQUIRED - fallback for unmocked requests
  strictMode: false,  // true = error on unmocked requests, false = passthrough
  headers: {
    testId: 'x-test-id',
    mockEnabled: 'x-mock-enabled',
  },
});

// 3. Create adapters (dependency injection)
const registry = new InMemoryScenarioRegistry();
const store = new InMemoryScenarioStore();

// 4. Create scenario manager
const manager = createScenarioManager({ registry, store });

// 5. Register scenarios
manager.registerScenario(defaultScenario); // Must register default
manager.registerScenario(happyPathScenario);

// 6. Switch to a scenario
const result = manager.switchScenario('test-123', 'happy-path');

if (result.success) {
  console.log('Scenario activated!');
}
```

### Key Principles

- **Serialization**: All types must be JSON-serializable (no functions!)
- **Dependency Injection**: Ports are injected, never created internally
- **Immutability**: All data structures use `readonly`
- **Factory Pattern**: Use `createScenarioManager()`, not classes

## Adapter Contract

The core package defines a **universal adapter contract** that all framework adapters (Express, Fastify, Next.js, etc.) must implement. This ensures consistent API across all frameworks.

### BaseAdapterOptions

All adapters must accept these base options:

```typescript
type BaseAdapterOptions<T extends ScenariosObject> = {
  readonly enabled: boolean;
  readonly scenarios: T;  // REQUIRED - scenarios object (all scenarios registered upfront)
  readonly defaultScenarioId: keyof T;  // REQUIRED - ID of default scenario for fallback
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
  readonly registry?: ScenarioRegistry;
  readonly store?: ScenarioStore;
  readonly stateManager?: StateManager;
  readonly sequenceTracker?: SequenceTracker;
};
```

Adapters can extend this with framework-specific options:

```typescript
// Express adapter
type ExpressAdapterOptions<T extends ScenariosObject> = BaseAdapterOptions<T> & {
  // Add Express-specific options if needed
};

// Next.js adapter
type NextJSAdapterOptions<T extends ScenariosObject> = BaseAdapterOptions<T> & {
  // Add Next.js-specific options if needed
};
```

### ScenaristAdapter<T, TMiddleware>

All adapters must return an object matching this contract:

```typescript
type ScenaristAdapter<T extends ScenariosObject, TMiddleware = unknown> = {
  readonly config: ScenaristConfig;  // Resolved configuration
  readonly middleware?: TMiddleware;  // Framework-specific middleware (optional - Next.js doesn't have global middleware)
  readonly switchScenario: (testId: string, scenarioId: ScenarioIds<T>, variant?: string) => Result<void, Error>;
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;
  readonly getScenarioById: (scenarioId: ScenarioIds<T>) => ScenarioDefinition | undefined;
  readonly listScenarios: () => ReadonlyArray<ScenarioDefinition>;
  readonly clearScenario: (testId: string) => void;
  readonly start: () => void;
  readonly stop: () => Promise<void>;
};
```

The generic parameters:
- `T extends ScenariosObject`: The scenarios object type for type-safe scenario IDs
- `TMiddleware`: Framework-specific middleware type

Examples:
- Express: `ScenaristAdapter<typeof scenarios, Router>`
- Next.js: `ScenaristAdapter<typeof scenarios, never>` (no global middleware)

### Implementation Example

```typescript
// Express adapter implementation
export const createScenarist = <T extends ScenariosObject>(
  options: ExpressAdapterOptions<T>
): ScenaristAdapter<T, Router> => {
  // Implementation automatically wires:
  // - MSW server with dynamic handler
  // - Test ID middleware
  // - Scenario endpoints
  // - Scenario manager
  // - Registers all scenarios from scenarios object

  // Register all scenarios upfront
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  return {
    config: resolvedConfig,
    middleware: router,  // Express Router
    switchScenario: (id, scenario, variant) => manager.switchScenario(id, scenario, variant),
    // ... all other required methods
    start: () => server.listen(),
    stop: async () => server.close(),
  };
};
```

### Benefits

1. **TypeScript Enforcement**: Adapters must implement the full contract
2. **Consistent API**: All adapters work the same way from user perspective
3. **Framework Flexibility**: Each adapter can add framework-specific features
4. **Future-Proof**: New frameworks can be added with guaranteed API consistency

## Contributing

Follow the TDD workflow:
1. **RED**: Write a failing test
2. **GREEN**: Write minimum code to pass
3. **REFACTOR**: Improve code structure

See the root `CLAUDE.md` for detailed development guidelines.
