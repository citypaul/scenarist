---
description: Guide for adding a new feature following TDD and hexagonal architecture
---

Step-by-step guide for adding a new feature to Scenarist following TDD and hexagonal architecture principles.

## The Process (TDD + Hexagonal)

### Phase 1: Design (Think First)

1. **Identify the feature:**
   - What behavior are we adding?
   - Who is the consumer of this feature?
   - What port does this belong to?

2. **Check architecture fit:**
   - Is this core domain logic?
   - Is this a new port or extension of existing?
   - Does it need a new adapter?

3. **Plan the types:**
   - What data structures are needed?
   - Are they serializable?
   - Do they use `readonly`?

### Phase 2: Types (Define Data First)

**If new types are needed:**

1. Create type definitions in `packages/core/src/types/`
2. Use `type` with `readonly` fields
3. Ensure all types are serializable (no functions!)
4. Export from `packages/core/src/types/index.ts`

```typescript
// packages/core/src/types/new-feature.ts
export type NewFeature = {
  readonly id: string;
  readonly name: string;
  readonly data: unknown;  // Must be JSON-serializable
};
```

### Phase 3: Ports (Define Behavior)

**If new port is needed:**

1. Use `/create-port` command to scaffold
2. Define interface in `packages/core/src/ports/`
3. Document with comprehensive JSDoc
4. List multiple possible implementations
5. Export from `packages/core/src/ports/index.ts`

```typescript
// packages/core/src/ports/new-port.ts
export interface NewPort {
  doSomething(data: NewFeature): Result<void, Error>;
}
```

### Phase 4: Tests (RED - Write Failing Tests)

**Start with tests for desired behavior:**

1. Create test file in `packages/core/tests/`
2. Write tests for expected behavior (they will fail)
3. Test through public API only
4. Cover happy path, edge cases, and errors

```typescript
// packages/core/tests/new-feature.test.ts
describe('NewFeature', () => {
  it('should do expected behavior', () => {
    const result = feature.doSomething(data);
    expect(result.success).toBe(true);
  });

  it('should handle error case', () => {
    const result = feature.doSomething(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.message).toContain('expected error');
  });
});
```

### Phase 5: Implementation (GREEN - Make Tests Pass)

**Minimal implementation to pass tests:**

1. Create implementation in `packages/core/src/domain/`
2. Follow dependency injection (inject all ports)
3. Use factory function pattern
4. Delegate to injected ports

```typescript
// packages/core/src/domain/new-feature.ts
export const createNewFeature = ({
  dependency1,
  dependency2,
}: {
  dependency1: SomePort;
  dependency2: AnotherPort;
}): NewPort => {
  return {
    doSomething(data) {
      // Minimal implementation
      const result = dependency1.validate(data);
      if (!result.success) return result;

      dependency2.persist(data);
      return { success: true, data: undefined };
    },
  };
};
```

### Phase 6: Refactor (Clean Up)

**If tests pass, assess refactoring opportunities:**

1. Commit working code: `git add . && git commit -m "feat: add new feature"`
2. Look for improvements:
   - Can names be clearer?
   - Can logic be simplified?
   - Are there magic numbers?
   - Should constants be extracted?
3. Refactor if valuable (keep tests green)
4. Commit refactor separately: `git commit -m "refactor: extract constants"`

### Phase 7: Adapter (If Needed)

**If new port needs implementation:**

1. Use `/create-adapter` command
2. Decide: core (in-memory) or external package?
3. Explicitly implement port: `implements NewPort`
4. Write tests for adapter
5. Document usage

```typescript
// packages/core/src/adapters/in-memory-new.ts
export class InMemoryNewPort implements NewPort {
  private readonly data = new Map();

  doSomething(data: NewFeature): Result<void, Error> {
    // Implementation
  }
}
```

### Phase 8: Documentation

**Update documentation:**

1. **CLAUDE.md** - If new patterns introduced
2. **Implementation Plan** - If approach changed
3. **ADR** - If significant architectural decision
4. **README** - If user-facing feature

### Phase 9: Integration

**Wire it all together:**

1. Export from main package
2. Update examples if needed
3. Add to adapters documentation
4. Consider adding integration test

## Checklist

Before committing:

- [ ] All tests passing (100% coverage)
- [ ] All new code has tests written FIRST
- [ ] Types are serializable (no functions)
- [ ] Ports use `interface`, types use `type` with `readonly`
- [ ] Dependencies are injected, not created
- [ ] Adapters explicitly implement ports
- [ ] Code is self-documenting (no comments)
- [ ] Documentation updated (if needed)
- [ ] TypeScript strict mode passes
- [ ] Linting passes

## Common Mistakes to Avoid

❌ **Writing implementation before tests**
→ Always RED (test) → GREEN (code) → REFACTOR

❌ **Creating port implementations in domain logic**
→ Inject all dependencies

❌ **Using functions in types**
→ Keep types serializable

❌ **Testing implementation details**
→ Test behavior through public API

❌ **Forgetting to explicitly implement ports**
→ Use `implements PortName`

## Example: Adding a New Scenario Variant Feature

1. **Types:** Create `VariantDefinition` type
2. **Port:** Extend `ScenarioRegistry` with variant methods
3. **Tests:** Write tests for variant behavior
4. **Implementation:** Update `createScenarioManager` to handle variants
5. **Adapter:** Update `InMemoryScenarioRegistry` to store variants
6. **Docs:** Update CLAUDE.md with variant pattern

Remember: **Test First, Always!**
