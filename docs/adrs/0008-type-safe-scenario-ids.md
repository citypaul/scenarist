# ADR-0008: Type-Safe Scenario IDs via TypeScript Generics

**Status**: Accepted
**Date**: 2025-11-02
**Authors**: Claude Code

## Context

Before this decision, scenario IDs were untyped strings throughout Scenarist:

```typescript
// Before: No type safety, no autocomplete
scenarist.registerScenario({ id: 'premiumUser', ... });
scenarist.registerScenario({ id: 'standardUser', ... });

await setScenario(page, 'premiumUser'); // ✅ Valid
await setScenario(page, 'premiumUsr');  // ❌ Typo - runtime error only!
```

**Problems with string-based IDs:**

1. **No IDE autocomplete** - Developers must remember scenario names
2. **Typos caught at runtime** - `'premiumUsr'` compiles fine but fails at runtime
3. **No refactoring support** - Renaming a scenario requires manual find-replace
4. **Poor discoverability** - New developers can't see available scenarios
5. **Fragile tests** - Scenario name changes break tests in non-obvious ways

This lack of type safety was particularly painful in test code where scenario switching is frequent. A typo in a scenario name would only be caught when the test runs, not during development.

## Problem

**How can we provide compile-time type safety and autocomplete for scenario IDs without:**
1. Breaking serialization (must remain JSON-compatible)
2. Requiring code generation
3. Adding runtime overhead
4. Forcing string unions or enums (maintenance burden)

**Requirements:**
- ✅ IDE autocomplete for scenario names in all contexts
- ✅ Compile-time errors for invalid scenario IDs
- ✅ Zero runtime overhead (pure type-level feature)
- ✅ Works with dynamic scenario objects (no code generation)
- ✅ Refactoring-safe (rename scenario → all references update)
- ✅ Self-documenting (scenarios object shows all available scenarios)

## Decision

We will use **TypeScript generics with `as const satisfies` pattern** to extract scenario IDs from a scenarios object at compile time.

### The Pattern

```typescript
// Step 1: Define ScenariosObject type (core package)
export type ScenariosObject = Record<string, ScenarioDefinition>;

// Step 2: Extract scenario IDs from object keys
export type ScenarioIds<T extends ScenariosObject> = keyof T & string;

// Step 3: User defines scenarios with `as const satisfies`
const scenarios = {
  cartWithState: { id: 'cartWithState', name: 'Cart with State', ... },
  premiumUser: { id: 'premiumUser', name: 'Premium User', ... },
  standardUser: { id: 'standardUser', name: 'Standard User', ... },
} as const satisfies ScenariosObject;
//  ^^^^^^^ Preserves literal types ('cartWithState' | 'premiumUser' | 'standardUser')
//          ^^^^^^^^^ Ensures object matches ScenariosObject structure

// Step 4: Adapters become generic over scenarios type
export const createScenarist = <T extends ScenariosObject>(
  options: CreateScenaristOptions<T>
): Scenarist<T> => { ... };

// Result: TypeScript infers scenario IDs from object keys!
type MyScenarioIds = ScenarioIds<typeof scenarios>;
// Result: 'cartWithState' | 'premiumUser' | 'standardUser'
```

### How It Works

**TypeScript's Type Inference Magic:**

1. `as const` makes object keys literal types instead of `string`
   ```typescript
   // Without `as const`:
   const obj = { foo: 'bar' };
   type Keys = keyof typeof obj; // string

   // With `as const`:
   const obj = { foo: 'bar' } as const;
   type Keys = keyof typeof obj; // 'foo'
   ```

2. `satisfies ScenariosObject` validates structure without widening types
   ```typescript
   // Ensures object has correct shape while preserving literal types
   const scenarios = {
     cart: { id: 'cart', name: 'Cart', ... },
     user: { id: 'wrong-id', ... } // ❌ Compile error: id doesn't match key
   } as const satisfies ScenariosObject;
   ```

3. `keyof T & string` extracts only string keys (excludes `number | symbol`)
   ```typescript
   type ScenarioIds<T> = keyof T & string;
   // Ensures we only get string literal types, never number/symbol
   ```

4. Generics flow through adapter APIs automatically
   ```typescript
   const scenarist = createScenarist({ scenarios }); // T = typeof scenarios
   scenarist.switchScenario(testId, 'cart'); // ✅ Autocomplete!
   scenarist.switchScenario(testId, 'xyz');  // ❌ Compile error!
   ```

### Integration Points

**Core Package (`@scenarist/core`):**
```typescript
// types/scenario.ts
export type ScenariosObject = Record<string, ScenarioDefinition>;
export type ScenarioIds<T extends ScenariosObject> = keyof T & string;

// types/config.ts
export type ScenaristConfigInput<T extends ScenariosObject = ScenariosObject> = {
  readonly scenarios: T;
  readonly defaultScenarioId: string; // Not keyof T (yet - see ADR-0010)
  // ...
};
```

**Adapter Packages (Express, Next.js):**
```typescript
export type CreateScenaristOptions<T extends ScenariosObject> = {
  scenarios: T;
  defaultScenarioId: string;
  // ...
};

export const createScenarist = <T extends ScenariosObject>(
  options: CreateScenaristOptions<T>
): Scenarist<T> => {
  // TypeScript infers T from options.scenarios
  // All scenario ID parameters become keyof T automatically
};
```

**Playwright Helpers:**
```typescript
export const withScenarios = <T extends ScenariosObject>(scenarios: T) => {
  return base.extend<ScenaristFixtures<T>>({
    switchScenario: async ({ page }, use) => {
      const switchFn = async (scenarioId: ScenarioIds<T>) => {
        // scenarioId is now autocomplete + type-checked!
      };
      await use(switchFn);
    },
  });
};

// Usage in tests:
const test = withScenarios(scenarios); // T inferred from scenarios object

test('my test', async ({ page, switchScenario }) => {
  await switchScenario('premiumUser'); // ✅ Autocomplete works!
  await switchScenario('typo');        // ❌ Compile error!
});
```

**User Code:**
```typescript
// apps/my-app/scenarios.ts
export const scenarios = {
  default: { id: 'default', name: 'Default', ... },
  premium: { id: 'premium', name: 'Premium User', ... },
  admin: { id: 'admin', name: 'Admin User', ... },
} as const satisfies ScenariosObject;

// apps/my-app/server.ts
import { scenarios } from './scenarios';

const scenarist = createScenarist({
  enabled: true,
  scenarios,                    // TypeScript infers scenario IDs!
  defaultScenarioId: 'default', // ✅ String for now (see ADR-0010)
});

// tests/my-test.spec.ts
import { scenarios } from '../scenarios';

const test = withScenarios(scenarios);

test('premium user flow', async ({ page, switchScenario }) => {
  await switchScenario('premium'); // ✅ Autocomplete + type-checked!
});
```

## Alternatives Considered

### Alternative 1: String Unions

**Pattern:**
```typescript
type ScenarioId = 'cartWithState' | 'premiumUser' | 'standardUser';

const scenarios: Record<ScenarioId, ScenarioDefinition> = {
  cartWithState: { ... },
  premiumUser: { ... },
  standardUser: { ... },
};
```

**Pros:**
- ✅ Type-safe scenario IDs
- ✅ Autocomplete works
- ✅ Simple mental model

**Cons:**
- ❌ Requires manual maintenance (define union AND object)
- ❌ Easy for union and object to drift out of sync
- ❌ Duplicate source of truth (DRY violation)
- ❌ Adding scenario requires changing two places

**Decision**: Rejected - violates DRY principle

### Alternative 2: Enums

**Pattern:**
```typescript
enum ScenarioId {
  CartWithState = 'cartWithState',
  PremiumUser = 'premiumUser',
  StandardUser = 'standardUser',
}

const scenarios: Record<ScenarioId, ScenarioDefinition> = {
  [ScenarioId.CartWithState]: { ... },
  [ScenarioId.PremiumUser]: { ... },
  [ScenarioId.StandardUser]: { ... },
};
```

**Pros:**
- ✅ Type-safe
- ✅ Explicit enum values

**Cons:**
- ❌ Even more duplication (enum + object)
- ❌ Verbose access (`ScenarioId.CartWithState`)
- ❌ Enums have runtime representation (not pure types)
- ❌ Against CLAUDE.md guidelines (prefer types over enums)

**Decision**: Rejected - too much duplication, runtime overhead

### Alternative 3: Code Generation from Schema

**Pattern:**
```yaml
# scenarios.yaml
scenarios:
  - id: cartWithState
    name: Cart with State
  - id: premiumUser
    name: Premium User

# Generated:
type ScenarioId = 'cartWithState' | 'premiumUser';
```

**Pros:**
- ✅ Single source of truth (YAML/JSON)
- ✅ Type-safe
- ✅ Could generate runtime validation

**Cons:**
- ❌ Requires build step
- ❌ Adds tooling complexity
- ❌ Harder to debug (generated code)
- ❌ Overkill for simple use case

**Decision**: Rejected - unnecessary complexity for the problem

### Alternative 4: Template Literal Types (Future Enhancement)

**Pattern:**
```typescript
// Validate that scenario ID matches object key
type ValidScenarios<T extends Record<string, ScenarioDefinition>> = {
  [K in keyof T]: T[K] extends { id: K } ? T[K] : never;
};

const scenarios = {
  cart: { id: 'cart', ... },
  user: { id: 'wrong' }, // ❌ Compile error: 'wrong' !== 'user'
} satisfies ValidScenarios<typeof scenarios>;
```

**Pros:**
- ✅ Validates ID matches key at compile time
- ✅ Prevents ID/key mismatches

**Cons:**
- ❌ More complex type gymnastics
- ❌ Requires TypeScript 4.5+ (template literal types)
- ❌ Harder for developers to understand

**Decision**: Deferred to future ADR - current pattern is simpler and sufficient

## Consequences

### Positive

✅ **IDE autocomplete everywhere** - Scenario IDs autocomplete in:
   - Adapter setup (`defaultScenarioId`)
   - Test helpers (`switchScenario('premiumUser')`)
   - API calls (`setScenario(page, 'cart')`)

✅ **Compile-time errors** - Typos caught during development:
   ```typescript
   await switchScenario('premiumUsr'); // ❌ Type error before running tests
   ```

✅ **Refactoring-safe** - Rename scenario key → all references update automatically in IDEs

✅ **Self-documenting** - Scenarios object shows all available scenarios in one place

✅ **Zero runtime overhead** - Pure type-level feature (erases to JavaScript)

✅ **No code generation** - Works with plain TypeScript, no build step

✅ **Single source of truth** - Scenario IDs derived from object keys (DRY)

✅ **Better DX** - New developers can discover scenarios via autocomplete

### Negative

❌ **TypeScript 4.1+ required** - Needs template literal types and key remapping

❌ **`as const satisfies` syntax** - Requires TypeScript 4.9+ for `satisfies`
   - Workaround for older TS: `as const` + separate type assertion

❌ **Learning curve** - Developers must understand:
   - `as const` for literal types
   - `satisfies` for type validation
   - Generic type flow through APIs

❌ **Generic complexity** - All adapter types become generic:
   ```typescript
   Scenarist<T>
   CreateScenaristOptions<T>
   ScenaristFixtures<T>
   ```

❌ **Migration required** - Breaking change for existing users:
   - Must change from imperative `registerScenario()` to declarative `scenarios` object
   - Must add `as const satisfies ScenariosObject` to scenarios
   - All adapter setup code must change

### Neutral

⚖️ **Type inference can be surprising** - Sometimes TS can't infer T:
   ```typescript
   // Works:
   const scenarist = createScenarist({ scenarios });

   // Doesn't work (T = ScenariosObject, loses literal types):
   const options = { scenarios };
   const scenarist = createScenarist(options); // No autocomplete

   // Fix: Inline scenarios or use type annotation
   const options = { scenarios } as const;
   ```

⚖️ **`defaultScenarioId` still string** - Not yet `keyof T` (see ADR-0010 for future enforcement)

## Implementation Notes

### Migration Path for Users

**Before (v1.x):**
```typescript
import { createScenarist } from '@scenarist/express-adapter';

const scenarist = createScenarist({
  enabled: true,
  defaultScenario: { id: 'default', ... },
});

scenarist.registerScenario({ id: 'premium', ... });
scenarist.registerScenario({ id: 'standard', ... });

// No type safety:
await setScenario(page, 'premium'); // ❌ Typos not caught
```

**After (v2.x):**
```typescript
import { createScenarist } from '@scenarist/express-adapter';

const scenarios = {
  default: { id: 'default', ... },
  premium: { id: 'premium', ... },
  standard: { id: 'standard', ... },
} as const satisfies ScenariosObject;

const scenarist = createScenarist({
  enabled: true,
  scenarios,
  defaultScenarioId: 'default',
});

const test = withScenarios(scenarios);

test('my test', async ({ switchScenario }) => {
  await switchScenario('premium'); // ✅ Autocomplete + compile-time checking!
});
```

### Type Inference Requirements

**For autocomplete to work, users must:**

1. Use `as const satisfies ScenariosObject` pattern:
   ```typescript
   const scenarios = { ... } as const satisfies ScenariosObject;
   ```

2. Pass scenarios directly to adapter (no intermediate variables without `as const`):
   ```typescript
   // ✅ Good:
   createScenarist({ scenarios });

   // ❌ Bad (loses type inference):
   const options = { scenarios };
   createScenarist(options);

   // ✅ Fixed:
   const options = { scenarios } as const;
   createScenarist(options);
   ```

3. Use `withScenarios()` for Playwright fixtures (not raw `base.extend`):
   ```typescript
   // ✅ Good:
   const test = withScenarios(scenarios);

   // ❌ Bad (no type inference):
   const test = base.extend({ ... });
   ```

### Documentation Requirements

All adapter READMEs must include:

1. **Setup example** showing `as const satisfies ScenariosObject` pattern
2. **Explanation** of why `as const` is needed (literal types)
3. **Migration guide** from v1.x to v2.x API
4. **Common pitfalls** (intermediate variables, missing `as const`)
5. **TypeScript version requirement** (4.9+ for `satisfies`)

## Related Decisions

- **ADR-0009**: Upfront Scenario Registration (why we removed `registerScenario()`)
- **ADR-0010**: Convention Over Configuration: 'default' Key (future: enforce `defaultScenarioId` is `keyof T`)
- **ADR-0001**: Serializable Scenario Definitions (why scenarios must be plain objects)

## Future Enhancements

### Potential Improvement: Validate ID Matches Key

```typescript
// Future: Ensure scenario.id === object key
type ValidScenarios<T extends Record<string, ScenarioDefinition>> = {
  [K in keyof T]: T[K] extends { id: K } ? T[K] : never;
};

const scenarios = {
  cart: { id: 'cart', ... },    // ✅ OK
  user: { id: 'wrong', ... },   // ❌ Compile error
} satisfies ValidScenarios<typeof scenarios>;
```

This would catch copy-paste errors where key and ID don't match, but adds complexity. Deferred to future ADR.

## References

- [TypeScript Handbook: `as const`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [TypeScript 4.9: `satisfies` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
- [TypeScript: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- Internal: WIP.md "Unified Type-Safe API Migration" section
- Internal: Migration commit `3a50d84`
