---
description: Verify scenario definitions are serializable (no functions, closures, or classes)
---

Check that all scenario-related types are serializable to enable distributed testing.

## Critical Rule

Per ADR-0001, scenarios must be **pure JSON** - no functions, closures, regex, or class instances.

## What to Check

1. **ScenaristScenario type:**
   - Must use `ScenaristMock[]` NOT `HttpHandler[]`
   - All fields must be JSON-serializable primitives or objects
   - No function types, no `() => T`, no methods

2. **ScenaristMock type:**
   - Uses plain strings for URLs (not regex)
   - Uses union types for HTTP methods (not enums with methods)
   - Response body is `unknown` (must be JSON-serializable at runtime)

3. **ActiveScenario type:**
   - Stores only references: `scenarioId` and `variantName`
   - Does NOT store full `ScenaristScenario` object
   - Does NOT store `HttpHandler` instances

4. **ScenaristVariant type:**
   - Uses `data: unknown` NOT `value: () => T`
   - No functions for providing variant data

## Checks to Run

```bash
# Search for non-serializable patterns
grep -r "HttpHandler" packages/core/src/types/ && echo "❌ Found HttpHandler in types (not serializable)"
grep -r "() =>" packages/core/src/types/ && echo "❌ Found function types in types"
grep -r "Function" packages/core/src/types/ && echo "❌ Found Function type"
grep -r "RegExp" packages/core/src/types/ && echo "❌ Found RegExp in types"

# Verify ScenaristMock exists and is used
grep -r "ScenaristMock" packages/core/src/types/scenario.ts || echo "❌ ScenaristMock not found"

# Verify ActiveScenario is reference-based
grep "scenario:" packages/core/src/types/scenario.ts && echo "❌ ActiveScenario stores full scenario (should be reference only)"
```

## What Makes Data Serializable?

✅ **Serializable:**
- Primitives: `string`, `number`, `boolean`, `null`
- Plain objects: `{ key: value }`
- Arrays: `ReadonlyArray<T>`
- Union types: `'GET' | 'POST'`
- `unknown` (runtime validation required)

❌ **NOT Serializable:**
- Functions: `() => void`, `(x: T) => U`
- Closures: functions capturing variables
- Classes: instances with methods
- Regex: `/pattern/`
- Symbols, undefined, circular references

Report any non-serializable types found with:
- File path
- Type name
- Specific violation
- Recommended fix (reference ADR-0001)
