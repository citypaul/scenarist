---
description: Scaffold a new adapter implementing a port interface
---

Create a new adapter that implements a port interface following Scenarist's hexagonal architecture.

**Ask the user:**

1. Which port are you implementing? (e.g., "ScenarioRegistry", "ScenarioStore")
2. What is the adapter name? (e.g., "InMemoryScenarioRegistry", "RedisScenarioStore")
3. What technology/approach does it use? (e.g., "Map-based in-memory", "Redis client", "File system")
4. Should this be in core or a separate package?
   - Core: Simple, zero-dependency implementations (e.g., InMemory adapters)
   - Separate package: Framework-specific or external dependency implementations

## Adapter Template

```typescript
import type { [PortName] } from '@scenarist/core';
import type { [RelevantTypes] } from '@scenarist/core';

/**
 * [Description of what this adapter does]
 *
 * **Implementation Details:**
 * - Uses [technology/approach]
 * - [Key characteristic 1]
 * - [Key characteristic 2]
 *
 * **Use Cases:**
 * - [When to use this implementation]
 * - [Performance characteristics]
 * - [Limitations or constraints]
 *
 * @example
 * \`\`\`typescript
 * const [adapterInstance] = new [AdapterName]();
 * // Usage example
 * \`\`\`
 */
export class [AdapterName] implements [PortName] {
  // Private state
  private readonly [internalState]: [Type];

  /**
   * Creates a new [AdapterName] instance.
   *
   * @param [dependency] [Description if constructor takes dependencies]
   */
  constructor([dependencies]?: [DependencyType]) {
    // Initialize
  }

  // Implement all port methods...

  /**
   * [Method documentation matching port interface]
   */
  [methodName]([params]): [ReturnType] {
    // Implementation
  }
}
```

## Checklist

After creating the adapter:

1. **Explicit implementation:**

   ```typescript
   export class [AdapterName] implements [PortName] {
   ```

   - MUST use `implements` keyword
   - TypeScript will verify all methods are implemented

2. **File location:**
   - Core adapters: `packages/core/src/adapters/[adapter-name].ts`
   - External: `packages/[adapter-name]/src/index.ts`

3. **Export:**
   - Core: Add to `packages/core/src/index.ts`
   - External: Configure `package.json` exports

4. **Dependencies:**
   - Core adapters: ZERO external dependencies
   - External adapters: Add to `package.json` dependencies

5. **Testing:**
   - Test file: `tests/[adapter-name].test.ts`
   - Test all port interface methods
   - Test edge cases and error conditions
   - Verify behavior matches port contract

6. **Documentation:**
   - Clear class JSDoc
   - Document implementation approach
   - Explain when to use this adapter
   - Show example usage

## Rules for Core Adapters (in-memory)

✅ **Must have:**

- Zero external dependencies
- Simple, Map/Set-based implementations
- Fast and lightweight
- Good for single-process scenarios

❌ **Cannot have:**

- External libraries (Redis, file system, etc.)
- Framework dependencies
- Complex logic

## Rules for External Adapters

✅ **Must have:**

- Own package in `packages/[adapter-name]/`
- Peer dependency on `@scenarist/core`
- Explicit `implements PortName`
- Comprehensive tests
- README with usage examples

✅ **Should have:**

- TypeScript strict mode
- Same linting rules as core
- Example in README

## Testing Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { [AdapterName] } from '../src/[adapter-name]';
import type { [PortName] } from '@scenarist/core';

describe('[AdapterName]', () => {
  let adapter: [PortName];

  beforeEach(() => {
    adapter = new [AdapterName]();
  });

  it('should implement [PortName] interface', () => {
    // TypeScript will error if it doesn't
    expect(adapter).toBeDefined();
  });

  describe('[methodName]', () => {
    it('should [expected behavior]', () => {
      // Test implementation
    });
  });
});
```

## After Creation

1. Verify TypeScript compilation succeeds
2. Run tests and ensure 100% coverage
3. Update implementation plan if needed
4. Add example usage to README
5. Consider adding to main package exports
