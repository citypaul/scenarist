---
description: Verify scenario definitions use declarative patterns (no imperative functions)
---

Check that all scenario-related types use declarative patterns instead of imperative functions.

## Critical Rule

Per ADR-0013 and ADR-0016, scenarios must use **declarative patterns** - no imperative functions or closures. Native RegExp is ALLOWED (it's declarative pattern matching).

## What to Check

1. **ScenaristScenario type:**
   - Must use `ScenaristMock[]` NOT `HttpHandler[]`
   - All fields must be JSON-serializable primitives or objects
   - No function types, no `() => T`, no methods

2. **ScenaristMock type:**
   - Uses `string | RegExp` for URLs (RegExp is declarative per ADR-0016)
   - Uses union types for HTTP methods (not enums with methods)
   - Match criteria use declarative patterns (not functions)

3. **ActiveScenario type:**
   - Stores only references: `scenarioId` and `variantName`
   - Does NOT store full `ScenaristScenario` object
   - Does NOT store `HttpHandler` instances

4. **ScenaristVariant type:**
   - Uses `data: unknown` NOT `value: () => T`
   - No functions for providing variant data

## Checks to Run

```bash
# Search for imperative function patterns
grep -r "HttpHandler" packages/core/src/types/ && echo "❌ Found HttpHandler in types (imperative functions)"
grep -r "() =>" packages/core/src/types/ && echo "❌ Found function types in types"
grep -r "Function" packages/core/src/types/ && echo "❌ Found Function type"
# NOTE: RegExp is ALLOWED - it's declarative pattern matching (ADR-0016)

# Verify ScenaristMock exists and is used
grep -r "ScenaristMock" packages/core/src/types/scenario.ts || echo "❌ ScenaristMock not found"

# Verify ActiveScenario is reference-based
grep "scenario:" packages/core/src/types/scenario.ts && echo "❌ ActiveScenario stores full scenario (should be reference only)"
```

## What Makes Patterns Declarative?

✅ **Declarative (ALLOWED):**

- Primitives: `string`, `number`, `boolean`, `null`
- Plain objects: `{ key: value }`
- Arrays: `ReadonlyArray<T>`
- Union types: `'GET' | 'POST'`
- Native RegExp: `/pattern/flags` (ADR-0016 - declarative pattern matching)
- Serialized regex: `{ regex: { source, flags } }`
- Match criteria: `{ headers: { 'x-tier': 'premium' } }`

❌ **Imperative (NOT ALLOWED):**

- Functions: `() => void`, `(x: T) => U`
- Closures: functions capturing external variables
- Imperative logic: `(req) => req.header === 'premium'`
- Classes: instances with methods
- Symbols, undefined, circular references

Report any imperative patterns found with:

- File path
- Type name
- Specific violation
- Recommended fix (reference ADR-0013 and ADR-0016)
