# ADR-0010: Convention Over Configuration - 'default' Key Requirement

**Status**: Implemented
**Date**: 2025-11-02
**Implementation Date**: 2025-11-02
**Authors**: Claude Code

## Implementation Update (Nov 2025)

**Decision**: We implemented the "enforce 'default' key" solution immediately, skipping the intermediate type-safe `defaultScenarioId` phase.

**What was implemented:**
- Removed `defaultScenarioId` parameter from configuration entirely
- Enforced 'default' key requirement via Zod schema validation (`ScenariosObjectSchema`)
- All adapters now hardcode `'default'` literal for fallback behavior
- Zod validation ensures 'default' key exists at runtime

**Rationale for immediate implementation:**
- The 'default' key was already conventional in all examples and usage
- Zod validation made enforcement straightforward and type-safe
- Simpler to implement once than to migrate through two phases
- Cleaner API surface (one less parameter to document and explain)

The historical context and decision-making process below documents why this approach was chosen.

---

## Context (Historical)

After implementing type-safe scenario IDs (ADR-0008) and upfront scenario registration (ADR-0009), the current API requires users to specify both:

1. A `scenarios` object containing all scenarios
2. A `defaultScenarioId` parameter specifying which scenario is the default

```typescript
const scenarios = {
  default: { id: 'default', name: 'Default Scenario', ... },
  premium: { id: 'premium', name: 'Premium User', ... },
  standard: { id: 'standard', name: 'Standard User', ... },
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios,
  defaultScenarioId: 'default', // ← Must specify default scenario ID
  // ...
});
```

**Current state:**
- `defaultScenarioId` is a required `string` parameter
- TypeScript doesn't validate that `defaultScenarioId` exists in scenarios
- Users can specify any scenario ID (e.g., `'premium'`, `'custom-default'`, `'base'`)
- Flexible but requires extra configuration

**Identified issue:**
The refactor-scan agent identified this as a duplication/configuration opportunity:
> "Users must always have a 'default' scenario anyway. Why make them specify `defaultScenarioId: 'default'` every time?"

## Problem

**Should we enforce a 'default' key convention or keep flexible `defaultScenarioId`?**

**Trade-off analysis:**

**Option A: Convention (Require 'default' key)**
- Pro: Less configuration (no `defaultScenarioId` parameter needed)
- Pro: Consistent naming across all projects ("default means default")
- Pro: Simpler API surface (one less parameter)
- Con: Less flexibility (what if user wants different name?)
- Con: Migration burden (rename existing default scenarios to 'default')

**Option B: Configuration (Keep `defaultScenarioId`)**
- Pro: Flexible (any scenario can be default)
- Pro: Semantic naming (e.g., `'baseline'`, `'standard'`, `'empty'`)
- Pro: No migration needed (current behavior)
- Con: Extra configuration every time
- Con: TypeScript doesn't validate ID exists (can typo)

**Key insight from refactoring analysis:**

The current `defaultScenarioId: string` has a subtle gotcha:

```typescript
const scenarios = {
  baseline: { id: 'baseline', ... },
  premium: { id: 'premium', ... },
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  scenarios,
  defaultScenarioId: 'default', // ❌ Typo! "default" doesn't exist
  // TypeScript doesn't catch this error
});

// Runtime error when trying to use default scenario
```

TypeScript can't validate `defaultScenarioId` exists because it's currently `string`, not `keyof T`.

## Decision

**We propose DEFERRING enforcement of 'default' key convention to a future major version.**

Instead, we will:
1. **Make `defaultScenarioId` type-safe NOW** (change from `string` to `keyof T & string`)
2. **Recommend 'default' as best practice** (document in READMEs, examples)
3. **Consider 'default' convention for v3.0** (breaking change)

### Immediate Change (v2.x): Type-Safe `defaultScenarioId`

```typescript
// Before:
export type ScenaristConfigInput<T extends ScenaristScenarios = ScenaristScenarios> = {
  readonly scenarios: T;
  readonly defaultScenarioId: string; // ❌ Not type-safe
  // ...
};

// After:
export type ScenaristConfigInput<T extends ScenaristScenarios = ScenaristScenarios> = {
  readonly scenarios: T;
  readonly defaultScenarioId: ScenarioIds<T>; // ✅ Type-safe! (keyof T & string)
  // ...
};
```

**Result:**
```typescript
const scenarios = {
  baseline: { id: 'baseline', ... },
  premium: { id: 'premium', ... },
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  scenarios,
  defaultScenarioId: 'baseline', // ✅ Autocomplete + type-checked!
  defaultScenarioId: 'default',  // ❌ Compile error: 'default' not in scenarios
});
```

### Recommended Convention (Documentation)

Document best practice in all adapter READMEs:

```typescript
/**
 * RECOMMENDED: Use 'default' as the key for your default scenario.
 * This creates consistency across projects and makes intent clear.
 */
const scenarios = {
  default: { id: 'default', name: 'Default Scenario', ... }, // ← Recommended
  premium: { id: 'premium', name: 'Premium User', ... },
  standard: { id: 'standard', name: 'Standard User', ... },
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios,
  defaultScenarioId: 'default', // ✅ Clear intent, conventional
});
```

### Future Option (v3.0): Enforce 'default' Convention

If we decide to enforce 'default' in v3.0, the API would become:

```typescript
// v3.0 hypothetical:
export type ScenaristConfigInput<T extends ScenaristScenarios> = {
  readonly scenarios: T extends { default: ScenaristScenario }
    ? T
    : never; // ← Require 'default' key at type level
  // No defaultScenarioId parameter (always uses 'default')
};

const scenarios = {
  default: { id: 'default', ... },  // ← Required
  premium: { id: 'premium', ... },
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  enabled: true,
  scenarios, // 'default' is implicit
  // No defaultScenarioId needed
});
```

**This would be a breaking change requiring major version bump.**

## Rationale for Deferred Enforcement

### Why Not Enforce Now?

1. **Just shipped v2.0 with type-safe IDs** - Two major breaking changes in quick succession is too disruptive
2. **Need real-world feedback** - Let users try `defaultScenarioId: keyof T` first to see if 'default' convention emerges naturally
3. **Low pain currently** - Type-safe `defaultScenarioId` solves the typo problem (main pain point)
4. **Semantic value exists** - Some users may genuinely prefer `'baseline'`, `'standard'`, or `'empty'` as default name
5. **Migration fatigue** - Forcing another rename (to 'default') adds migration burden

### Why Type-Safe `defaultScenarioId` Is Sufficient for Now

The core problem isn't the parameter existing, it's the lack of validation:

```typescript
// Problem: Typo in defaultScenarioId
defaultScenarioId: 'defualt' // ❌ Runtime error (current)
defaultScenarioId: 'defualt' // ✅ Compile error (with keyof T)

// Non-problem: User prefers 'baseline' over 'default'
const scenarios = { baseline: ..., premium: ... };
defaultScenarioId: 'baseline' // ✅ Valid use case
```

Type safety solves the actual pain point (typos) without forcing convention.

### What Would Trigger Enforcement?

We would reconsider 'default' key enforcement if:

1. **Feedback shows confusion** - Users ask "which scenario should I use for default?"
2. **Ecosystem divergence** - Projects use wildly different names (`'base'`, `'standard'`, `'empty'`, etc.)
3. **Tooling complexity** - Tools need to know default scenario and convention helps
4. **Next major version** - Already doing breaking changes for v3.0

## Alternatives Considered

### Alternative 1: Enforce 'default' Now (Convention Over Configuration)

**Pattern:**
```typescript
// Type enforces 'default' key exists
export type ScenariosWithDefault = {
  default: ScenaristScenario;
  [key: string]: ScenaristScenario;
};

export type ScenaristConfigInput<T extends ScenariosWithDefault> = {
  readonly scenarios: T;
  // No defaultScenarioId - always uses 'default'
};
```

**Pros:**
- ✅ Less configuration (no `defaultScenarioId`)
- ✅ Consistent across all projects
- ✅ Clear convention ("default is default")

**Cons:**
- ❌ Breaking change (must rename scenarios to 'default')
- ❌ Migration burden on top of v2.0 changes
- ❌ Less flexible (can't use semantic names)
- ❌ Premature - haven't proven 'default' is universally best

**Decision**: Rejected for now - too disruptive for v2.x, consider for v3.0

### Alternative 2: Make `defaultScenarioId` Optional with 'default' Fallback

**Pattern:**
```typescript
export type ScenaristConfigInput<T extends ScenaristScenarios> = {
  readonly scenarios: T;
  readonly defaultScenarioId?: ScenarioIds<T>; // Optional
};

// Implementation defaults to 'default' if not specified
const defaultId = options.defaultScenarioId ?? ('default' as ScenarioIds<T>);
```

**Pros:**
- ✅ Backward compatible
- ✅ Convention encouraged (omit parameter → uses 'default')
- ✅ Flexibility preserved (can override)

**Cons:**
- ❌ Type safety unclear (what if 'default' doesn't exist?)
- ❌ Runtime error possible if 'default' not in scenarios
- ❌ Requires type assertion (`as ScenarioIds<T>`) which breaks type safety

**Decision**: Rejected - breaks type safety, confusing behavior

### Alternative 3: First Key Is Default (Implicit Convention)

**Pattern:**
```typescript
// First key in scenarios object is implicitly the default
const scenarios = {
  baseline: { ... }, // ← Implicitly default (first key)
  premium: { ... },
};

// No defaultScenarioId parameter
```

**Pros:**
- ✅ No configuration needed
- ✅ Flexible naming

**Cons:**
- ❌ Non-obvious convention (requires documentation)
- ❌ Object key order dependency (fragile)
- ❌ Can't easily change default (must reorder keys)
- ❌ Confusing when reading code ("which is default?")

**Decision**: Rejected - too implicit, fragile, confusing

### Alternative 4: Required 'default' + Alias Support

**Pattern:**
```typescript
const scenarios = {
  default: { id: 'default', ... },  // ← Required
  baseline: { id: 'default', ... }, // ← Alias to default (same ID)
  premium: { id: 'premium', ... },
};
```

**Pros:**
- ✅ Enforces 'default' convention
- ✅ Allows semantic aliases

**Cons:**
- ❌ Confusing (two keys for same scenario)
- ❌ Duplication in scenarios object
- ❌ Hard to implement (scenario ID uniqueness validation?)

**Decision**: Rejected - too complex, confusing

## Consequences

### Immediate Change (v2.x): Type-Safe `defaultScenarioId`

**Positive:**

✅ **Compile-time validation** - Can't typo `defaultScenarioId`:
   ```typescript
   defaultScenarioId: 'defualt' // ❌ Compile error
   ```

✅ **Autocomplete** - IDE suggests valid scenario IDs

✅ **Refactoring-safe** - Rename scenario key → all references update

✅ **No migration needed** - Existing code works if `defaultScenarioId` is valid

✅ **Better DX** - Developers can't accidentally break default scenario

**Negative:**

❌ **Type complexity** - `ScenarioIds<T>` instead of `string`
   - Minor complexity increase, worth it for safety

**Neutral:**

⚖️ **Still requires configuration** - Must specify `defaultScenarioId`
   - Not worse than current state, just type-safe now

### Future Option (v3.0): 'default' Enforcement

**Positive (if we do it):**

✅ **One less parameter** - No `defaultScenarioId` needed

✅ **Consistent naming** - All projects use 'default'

✅ **Simpler examples** - Less configuration in docs

**Negative (if we do it):**

❌ **Breaking change** - Requires migration

❌ **Less flexibility** - Can't use semantic names for default

❌ **Convention fatigue** - Developers may resist forced naming

## Implementation Notes

### Immediate Implementation (v2.x)

**Step 1: Update core types**

```typescript
// packages/core/src/types/config.ts
export type ScenaristConfigInput<T extends ScenaristScenarios = ScenaristScenarios> = {
  readonly scenarios: T;
  readonly defaultScenarioId: ScenarioIds<T>; // Changed from string
  // ...
};
```

**Step 2: Update all adapter signatures**

```typescript
// packages/express-adapter/src/setup/setup-scenarist.ts
export type CreateScenaristOptions<T extends ScenaristScenarios> = {
  scenarios: T;
  defaultScenarioId: ScenarioIds<T>; // Changed from string
  // ...
};
```

**Step 3: Update all example apps**

```typescript
// Verify defaultScenarioId exists in scenarios
const scenarist = createScenarist({
  scenarios,
  defaultScenarioId: 'default', // ✅ Type-checked against scenarios keys
});
```

**Step 4: Update documentation**

Add to all adapter READMEs:

```markdown
## Default Scenario

The `defaultScenarioId` parameter specifies which scenario to use as the fallback.

**Best Practice**: Use `'default'` as the key for your baseline scenario:

\`\`\`typescript
const scenarios = {
  default: { id: 'default', name: 'Default Scenario', ... }, // ← Recommended
  premium: { id: 'premium', name: 'Premium User', ... },
} as const satisfies ScenaristScenarios;

const scenarist = createScenarist({
  scenarios,
  defaultScenarioId: 'default', // ✅ Conventional and clear
});
\`\`\`

**Note**: `defaultScenarioId` is type-checked. TypeScript will error if you specify
a scenario ID that doesn't exist in your scenarios object.
```

### Future Implementation (v3.0) - If We Decide to Enforce

**Only if:**
1. Feedback shows 'default' convention is universal
2. Users ask for less configuration
3. We're already doing other breaking changes for v3.0

**Migration would be:**

```typescript
// v2.x:
const scenarios = { baseline: ..., premium: ... };
createScenarist({ scenarios, defaultScenarioId: 'baseline' });

// v3.x:
const scenarios = { default: ..., premium: ... }; // ← Rename to 'default'
createScenarist({ scenarios }); // ← defaultScenarioId removed
```

## Tests Required

### For Immediate Change (Type-Safe `defaultScenarioId`)

```typescript
describe('createScenarist', () => {
  it('should accept valid defaultScenarioId from scenarios', () => {
    const scenarios = {
      baseline: { id: 'baseline', ... },
      premium: { id: 'premium', ... },
    } as const satisfies ScenaristScenarios;

    const scenarist = createScenarist({
      enabled: true,
      scenarios,
      defaultScenarioId: 'baseline', // ✅ Valid
    });

    expect(scenarist).toBeDefined();
  });

  it('should provide autocomplete for defaultScenarioId', () => {
    // This is a type-level test (checked by TypeScript compiler)
    // If this code compiles, the test passes
    const scenarios = {
      default: { id: 'default', ... },
      premium: { id: 'premium', ... },
    } as const satisfies ScenaristScenarios;

    const scenarist = createScenarist({
      enabled: true,
      scenarios,
      defaultScenarioId: 'default', // ✅ Autocomplete suggests 'default' | 'premium'
    });
  });

  it('should error at compile time for invalid defaultScenarioId', () => {
    const scenarios = {
      baseline: { id: 'baseline', ... },
    } as const satisfies ScenaristScenarios;

    // @ts-expect-error - 'nonexistent' is not a key in scenarios
    const scenarist = createScenarist({
      enabled: true,
      scenarios,
      defaultScenarioId: 'nonexistent', // ❌ Should fail type check
    });
  });
});
```

### For Future Enforcement (v3.0) - If We Do It

```typescript
describe('createScenarist', () => {
  it('should require "default" key in scenarios object', () => {
    const scenariosWithDefault = {
      default: { id: 'default', ... },
      premium: { id: 'premium', ... },
    } as const satisfies ScenaristScenarios;

    // ✅ Should compile
    const scenarist = createScenarist({ scenarios: scenariosWithDefault });
  });

  it('should error if "default" key is missing', () => {
    const scenariosWithoutDefault = {
      baseline: { id: 'baseline', ... },
      premium: { id: 'premium', ... },
    } as const satisfies ScenaristScenarios;

    // @ts-expect-error - 'default' key required
    const scenarist = createScenarist({ scenarios: scenariosWithoutDefault });
  });
});
```

## Related Decisions

- **ADR-0008**: Type-Safe Scenario IDs (provides `ScenarioIds<T>` type)
- **ADR-0009**: Upfront Scenario Registration (provides scenarios object)
- Future: Validate scenario.id matches object key (could enforce naming consistency)

## References

- [Convention Over Configuration (Martin Fowler)](https://en.wikipedia.org/wiki/Convention_over_configuration)
- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- Internal: refactor-scan analysis (identified duplication/configuration opportunity)
- Internal: Migration commit `3a50d84`
- Internal: CLAUDE.md sections on defaultScenarioId
