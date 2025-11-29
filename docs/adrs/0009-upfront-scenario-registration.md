# ADR-0009: Upfront Scenario Registration

**Status**: Accepted
**Date**: 2025-11-02
**Authors**: Claude Code

**Note**: Historical code examples in this ADR reference `defaultScenarioId`, which was later removed per ADR-0010 (enforces 'default' key convention via Zod validation).

## Context

Before this decision, Scenarist used imperative scenario registration with a two-step process:

```typescript
// Step 1: Create adapter with default scenario
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: defaultScenarioDefinition,
  // ...
});

// Step 2: Register additional scenarios imperatively
scenarist.registerScenario(premiumUserScenario);
scenarist.registerScenario(standardUserScenario);
scenarist.registerScenario(adminUserScenario);
// ... potentially many more
```

**Problems with imperative registration:**

1. **Scenarios not known upfront** - Can't generate type-safe IDs (see ADR-0008)
2. **Two-phase initialization** - Must track which scenarios are registered
3. **Order-dependent** - `registerScenario()` calls must happen before tests run
4. **Distributed concerns** - Scenarios defined in multiple places
5. **Hard to audit** - Can't easily see "what scenarios are available?"
6. **Testing complexity** - Setup requires multiple steps, easy to forget scenarios

This imperative pattern was inherited from typical mock library patterns (like MSW itself), but doesn't leverage TypeScript's type system effectively.

## Problem

**How can we provide compile-time knowledge of all available scenarios for type safety (ADR-0008) while:**

1. Maintaining simplicity and ease of use
2. Keeping setup code readable and maintainable
3. Ensuring scenarios are always available when needed
4. Enabling scenario discovery (what scenarios exist?)
5. Remaining consistent across all adapters (Express, Next.js, etc.)

**Requirements:**

- ✅ All scenarios known at adapter creation time (for TypeScript inference)
- ✅ Single initialization step (no two-phase setup)
- ✅ Scenarios defined in one place (single source of truth)
- ✅ Easy to audit (can see all scenarios at a glance)
- ✅ Order-independent (declarative, not imperative)
- ✅ Works with type-safe scenario IDs (ADR-0008)

## Decision

We will **require all scenarios to be provided upfront** via a `scenarios` object parameter. The imperative `registerScenario()` method will be removed.

### The Pattern

```typescript
// Define all scenarios in one object
const scenarios = {
  default: { id: 'default', name: 'Default', ... },
  premium: { id: 'premium', name: 'Premium User', ... },
  standard: { id: 'standard', name: 'Standard User', ... },
  admin: { id: 'admin', name: 'Admin User', ... },
} as const satisfies ScenaristScenarios;

// Single initialization step - all scenarios known upfront
const scenarist = createScenarist({
  enabled: true,
  scenarios,                    // All scenarios provided here
  defaultScenarioId: 'default', // Reference to key in scenarios object
  // ...
});

// No registerScenario() calls needed - all scenarios already available
```

### How It Works

**Adapter Initialization:**

1. User defines scenarios object (single source of truth)
2. User passes scenarios to `createScenarist()` in config
3. Adapter iterates through scenarios and registers all of them internally
4. TypeScript infers scenario IDs from object keys (ADR-0008)

**Express Adapter Implementation:**

```typescript
export const createScenarist = <T extends ScenaristScenarios>(
  options: CreateScenaristOptions<T>,
): Scenarist<T> => {
  const manager = createScenarioManager({ registry, store });

  // Register all scenarios upfront (iteration over object)
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  // Set default scenario for fallback
  manager.switchScenario(
    options.defaultTestId ?? "default-test",
    options.defaultScenarioId,
    undefined,
  );

  return {
    middleware,
    scenarioEndpoints,
    // No registerScenario method exposed
  };
};
```

**Next.js Adapter Implementation:**

```typescript
const createScenaristBase = <T extends ScenaristScenarios>(
  options: CreateScenaristOptions<T>,
): ScenaristBase<T> => {
  const manager = createScenarioManager({ registry, store });

  // Same upfront registration pattern
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  manager.switchScenario(
    options.defaultTestId ?? "default-test",
    options.defaultScenarioId,
    undefined,
  );

  return { manager, config };
};
```

### API Surface Changes

**Before (v1.x):**

```typescript
type Scenarist = {
  middleware: RequestHandler;
  scenarioEndpoints: Router;
  registerScenario(definition: ScenaristScenario): void; // ← Removed
  unregisterScenario(id: string): void; // ← Removed
};

type CreateScenaristOptions = {
  enabled: boolean;
  defaultScenario: ScenaristScenario; // ← Removed
  // ...
};
```

**After (v2.x):**

```typescript
type Scenarist<T extends ScenaristScenarios> = {
  middleware: RequestHandler;
  scenarioEndpoints: Router;
  // registerScenario removed - use scenarios object instead
  // unregisterScenario removed - modify scenarios object and recreate
};

type CreateScenaristOptions<T extends ScenaristScenarios> = {
  enabled: boolean;
  scenarios: T; // ← New: All scenarios upfront
  defaultScenarioId: string; // ← Changed: Reference instead of object
  // ...
};
```

### Integration with Type-Safe IDs

This decision enables ADR-0008's type-safe scenario IDs:

```typescript
const scenarios = {
  premium: { id: 'premium', ... },
  standard: { id: 'standard', ... },
} as const satisfies ScenaristScenarios;
//  ^^^^^^^ Required for literal types

const scenarist = createScenarist({ scenarios });
//                                  ^^^^^^^^^ TypeScript infers T = typeof scenarios

// Now TypeScript knows scenario IDs: 'premium' | 'standard'
type IDs = ScenarioIds<typeof scenarios>; // 'premium' | 'standard'
```

Without upfront registration, TypeScript couldn't infer scenario IDs because they'd be added imperatively at runtime.

## Alternatives Considered

### Alternative 1: Keep Imperative Registration, Add Type Parameter

**Pattern:**

```typescript
const scenarist = createScenarist<"premium" | "standard">({
  enabled: true,
  defaultScenario: defaultScenario,
});

scenarist.registerScenario(premiumScenario);
scenarist.registerScenario(standardScenario);
```

**Pros:**

- ✅ Backward compatible
- ✅ Gradual type safety adoption

**Cons:**

- ❌ Manual type parameter (violates DRY - IDs defined in two places)
- ❌ Type parameter can drift from actual registered scenarios
- ❌ Still two-phase initialization
- ❌ TypeScript can't validate scenarios actually registered

**Decision**: Rejected - doesn't solve the core problem of type inference

### Alternative 2: Hybrid Approach (Both Patterns Supported)

**Pattern:**

```typescript
// Option A: Upfront (new)
const scenarist = createScenarist({ scenarios });

// Option B: Imperative (legacy)
const scenarist = createScenarist({ defaultScenario });
scenarist.registerScenario(otherScenario);
```

**Pros:**

- ✅ Backward compatible
- ✅ Gradual migration path

**Cons:**

- ❌ Two ways to do the same thing (confusing)
- ❌ Maintenance burden (support both patterns)
- ❌ Type inference only works for Option A
- ❌ Documentation complexity (which pattern to use when?)

**Decision**: Rejected - prefer simplicity and one clear pattern

### Alternative 3: Registration Function (Fluent Builder)

**Pattern:**

```typescript
const scenarist = createScenarist({ enabled: true })
  .withScenario(defaultScenario)
  .withScenario(premiumScenario)
  .withScenario(standardScenario)
  .build();
```

**Pros:**

- ✅ Fluent API style
- ✅ Method chaining

**Cons:**

- ❌ TypeScript inference doesn't accumulate across chained calls
- ❌ Still imperative (order-dependent)
- ❌ More complex implementation (builder pattern)
- ❌ `.build()` feels unnatural for configuration

**Decision**: Rejected - doesn't enable type inference, adds complexity

### Alternative 4: Two-Step Explicit Registration

**Pattern:**

```typescript
const scenarios = {
  premium: premiumScenario,
  standard: standardScenario,
};

const scenarist = createScenarist({ enabled: true });
scenarist.registerScenarios(scenarios); // Single call with object
```

**Pros:**

- ✅ Could support type inference
- ✅ Single registration call (not multiple)

**Cons:**

- ❌ Still two-phase initialization
- ❌ Scenarios could change between creation and registration
- ❌ Need to track "initialized" state
- ❌ More complex API surface

**Decision**: Rejected - upfront registration is simpler

## Consequences

### Positive

✅ **Type inference enabled** - Scenarios object enables TypeScript to infer IDs (ADR-0008)

✅ **Single initialization** - One `createScenarist()` call, no follow-up steps:

```typescript
const scenarist = createScenarist({ scenarios });
// Done! All scenarios available immediately.
```

✅ **Order-independent** - Object iteration order doesn't matter for functionality

✅ **Single source of truth** - All scenarios defined in one place:

```typescript
// Easy to see all available scenarios at a glance
const scenarios = {
  default: { ... },
  premium: { ... },
  standard: { ... },
  admin: { ... },
} as const satisfies ScenaristScenarios;
```

✅ **Easy to audit** - Can see all scenarios in scenarios object

✅ **Simpler API** - No `registerScenario()` / `unregisterScenario()` methods

✅ **Consistent across adapters** - Express, Next.js, and future adapters all use same pattern

✅ **Better testability** - Single setup step makes tests simpler:

```typescript
const scenarist = createScenarist({
  enabled: true,
  scenarios: testScenarios,
});
// All test scenarios available immediately
```

✅ **Self-documenting** - Scenarios object serves as documentation of available scenarios

### Negative

❌ **Breaking change** - Existing code must migrate:

```typescript
// Before:
const scenarist = createScenarist({ defaultScenario: ... });
scenarist.registerScenario(scenario1);
scenarist.registerScenario(scenario2);

// After:
const scenarios = { default: ..., scenario1: ..., scenario2: ... };
const scenarist = createScenarist({ scenarios, defaultScenarioId: 'default' });
```

❌ **Dynamic registration harder** - Can't add scenarios at runtime:

```typescript
// Before (dynamic):
if (condition) {
  scenarist.registerScenario(specialScenario);
}

// After (requires object construction):
const scenarios = {
  default: defaultScenario,
  ...(condition ? { special: specialScenario } : {}),
};
```

**Note**: Dynamic scenario registration is rare and can be handled with conditional object spreading.

❌ **Large scenario files** - All scenarios in one object could make file large:

```typescript
// scenarios.ts could become large with many scenarios
export const scenarios = {
  default: { ... },    // 50 lines
  premium: { ... },    // 50 lines
  standard: { ... },   // 50 lines
  // ... 10 more scenarios
} as const;
```

**Mitigation**: Extract scenario definitions to separate files, import and combine:

```typescript
// scenarios/default.ts
export const defaultScenario: ScenaristScenario = { ... };

// scenarios/index.ts
import { defaultScenario } from './default';
import { premiumScenario } from './premium';

export const scenarios = {
  default: defaultScenario,
  premium: premiumScenario,
} as const satisfies ScenaristScenarios;
```

❌ **Scenario removal** - Can't dynamically unregister scenarios:

```typescript
// Before:
scenarist.unregisterScenario("old-scenario");

// After:
// Must recreate adapter with new scenarios object (rare use case)
```

**Note**: Dynamic scenario removal is extremely rare in practice. Most scenarios are static for the lifetime of the application.

### Neutral

⚖️ **Migration effort** - Users must update code, but benefits (type safety) justify cost

⚖️ **File organization** - Need to decide where scenarios object lives (separate file recommended)

⚖️ **Flexibility trade-off** - Less runtime flexibility, more compile-time safety

## Implementation Notes

### Migration Guide for Users

**Step 1: Collect all scenarios into object**

Before:

```typescript
const defaultScenario: ScenaristScenario = { ... };
const premiumScenario: ScenaristScenario = { ... };
const standardScenario: ScenaristScenario = { ... };
```

After:

```typescript
const scenarios = {
  default: { id: 'default', ... },
  premium: { id: 'premium', ... },
  standard: { id: 'standard', ... },
} as const satisfies ScenaristScenarios;
```

**Step 2: Update adapter initialization**

Before:

```typescript
const scenarist = createScenarist({
  enabled: true,
  defaultScenario: defaultScenario,
});

scenarist.registerScenario(premiumScenario);
scenarist.registerScenario(standardScenario);
```

After:

```typescript
const scenarist = createScenarist({
  enabled: true,
  scenarios,
});
```

**Step 3: Remove registration calls**

Delete all `scenarist.registerScenario()` and `scenarist.unregisterScenario()` calls.

**Step 4: Update types if using TypeScript**

No manual type updates needed! TypeScript infers scenario IDs automatically from scenarios object.

### Recommended File Structure

```
src/
  scenarios/
    default.ts          # Default scenario definition
    premium-user.ts     # Premium user scenario
    standard-user.ts    # Standard user scenario
    admin-user.ts       # Admin user scenario
    index.ts            # Combines all scenarios into scenarios object
  server.ts             # Imports scenarios from scenarios/index.ts
```

**scenarios/index.ts:**

```typescript
import { defaultScenario } from "./default";
import { premiumUserScenario } from "./premium-user";
import { standardUserScenario } from "./standard-user";
import { adminUserScenario } from "./admin-user";

export const scenarios = {
  default: defaultScenario,
  premiumUser: premiumUserScenario,
  standardUser: standardUserScenario,
  adminUser: adminUserScenario,
} as const satisfies ScenaristScenarios;
```

**server.ts:**

```typescript
import { scenarios } from "./scenarios";

const scenarist = createScenarist({
  enabled: true,
  scenarios,
});
```

### Adapter Implementation Requirements

All adapters must:

1. Accept `scenarios: T` parameter instead of `defaultScenario`
2. Accept `defaultScenarioId: string` instead of `defaultScenario` object
3. Register all scenarios from object during initialization
4. Not expose `registerScenario()` or `unregisterScenario()` methods
5. Set default scenario using `defaultScenarioId` reference

**Example (Express adapter):**

```typescript
export const createScenarist = <T extends ScenaristScenarios>(
  options: CreateScenaristOptions<T>,
): Scenarist<T> => {
  // Register all scenarios upfront
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  // Set default scenario
  manager.switchScenario(
    config.defaultTestId,
    options.defaultScenarioId,
    undefined,
  );

  // Don't expose registration methods
  return {
    middleware,
    scenarioEndpoints,
  };
};
```

## Related Decisions

- **ADR-0008**: Type-Safe Scenario IDs (enabled by upfront registration)
- **ADR-0010**: Convention Over Configuration: 'default' Key (future: enforce 'default' in scenarios object)
- **ADR-0001**: Serializable Scenario Definitions (scenarios object must be serializable)

## Future Enhancements

### Potential: Hot Reloading of Scenarios

For development, could support watching scenarios file and recreating adapter:

```typescript
// Development mode only
if (process.env.NODE_ENV === "development") {
  watch("./scenarios.ts", () => {
    // Re-import scenarios
    const newScenarios = await import("./scenarios.ts?t=" + Date.now());
    // Recreate adapter with new scenarios
    scenarist = createScenarist({ scenarios: newScenarios.scenarios });
  });
}
```

This would enable scenario changes without server restart, but requires careful state management.

## References

- [TypeScript: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- Internal: ADR-0008 (Type-Safe Scenario IDs)
- Internal: Migration commit `3a50d84`
- Internal: WIP.md "Unified Type-Safe API Migration" section
