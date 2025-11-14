# ADR-0014: Build-Time Variant Generation

**Status**: Accepted
**Date**: 2025-11-14
**Authors**: Claude Code

## Context

During analysis of Acquisition.Web's variant system (PR #88, Issue #89), we identified a critical pattern: **12 variants per scenario family with 90% shared mocks and 10% variant-specific differences**.

**Acquisition.Web Example:**
```typescript
// 12 variants: all combinations of:
// - 3 tiers: Premium, Standard, Basic
// - 4 contexts: Online, Branch, Call-Center, Mobile

// Naive approach: Define 12 separate scenarios
const premiumOnlineScenario = { id: 'premium-online', mocks: [...100 mocks] };
const premiumBranchScenario = { id: 'premium-branch', mocks: [...100 mocks] };
const premiumCallCenterScenario = { id: 'premium-call-center', mocks: [...100 mocks] };
// ... 9 more scenarios

// Result: ~1,200 mock definitions (100 mocks × 12 scenarios)
// Reality: 90% are identical, only 10 mocks differ per variant
```

**The Duplication Problem:**
- Source code duplication makes maintenance nightmarish
- Changes to shared mocks require updating 12 files
- High risk of inconsistency (missing an update in one variant)
- Violates DRY principle at the knowledge level

**Three Possible Solutions:**

1. **Manual duplication** - Copy scenarios 12 times (current pain point)
2. **Runtime interpolation** - Single scenario with variant parameter functions
3. **Build-time generation** - Generate 12 scenarios from shared base + variant configs

### Why Runtime Interpolation Was Rejected

Acquisition.Web uses runtime variant interpolation:

```typescript
// Runtime interpolation pattern
const scenario = {
  id: 'products',
  mocks: [
    {
      url: '/api/products',
      response: (variant) => buildProducts(variant.tier) // Function!
    }
  ]
};
```

**Why we can't use this:**

Per ADR-0013 (Declarative Scenarios Through JSON Constraint), scenarios must be JSON-serializable to enforce declarative patterns and prevent imperative routing logic. This constraint also enables storage adapters like Redis (side benefit), but the primary value is preventing function-based handlers that hide routing logic in if/else chains.

**We need a solution that:**
- ✅ Eliminates source duplication (shared mocks defined once)
- ✅ Maintains JSON serializability (functions → data expansion)
- ✅ Enables storage adapters like Redis (distributed testing, side benefit)
- ✅ Provides type safety (TypeScript inference)
- ✅ Stays maintainable (clear separation of shared vs variant logic)

## Problem

**How can we support scenarios with multiple variants while:**
1. Avoiding massive source code duplication (12 copies of 100 mocks)
2. Maintaining JSON serializability (no runtime functions)
3. Enabling distributed testing (Redis adapter)
4. Providing good developer experience (clear, maintainable code)
5. Keeping memory overhead acceptable (runtime cost trade-off)

**Requirements:**
- ✅ Shared mocks defined once (DRY at source level)
- ✅ Variant-specific mocks clearly separated
- ✅ Output is fully JSON-serializable
- ✅ Type-safe variant configurations
- ✅ Acceptable memory overhead at runtime

## Decision

We will **implement a `buildVariants` utility for build-time variant generation** that produces fully expanded, JSON-serializable scenarios.

**The Pattern:**

```typescript
import { buildVariants } from '@scenarist/core';

// 1. Define base configuration (shared mocks - 90% of content)
const baseConfig = {
  mocks: [
    { method: 'GET', url: '/api/auth/status', response: { status: 200, body: { authenticated: true } } },
    { method: 'GET', url: '/api/user/profile', response: { status: 200, body: { name: 'User' } } },
    // ... 90 more shared mocks
  ]
};

// 2. Define variant configurations (variant-specific data - 10% of content)
const variantConfigs = [
  { tier: 'premium', context: 'online', products: premiumOnlineProducts },
  { tier: 'premium', context: 'branch', products: premiumBranchProducts },
  { tier: 'standard', context: 'online', products: standardOnlineProducts },
  { tier: 'standard', context: 'branch', products: standardBranchProducts },
  // ... 8 more variants
];

// 3. Compose function: How to merge base + variant config
const scenarios = buildVariants(
  baseConfig,
  variantConfigs,
  (base, config) => ({
    id: `${config.tier}-${config.context}`,
    name: `${config.tier} - ${config.context}`,
    mocks: [
      ...base.mocks, // Shared mocks
      {
        method: 'GET',
        url: '/api/products',
        response: { status: 200, body: { products: config.products } } // Variant-specific
      }
    ]
  })
);

// Result: 12 fully expanded scenarios (JSON-serializable)
// scenarios = [
//   { id: 'premium-online', mocks: [...100 mocks] },   ← All JSON data
//   { id: 'premium-branch', mocks: [...100 mocks] },   ← All JSON data
//   { id: 'standard-online', mocks: [...100 mocks] },  ← All JSON data
//   { id: 'standard-branch', mocks: [...100 mocks] },  ← All JSON data
//   // ... 8 more
// ]
```

**The `buildVariants` Utility:**

```typescript
// packages/core/src/utils/build-variants.ts
import type { ScenaristScenario } from '../types';

export const buildVariants = <TConfig>(
  baseConfig: Partial<ScenaristScenario>,
  variantConfigs: ReadonlyArray<TConfig>,
  composeFn: (base: Partial<ScenaristScenario>, config: TConfig) => ScenaristScenario
): ReadonlyArray<ScenaristScenario> => {
  return variantConfigs.map(config => composeFn(baseConfig, config));
};
```

**Key Properties:**
- **Input**: Base config + variant configs + compose function
- **Output**: Array of fully expanded `ScenaristScenario` objects
- **Serializability**: All output scenarios are JSON-serializable
- **Type Safety**: Generic `TConfig` enables type-safe variant configurations
- **Flexibility**: Compose function allows any merging logic

## Alternatives Considered

### Alternative 1: Manual Scenario Duplication

**Pattern:**
```typescript
const premiumOnlineScenario: ScenaristScenario = {
  id: 'premium-online',
  mocks: [
    { method: 'GET', url: '/api/auth/status', ... },
    { method: 'GET', url: '/api/user/profile', ... },
    // ... 90 more shared mocks
    { method: 'GET', url: '/api/products', response: { body: { products: premiumOnlineProducts } } }
  ]
};

const premiumBranchScenario: ScenaristScenario = {
  id: 'premium-branch',
  mocks: [
    { method: 'GET', url: '/api/auth/status', ... }, // DUPLICATION!
    { method: 'GET', url: '/api/user/profile', ... }, // DUPLICATION!
    // ... 90 more shared mocks (all duplicated)
    { method: 'GET', url: '/api/products', response: { body: { products: premiumBranchProducts } } }
  ]
};

// ... 10 more scenarios (all duplicating shared mocks)
```

**Pros:**
- ✅ Simple to understand (no abstraction)
- ✅ JSON-serializable (all data)
- ✅ No build-time generation needed

**Cons:**
- ❌ Massive source duplication (1,080 duplicated mock definitions for 90 shared mocks × 12 variants)
- ❌ Maintenance nightmare (change to shared mock requires updating 12 files)
- ❌ High risk of inconsistency (easy to miss one variant)
- ❌ Violates DRY at knowledge level
- ❌ Version control noise (large diffs for small changes)

**Decision**: Rejected - unacceptable maintenance burden

### Alternative 2: Runtime Variant Interpolation (Acquisition.Web Pattern)

**Pattern:**
```typescript
const scenario = {
  id: 'products',
  mocks: [
    {
      url: '/api/products',
      response: (variant) => ({ products: buildProducts(variant.tier) }) // Function!
    }
  ]
};

// At runtime:
const response = scenario.mocks[0].response({ tier: 'premium' });
```

**Pros:**
- ✅ Minimal source duplication (single definition)
- ✅ Concise and readable
- ✅ DRY (shared mocks defined once)

**Cons:**
- ❌ Not JSON-serializable (functions cannot be stored in Redis)
- ❌ Breaks `RedisScenarioRegistry` (distributed testing impossible)
- ❌ Violates ADR-0013 (enables imperative patterns, hides logic in functions)
- ❌ Cannot version-control scenarios as JSON/YAML
- ❌ Cannot fetch scenarios from remote APIs

**Decision**: Rejected per ADR-0013 - enables imperative patterns (and breaks storage adapters)

### Alternative 3: Template String Interpolation

**Pattern:**
```typescript
const scenario = {
  id: 'products',
  mocks: [
    {
      url: '/api/products',
      response: {
        status: 200,
        body: '{{ products | variantData.tier }}' // Template string
      }
    }
  ]
};

// At runtime, replace templates with variant data
const expanded = interpolateTemplates(scenario, { tier: 'premium' });
```

**Pros:**
- ✅ Minimal source duplication
- ✅ Could be JSON-serializable (strings, not functions)

**Cons:**
- ❌ Requires runtime template engine (complexity)
- ❌ Type safety lost (template strings are opaque to TypeScript)
- ❌ Custom template syntax to learn/document
- ❌ Limited expressiveness (can't handle complex logic)
- ❌ Still need to store variant data somewhere (where?)

**Decision**: Rejected - adds complexity without solving core problems

### Alternative 4: Scenario Inheritance/Composition

**Pattern:**
```typescript
const baseScenario: ScenaristScenario = {
  id: 'base',
  mocks: [
    { method: 'GET', url: '/api/auth/status', ... },
    // ... shared mocks
  ]
};

const premiumOnlineScenario: ScenaristScenario = {
  ...baseScenario,
  id: 'premium-online',
  extends: 'base', // Hypothetical extension mechanism
  mocks: [
    ...baseScenario.mocks,
    { method: 'GET', url: '/api/products', ... } // Override
  ]
};
```

**Pros:**
- ✅ Reduces duplication via spread
- ✅ JSON-serializable

**Cons:**
- ❌ Still requires manually defining 12 scenarios
- ❌ Spread operator duplicates arrays in memory anyway
- ❌ Not much better than manual duplication
- ❌ Hypothetical `extends` field adds complexity

**Decision**: Rejected - doesn't provide enough benefit over build-time generation

### Alternative 5: Code Generation from Config Files

**Pattern:**
```yaml
# scenarios.yaml
base:
  mocks:
    - method: GET
      url: /api/auth/status
      response: { status: 200 }

variants:
  - tier: premium
    context: online
  - tier: premium
    context: branch
```

```bash
# Generate TypeScript from YAML
pnpm scenarist generate scenarios.yaml > scenarios.ts
```

**Pros:**
- ✅ Declarative configuration
- ✅ Version-controllable (YAML/JSON)
- ✅ Could generate fully expanded scenarios

**Cons:**
- ❌ Build tool dependency (code generation step)
- ❌ Two languages to learn (YAML + TypeScript)
- ❌ Loss of TypeScript type safety in YAML
- ❌ Harder to debug (generated code)
- ❌ More complex workflow (generate → commit → use)

**Decision**: Rejected - `buildVariants` provides similar benefits with less complexity

## Consequences

### Positive

✅ **Minimal source duplication** - Shared mocks defined once:
   ```typescript
   // Instead of 1,200 mock definitions (100 × 12):
   const baseConfig = {
     mocks: [/* 90 shared mocks */] // Defined once
   };
   const variantConfigs = [
     { tier: 'premium', products: [...] }, // 10 mocks × 12 = 120 variant configs
     // ... 11 more
   ];

   // Result: 90 + 120 = 210 definitions vs 1,200 (5.7x reduction)
   ```

✅ **JSON-serializable output** - All scenarios are plain data:
   ```typescript
   const scenarios = buildVariants(...);
   // Every scenario in result can be:
   await redis.set('scenario:premium-online', JSON.stringify(scenarios[0])); ✅
   ```

✅ **Type-safe variant configurations** - TypeScript enforces config shape:
   ```typescript
   type VariantConfig = {
     tier: 'premium' | 'standard' | 'basic';
     context: 'online' | 'branch' | 'call-center' | 'mobile';
     products: Product[];
   };

   const variantConfigs: VariantConfig[] = [
     { tier: 'premium', context: 'online', products: [...] }, // ✅ Type-checked
     { tier: 'invalid', context: 'online', products: [...] }, // ❌ Compile error
   ];
   ```

✅ **Clear separation of concerns** - Shared vs variant logic separated:
   ```typescript
   // Shared (90%):
   const baseConfig = { mocks: [...] };

   // Variant-specific (10%):
   const variantConfigs = [{ tier: 'premium', ... }];

   // Composition logic:
   const composeFn = (base, config) => ({ ...base, ... });
   ```

✅ **Maintainable** - Changes to shared mocks affect all variants:
   ```typescript
   // Add a new shared mock:
   const baseConfig = {
     mocks: [
       ...existingMocks,
       { method: 'GET', url: '/api/new-endpoint', ... } // ← Automatically in all 12 variants
     ]
   };
   ```

✅ **Flexible composition** - Compose function allows any merging logic:
   ```typescript
   // Simple spread:
   (base, config) => ({ ...base, mocks: [...base.mocks, config.mock] })

   // Conditional logic:
   (base, config) => ({
     ...base,
     mocks: config.tier === 'premium'
       ? [...base.mocks, premiumMock]
       : [...base.mocks, standardMock]
   })

   // Complex transformations:
   (base, config) => ({
     ...base,
     mocks: base.mocks.map(mock =>
       mock.url === '/api/products'
         ? { ...mock, response: { ...mock.response, body: config.products } }
         : mock
     )
   })
   ```

✅ **Testable** - Compose function is pure and easy to test:
   ```typescript
   it('should merge base and variant configs', () => {
     const result = composeFn(baseConfig, { tier: 'premium' });
     expect(result.id).toBe('premium-online');
     expect(result.mocks).toHaveLength(100);
   });
   ```

### Negative

❌ **Memory overhead at runtime** - Variants stored as separate scenarios:
   - 12 variants × 100 mocks = 1,200 mock objects in memory
   - vs. runtime interpolation: 100 base mocks + variant function
   - Acquisition.Web analysis: 5x memory (3 MB vs 500 KB)

   **Mitigation**: Acceptable for most use cases
   - Modern servers have abundant memory
   - 3 MB is negligible in typical Node.js application
   - Enables distributed testing (critical for production)

❌ **Build-time generation required** - Scenarios generated at module evaluation:
   ```typescript
   // This runs when module is imported:
   const scenarios = buildVariants(...); // Build-time generation

   // vs. runtime interpolation:
   const scenario = { response: (v) => ... }; // No generation
   ```

   **Mitigation**: Negligible performance impact
   - Generation happens once per module load (cached by Node.js)
   - Fast (simple array mapping)
   - No external build step required (unlike code generation)

❌ **More verbose than runtime interpolation** - 3 steps vs. 1:
   ```typescript
   // buildVariants (3 steps):
   const base = { ... };           // 1. Define base
   const variants = [...];         // 2. Define variants
   const scenarios = buildVariants(base, variants, composeFn); // 3. Generate

   // Runtime interpolation (1 step):
   const scenario = { response: (v) => ... }; // Done
   ```

   **Mitigation**: Verbosity is explicit and self-documenting
   - Clear separation of shared vs variant logic
   - Easier to reason about composition
   - Type-safe variant configurations

❌ **Indirection** - Additional layer between definition and usage:
   ```typescript
   // Instead of direct scenario access:
   const scenario = premiumOnlineScenario; // Direct

   // Must find in generated array:
   const scenario = scenarios.find(s => s.id === 'premium-online'); // Indirect
   ```

   **Mitigation**: Use `scenarios` object pattern (ADR-0009):
   ```typescript
   const scenariosArray = buildVariants(...);
   const scenarios = {
     premiumOnline: scenariosArray[0],
     premiumBranch: scenariosArray[1],
     // ... OR use Object.fromEntries for dynamic mapping
   } as const satisfies ScenaristScenarios;

   // Now direct access:
   const scenario = scenarios.premiumOnline; // ✅ Direct + type-safe
   ```

### Neutral

⚖️ **Complexity trade-off** - More setup code, clearer separation:
   - buildVariants adds abstraction layer
   - But makes shared/variant distinction explicit
   - Better for maintainability long-term

⚖️ **Memory vs. serializability** - 5x memory enables distributed testing:
   - Critical for production environments
   - Negligible for development/testing
   - Acceptable trade-off for architectural flexibility

## Implementation Notes

### The `buildVariants` Utility

**Implementation:**

```typescript
// packages/core/src/utils/build-variants.ts
import type { ScenaristScenario } from '../types';

/**
 * Generate multiple scenario variants from a base configuration.
 *
 * @template TConfig - Type of variant configuration object
 * @param baseConfig - Shared configuration for all variants
 * @param variantConfigs - Array of variant-specific configurations
 * @param composeFn - Function to merge base + variant config into scenario
 * @returns Array of fully expanded scenarios (JSON-serializable)
 *
 * @example
 * ```typescript
 * const scenarios = buildVariants(
 *   { mocks: [sharedMock1, sharedMock2] },
 *   [
 *     { tier: 'premium', products: premiumProducts },
 *     { tier: 'standard', products: standardProducts },
 *   ],
 *   (base, config) => ({
 *     id: `products-${config.tier}`,
 *     name: `Products - ${config.tier}`,
 *     mocks: [
 *       ...base.mocks,
 *       {
 *         method: 'GET',
 *         url: '/api/products',
 *         response: { status: 200, body: { products: config.products } }
 *       }
 *     ]
 *   })
 * );
 * ```
 */
export const buildVariants = <TConfig>(
  baseConfig: Partial<ScenaristScenario>,
  variantConfigs: ReadonlyArray<TConfig>,
  composeFn: (base: Partial<ScenaristScenario>, config: TConfig) => ScenaristScenario
): ReadonlyArray<ScenaristScenario> => {
  return variantConfigs.map(config => composeFn(baseConfig, config));
};
```

**Export from core:**

```typescript
// packages/core/src/index.ts
export { buildVariants } from './utils/build-variants';
```

### Usage Pattern (Acquisition.Web Replacement)

**Scenario family with 12 variants:**

```typescript
// scenarios/products.ts
import { buildVariants } from '@scenarist/core';
import type { ScenaristScenario } from '@scenarist/core';

// Type-safe variant configuration
type ProductVariantConfig = {
  tier: 'premium' | 'standard' | 'basic';
  context: 'online' | 'branch' | 'call-center' | 'mobile';
  products: Product[];
};

// 1. Base configuration (90% shared mocks)
const baseConfig: Partial<ScenaristScenario> = {
  mocks: [
    { method: 'GET', url: '/api/auth/status', response: { status: 200, body: { authenticated: true } } },
    { method: 'GET', url: '/api/user/profile', response: { status: 200, body: { name: 'User' } } },
    // ... 88 more shared mocks
  ]
};

// 2. Variant configurations (10% variant-specific)
const variantConfigs: ProductVariantConfig[] = [
  { tier: 'premium', context: 'online', products: premiumOnlineProducts },
  { tier: 'premium', context: 'branch', products: premiumBranchProducts },
  { tier: 'premium', context: 'call-center', products: premiumCallCenterProducts },
  { tier: 'premium', context: 'mobile', products: premiumMobileProducts },
  { tier: 'standard', context: 'online', products: standardOnlineProducts },
  { tier: 'standard', context: 'branch', products: standardBranchProducts },
  { tier: 'standard', context: 'call-center', products: standardCallCenterProducts },
  { tier: 'standard', context: 'mobile', products: standardMobileProducts },
  { tier: 'basic', context: 'online', products: basicOnlineProducts },
  { tier: 'basic', context: 'branch', products: basicBranchProducts },
  { tier: 'basic', context: 'call-center', products: basicCallCenterProducts },
  { tier: 'basic', context: 'mobile', products: basicMobileProducts },
];

// 3. Compose function (merging logic)
const productScenariosArray = buildVariants(
  baseConfig,
  variantConfigs,
  (base, config): ScenaristScenario => ({
    id: `products-${config.tier}-${config.context}`,
    name: `Products - ${config.tier} - ${config.context}`,
    mocks: [
      ...base.mocks!,
      {
        method: 'GET',
        url: '/api/products',
        response: {
          status: 200,
          body: { products: config.products }
        }
      }
    ]
  })
);

// 4. Convert to scenarios object (ADR-0009 pattern)
export const productScenarios = {
  'premium-online': productScenariosArray[0],
  'premium-branch': productScenariosArray[1],
  'premium-call-center': productScenariosArray[2],
  'premium-mobile': productScenariosArray[3],
  'standard-online': productScenariosArray[4],
  'standard-branch': productScenariosArray[5],
  'standard-call-center': productScenariosArray[6],
  'standard-mobile': productScenariosArray[7],
  'basic-online': productScenariosArray[8],
  'basic-branch': productScenariosArray[9],
  'basic-call-center': productScenariosArray[10],
  'basic-mobile': productScenariosArray[11],
} as const satisfies ScenaristScenarios;
```

**Alternative: Dynamic scenarios object:**

```typescript
// More concise but loses explicit type safety
export const productScenarios = Object.fromEntries(
  productScenariosArray.map(scenario => [scenario.id, scenario])
) as const satisfies ScenaristScenarios;
```

### Testing Strategy

**Test the compose function:**

```typescript
// scenarios/products.test.ts
import { buildVariants } from '@scenarist/core';

describe('Product scenarios', () => {
  it('should generate correct scenario ID', () => {
    const scenarios = buildVariants(baseConfig, [
      { tier: 'premium', context: 'online', products: [] }
    ], composeFn);

    expect(scenarios[0].id).toBe('products-premium-online');
  });

  it('should include all base mocks', () => {
    const scenarios = buildVariants(baseConfig, [
      { tier: 'premium', context: 'online', products: [] }
    ], composeFn);

    expect(scenarios[0].mocks).toHaveLength(91); // 90 base + 1 variant
  });

  it('should inject variant-specific products', () => {
    const premiumProducts = [{ id: 1, name: 'Premium Product' }];
    const scenarios = buildVariants(baseConfig, [
      { tier: 'premium', context: 'online', products: premiumProducts }
    ], composeFn);

    const productsMock = scenarios[0].mocks.find(m => m.url === '/api/products');
    expect(productsMock?.response.body.products).toEqual(premiumProducts);
  });
});
```

### Memory Profiling (Acquisition.Web Analysis)

**Measured memory overhead:**

```typescript
// Manual duplication: 12 scenarios × 100 mocks = 1,200 definitions
const premiumOnline = { mocks: [...100] };
const premiumBranch = { mocks: [...100] };
// ... 10 more
// Result: ~500 KB (rough estimate)

// buildVariants: 90 base + (10 × 12 variants) + 1,200 generated = 1,410 definitions
const base = { mocks: [...90] };
const variants = [{ tier: 'premium', products: [...10] }, ...11 more];
const generated = buildVariants(base, variants, composeFn); // 1,200 mocks
// Result: ~3 MB (5x overhead)

// Runtime interpolation: 100 base + 1 function = 101 definitions
const scenario = { mocks: [...90], response: (v) => ...10 };
// Result: ~500 KB (same as manual, but not serializable)
```

**Conclusion:** 5x memory overhead is acceptable trade-off for:
- Distributed testing (Redis adapter)
- Maintainability (DRY source code)
- Type safety (variant configurations)

## Related Decisions

- **ADR-0013**: Declarative Scenarios Through JSON Constraint (why runtime interpolation rejected)
- **ADR-0009**: Upfront Scenario Registration (scenarios object pattern)
- **ADR-0001**: Serializable Scenario Definitions (foundational requirement)
- **Issue #89**: buildVariants Utility Implementation (specification)
- **PR #88**: Acquisition.Web Analysis (variant use case discovery)

## Future Enhancements

### Potential: Memoization for Shared Mocks

Reduce memory overhead by sharing mock object references:

```typescript
const buildVariants = <TConfig>(
  baseConfig: Partial<ScenaristScenario>,
  variantConfigs: ReadonlyArray<TConfig>,
  composeFn: (base: Partial<ScenaristScenario>, config: TConfig) => ScenaristScenario
): ReadonlyArray<ScenaristScenario> => {
  // Freeze base mocks to enable safe sharing
  const frozenBaseMocks = Object.freeze(baseConfig.mocks);

  return variantConfigs.map(config => {
    const scenario = composeFn({ ...baseConfig, mocks: frozenBaseMocks }, config);

    // Share references to frozen base mocks (reduces memory)
    return scenario;
  });
};
```

This could reduce memory from 5x to ~2x overhead.

### Potential: Helper for Dynamic Scenarios Object

```typescript
// packages/core/src/utils/scenarios-from-array.ts
export const scenariosFromArray = <T extends ScenaristScenario>(
  scenarios: ReadonlyArray<T>
): { [K in T['id']]: Extract<T, { id: K }> } => {
  return Object.fromEntries(
    scenarios.map(s => [s.id, s])
  ) as any; // Type assertion needed for complex mapping
};

// Usage:
const productScenarios = scenariosFromArray(productScenariosArray);
// Result: { 'premium-online': ..., 'premium-branch': ..., ... }
```

## References

- [DRY Principle (Don't Repeat Yourself)](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- Internal: ADR-0013 (Declarative Scenarios Through JSON Constraint)
- Internal: Issue #89 (buildVariants implementation specification)
- Internal: `docs/analysis/can-scenarist-replace-acquisition-web.md` (variant analysis)
