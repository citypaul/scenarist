# ADR-0017: Return `null` Instead of `undefined` for Missing State in Pure Templates

**Status**: Accepted
**Date**: 2025-11-23
**Authors**: Claude Code, Paul Hammond
**Supersedes**: [ADR-0012](./0012-template-missing-state-undefined.md)

## Context

[ADR-0012](./0012-template-missing-state-undefined.md) decided that pure templates with missing state keys should return `undefined`. This was implemented and tested across all packages.

### The JSON Serialization Problem

During production E2E test development, we discovered a critical flaw: **`undefined` values are omitted during JSON serialization, breaking API contracts**.

```typescript
// Scenario mock
{
  response: {
    body: {
      items: "{{state.cartItems}}"; // No state exists yet
    }
  }
}

// With undefined (ADR-0012 behavior):
const result = { items: undefined };
JSON.stringify(result); // => "{}"  ← Field disappears!

// With null (new behavior):
const result = { items: null };
JSON.stringify(result); // => '{"items":null}'  ← Field preserved!
```

**Real-world impact:**

```typescript
// Test flow: Add product 1 twice, product 2 once
// Expected: 2 unique products in cart with quantities [2, 1]
// Actual: Test fails - cart shows only 1 product

// Root cause:
// 1. First GET /cart returns {items: undefined}
// 2. JSON.stringify removes the field entirely: {}
// 3. API handler's fallback `data.items ?? []` receives {}
// 4. Accessing {}.items returns undefined, fallback returns []
// 5. PATCH tries to append to [], losing previous state
```

### Why ADR-0012 Evaluation Was Incomplete

ADR-0012 listed JSON serialization as a "con" but underestimated its severity:

> ❌ **JSON.stringify omits undefined values (may be unexpected)**

This is not "unexpected" - it's **fundamentally broken for JSON APIs**:

- Response shape changes based on state existence
- Fields disappear silently
- No error, just missing data
- Violates API contract consistency

## Decision

**Pure templates with missing state keys return `null` instead of `undefined`.**

```typescript
// Core implementation change (template-replacement.ts)
// Before (ADR-0012): return resolvedValue !== undefined ? resolvedValue : undefined;
// After  (ADR-0017): return resolvedValue !== undefined ? resolvedValue : null;
```

**Impact:**

- Pure template `"{{state.missing}}"` with no state → returns `null` (not `undefined`)
- Mixed template `"Count: {{state.missing}}"` → returns `"Count: {{state.missing}}"` (unchanged)
- Pure template with valid state → returns actual state value (unchanged)

## Rationale

### Why `null` is Superior for JSON APIs

1. **JSON Semantics**: `null` is a valid JSON value, `undefined` is not
2. **Field Preservation**: Fields remain in serialized objects
3. **API Contract Stability**: Response shape doesn't change based on state existence
4. **Explicit "No Value"**: `null` semantically means "intentionally empty"
5. **Standard HTTP**: HTTP APIs use `null` to represent missing/empty values

### Re-Evaluating ADR-0012's Rejection of `null`

ADR-0012 rejected `null` for these reasons:

| ADR-0012 Con                                   | 2025-11-23 Response                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| "Inconsistent with JavaScript property access" | True, but API serialization is more important than property access semantics |
| "Requires explicit null checks"                | `value ?? []` handles both null and undefined                                |
| "TypeScript types need explicit `\| null`"     | Small price for JSON safety                                                  |

**The key insight:** Scenarist is primarily used for **API mocking**, not general JavaScript object manipulation. JSON serialization semantics trump JavaScript property access semantics.

### Why Not Keep `undefined`?

Defensive code doesn't solve the problem:

```typescript
// Can't fix with defensive code in API handler
export async function GET(request: NextRequest) {
  const response = await fetch("http://localhost:3001/cart", {
    headers: { ...getScenaristHeaders(request) },
  });

  const data = await response.json(); // Too late - JSON parsing already lost the field!

  // This won't help because data = {}, not {items: undefined}
  return NextResponse.json({
    items: data.items ?? [], // data.items is undefined because field missing
  });
}
```

The undefined→omission happens **during serialization in the mock layer**, before the API handler sees it.

## Implementation

### Changes Made

**1. Core Template Replacement (packages/core/src/domain/template-replacement.ts)**

```typescript
// Line 30: Changed undefined → null
return resolvedValue !== undefined ? resolvedValue : null;
```

**2. Test Updates**

Updated 5 tests across 2 files to expect `null` instead of `undefined`:

- `packages/core/tests/template-replacement.test.ts`:
  - `should return null when pure template state key is missing`
  - `should return null for pure template when prefix is null`
  - `should return null for pure template when prefix is not an object`
  - **New test**: `should preserve field with null when template value is missing (JSON serialization safe)`

- `packages/core/tests/response-selector.test.ts`:
  - `should handle template referencing non-existent params prefix`
  - `should use empty params fallback when stateManager exists but params is undefined`

**3. Test Coverage**

- All 315 core tests passing
- JSON serialization explicitly tested
- Backward compatibility: applications can use `?? []` for both null and undefined

### Migration Impact

**For consumers:**

Applications already using optional chaining or nullish coalescing work unchanged:

```typescript
// These patterns handle both null and undefined:
const items = data.items ?? []; // ✅ Works with null
const items = data.items || []; // ✅ Works with null
const items = data.items ? data.items : []; // ✅ Works with null
```

**Breaking change only affects:**

```typescript
// Code that explicitly checks for undefined (rare):
if (data.items === undefined) { ... }  // ❌ Now false (items is null)

// Fix:
if (data.items == null) { ... }        // ✅ Checks both null and undefined
```

## Consequences

### Positive

✅ **JSON serialization safety** - Fields preserved in serialized objects

✅ **API contract stability** - Response shape consistent regardless of state

✅ **Standard HTTP semantics** - `null` is the standard "no value" in JSON APIs

✅ **Explicit signaling** - `null` clearly means "no value" vs accidental undefined

✅ **No silent failures** - Fields don't disappear mysteriously

✅ **Works with standard patterns** - `?? []` handles both null and undefined

### Negative

❌ **Breaking change** - Supersedes ADR-0012 decision

❌ **TypeScript verbosity** - Types need `| null` instead of optional `?`

❌ **JavaScript inconsistency** - `obj.missing` returns `undefined`, template returns `null`

### Neutral

⚪ **Test updates required** - 5 tests updated across 2 files

⚪ **Documentation updates** - ADR-0012 superseded, CLAUDE.md updated

## Alternatives Considered

### Alternative 1: Keep `undefined` (Status Quo from ADR-0012)

**Why Rejected:** Fundamentally broken for JSON APIs. Field omission breaks API contracts and causes silent data loss.

### Alternative 2: Return Empty Collections by Type

**Approach:** Return `[]` for arrays, `{}` for objects, `""` for strings, etc.

**Why Rejected:**

- Requires runtime type inference (complex, error-prone)
- Hides the "no value" signal
- `[]` is semantically different from "no items yet"
- Can't distinguish "empty" from "missing"

### Alternative 3: Seed Data Pattern

**Approach:** Force users to provide initial state via seed data

**Why Rejected:**

- Requires extra boilerplate for every scenario
- Doesn't solve the general case (state can still be missing)
- Users shouldn't need to think about internal serialization issues

## Related Decisions

- **[ADR-0012: Return `undefined` for Missing State](./0012-template-missing-state-undefined.md)** - **Superseded by this ADR**
- **[ADR-0002: Dynamic Response System](./0002-dynamic-response-system.md)** - Template replacement system
- **[ADR-0005: State & Sequence Reset](./0005-state-sequence-reset-on-scenario-switch.md)** - State lifecycle

## References

- **Discovery PR**: Production E2E tests for json-server cart flow
- **Test failure**: Cart test expecting 2 items, receiving 1
- **Root cause**: `JSON.stringify({items: undefined})` → `"{}"`
- **Fix verification**: `JSON.stringify({items: null})` → `'{"items":null}'`

## Decision History

- **2025-11-09**: ADR-0012 chose `undefined` over `null`
- **2025-11-23**: JSON serialization issue discovered during production E2E test development
- **2025-11-23**: Issue analysis confirmed `undefined` breaks JSON API contracts
- **2025-11-23**: ADR-0017 created to supersede ADR-0012 with `null` decision
- **2025-11-23**: Status: **Accepted** (implemented and tested across core)
