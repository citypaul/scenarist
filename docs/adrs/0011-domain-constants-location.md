# ADR-0011: Domain Constants Location - Mock Defaults in Config

**Status**: Proposed
**Date**: 2025-11-02
**Authors**: Claude Code

## Context

During refactoring analysis after the unified type-safe API migration, we discovered `DEFAULT_MOCK_ENABLED` constant duplicated across three adapter context files:

```typescript
// packages/express-adapter/src/context/express-request-context.ts
const DEFAULT_MOCK_ENABLED = true; // Line 29

// packages/nextjs-adapter/src/pages/context.ts
const DEFAULT_MOCK_ENABLED = true; // Line 35

// packages/nextjs-adapter/src/app/context.ts
const DEFAULT_MOCK_ENABLED = true; // Line 33
```

All three occurrences:
1. Have identical names (`DEFAULT_MOCK_ENABLED`)
2. Have identical values (`true`)
3. Serve identical purposes (default when `x-mock-enabled` header absent)
4. Are in similar code locations (within `isMockEnabled()` method)

**This is a DRY violation at the knowledge level** - the same domain knowledge ("mocks are enabled by default") exists in three places.

## Problem

**Where should domain default values live in a hexagonal architecture?**

Currently, each adapter defines its own default for mock enablement:

```typescript
// Express adapter
isMockEnabled(): boolean {
  const headerName = this.config.headers.mockEnabled.toLowerCase();
  const header = this.req.headers[headerName];

  const DEFAULT_MOCK_ENABLED = true; // ← Defined locally in adapter

  if (!header) {
    return DEFAULT_MOCK_ENABLED;
  }

  return header === 'true';
}
```

**Issues with current approach:**

1. **Duplication** - Same constant in 3 files (Express, Next.js Pages, Next.js App)
2. **Knowledge spread** - Business rule ("mocks enabled by default") scattered across adapters
3. **Fragility** - Changing default requires updating 3 files (easy to miss one)
4. **Inconsistency risk** - Adapters could drift (one says `true`, another `false`)
5. **Not discoverable** - Users can't easily see what the default is
6. **Domain logic in adapters** - Default value is domain knowledge, not adapter-specific

**Key questions:**

1. Is `DEFAULT_MOCK_ENABLED = true` domain knowledge or adapter implementation detail?
2. Should different adapters be allowed to have different defaults?
3. Where is the best place for default values in hexagonal architecture?
4. How do we balance DRY with adapter independence?

## Decision

**We will move `DEFAULT_MOCK_ENABLED` to core config as a DEFAULT constant.**

The default value for mock enablement is **domain knowledge** that belongs in the core package, not in individual adapter implementations.

### The Pattern

**Core Package (`@scenarist/core`):**

```typescript
// packages/core/src/types/config.ts

/**
 * Default values for Scenarist configuration.
 * These represent domain-level decisions about how Scenarist should behave.
 */
export const CONFIG_DEFAULTS = {
  /**
   * Whether mocks are enabled when x-mock-enabled header is absent.
   * Default: true (mocks enabled unless explicitly disabled)
   */
  MOCK_ENABLED: true,

  /**
   * Default test ID when x-test-id header is absent.
   */
  TEST_ID: 'default-test',

  /**
   * HTTP header names for test isolation and control.
   */
  HEADERS: {
    TEST_ID: 'x-test-id',
    MOCK_ENABLED: 'x-mock-enabled',
  },

  /**
   * HTTP endpoint paths for scenario control.
   */
  ENDPOINTS: {
    SET_SCENARIO: '/__scenario__',
    GET_SCENARIO: '/__scenario__',
  },

  /**
   * Strict mode (unmocked requests return 501).
   * Default: false (passthrough to real APIs)
   */
  STRICT_MODE: false,
} as const;
```

**Adapter Implementations Use CONFIG_DEFAULTS:**

```typescript
// packages/express-adapter/src/context/express-request-context.ts
import { CONFIG_DEFAULTS } from '@scenarist/core';

export class ExpressRequestContext implements RequestContext {
  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers[headerName];

    if (!header) {
      return CONFIG_DEFAULTS.MOCK_ENABLED; // ✅ Use core default
    }

    return header === 'true';
  }
}
```

```typescript
// packages/nextjs-adapter/src/pages/context.ts
import { CONFIG_DEFAULTS } from '@scenarist/core';

export class PagesRequestContext implements RequestContext {
  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers[headerName];

    if (!header) {
      return CONFIG_DEFAULTS.MOCK_ENABLED; // ✅ Use core default
    }

    return header === 'true';
  }
}
```

```typescript
// packages/nextjs-adapter/src/app/context.ts
import { CONFIG_DEFAULTS } from '@scenarist/core';

export class AppRequestContext implements RequestContext {
  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers.get(headerName);

    if (!header) {
      return CONFIG_DEFAULTS.MOCK_ENABLED; // ✅ Use core default
    }

    return header === 'true';
  }
}
```

### Why This Is Domain Knowledge

`DEFAULT_MOCK_ENABLED = true` represents a **domain-level decision** about Scenarist's behavior:

1. **Business rule** - "Mocks should be enabled unless explicitly disabled"
2. **Applies to all adapters** - Express, Next.js, Fastify, Hono, etc. all share this rule
3. **User-visible behavior** - Affects how Scenarist works, not just implementation detail
4. **Should be consistent** - Different adapters having different defaults would be confusing

**Contrast with adapter-specific logic:**
- How to read headers (Express vs Next.js API) → **Adapter concern**
- Whether mocks are enabled by default → **Domain concern**

### Export from Core Package

```typescript
// packages/core/src/index.ts
export { CONFIG_DEFAULTS } from './types/config.js';
export type { ScenaristConfig, ScenaristConfigInput } from './types/config.js';
```

All adapters can import:
```typescript
import { CONFIG_DEFAULTS } from '@scenarist/core';
```

## Rationale

### Why Core Package?

1. **Single source of truth** - One place defines domain defaults
2. **Consistency guaranteed** - All adapters use same defaults
3. **Easy to change** - Modify once, all adapters updated
4. **Discoverable** - Users can import `CONFIG_DEFAULTS` to see what defaults are
5. **Domain knowledge belongs in core** - Hexagonal architecture principle
6. **Prevents drift** - Adapters can't accidentally diverge

### Why Not in Config Builder?

**Alternative considered:** Use config values from `buildConfig()`:

```typescript
export const buildConfig = <T extends ScenariosObject>(
  input: ScenaristConfigInput<T>
): ScenaristConfig => {
  return {
    enabled: input.enabled,
    strictMode: input.strictMode ?? false,
    defaultMockEnabled: true, // ← Add to config object
    // ...
  };
};
```

**Problem:** Config is per-adapter-instance, but default is a constant.

```typescript
// Express adapter
isMockEnabled(): boolean {
  if (!header) {
    return this.config.defaultMockEnabled; // ← Accessing instance config
  }
}
```

**Issues:**
- Config object isn't passed to RequestContext currently (could be added)
- Config is mutable state (conceptually), default is immutable constant
- More complex: `this.config.defaultMockEnabled` vs `CONFIG_DEFAULTS.MOCK_ENABLED`
- Doesn't solve discoverability (still not clear what default is without creating config)

**Verdict:** Static constant is clearer for immutable defaults.

### Why `CONFIG_DEFAULTS` Object?

**Alternative considered:** Individual named exports:

```typescript
export const DEFAULT_MOCK_ENABLED = true;
export const DEFAULT_TEST_ID = 'default-test';
export const DEFAULT_STRICT_MODE = false;
```

**Problem:** Scattered constants, no clear grouping.

**Benefit of object:**
- Groups related constants together
- Clear namespace (`CONFIG_DEFAULTS.MOCK_ENABLED`)
- Easy to extend (add new defaults)
- Can export as single const object (`as const` for type inference)

**Verdict:** Object is clearer and more maintainable.

## Alternatives Considered

### Alternative 1: Keep Duplicated Constants (Status Quo)

**Pattern:**
```typescript
// Each adapter defines its own
const DEFAULT_MOCK_ENABLED = true;
```

**Pros:**
- ✅ Adapters fully independent
- ✅ No changes needed

**Cons:**
- ❌ Duplication (3 occurrences)
- ❌ Knowledge spread across adapters
- ❌ Risk of inconsistency
- ❌ Violates DRY principle

**Decision**: Rejected - violates DRY at knowledge level

### Alternative 2: Add to ScenaristConfig Type

**Pattern:**
```typescript
export type ScenaristConfig = {
  readonly enabled: boolean;
  readonly defaultMockEnabled: boolean; // ← Add to config type
  // ...
};

export const buildConfig = <T>(input: ScenaristConfigInput<T>): ScenaristConfig => {
  return {
    enabled: input.enabled,
    defaultMockEnabled: input.defaultMockEnabled ?? true,
    // ...
  };
};
```

**Pros:**
- ✅ Per-instance configurability
- ✅ Flexible (users can change default)

**Cons:**
- ❌ More configuration burden (another parameter)
- ❌ Not truly configurable (shouldn't change per instance)
- ❌ Adds complexity without benefit
- ❌ Default is constant, not configuration

**Decision**: Rejected - default is constant, not configuration

### Alternative 3: Environment Variable

**Pattern:**
```typescript
const DEFAULT_MOCK_ENABLED = process.env.SCENARIST_DEFAULT_MOCK_ENABLED === 'true';
```

**Pros:**
- ✅ Runtime configurability

**Cons:**
- ❌ Hides default (not visible in code)
- ❌ Environment-dependent behavior (confusing)
- ❌ Not serializable (violates ADR-0001)
- ❌ Overkill for simple constant

**Decision**: Rejected - environment variables for runtime config, not defaults

### Alternative 4: Per-Adapter Configuration

**Pattern:**
```typescript
// Express adapter
export const EXPRESS_DEFAULTS = {
  MOCK_ENABLED: true,
};

// Next.js adapter
export const NEXTJS_DEFAULTS = {
  MOCK_ENABLED: true,
};
```

**Pros:**
- ✅ Adapters can have different defaults (if needed)

**Cons:**
- ❌ Still duplicated knowledge
- ❌ Inconsistency risk (adapters drift)
- ❌ Users expect consistent behavior across adapters
- ❌ No use case for different defaults per adapter

**Decision**: Rejected - no reason for adapters to differ

## Consequences

### Positive

✅ **Single source of truth** - `CONFIG_DEFAULTS.MOCK_ENABLED` defined once:
   ```typescript
   // packages/core/src/types/config.ts
   export const CONFIG_DEFAULTS = {
     MOCK_ENABLED: true,
     // ...
   } as const;
   ```

✅ **DRY principle satisfied** - Knowledge not duplicated across adapters

✅ **Consistency guaranteed** - All adapters use same default (can't drift)

✅ **Easy to change** - Modify one constant, all adapters updated

✅ **Discoverable** - Users can import `CONFIG_DEFAULTS` to see defaults:
   ```typescript
   import { CONFIG_DEFAULTS } from '@scenarist/core';
   console.log(CONFIG_DEFAULTS.MOCK_ENABLED); // true
   ```

✅ **Domain knowledge in core** - Hexagonal architecture principle maintained

✅ **Better documentation** - JSDoc on constants explains domain decisions:
   ```typescript
   /**
    * Whether mocks are enabled when x-mock-enabled header is absent.
    * Default: true (mocks enabled unless explicitly disabled)
    *
    * Rationale: Scenarist is a testing library - tests expect mocks
    * to be active. Explicit opt-out (x-mock-enabled: false) is clearer
    * than explicit opt-in.
    */
   MOCK_ENABLED: true,
   ```

✅ **Future extensibility** - Can add more defaults to `CONFIG_DEFAULTS`:
   ```typescript
   export const CONFIG_DEFAULTS = {
     MOCK_ENABLED: true,
     TEST_ID: 'default-test',
     STRICT_MODE: false,
     // Future: RESPONSE_DELAY: 0, etc.
   } as const;
   ```

### Negative

❌ **Import dependency** - Adapters must import from core:
   ```typescript
   import { CONFIG_DEFAULTS } from '@scenarist/core';
   ```
   **Note**: Adapters already depend on core, so no new dependency.

❌ **Not overridable per adapter** - All adapters use same default:
   ```typescript
   // Can't do this:
   // Express uses MOCK_ENABLED = true
   // Next.js uses MOCK_ENABLED = false
   ```
   **Note**: No use case for this - consistency is desirable.

### Neutral

⚖️ **Constants file grows** - More defaults added over time
   - Manageable: Keep constants organized in object

⚖️ **Breaking change for users?** - No, implementation detail only
   - Users don't access `DEFAULT_MOCK_ENABLED` directly
   - Behavior stays identical (still defaults to `true`)

## Implementation Notes

### Step 1: Add `CONFIG_DEFAULTS` to Core

```typescript
// packages/core/src/types/config.ts

/**
 * Default values for Scenarist configuration.
 * These represent domain-level decisions about how Scenarist should behave.
 */
export const CONFIG_DEFAULTS = {
  /**
   * Whether mocks are enabled when x-mock-enabled header is absent.
   * Default: true (mocks enabled unless explicitly disabled)
   *
   * Rationale: Scenarist is a testing library - tests expect mocks
   * to be active. Explicit opt-out (x-mock-enabled: false) is clearer
   * than explicit opt-in.
   */
  MOCK_ENABLED: true,

  /**
   * Default test ID when x-test-id header is absent.
   */
  TEST_ID: 'default-test',

  /**
   * HTTP header names for test isolation and control.
   */
  HEADERS: {
    TEST_ID: 'x-test-id',
    MOCK_ENABLED: 'x-mock-enabled',
  },

  /**
   * HTTP endpoint paths for scenario control.
   */
  ENDPOINTS: {
    SET_SCENARIO: '/__scenario__',
    GET_SCENARIO: '/__scenario__',
  },

  /**
   * Strict mode (unmocked requests return 501).
   * Default: false (passthrough to real APIs)
   */
  STRICT_MODE: false,
} as const;
```

### Step 2: Export from Core Package

```typescript
// packages/core/src/index.ts
export { CONFIG_DEFAULTS } from './types/config.js';
```

### Step 3: Update Express Adapter

```typescript
// packages/express-adapter/src/context/express-request-context.ts
import type { RequestContext, ScenaristConfig } from '@scenarist/core';
import { CONFIG_DEFAULTS } from '@scenarist/core'; // ← Add import

export class ExpressRequestContext implements RequestContext {
  // ...

  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers[headerName];

    // Remove: const DEFAULT_MOCK_ENABLED = true;

    if (!header) {
      return CONFIG_DEFAULTS.MOCK_ENABLED; // ← Use core default
    }

    return header === 'true';
  }
}
```

### Step 4: Update Next.js Pages Adapter

```typescript
// packages/nextjs-adapter/src/pages/context.ts
import type { RequestContext, ScenaristConfig } from '@scenarist/core';
import { CONFIG_DEFAULTS } from '@scenarist/core'; // ← Add import

export class PagesRequestContext implements RequestContext {
  // ...

  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers[headerName];

    // Remove: const DEFAULT_MOCK_ENABLED = true;

    if (!header) {
      return CONFIG_DEFAULTS.MOCK_ENABLED; // ← Use core default
    }

    return header === 'true';
  }
}
```

### Step 5: Update Next.js App Adapter

```typescript
// packages/nextjs-adapter/src/app/context.ts
import type { RequestContext, ScenaristConfig } from '@scenarist/core';
import { CONFIG_DEFAULTS } from '@scenarist/core'; // ← Add import

export class AppRequestContext implements RequestContext {
  // ...

  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers.get(headerName);

    // Remove: const DEFAULT_MOCK_ENABLED = true;

    if (!header) {
      return CONFIG_DEFAULTS.MOCK_ENABLED; // ← Use core default
    }

    return header === 'true';
  }
}
```

### Step 6: Optionally Use CONFIG_DEFAULTS in buildConfig()

```typescript
// packages/core/src/domain/config-builder.ts
import { CONFIG_DEFAULTS } from '../types/config.js';

export const buildConfig = <T extends ScenariosObject>(
  input: ScenaristConfigInput<T>
): ScenaristConfig => {
  return {
    enabled: input.enabled,
    strictMode: input.strictMode ?? CONFIG_DEFAULTS.STRICT_MODE, // ← Use default
    headers: {
      testId: input.headers?.testId ?? CONFIG_DEFAULTS.HEADERS.TEST_ID,
      mockEnabled: input.headers?.mockEnabled ?? CONFIG_DEFAULTS.HEADERS.MOCK_ENABLED,
    },
    endpoints: {
      setScenario: input.endpoints?.setScenario ?? CONFIG_DEFAULTS.ENDPOINTS.SET_SCENARIO,
      getScenario: input.endpoints?.getScenario ?? CONFIG_DEFAULTS.ENDPOINTS.GET_SCENARIO,
    },
    defaultScenarioId: input.defaultScenarioId,
    defaultTestId: input.defaultTestId ?? CONFIG_DEFAULTS.TEST_ID, // ← Use default
  };
};
```

This ensures `buildConfig()` and `isMockEnabled()` use the same defaults (single source of truth).

### Step 7: Add Tests

```typescript
// packages/core/tests/config-defaults.test.ts
import { CONFIG_DEFAULTS } from '../src/index.js';

describe('CONFIG_DEFAULTS', () => {
  it('should have MOCK_ENABLED = true', () => {
    expect(CONFIG_DEFAULTS.MOCK_ENABLED).toBe(true);
  });

  it('should have TEST_ID = "default-test"', () => {
    expect(CONFIG_DEFAULTS.TEST_ID).toBe('default-test');
  });

  it('should have STRICT_MODE = false', () => {
    expect(CONFIG_DEFAULTS.STRICT_MODE).toBe(false);
  });

  it('should be immutable (as const)', () => {
    // TypeScript enforces this at compile time
    // @ts-expect-error - Cannot assign to readonly property
    CONFIG_DEFAULTS.MOCK_ENABLED = false;
  });
});
```

### Step 8: Update Documentation

Add to core package README:

```markdown
## Configuration Defaults

Scenarist uses sensible defaults for configuration values. You can import these
to see what the defaults are:

\`\`\`typescript
import { CONFIG_DEFAULTS } from '@scenarist/core';

console.log(CONFIG_DEFAULTS);
// {
//   MOCK_ENABLED: true,
//   TEST_ID: 'default-test',
//   STRICT_MODE: false,
//   HEADERS: { TEST_ID: 'x-test-id', MOCK_ENABLED: 'x-mock-enabled' },
//   ENDPOINTS: { SET_SCENARIO: '/__scenario__', GET_SCENARIO: '/__scenario__' }
// }
\`\`\`

These constants represent domain-level decisions about how Scenarist behaves.
They are used internally by all adapters to ensure consistent behavior.
```

## Related Decisions

- **ADR-0001**: Serializable Scenario Definitions (CONFIG_DEFAULTS must be serializable)
- **ADR-0008**: Type-Safe Scenario IDs (uses `CONFIG_DEFAULTS.TEST_ID`)
- Hexagonal Architecture principle: Domain knowledge belongs in core, not adapters

## Future Enhancements

### Potential: User-Overridable Defaults

If users need to override defaults globally (rare), could expose in config:

```typescript
export type ScenaristConfigInput<T extends ScenariosObject> = {
  // ...existing fields
  defaults?: {
    mockEnabled?: boolean;
    testId?: string;
  };
};

export const buildConfig = <T>(input: ScenaristConfigInput<T>): ScenaristConfig => {
  const mockEnabledDefault = input.defaults?.mockEnabled ?? CONFIG_DEFAULTS.MOCK_ENABLED;
  const testIdDefault = input.defaults?.testId ?? CONFIG_DEFAULTS.TEST_ID;

  return {
    // ...existing fields
    defaultMockEnabled: mockEnabledDefault,
    defaultTestId: testIdDefault,
  };
};
```

**Deferring this unless users request it** - YAGNI principle.

## References

- [DRY Principle (Don't Repeat Yourself)](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [Hexagonal Architecture: Domain Knowledge in Core](https://alistair.cockburn.us/hexagonal-architecture/)
- Internal: refactor-scan analysis (identified DEFAULT_MOCK_ENABLED duplication)
- Internal: ADR-0001 (Serializable Scenario Definitions)
- Internal: CLAUDE.md section on "Domain Knowledge Location: Mock Defaults"
