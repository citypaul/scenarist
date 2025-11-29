---
description: Verify dependency injection pattern is correct (all ports injected, never created internally)
---

Check that domain logic follows proper dependency injection - all ports are injected as parameters, never created internally.

## Critical Rule

**Domain logic must NEVER create port implementations.** All ports (ScenarioRegistry, ScenarioStore, etc.) must be injected as dependencies.

## What to Check

### 1. Factory Functions Accept All Ports

```typescript
// ❌ WRONG
export const createScenarioManager = (config: ScenaristConfig) => {
  const registry = new Map(); // Creating implementation!
  const store = new Map(); // Creating implementation!
};

// ✅ CORRECT
export const createScenarioManager = ({
  registry, // Injected
  store, // Injected
  config,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
  config: ScenaristConfig;
}) => {
  // Use injected ports
};
```

### 2. ScenarioManager Injects BOTH Registry and Store

The manager is a **coordinator** - it must have both dependencies injected:

- `ScenarioRegistry` - catalog of available scenarios
- `ScenarioStore` - active scenarios per test ID

### 3. Implementation Delegates to Ports

All methods should delegate to injected ports, not implement storage logic:

```typescript
// ✅ CORRECT
return {
  registerScenario(definition) {
    registry.register(definition);  // Delegate to injected port
  },
  switchScenario(testId, scenarioId, variantName) {
    const def = registry.get(scenarioId);  // Use injected registry
    if (!def) return { success: false, error: ... };
    store.set(testId, { scenarioId, variantName });  // Use injected store
    return { success: true, data: undefined };
  },
};
```

## Checks to Run

```bash
# Search for port creation in domain logic
grep -r "new Map" packages/core/src/domain/ && echo "❌ Found Map creation in domain (should be injected)"
grep -r "new.*Registry" packages/core/src/domain/ && echo "❌ Found Registry creation in domain"
grep -r "new.*Store" packages/core/src/domain/ && echo "❌ Found Store creation in domain"

# Check createScenarioManager signature
grep -A 10 "createScenarioManager" packages/core/src/domain/scenario-manager.ts | grep "registry" || echo "❌ registry not in createScenarioManager parameters"
grep -A 10 "createScenarioManager" packages/core/src/domain/scenario-manager.ts | grep "store" || echo "❌ store not in createScenarioManager parameters"

# Verify implementation plan matches
grep -A 20 "createScenarioManager" SCENARIST_IMPLEMENTATION_PLAN.md | grep "registry" || echo "❌ Implementation plan doesn't show registry injection"
```

## What to Look For

### Red Flags:

- `new Map` in domain logic
- `new SomeRegistry()` in domain logic
- Factory function not accepting registry/store
- Implementation contains storage logic instead of delegation

### Green Flags:

- All ports as function parameters
- Options object: `{ registry, store, config }`
- Methods call `registry.method()` or `store.method()`
- No storage logic in domain

Report any dependency injection violations with:

- File path
- Function name
- Specific violation
- Corrected example
