# ADR-0001: Serializable Scenario Definitions

**Status**: Accepted (Refined by ADR-0013 and ADR-0016)
**Date**: 2025-10-20
**Authors**: Claude Code

> **Note**: This ADR established the foundational principle of using data definitions instead of runtime functions. ADR-0013 (2025-11-14) refined this to emphasize declarative patterns over strict JSON serializability. ADR-0016 (2025-01-16) further refined this by allowing native RegExp objects, recognizing that declarative patterns (not JSON serializability) is the true architectural constraint.

## Context

Scenarist uses hexagonal architecture with ports (interfaces) to abstract storage mechanisms for scenarios. We defined two key ports:

- `ScenarioRegistry`: Manages the catalog of available scenarios
- `ScenarioStore`: Tracks which scenario each test is using

The architectural promise of these ports was that they could have multiple implementations:
- `InMemoryScenarioRegistry` - Fast, for single process
- `RedisScenarioRegistry` - Distributed testing across processes
- `FileSystemScenarioRegistry` - Version control scenarios as JSON/YAML
- `RemoteScenarioRegistry` - Fetch from REST API

However, the initial design made these alternative implementations **impossible**.

## Problem

The initial `Scenario` type contained MSW's `HttpHandler` type:

```typescript
import type { HttpHandler } from 'msw';

type Scenario = {
  readonly name: string;
  readonly description: string;
  readonly mocks: ReadonlyArray<HttpHandler>; // ❌ NOT SERIALIZABLE
  readonly devToolEnabled: boolean;
};
```

`HttpHandler` is not serializable because it contains:
- Functions (request matchers, response resolvers)
- Closures over variables
- Regular expressions
- Methods and class instances

This meant:
- ❌ Cannot store scenarios in Redis (can't serialize functions)
- ❌ Cannot save scenarios to files (JSON.stringify fails on functions)
- ❌ Cannot fetch scenarios from remote APIs (can't send functions over HTTP)
- ❌ Cannot store in databases (functions aren't data)

**The ports were "architectural theater"** - beautiful interfaces that could only ever have one implementation (in-memory). The hexagonal architecture promise was broken.

## Decision

We will **separate serializable scenario definitions from runtime MSW handlers**.

### New Type System

**Serializable Definition Types:**

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type ScenaristResponse = {
  readonly status: number;
  readonly body?: unknown; // Must be JSON-serializable
  readonly headers?: Readonly<Record<string, string>>;
  readonly delay?: number;
};

export type ScenaristMock = {
  readonly method: HttpMethod;
  readonly url: string; // String pattern, not regex
  readonly response: ScenaristResponse;
};

export type ScenaristVariant = {
  readonly name: string;
  readonly description: string;
  readonly data: unknown; // JSON-serializable data, not functions
};

export type ScenaristScenario = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly mocks: ReadonlyArray<ScenaristMock>;
  readonly devToolEnabled: boolean;
  readonly variants?: ReadonlyArray<ScenaristVariant>;
};
```

**ActiveScenario stores only references:**

```typescript
export type ActiveScenario = {
  readonly scenarioId: string;
  readonly variantName?: string;
};
```

### Runtime Conversion

At runtime, `ScenaristMock` instances are converted to MSW `HttpHandler` instances:

```typescript
import { http, HttpResponse, delay } from 'msw';

const toMSWHandler = (definition: ScenaristMock): HttpHandler => {
  const method = definition.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

  return http[method](definition.url, async () => {
    if (definition.response.delay) {
      await delay(definition.response.delay);
    }

    return HttpResponse.json(definition.response.body, {
      status: definition.response.status,
      headers: definition.response.headers,
    });
  });
};
```

### Updated Port Interfaces

```typescript
interface ScenarioRegistry {
  register(definition: ScenaristScenario): void;
  get(id: string): ScenaristScenario | undefined;
  has(id: string): boolean;
  list(): ReadonlyArray<ScenaristScenario>;
  unregister(id: string): void;
}

interface ScenarioStore {
  set(testId: string, active: ActiveScenario): void;
  get(testId: string): ActiveScenario | undefined;
  has(testId: string): boolean;
  delete(testId: string): void;
  clear(): void;
}
```

## Consequences

### Positive

✅ **Ports are genuinely useful** - Multiple implementations are now possible:
   - `InMemoryScenarioRegistry` - Fast, no external dependencies
   - `RedisScenarioRegistry` - Distributed testing across processes
   - `FileSystemScenarioRegistry` - Version control scenarios as JSON/YAML
   - `RemoteScenarioRegistry` - Centralized scenario management
   - `DatabaseScenarioRegistry` - PostgreSQL, MongoDB, etc.

✅ **Scenarios can be version controlled** - Save as JSON/YAML files in git

✅ **Distributed testing enabled** - Share scenarios across processes via Redis

✅ **Clear separation of concerns** - Data (definitions) vs. runtime (handlers)

✅ **MSW independence** - Core types don't directly depend on MSW's runtime types

✅ **Easier testing** - Scenario definitions are pure data, easy to test and mock

### Negative

❌ **Runtime conversion required** - Must convert `ScenaristMock` → `HttpHandler` at runtime

❌ **Limited expressiveness initially** - JSON-based mocks are less flexible than function-based ones (can be addressed with future enhancements like JavaScript-based response templates)

❌ **Breaking change** - Existing code using `Scenario` type must migrate to `ScenaristScenario`

### Neutral

⚖️ **Complexity trade-off** - More types to understand, but clearer boundaries

⚖️ **Two-phase system** - Definitions (storage) + Handlers (runtime) instead of one type

## Alternatives Considered

### Alternative 1: Keep HttpHandler, Only Support In-Memory

**Decision**: Rejected

**Rationale**: This would make the ports useless and break the hexagonal architecture promise. The whole point of ports is to enable multiple implementations.

### Alternative 2: Custom Serialization for Functions

**Decision**: Rejected

**Rationale**: Serializing JavaScript functions is fragile, insecure (eval required), and doesn't work across language boundaries. Would make remote/DB implementations brittle and dangerous.

### Alternative 3: Code Generation from OpenAPI/Swagger

**Decision**: Deferred to future

**Rationale**: Great idea for v2.0+ but adds complexity. The current JSON-based approach is simpler and can be enhanced later with code generation.

## Implementation Notes

1. All existing mock definitions using `HttpHandler` must be converted to `ScenaristMock`
2. The `ScenarioManager` implementation will convert definitions to handlers at registration time or on-demand
3. Implementations must ensure `ScenaristMock.response.body` is JSON-serializable (primitives, objects, arrays only)
4. Future enhancements can add template support (e.g., Handlebars, JavaScript expressions) while maintaining serializability

## Related Decisions

- Future ADR: Dynamic Response Templates (for more expressive mocks while maintaining serializability)
- Future ADR: Scenario Versioning and Migration Strategy

## References

- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [MSW Documentation](https://mswjs.io/docs/)
- [JSON Serialization Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
