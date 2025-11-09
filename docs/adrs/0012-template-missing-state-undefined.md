# ADR-0012: Return `undefined` for Missing State in Pure Templates

**Status**: Accepted
**Date**: 2025-11-09
**Authors**: Claude Code
**Supersedes**: Partial supersession of [ADR-0002](./0002-dynamic-response-system.md) (template edge case handling)

## Context

Scenarist's stateful mocks support **template replacement** where response values can reference captured state using `{{state.path}}` syntax. There are two types of templates:

1. **Pure templates**: Entire value is a template (e.g., `"{{state.cartItems}}"`)
2. **Mixed templates**: Template embedded in surrounding text (e.g., `"You have {{state.items.length}} items"`)

### The Problem

When a pure template references a state key that doesn't exist, what should be returned?

**Original behavior (ADR-0002 decision, line 292):**
- Pure template with missing state → returned unreplaced template string `"{{state.cartItems}}"`
- This was documented as: *"Undefined keys remain as templates"*

**Real-world impact:**
```typescript
// Response definition
{
  status: 200,
  body: {
    items: "{{state.cartItems}}"  // Pure template
  }
}

// When state.cartItems doesn't exist:
// OLD behavior: { items: "{{state.cartItems}}" }  ← String leak!
// NEW behavior: { items: undefined }              ← Type-safe
```

**Problems with returning unreplaced template string:**

1. **Type safety violation**: If `items` is typed as `Array<Item>`, receiving string `"{{state.cartItems}}"` breaks type contracts
2. **Leaked implementation details**: Template syntax exposed to consumers
3. **Required workarounds**: Applications needed defensive code to detect and handle unreplaced templates:
   ```typescript
   // Workaround code required in application
   const items = typeof data.items === 'string' && data.items.includes('{{')
     ? []
     : data.items;
   ```
4. **Inconsistent with JavaScript semantics**: Accessing missing property returns `undefined`, not a string representation

### Discovery During RSC Implementation

While implementing React Server Components examples (Phase 8), we discovered this behavior caused real issues:

- Cart page needed workaround to detect unreplaced templates
- Type safety compromised (expected array, got string)
- Template syntax leaked to UI components
- Defensive code required throughout application

**User feedback:** "Let's fix in core with all the tests, and then remove the code that fixed it here and prove it works properly."

This led to **Bug #2 fix** (commit 6272b3e) which changed the behavior.

## Decision

**Pure templates with missing state keys return `undefined` instead of unreplaced template string.**

```typescript
// Core implementation (template-replacement.ts line 21)
// Before: return stateValue !== undefined ? stateValue : value;
// After:  return stateValue !== undefined ? stateValue : undefined;
```

**Implementation:**
- Pure template `"{{state.missing}}"` with no `state.missing` → returns `undefined`
- Mixed template `"Count: {{state.missing}}"` → returns `"Count: {{state.missing}}"` (unchanged)
- Pure template with valid state → returns actual state value (unchanged)

**Scope:**
- Only affects **pure templates** (entire value is template)
- **Mixed templates** retain original behavior (keep unreplaced template in string)
- This distinction is intentional: mixed templates are strings by nature

## Alternatives Considered

### Alternative 1: Keep Unreplaced Template String (Status Quo)

**Approach:** Return `"{{state.key}}"` when state key missing

**Pros:**
- ✅ Makes missing state visible in responses
- ✅ Explicit failure mode (can see what's broken)
- ✅ Already implemented in ADR-0002

**Cons:**
- ❌ Type safety violation (expecting T, get string)
- ❌ Leaks implementation details (template syntax exposed)
- ❌ Requires application-level workarounds
- ❌ Inconsistent with JavaScript semantics
- ❌ Defensive code throughout application

**Why Rejected:** Required workarounds in every application using pure templates. Type safety violations are unacceptable in TypeScript-first library.

### Alternative 2: Throw Error

**Approach:** Throw exception when pure template references missing state

**Pros:**
- ✅ Fail-fast behavior
- ✅ Forces developers to handle missing state explicitly
- ✅ Clear error messages

**Cons:**
- ❌ Breaks scenarios where missing state is expected (e.g., before first capture)
- ❌ Requires try-catch wrappers everywhere
- ❌ Too strict for optional state
- ❌ Makes testing harder (can't test "before capture" state)

**Why Rejected:** Too strict. Missing state is often expected behavior (e.g., cart empty until items added). Errors should be reserved for truly exceptional conditions.

### Alternative 3: Return Empty String `""`

**Approach:** Return empty string for missing pure templates

**Pros:**
- ✅ Falsy value (easy to check)
- ✅ No type errors if expecting string
- ✅ Doesn't leak template syntax

**Cons:**
- ❌ Type violation for non-string types (numbers, arrays, objects)
- ❌ Confusing: is it "missing" or "actually empty string"?
- ❌ Still requires defensive code for non-string types

**Why Rejected:** Only solves problem for string types. Arrays, numbers, objects still have type mismatches.

### Alternative 4: Return `null`

**Approach:** Return `null` instead of `undefined`

**Pros:**
- ✅ Explicitly represents "no value"
- ✅ JSON-serializable (unlike undefined)
- ✅ Semantically clear (null = intentionally missing)

**Cons:**
- ❌ Inconsistent with JavaScript property access (`obj.missing` → `undefined`, not `null`)
- ❌ Requires explicit null checks (`if (value === null)` vs `if (value == null)`)
- ❌ TypeScript types need explicit `| null` (more verbose than optional)

**Why Rejected:** `undefined` is more consistent with JavaScript semantics and TypeScript's optional types pattern.

### Alternative 5: Return `undefined` (CHOSEN)

**Approach:** Return `undefined` when pure template references missing state

**Pros:**
- ✅ Type-safe: `items?: Array<Item>` naturally handles undefined
- ✅ Programmatically detectable: `if (items !== undefined)`
- ✅ Consistent with JavaScript: `obj.missing` → `undefined`
- ✅ No leaked implementation details
- ✅ No application-level workarounds needed
- ✅ Works with optional types naturally
- ✅ Standard TypeScript pattern: `field?: Type`

**Cons:**
- ❌ Less visible in responses (undefined often serializes to null or omitted)
- ❌ Requires explicit check to detect missing state
- ❌ JSON.stringify omits undefined values (may be unexpected)

**Why Chosen:** Best balance of type safety, JavaScript semantics, and developer experience. The cons are standard JavaScript behavior that developers already understand.

## Consequences

### Positive

✅ **Type safety preserved** - No string-where-array-expected violations

✅ **No application workarounds** - Removed defensive code from cart-server/page.tsx

✅ **Consistent with JavaScript** - `undefined` matches property access semantics

✅ **Works with optional types** - `items?: Array<Item>` naturally handles undefined

✅ **No leaked syntax** - Template syntax never exposed to consumers

✅ **Programmatically detectable** - Simple `if (value !== undefined)` check

✅ **Standard TypeScript pattern** - Aligns with `field?: Type` convention

### Negative

❌ **Less visible in responses** - undefined may serialize to null or be omitted

❌ **Requires explicit checks** - Can't rely on seeing unreplaced template string

❌ **JSON serialization quirks** - `JSON.stringify({a: undefined})` → `"{}"` (omitted)

### Neutral

⚪ **Mixed templates unchanged** - Still return string with unreplaced template (intentional)

⚪ **Breaking change** - Applications relying on string leak behavior must adapt

⚪ **Documentation updates required** - ADR-0002 and stateful-mocks.md need updates

### Migration Impact

**For consumers:**

Applications that had workarounds for unreplaced template strings can now remove them:

```typescript
// BEFORE (workaround needed)
const items = typeof data.items === 'string' && data.items.includes('{{')
  ? []
  : data.items;

// AFTER (no workaround needed)
const items = data.items ?? [];  // or: data.items || []
```

**Test updates required:**

3 test files needed updates across 2 packages:
- `packages/core/tests/template-replacement.test.ts` (new behavior test added)
- `packages/express-adapter/tests/setup-scenarist.test.ts` (2 expectations updated)
- `apps/express-example/tests/stateful-scenarios.test.ts` (1 expectation updated)

Pattern: Changed `.toBe('{{state.key}}')` → `.toBeUndefined()`

## Implementation Notes

**Change made:**
```typescript
// packages/core/src/domain/template-replacement.ts (line 21)

// Before (ADR-0002 behavior)
return stateValue !== undefined ? stateValue : value;

// After (ADR-0012 behavior)
return stateValue !== undefined ? stateValue : undefined;
```

**Test added:**
```typescript
// packages/core/tests/template-replacement.test.ts
it('should return undefined when pure template state key is missing', () => {
  const template = '{{state.missing}}';
  const state = { other: 'value' };

  const result = applyTemplates(template, state);

  expect(result).toBeUndefined();
});
```

**Test coverage:**
- 19 template replacement tests (up from 18)
- 100% coverage maintained
- All 159 core tests passing

**Workaround removed:**
```typescript
// apps/nextjs-app-router-example/app/cart-server/page.tsx
// REMOVED: Defensive code no longer needed
const items = typeof cartData.items === 'string' && cartData.items.includes('{{')
  ? []
  : cartData.items;
```

## Design Rationale: Pure vs Mixed Templates

**Why pure templates return `undefined` but mixed templates keep unreplaced string:**

```typescript
// Pure template (entire value is template)
items: "{{state.cartItems}}"  // → undefined (if missing)

// Mixed template (template in surrounding text)
message: "You have {{state.count}} items"  // → "You have {{state.count}} items" (if missing)
```

**Rationale:**

1. **Pure templates replace entire value** → undefined is the natural "no value" representation
2. **Mixed templates are strings** → keeping unreplaced template in string maintains type consistency
3. **Type expectations differ:**
   - Pure: Expecting `T` (array, number, object) → `undefined` is appropriate
   - Mixed: Expecting `string` → keeping as string is appropriate
4. **Fallback behavior:**
   - Pure: Consumers can provide defaults: `items ?? []`
   - Mixed: Consumers can detect unreplaced templates if needed: `.includes('{{')`

## Related Decisions

- **[ADR-0002: Dynamic Response System](./0002-dynamic-response-system.md)** - Partially superseded
  - Original decision: "Undefined keys remain as templates" (line 292)
  - This ADR updates that decision for pure templates only
  - Mixed template behavior unchanged

- **[ADR-0001: Serializable Scenario Definitions](./0001-serializable-scenario-definitions.md)** - Template replacement is part of the serializable response system

- **[ADR-0005: State & Sequence Reset](./0005-state-sequence-reset-on-scenario-switch.md)** - State management context

## Documentation Updates Required

### ADR-0002 Update Needed

Line 292 currently states:
> ✅ **Template edge cases** - Handled through graceful degradation:
> - Undefined keys remain as templates (e.g., `{{state.missing}}`)

**Should be updated to:**
> ✅ **Template edge cases** - Handled through graceful degradation:
> - Pure templates with missing keys return `undefined` (see [ADR-0012](./0012-template-missing-state-undefined.md))
> - Mixed templates with missing keys keep unreplaced template in string (e.g., `"Count: {{state.missing}}"`)

### docs/stateful-mocks.md Update Needed

Line 766 currently states:
> Templates with missing keys remain as templates (`'{{state.missing}}'`). This is useful for debugging but can be confusing if you expect an error.

**Should be updated to:**
> **Pure templates** with missing keys return `undefined`. **Mixed templates** keep unreplaced template strings (e.g., `"Count: {{state.missing}}"`). See [Template Types](#template-types) for distinction.

### docs/api-reference-state.md

Check if this file needs updates regarding template behavior.

## References

- **Bug #2 fix commit**: 6272b3e "fix(core): return undefined for missing state in pure templates"
- **Follow-up fixes**:
  - 0c209f5 "fix(express-adapter): update tests for new template undefined behavior"
  - 9530a41 "fix(express-example): update test for new template undefined behavior"
- **TypeScript Optional Types**: https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties
- **JavaScript undefined semantics**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined

## Decision History

- **2025-10-27**: ADR-0002 established "undefined keys remain as templates"
- **2025-11-09**: Bug #2 discovered during RSC implementation (template string leak)
- **2025-11-09**: Bug fix implemented (return undefined for pure templates)
- **2025-11-09**: ADR-0012 created to document decision rationale
- **2025-11-09**: Status: **Accepted** (implemented and tested across all packages)
