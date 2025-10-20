# Scenarist: MSW Scenario Management Library - Implementation Plan

## Project Overview

**Scenarist** is a hexagonal architecture library for managing MSW mock scenarios in E2E testing environments, with built-in support for test isolation via test IDs. Perfect for Playwright tests that need to switch between different backend states without restarting the application.

### Key Features
- 🎯 **Test Isolation**: Concurrent tests run with different mock scenarios via test IDs
- 🔄 **Runtime Scenario Switching**: Change mock behavior without restarting your app
- 🏗️ **Hexagonal Architecture**: Framework-agnostic core with adapters for Express, Fastify, etc.
- 📦 **Type-Safe**: Full TypeScript support with strict mode
- 🎭 **Variant System**: Parameterized scenarios for flexible testing
- 🔌 **MSW Integration**: Built on Mock Service Worker for powerful HTTP mocking

### Architecture Philosophy

**Hexagonal Architecture (Ports & Adapters)**
- **Core (The Hexagon)**: Pure TypeScript domain logic, zero framework dependencies
- **Ports**: Interfaces defining contracts for behavior
- **Adapters**: Framework-specific implementations (Express, Fastify, etc.)
- **Type Strategy**:
  - `interface` for ports (behavior contracts to implement)
  - `type` for data (immutable domain structures)

---

## Repository Structure (Turborepo)

```
scenarist/
├── apps/
│   └── docs/                    # Documentation site (future)
├── packages/
│   ├── core/                    # The hexagon - pure domain logic
│   │   ├── src/
│   │   │   ├── domain/          # Business logic implementations
│   │   │   ├── ports/           # Interface definitions (contracts)
│   │   │   └── types/           # Type definitions (data structures)
│   │   ├── tests/
│   │   └── package.json
│   ├── in-memory-store/         # In-memory ScenarioStore adapter
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   ├── express-adapter/         # Express middleware adapter
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   └── playwright-helpers/      # Playwright utility functions (future)
├── examples/
│   ├── express-basic/           # Basic Express + MSW setup
│   └── playwright-e2e/          # Complete E2E testing example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
└── README.md
```

---

## Phase 1: Project Setup (Week 1, ~3-4 hours)

### 1.1 Initialize Turborepo

```bash
npx create-turbo@latest
# Choose: pnpm
# Name: scenarist

cd scenarist
```

### 1.2 Configure Root Files

**`package.json`**
```json
{
  "name": "scenarist",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "turbo": "latest",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4"
  }
}
```

**`turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**`pnpm-workspace.yaml`**
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
  - 'apps/*'
```

**Root `tsconfig.json`**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

### 1.3 Set Up Changesets

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

Edit `.changeset/config.json`:
```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@scenarist/examples-*"]
}
```

---

## Phase 2: Core Package - Types & Ports (Week 1-2, ~5-6 hours)

### 2.1 Create Core Package

```bash
mkdir -p packages/core/src/{domain,ports,types}
mkdir -p packages/core/tests
```

**`packages/core/package.json`**
```json
{
  "name": "@scenarist/core",
  "version": "0.0.0",
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
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "msw": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

**`packages/core/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 2.2 Define Core Types (Data Structures)

**`packages/core/src/types/scenario.ts`**
```typescript
import type { HttpHandler } from 'msw';

/**
 * A scenario represents a complete mock state for testing.
 * Scenarios are immutable data structures.
 */
export type Scenario<TVariant extends string = string, TValue = unknown> = {
  readonly name: string;
  readonly description: string;
  readonly mocks: ReadonlyArray<HttpHandler>;
  readonly devToolEnabled: boolean;
  readonly variants?: Readonly<Record<TVariant, ScenarioVariant<TValue>>>;
};

/**
 * A variant allows parameterization of scenarios.
 * Use variants when you need the same scenario with different data.
 */
export type ScenarioVariant<T = unknown> = {
  readonly name: string;
  readonly description: string;
  readonly value: () => T;
};

/**
 * Represents an active scenario for a specific test ID.
 */
export type ActiveScenario = {
  readonly scenarioId: string;
  readonly scenario: Scenario;
  readonly variant?: {
    readonly name: string;
    readonly meta?: unknown;
  };
};

/**
 * Result type for operations that can fail.
 * Prefer this over throwing exceptions for expected error cases.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
```

**`packages/core/src/types/config.ts`**
```typescript
/**
 * Configuration for the scenario management system.
 * All properties are readonly for immutability.
 */
export type ScenaristConfig = {
  /**
   * Whether mocking is enabled. Can be a boolean or function.
   * Function allows for dynamic enabling (e.g., based on environment).
   */
  readonly enabled: boolean | (() => boolean);

  /**
   * HTTP header names for test isolation and control.
   */
  readonly headers: {
    /** Header name for test ID (default: 'x-test-id') */
    readonly testId: string;
    /** Header name to enable/disable mocks (default: 'x-mock-enabled') */
    readonly mockEnabled: string;
  };

  /**
   * HTTP endpoint paths for scenario control.
   */
  readonly endpoints: {
    /** Endpoint to set/switch scenarios (default: '/__scenario__') */
    readonly setScenario: string;
    /** Endpoint to get current scenario (default: '/__scenario__') */
    readonly getScenario: string;
  };

  /**
   * The default scenario ID to use when none is specified.
   */
  readonly defaultScenario: string;

  /**
   * The default test ID to use when no x-test-id header is present.
   */
  readonly defaultTestId: string;
};

/**
 * Partial config for user input - missing values will use defaults.
 */
export type ScenaristConfigInput = {
  readonly enabled: boolean | (() => boolean);
  readonly headers?: Partial<ScenaristConfig['headers']>;
  readonly endpoints?: Partial<ScenaristConfig['endpoints']>;
  readonly defaultScenario?: string;
  readonly defaultTestId?: string;
};
```

**`packages/core/src/types/index.ts`**
```typescript
export type {
  Scenario,
  ScenarioVariant,
  ActiveScenario,
  Result,
} from './scenario';

export type {
  ScenaristConfig,
  ScenaristConfigInput,
} from './config';
```

### 2.3 Define Port Interfaces (Behavior Contracts)

**`packages/core/src/ports/scenario-manager.ts`**
```typescript
import type { Scenario, ActiveScenario, Result, ScenarioVariant } from '../types';

/**
 * Primary port for scenario management.
 * This is the main interface for interacting with scenarios.
 *
 * Implementations must be thread-safe for concurrent test execution.
 */
export interface ScenarioManager {
  /**
   * Register a scenario with a unique ID.
   * @throws Error if scenario ID is already registered
   */
  registerScenario(id: string, scenario: Scenario): void;

  /**
   * Switch to a different scenario for a specific test ID.
   * This enables test isolation - different tests can run different scenarios.
   */
  switchScenario(
    testId: string,
    scenarioId: string,
    variant?: { name: string; meta?: unknown }
  ): Result<void, Error>;

  /**
   * Get the currently active scenario for a test ID.
   * Returns undefined if no scenario is active for this test.
   */
  getActiveScenario(testId: string): ActiveScenario | undefined;

  /**
   * List all registered scenarios.
   * Useful for debugging and dev tools.
   */
  listScenarios(): ReadonlyArray<{ id: string; scenario: Scenario }>;

  /**
   * Clear the active scenario for a specific test ID.
   * Useful for cleanup after tests.
   */
  clearScenario(testId: string): void;

  /**
   * Get a registered scenario by ID without activating it.
   */
  getScenarioById(id: string): Scenario | undefined;
}
```

**`packages/core/src/ports/scenario-store.ts`**
```typescript
import type { ActiveScenario } from '../types';

/**
 * Secondary port for scenario storage.
 * Implementations determine where active scenarios are stored.
 *
 * Examples:
 * - InMemoryScenarioStore: Map-based storage (single process)
 * - RedisScenarioStore: Redis-based storage (distributed tests)
 */
export interface ScenarioStore {
  /**
   * Store an active scenario for a test ID.
   */
  set(testId: string, scenario: ActiveScenario): void;

  /**
   * Retrieve an active scenario for a test ID.
   */
  get(testId: string): ActiveScenario | undefined;

  /**
   * Check if a test ID has an active scenario.
   */
  has(testId: string): boolean;

  /**
   * Remove the active scenario for a test ID.
   */
  delete(testId: string): void;

  /**
   * Clear all active scenarios.
   * Use with caution - affects all test IDs.
   */
  clear(): void;
}
```

**`packages/core/src/ports/request-context.ts`**
```typescript
/**
 * Secondary port for extracting context from HTTP requests.
 * Framework adapters implement this to provide test ID and mock control.
 */
export interface RequestContext {
  /**
   * Extract the test ID from the request.
   * This enables test isolation.
   */
  getTestId(): string;

  /**
   * Determine if mocks should be enabled for this request.
   * Allows per-request control of mocking.
   */
  isMockEnabled(): boolean;

  /**
   * Get all request headers.
   * Useful for debugging and logging.
   */
  getHeaders(): Record<string, string | string[] | undefined>;

  /**
   * Get the request hostname.
   * Used to determine passthrough behavior.
   */
  getHostname(): string;
}
```

**`packages/core/src/ports/index.ts`**
```typescript
export type { ScenarioManager } from './scenario-manager';
export type { ScenarioStore } from './scenario-store';
export type { RequestContext } from './request-context';
```

### 2.4 Implement Core Domain Logic (TDD!)

**`packages/core/src/domain/scenario-manager.ts`**
```typescript
import type {
  ScenarioManager,
  ScenarioRegistry,
  ScenarioStore,
} from '../ports';
import type {
  ScenarioDefinition,
  ActiveScenario,
  Result,
  ScenaristConfig,
} from '../types';

class ScenarioNotFoundError extends Error {
  constructor(scenarioId: string) {
    super(`Scenario '${scenarioId}' not found. Did you forget to register it?`);
    this.name = 'ScenarioNotFoundError';
  }
}

/**
 * Factory function to create a ScenarioManager implementation.
 *
 * Follows dependency injection principle - both ScenarioRegistry and
 * ScenarioStore are injected, never created internally.
 *
 * This enables:
 * - Any registry implementation (in-memory, Redis, files, remote)
 * - Any store implementation (in-memory, Redis, database)
 * - Proper testing with mock dependencies
 * - True hexagonal architecture
 */
export const createScenarioManager = ({
  registry,
  store,
  config,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
  config: ScenaristConfig;
}): ScenarioManager => {
  return {
    registerScenario(definition: ScenarioDefinition): void {
      // Delegate to injected registry
      registry.register(definition);
    },

    switchScenario(
      testId: string,
      scenarioId: string,
      variantName?: string,
    ): Result<void, Error> {
      // Business rule: Validate scenario exists in registry
      const definition = registry.get(scenarioId);

      if (!definition) {
        return {
          success: false,
          error: new ScenarioNotFoundError(scenarioId),
        };
      }

      // Store only the reference (serializable)
      const activeScenario: ActiveScenario = {
        scenarioId,
        variantName,
      };

      store.set(testId, activeScenario);

      return { success: true, data: undefined };
    },

    getActiveScenario(testId: string): ActiveScenario | undefined {
      // Delegate to injected store
      return store.get(testId);
    },

    listScenarios(): ReadonlyArray<ScenarioDefinition> {
      // Delegate to injected registry
      return registry.list();
    },

    clearScenario(testId: string): void {
      // Delegate to injected store
      store.delete(testId);
    },

    getScenarioById(id: string): ScenarioDefinition | undefined {
      // Delegate to injected registry
      return registry.get(id);
    },
  };
};
```

**`packages/core/src/domain/config-builder.ts`**
```typescript
import type { ScenaristConfig, ScenaristConfigInput } from '../types';

/**
 * Build a complete config from partial user input.
 * Applies sensible defaults for missing values.
 */
export const buildConfig = (input: ScenaristConfigInput): ScenaristConfig => {
  return {
    enabled: input.enabled,
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

**`packages/core/src/domain/scenario-helpers.ts`**
```typescript
import type { Scenario, ScenarioVariant } from '../types';
import type { HttpHandler } from 'msw';

/**
 * Helper to create scenarios with proper typing.
 * Supports optional variants for parameterized scenarios.
 */
export const createScenario = <TVariant extends string = string, TValue = unknown>(
  scenarioCreator: (variant?: { name: string; meta?: unknown }) => {
    name: string;
    description: string;
    devToolEnabled?: boolean;
    variants?: Record<TVariant, ScenarioVariant<TValue>>;
    mocks: HttpHandler[];
  },
): ((variant?: { name: string; meta?: unknown }) => Scenario<TVariant, TValue>) => {
  return (variant) => {
    const config = scenarioCreator(variant);

    return {
      name: config.name,
      description: config.description,
      devToolEnabled: config.devToolEnabled ?? false,
      variants: config.variants,
      mocks: config.mocks,
    };
  };
};
```

**`packages/core/src/domain/index.ts`**
```typescript
export { createScenarioManager } from './scenario-manager';
export { buildConfig } from './config-builder';
export { createScenario } from './scenario-helpers';
```

**`packages/core/src/index.ts`**
```typescript
// Types (data structures)
export type * from './types';

// Ports (interfaces)
export type * from './ports';

// Domain (implementations)
export * from './domain';
```

### 2.5 Write Tests for Core (TDD Approach)

**`packages/core/vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.ts'],
    },
  },
});
```

**`packages/core/tests/scenario-manager.test.ts`**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioManager } from '../src/domain/scenario-manager';
import { buildConfig } from '../src/domain/config-builder';
import type { ScenarioRegistry, ScenarioStore } from '../src/ports';
import type { ActiveScenario, ScenarioDefinition } from '../src/types';

// In-memory registry for testing (simple Map-based implementation)
const createTestRegistry = (): ScenarioRegistry => {
  const registry = new Map<string, ScenarioDefinition>();

  return {
    register: (definition) => registry.set(definition.id, definition),
    get: (id) => registry.get(id),
    has: (id) => registry.has(id),
    list: () => Array.from(registry.values()),
    unregister: (id) => registry.delete(id),
  };
};

// In-memory store for testing (simple Map-based implementation)
const createTestStore = (): ScenarioStore => {
  const store = new Map<string, ActiveScenario>();

  return {
    set: (testId, scenario) => store.set(testId, scenario),
    get: (testId) => store.get(testId),
    has: (testId) => store.has(testId),
    delete: (testId) => store.delete(testId),
    clear: () => store.clear(),
  };
};

// Test scenario definition factory
const createTestScenarioDefinition = (
  id: string,
  name: string = 'Test Scenario'
): ScenarioDefinition => ({
  id,
  name,
  description: `Description for ${name}`,
  devToolEnabled: false,
  mocks: [
    {
      method: 'GET',
      url: 'https://api.example.com/test',
      response: {
        status: 200,
        body: { message: 'mocked' },
      },
    },
  ],
});

describe('ScenarioManager', () => {
  let registry: ScenarioRegistry;
  let store: ScenarioStore;
  let manager: ReturnType<typeof createScenarioManager>;

  beforeEach(() => {
    registry = createTestRegistry();
    store = createTestStore();
    const config = buildConfig({
      enabled: true,
      defaultScenario: 'default',
    });

    // Inject both registry and store
    manager = createScenarioManager({ registry, store, config });
  });

  describe('registerScenario', () => {
    it('should register a new scenario', () => {
      const definition = createTestScenarioDefinition('happy-path', 'Happy Path');

      manager.registerScenario(definition);

      const registered = manager.getScenarioById('happy-path');
      expect(registered).toEqual(definition);
    });

    it('should delegate to registry', () => {
      const definition = createTestScenarioDefinition('test', 'Test');

      manager.registerScenario(definition);

      expect(registry.has('test')).toBe(true);
    });
  });

  describe('switchScenario', () => {
    it('should switch to a registered scenario for a test ID', () => {
      const definition = createTestScenarioDefinition('error-state', 'Error State');
      manager.registerScenario(definition);

      const result = manager.switchScenario('test-123', 'error-state');

      expect(result.success).toBe(true);
      const active = manager.getActiveScenario('test-123');
      expect(active?.scenarioId).toBe('error-state');
    });

    it('should return error when switching to unregistered scenario', () => {
      const result = manager.switchScenario('test-123', 'non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should support scenario variants', () => {
      const definition = createTestScenarioDefinition('with-variant', 'With Variant');
      manager.registerScenario(definition);

      const result = manager.switchScenario('test-123', 'with-variant', 'premium-user');

      expect(result.success).toBe(true);
      const active = manager.getActiveScenario('test-123');
      expect(active?.variantName).toBe('premium-user');
    });

    it('should isolate scenarios by test ID', () => {
      const definition1 = createTestScenarioDefinition('scenario-1', 'Scenario 1');
      const definition2 = createTestScenarioDefinition('scenario-2', 'Scenario 2');

      manager.registerScenario(definition1);
      manager.registerScenario(definition2);

      manager.switchScenario('test-A', 'scenario-1');
      manager.switchScenario('test-B', 'scenario-2');

      const activeA = manager.getActiveScenario('test-A');
      const activeB = manager.getActiveScenario('test-B');

      expect(activeA?.scenarioId).toBe('scenario-1');
      expect(activeB?.scenarioId).toBe('scenario-2');
    });

    it('should store only reference not full definition', () => {
      const definition = createTestScenarioDefinition('test', 'Test');
      manager.registerScenario(definition);

      manager.switchScenario('test-123', 'test', 'variant-1');

      const active = store.get('test-123');
      expect(active).toEqual({
        scenarioId: 'test',
        variantName: 'variant-1',
      });
    });
  });

  describe('getActiveScenario', () => {
    it('should return undefined when no scenario is active', () => {
      const active = manager.getActiveScenario('test-123');

      expect(active).toBeUndefined();
    });

    it('should delegate to store', () => {
      const definition = createTestScenarioDefinition('test', 'Test');
      manager.registerScenario(definition);
      manager.switchScenario('test-123', 'test');

      const active = manager.getActiveScenario('test-123');

      expect(store.get('test-123')).toEqual(active);
    });
  });

  describe('listScenarios', () => {
    it('should list all registered scenarios', () => {
      manager.registerScenario(createTestScenarioDefinition('scenario-1', 'Scenario 1'));
      manager.registerScenario(createTestScenarioDefinition('scenario-2', 'Scenario 2'));

      const scenarios = manager.listScenarios();

      expect(scenarios).toHaveLength(2);
      expect(scenarios.map(s => s.id)).toEqual(['scenario-1', 'scenario-2']);
    });

    it('should return empty array when no scenarios registered', () => {
      const scenarios = manager.listScenarios();

      expect(scenarios).toEqual([]);
    });

    it('should delegate to registry', () => {
      manager.registerScenario(createTestScenarioDefinition('test', 'Test'));

      const scenarios = manager.listScenarios();

      expect(scenarios).toEqual(registry.list());
    });
  });

  describe('clearScenario', () => {
    it('should clear active scenario for a test ID', () => {
      const definition = createTestScenarioDefinition('test', 'Test');
      manager.registerScenario(definition);
      manager.switchScenario('test-123', 'test');

      manager.clearScenario('test-123');

      const active = manager.getActiveScenario('test-123');
      expect(active).toBeUndefined();
    });

    it('should not affect other test IDs when clearing', () => {
      const definition = createTestScenarioDefinition('test', 'Test');
      manager.registerScenario(definition);
      manager.switchScenario('test-A', 'test');
      manager.switchScenario('test-B', 'test');

      manager.clearScenario('test-A');

      expect(manager.getActiveScenario('test-A')).toBeUndefined();
      expect(manager.getActiveScenario('test-B')).toBeDefined();
    });

    it('should delegate to store', () => {
      const definition = createTestScenarioDefinition('test', 'Test');
      manager.registerScenario(definition);
      manager.switchScenario('test-123', 'test');

      manager.clearScenario('test-123');

      expect(store.has('test-123')).toBe(false);
    });
  });
});
```

**`packages/core/tests/config-builder.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { buildConfig } from '../src/domain/config-builder';

describe('buildConfig', () => {
  it('should apply default values for missing config', () => {
    const config = buildConfig({
      enabled: true,
    });

    expect(config.headers.testId).toBe('x-test-id');
    expect(config.headers.mockEnabled).toBe('x-mock-enabled');
    expect(config.endpoints.setScenario).toBe('/__scenario__');
    expect(config.endpoints.getScenario).toBe('/__scenario__');
    expect(config.defaultScenario).toBe('default');
    expect(config.defaultTestId).toBe('default-test');
  });

  it('should allow overriding default values', () => {
    const config = buildConfig({
      enabled: true,
      headers: {
        testId: 'x-custom-test-id',
        mockEnabled: 'x-custom-mock',
      },
      endpoints: {
        setScenario: '/api/scenario/set',
        getScenario: '/api/scenario/get',
      },
      defaultScenario: 'happy-path',
      defaultTestId: 'my-test',
    });

    expect(config.headers.testId).toBe('x-custom-test-id');
    expect(config.headers.mockEnabled).toBe('x-custom-mock');
    expect(config.endpoints.setScenario).toBe('/api/scenario/set');
    expect(config.endpoints.getScenario).toBe('/api/scenario/get');
    expect(config.defaultScenario).toBe('happy-path');
    expect(config.defaultTestId).toBe('my-test');
  });

  it('should support function for enabled property', () => {
    const config = buildConfig({
      enabled: () => process.env.NODE_ENV !== 'production',
    });

    expect(typeof config.enabled).toBe('function');
  });
});
```

---

## Phase 3: In-Memory Store Adapter (Week 2, ~2-3 hours)

### 3.1 Create Package

```bash
mkdir -p packages/in-memory-store/src
mkdir -p packages/in-memory-store/tests
```

**`packages/in-memory-store/package.json`**
```json
{
  "name": "@scenarist/in-memory-store",
  "version": "0.0.0",
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
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@scenarist/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "msw": "^2.0.0"
  }
}
```

**`packages/in-memory-store/src/index.ts`**
```typescript
import type { ScenarioStore } from '@scenarist/core';
import type { ActiveScenario } from '@scenarist/core';

/**
 * In-memory implementation of ScenarioStore using a Map.
 * Suitable for single-process testing.
 *
 * For distributed testing across multiple processes,
 * use a Redis-based store instead.
 */
export class InMemoryScenarioStore implements ScenarioStore {
  private readonly store = new Map<string, ActiveScenario>();

  set(testId: string, scenario: ActiveScenario): void {
    this.store.set(testId, scenario);
  }

  get(testId: string): ActiveScenario | undefined {
    return this.store.get(testId);
  }

  has(testId: string): boolean {
    return this.store.has(testId);
  }

  delete(testId: string): void {
    this.store.delete(testId);
  }

  clear(): void {
    this.store.clear();
  }
}
```

**`packages/in-memory-store/tests/in-memory-store.test.ts`**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryScenarioStore } from '../src';
import type { ActiveScenario } from '@scenarist/core';
import { http, HttpResponse } from 'msw';

const createTestActiveScenario = (id: string): ActiveScenario => ({
  scenarioId: id,
  scenario: {
    name: `Scenario ${id}`,
    description: 'Test scenario',
    devToolEnabled: false,
    mocks: [
      http.get('https://api.example.com/test', () => {
        return HttpResponse.json({ message: 'test' });
      }),
    ],
  },
});

describe('InMemoryScenarioStore', () => {
  let store: InMemoryScenarioStore;

  beforeEach(() => {
    store = new InMemoryScenarioStore();
  });

  it('should store and retrieve scenarios', () => {
    const scenario = createTestActiveScenario('test-scenario');

    store.set('test-123', scenario);
    const retrieved = store.get('test-123');

    expect(retrieved).toBe(scenario);
  });

  it('should return undefined for non-existent test ID', () => {
    const retrieved = store.get('non-existent');

    expect(retrieved).toBeUndefined();
  });

  it('should check existence with has', () => {
    const scenario = createTestActiveScenario('test');

    store.set('test-123', scenario);

    expect(store.has('test-123')).toBe(true);
    expect(store.has('other')).toBe(false);
  });

  it('should delete scenarios', () => {
    const scenario = createTestActiveScenario('test');
    store.set('test-123', scenario);

    store.delete('test-123');

    expect(store.has('test-123')).toBe(false);
    expect(store.get('test-123')).toBeUndefined();
  });

  it('should clear all scenarios', () => {
    store.set('test-A', createTestActiveScenario('A'));
    store.set('test-B', createTestActiveScenario('B'));

    store.clear();

    expect(store.has('test-A')).toBe(false);
    expect(store.has('test-B')).toBe(false);
  });

  it('should isolate scenarios by test ID', () => {
    const scenarioA = createTestActiveScenario('A');
    const scenarioB = createTestActiveScenario('B');

    store.set('test-A', scenarioA);
    store.set('test-B', scenarioB);

    expect(store.get('test-A')).toBe(scenarioA);
    expect(store.get('test-B')).toBe(scenarioB);
  });
});
```

---

## Phase 4: Express Adapter (Week 2-3, ~5-6 hours)

### 4.1 Create Package

```bash
mkdir -p packages/express-adapter/src
mkdir -p packages/express-adapter/tests
```

**`packages/express-adapter/package.json`**
```json
{
  "name": "@scenarist/express-adapter",
  "version": "0.0.0",
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
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "express": "^4.0.0",
    "msw": "^2.0.0"
  },
  "dependencies": {
    "@scenarist/core": "workspace:*",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "express": "^4.18.2",
    "msw": "^2.0.0",
    "supertest": "^6.3.3",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

**`packages/express-adapter/src/request-context.ts`**
```typescript
import type { Request } from 'express';
import type { RequestContext, ScenaristConfig } from '@scenarist/core';

/**
 * Express implementation of RequestContext port.
 * Extracts test ID and mock control from Express request.
 */
export class ExpressRequestContext implements RequestContext {
  constructor(
    private readonly req: Request,
    private readonly config: ScenaristConfig,
  ) {}

  getTestId(): string {
    const header = this.req.headers[this.config.headers.testId.toLowerCase()];
    return typeof header === 'string' ? header : this.config.defaultTestId;
  }

  isMockEnabled(): boolean {
    const header = this.req.headers[this.config.headers.mockEnabled.toLowerCase()];
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

**`packages/express-adapter/src/middleware.ts`**
```typescript
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import type { ScenarioManager, ScenaristConfig } from '@scenarist/core';
import { ExpressRequestContext } from './request-context';

const scenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z
    .object({
      name: z.string(),
      meta: z.record(z.unknown()).optional(),
    })
    .optional(),
});

type CreateMiddlewareOptions = {
  manager: ScenarioManager;
  config: ScenaristConfig;
  /**
   * MSW server instance from setupServer()
   */
  mswServer: {
    boundary: (handler: (req: Request, res: Response, next: NextFunction) => void) => void;
    use: (...handlers: unknown[]) => void;
  };
};

/**
 * Creates Express middleware for scenario management.
 *
 * This middleware:
 * 1. Provides endpoints to get/set scenarios
 * 2. Integrates with MSW to apply scenario mocks
 * 3. Supports test isolation via test IDs
 * 4. Allows passthrough when mocks are disabled
 */
export const createScenaristMiddleware = ({
  manager,
  config,
  mswServer,
}: CreateMiddlewareOptions): Router => {
  const router = Router();

  // Check if mocking is enabled
  const isEnabled = typeof config.enabled === 'function'
    ? config.enabled()
    : config.enabled;

  if (!isEnabled) {
    return router;
  }

  // Endpoint: POST /__scenario__ (set scenario)
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

  // Endpoint: GET /__scenario__ (get current scenario)
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

    return res.status(200).json({
      testId,
      scenarioId: activeScenario.scenarioId,
      scenarioName: activeScenario.scenario.name,
      variant: activeScenario.variant,
    });
  });

  // MSW integration - apply mocks for active scenarios
  router.all('*', mswServer.boundary((req, res, next) => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();

    // Passthrough if mocks disabled for this request
    if (!context.isMockEnabled() && context.getHostname() !== 'localhost') {
      // Note: passthrough implementation depends on MSW version
      return next();
    }

    const activeScenario = manager.getActiveScenario(testId);

    if (activeScenario) {
      mswServer.use(...activeScenario.scenario.mocks);
    }

    next();
  }));

  return router;
};
```

**`packages/express-adapter/src/index.ts`**
```typescript
export { createScenaristMiddleware } from './middleware';
export { ExpressRequestContext } from './request-context';
```

**`packages/express-adapter/tests/middleware.test.ts`**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  createScenarioManager,
  buildConfig,
  createScenario,
  type ScenarioManager,
  type ScenaristConfig,
} from '@scenarist/core';
import { InMemoryScenarioStore } from '@scenarist/in-memory-store';
import { createScenaristMiddleware } from '../src';

describe('Express Middleware Integration', () => {
  let app: Express;
  let manager: ScenarioManager;
  let config: ScenaristConfig;
  let server: ReturnType<typeof setupServer>;

  beforeEach(() => {
    // Set up MSW server
    server = setupServer();
    server.listen({ onUnhandledRequest: 'bypass' });

    // Set up scenario manager
    const store = new InMemoryScenarioStore();
    config = buildConfig({
      enabled: true,
      defaultScenario: 'default',
    });
    manager = createScenarioManager(store, config);

    // Register test scenarios
    const happyPath = createScenario(() => ({
      name: 'Happy Path',
      description: 'All requests succeed',
      mocks: [
        http.get('https://api.example.com/data', () => {
          return HttpResponse.json({ message: 'success' });
        }),
      ],
    }))();

    const errorState = createScenario(() => ({
      name: 'Error State',
      description: 'All requests fail',
      mocks: [
        http.get('https://api.example.com/data', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        }),
      ],
    }))();

    manager.registerScenario('happy-path', happyPath);
    manager.registerScenario('error-state', errorState);

    // Set up Express app
    app = express();
    app.use(express.json());
    app.use(createScenaristMiddleware({
      manager,
      config,
      mswServer: server as any
    }));

    // Test route
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  });

  afterEach(() => {
    server.close();
  });

  describe('POST /__scenario__ (set scenario)', () => {
    it('should set scenario for a test ID', async () => {
      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 'happy-path' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.scenario).toBe('happy-path');
      expect(response.body.testId).toBe('test-123');
    });

    it('should return 400 for non-existent scenario', async () => {
      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 'non-existent' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not found');
    });

    it('should support scenario variants', async () => {
      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({
          scenario: 'happy-path',
          variant: { name: 'premium', meta: { tier: 'premium' } },
        });

      expect(response.status).toBe(200);
      expect(response.body.variant.name).toBe('premium');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ invalid: 'body' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid request body');
    });
  });

  describe('GET /__scenario__ (get current scenario)', () => {
    it('should return active scenario for test ID', async () => {
      // First set a scenario
      await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 'happy-path' });

      // Then get it
      const response = await request(app)
        .get('/__scenario__')
        .set('x-test-id', 'test-123');

      expect(response.status).toBe(200);
      expect(response.body.scenarioId).toBe('happy-path');
      expect(response.body.scenarioName).toBe('Happy Path');
      expect(response.body.testId).toBe('test-123');
    });

    it('should return 404 when no scenario is active', async () => {
      const response = await request(app)
        .get('/__scenario__')
        .set('x-test-id', 'test-999');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No active scenario');
    });
  });

  describe('Test ID isolation', () => {
    it('should isolate scenarios by test ID', async () => {
      // Set different scenarios for different test IDs
      await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-A')
        .send({ scenario: 'happy-path' });

      await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-B')
        .send({ scenario: 'error-state' });

      // Verify isolation
      const responseA = await request(app)
        .get('/__scenario__')
        .set('x-test-id', 'test-A');

      const responseB = await request(app)
        .get('/__scenario__')
        .set('x-test-id', 'test-B');

      expect(responseA.body.scenarioId).toBe('happy-path');
      expect(responseB.body.scenarioId).toBe('error-state');
    });
  });
});
```

---

## Phase 5: Documentation (Week 3-4, ~4 hours)

### 5.1 Root README.md

Create compelling README with:
- Clear value proposition
- Quick start (< 5 minutes to working example)
- Architecture diagram (use Mermaid or ASCII)
- Installation instructions
- Basic usage example
- Links to detailed docs
- Contributing guidelines
- License

### 5.2 ARCHITECTURE.md

Document:
- Hexagonal architecture principles and benefits
- Why interfaces for ports, types for data
- Package structure explanation
- How to create custom adapters (with examples)
- Extension points and patterns
- Design decisions and rationale

### 5.3 API.md

Comprehensive API documentation:
- All port interfaces with examples
- All type definitions
- Configuration options
- Helper functions
- Return types and error handling
- Migration guides

### 5.4 CONTRIBUTING.md

Development guide:
- Development setup instructions
- TDD workflow (RED → GREEN → REFACTOR)
- Code style guidelines
- Testing requirements
- PR process
- Code review expectations

---

## Phase 6: GitHub Actions & CI/CD (Week 4-5, ~2-3 hours)

### 6.1 Continuous Integration

**`.github/workflows/ci.yml`**
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm run typecheck

      - name: Lint
        run: pnpm run lint

      - name: Run tests
        run: pnpm run test

      - name: Build packages
        run: pnpm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
```

### 6.2 Automated Releases

**`.github/workflows/release.yml`**
```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm run build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Phase 7: Release Preparation (Week 5-6, ~2-3 hours)

### 7.1 Pre-Release Checklist

- [ ] All tests passing (>90% coverage)
- [ ] All packages build successfully
- [ ] Documentation complete and reviewed
- [ ] Examples working and documented
- [ ] npm package name reserved (`scenarist` or chosen name)
- [ ] Security review complete (no secrets, vulnerabilities)
- [ ] License file in place (MIT recommended)
- [ ] README has clear value proposition
- [ ] CONTRIBUTING.md complete
- [ ] CODE_OF_CONDUCT.md in place

### 7.2 Publishing to npm

1. **Reserve package names:**
   ```bash
   npm search scenarist
   npm search @scenarist/core
   ```

2. **Set up npm authentication:**
   ```bash
   npm login
   # Add NPM_TOKEN to GitHub secrets
   ```

3. **Create first changeset:**
   ```bash
   pnpm changeset
   # Choose "minor" for first release
   # Add description: "Initial release of scenarist"
   ```

4. **Version packages:**
   ```bash
   pnpm changeset version
   # This updates package.json versions
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "chore: version packages for v0.1.0"
   git push
   ```

6. **Publish to npm:**
   ```bash
   pnpm run release
   # Or let GitHub Actions handle this
   ```

### 7.3 Post-Release

1. **Create GitHub release:**
   - Tag: v0.1.0
   - Release notes from changelog
   - Mark as "pre-release" if alpha/beta

2. **Update README badges:**
   - npm version
   - npm downloads
   - Build status
   - Code coverage
   - License

---

## Promotion Strategy

### Launch Week

**Day 1: Blog Post**
- Publish on Dev.to, Medium, or your blog
- Title: "Introducing Scenarist: Type-Safe Scenario Management for Playwright Tests"
- Include: Problem statement, solution, quick example, architecture benefits

**Day 2-3: Social Media**
- Twitter/X with relevant hashtags: #typescript #testing #playwright #msw
- LinkedIn post for professional network
- Reddit posts:
  - r/javascript
  - r/node
  - r/typescript
  - r/playwright

**Day 4: Community Submissions**
- Submit to awesome-testing
- Submit to awesome-playwright
- Post on Hacker News (if confident)
- Post on Lobste.rs

**Day 5-7: Engage**
- Respond to all comments/questions
- Address any issues quickly
- Gather feedback for v0.2.0

### Content Ideas

**Blog Posts:**
1. "Why Hexagonal Architecture for a Testing Library"
2. "Testing E2E Applications with Isolated Mock Scenarios"
3. "From Monolith to Modular: Extracting Scenarist"
4. "Type-Safe Mocking: Interfaces vs Types in Library Design"

**Video Content:**
- Quick start tutorial (5 min)
- Architecture deep dive (15 min)
- Building a custom adapter (10 min)

---

## Success Metrics

### First Month Targets

**Adoption:**
- ⭐ GitHub stars: 50+
- 📦 npm downloads: 500+/week
- 🐛 Issues opened: 10+ (shows engagement)
- 👥 Contributors: 2+ (besides you)

**Quality:**
- ✅ Test coverage: 90%+
- 📖 Documentation: 100% API coverage
- ⚡ Issue response: <48h average
- 🔄 PR review: <72h average

### Three Month Targets

**Growth:**
- ⭐ GitHub stars: 200+
- 📦 npm downloads: 2000+/week
- 💬 Discord/discussion activity
- 🌍 International adoption

**Ecosystem:**
- 🔌 2+ community adapters
- 📦 Integration examples for popular frameworks
- 📚 3+ blog posts by community
- 🎤 Conference talk opportunity

---

## Future Roadmap

### v1.1-1.3 (Framework Adapters)
- **v1.1:** Fastify adapter
- **v1.2:** Koa adapter
- **v1.3:** Hono adapter (emerging framework)

### v2.0 (Distributed Testing)
- Redis-based ScenarioStore for distributed scenarios
- Scenario recording/replay from real traffic
- Visual scenario debugger UI
- Next.js App Router support

### v3.0 (Advanced Features)
- AI-powered scenario generation from OpenAPI specs
- Contract testing integration
- Performance regression detection
- Scenario diff and merge tools

---

## Time Investment Summary

### Initial Development (6 weeks)
- **Week 1:** Project setup + Core types/ports (8-10h)
- **Week 2:** Core implementation + In-memory store (7-9h)
- **Week 3:** Express adapter + Examples (5-6h)
- **Week 4:** Documentation (4h)
- **Week 5:** CI/CD + Polish (2-3h)
- **Week 6:** Release + Promotion (2-3h)

**Total: 28-35 hours** at 2-5 hours/week

### Ongoing Maintenance
- **Weekly:** 2-5 hours for:
  - Issue triage and responses
  - PR reviews
  - Bug fixes
  - Community engagement

---

## Key Architecture Decisions

### Why Hexagonal Architecture?
✅ **Technology independence** - Core logic works with any framework
✅ **Testability** - Test domain logic without HTTP/framework overhead
✅ **Clear boundaries** - Ports define explicit contracts
✅ **Extensibility** - New adapters don't affect existing code
✅ **Future-proof** - Easy to adapt to new technologies

### Why Interfaces for Ports?
✅ **Implementation signal** - Clear contract to implement
✅ **Better TypeScript errors** - Clearer messages when implementing
✅ **Declaration merging** - Users can augment if needed
✅ **Hexagonal convention** - Ports are traditionally interfaces
✅ **Class-friendly** - Some users prefer classes for adapters

### Why Types for Data?
✅ **Immutability** - Aligns with functional programming principles
✅ **Composition** - Better for unions, intersections, mapped types
✅ **Computed types** - Can use advanced TypeScript features
✅ **Functional feel** - Data is just data, not behavior
✅ **Readonly by default** - Prevents accidental mutations

### Why Serializable Scenario Definitions?
✅ **Storage flexibility** - Can be stored in Redis, databases, files, or remote APIs
✅ **Distribution** - Enable distributed testing across multiple processes
✅ **Version control** - Scenarios can be committed as JSON/YAML files
✅ **Port viability** - ScenarioRegistry/Store ports can have multiple implementations
✅ **MSW independence** - Core types don't depend on MSW's non-serializable HttpHandler

**The Problem:**
Originally, scenarios contained MSW's `HttpHandler` type, which includes functions, closures, and regex patterns. This made scenarios impossible to serialize, meaning:
- ❌ ScenarioRegistry could ONLY be in-memory
- ❌ ScenarioStore could ONLY be in-memory
- ❌ No Redis, databases, files, or remote scenarios
- ❌ The ports were architectural theater - only one implementation possible

**The Solution:**
Separate serializable **definitions** from runtime **handlers**:

```typescript
// ✅ SERIALIZABLE - Can be stored anywhere
type ScenarioDefinition = {
  readonly id: string;
  readonly name: string;
  readonly mocks: ReadonlyArray<MockDefinition>; // Plain data
};

type MockDefinition = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly url: string; // String pattern, not regex
  readonly response: {
    readonly status: number;
    readonly body?: unknown; // JSON-serializable
    readonly headers?: Record<string, string>;
    readonly delay?: number;
  };
};

// At runtime: MockDefinitions → MSW HttpHandlers
const createHandler = (mock: MockDefinition): HttpHandler => {
  return http[mock.method.toLowerCase()](mock.url, async () => {
    if (mock.response.delay) await delay(mock.response.delay);
    return HttpResponse.json(mock.response.body, {
      status: mock.response.status,
      headers: mock.response.headers,
    });
  });
};
```

**Benefits:**
- ScenarioRegistry can be Redis, DB, files, or remote
- ScenarioStore can be Redis for distributed tests
- Scenarios can be version controlled as JSON
- MSW is isolated to runtime only
- Ports are genuinely useful with multiple implementations

### Why Turborepo?
✅ **Build caching** - Faster builds and tests
✅ **Parallel execution** - Run tasks across packages concurrently
✅ **Simple setup** - Less complex than Nx for this scale
✅ **Package management** - Clean workspace structure
✅ **Growing ecosystem** - Active development and support

### Why TDD Throughout?
✅ **Confidence** - Every feature is tested
✅ **Design feedback** - Tests reveal design issues early
✅ **Documentation** - Tests document expected behavior
✅ **Regression prevention** - Changes don't break existing features
✅ **Refactoring safety** - Change internals without fear

---

## Risk Mitigation

### Risk: MSW API Changes
**Mitigation:**
- Pin to MSW v2.x in peer dependencies
- Abstract MSW-specific code behind ports
- Monitor MSW releases for breaking changes
- Maintain compatibility layer if needed

### Risk: Low Adoption
**Mitigation:**
- Focus on documentation quality first
- Create compelling real-world examples
- Solve a specific pain point well
- Engage with Playwright/MSW communities early
- Be responsive to early adopters

### Risk: Maintenance Burden
**Mitigation:**
- Keep initial scope small and focused
- Write excellent contributor documentation
- Set up automated releases and CI/CD
- Be transparent about time availability
- Consider co-maintainers after v1.0

### Risk: Breaking Changes Needed
**Mitigation:**
- Start at v0.x to signal API instability
- Use semantic versioning strictly
- Provide migration guides for all breaking changes
- Deprecate before removing when possible
- Gather feedback before major changes

### Risk: Security Issues
**Mitigation:**
- Regular dependency updates (Dependabot)
- Security audit before each release
- SECURITY.md with reporting process
- Quick response to security reports
- Minimize dependencies where possible

---

## Getting Started Today

### Immediate Next Steps

1. **Initialize Repository:**
   ```bash
   npx create-turbo@latest
   cd scenarist
   git init
   git add .
   git commit -m "chore: initialize turborepo"
   ```

2. **Create Core Package:**
   ```bash
   mkdir -p packages/core/src/{types,ports,domain}
   # Copy type definitions from this plan
   ```

3. **Write First Test (TDD!):**
   ```bash
   # Create packages/core/tests/scenario-manager.test.ts
   # Write failing test for scenario registration
   # Implement just enough to make it pass
   ```

4. **Set Up CI:**
   ```bash
   mkdir -p .github/workflows
   # Copy ci.yml from this plan
   git add .
   git commit -m "ci: add GitHub Actions workflow"
   ```

5. **Document as You Go:**
   ```bash
   # Keep ARCHITECTURE.md updated
   # Document decisions in comments
   # Update README with progress
   ```

---

## Conclusion

This plan provides a complete roadmap for extracting and open sourcing your mocking mechanism as a professional, maintainable library. The hexagonal architecture ensures long-term flexibility, the TDD approach guarantees quality, and the Turborepo setup enables scalable development.

**Remember:**
- Follow TDD strictly (RED → GREEN → REFACTOR)
- Commit frequently with meaningful messages
- Document decisions as you make them
- Test coverage >90% is non-negotiable
- Engage with early adopters actively

Good luck with **Scenarist**! 🎭

---

*This implementation plan created: 2025-10-20*
*Estimated total effort: 28-35 hours over 6 weeks*
*Maintenance commitment: 2-5 hours/week*
