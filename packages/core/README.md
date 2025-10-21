# @scenarist/core

The core domain logic for Scenarist - a hexagonal architecture library for managing MSW mock scenarios in integration testing.

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
- Defined with `interface` keyword
- Contracts that adapters must implement
- Examples: `ScenarioManager`, `ScenarioStore`, `RequestContext`

**Domain (Implementations):**
- Pure TypeScript functions and factory patterns
- No framework dependencies
- Implements the core business logic

## Current Status

**Phase 1: Initial Setup** ✅
- Type definitions created
- Port interfaces defined
- Directory structure established
- TypeScript and Vitest configured

**Phase 2: Domain Implementation** ✅
- Implemented `createScenarioManager()` with dependency injection
- Implemented `buildConfig()` helper with defaults
- Implemented `InMemoryScenarioRegistry` adapter
- Implemented `InMemoryScenarioStore` adapter
- 50 tests passing with 100% coverage
- TypeScript strict mode enforced

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

// 1. Build configuration (all properties serializable)
const config = buildConfig({
  enabled: process.env.NODE_ENV !== 'production', // Evaluated first!
  strictMode: false,  // true = error on unmocked requests, false = passthrough
  headers: {
    testId: 'x-test-id',
    mockEnabled: 'x-mock-enabled',
  },
});

// 2. Create adapters (dependency injection)
const registry = new InMemoryScenarioRegistry();
const store = new InMemoryScenarioStore();

// 3. Create scenario manager
const manager = createScenarioManager({ registry, store });

// 4. Define scenarios (serializable definitions)
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
        body: { users: [] },
      },
    },
  ],
};

// 5. Register and activate scenarios
manager.registerScenario(happyPathScenario);
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

## Contributing

Follow the TDD workflow:
1. **RED**: Write a failing test
2. **GREEN**: Write minimum code to pass
3. **REFACTOR**: Improve code structure

See the root `CLAUDE.md` for detailed development guidelines.
