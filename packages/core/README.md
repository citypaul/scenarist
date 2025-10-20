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
- Examples: `Scenario`, `ScenaristConfig`, `ActiveScenario`

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

**Phase 2: Domain Implementation** 🚧 (Next)
- Implement `createScenarioManager()`
- Implement `buildConfig()`
- Implement `createScenario()` helper

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

```typescript
import type { Scenario, ScenarioManager } from '@scenarist/core';

// Types and interfaces are exported for use in adapters
```

Full usage documentation will be available once domain implementations are complete.

## Contributing

Follow the TDD workflow:
1. **RED**: Write a failing test
2. **GREEN**: Write minimum code to pass
3. **REFACTOR**: Improve code structure

See the root `CLAUDE.md` for detailed development guidelines.
