# WIP: Path Parameter Extraction Feature

**Started**: 2025-11-17
**Status**: ✅ COMPLETE - Implementation Already Exists
**Current Step**: Documentation & Verification

## Goal

Enable `{{params.id}}` template injection for URL path parameters extracted from request URLs. This allows responses to echo back parameters from the URL pattern.

## Discovery: Feature Already Implemented

Upon investigation, this feature is **already fully implemented** across all packages. The implementation was completed as part of the URL matching work.

## Overall Implementation Status

✅ **Phase 1: URL Pattern Matching with Parameter Extraction** - COMPLETE
- `packages/msw-adapter/src/matching/url-matcher.ts` uses `path-to-regexp`
- Extracts params from URL patterns (`:id`, `:id?`, `:path+`, `:id(\d+)`)
- Returns `UrlMatchResult` with `params` field

✅ **Phase 2: Type Definitions** - COMPLETE
- `HttpRequestContext` has `params?: Readonly<Record<string, string | ReadonlyArray<string>>>`
- `ScenaristMockWithParams` pairs mocks with extracted params
- MSW-compatible types (string for simple params, string[] for repeating)

✅ **Phase 3: Pipeline Integration** - COMPLETE
- `dynamic-handler.ts:79-115` calls `matchesUrl()` which returns params
- Params flow through `ScenaristMockWithParams` type
- `response-selector.ts:139-148` merges params with state for template replacement

✅ **Phase 4: Template Replacement** - COMPLETE
- `template-replacement.ts` supports `{{params.x}}` syntax
- Works alongside existing `{{state.x}}` syntax
- Handles nested paths: `{{params.user.id}}`
- Preserves types for pure templates (returns raw value, not string)

✅ **Phase 5: Testing** - COMPLETE
- All 74 tests passing in express-example
- Includes path parameter tests (Tests 7-11)
- E2E tests verify full pipeline

## Current Status: All Tests Passing

```bash
cd apps/express-example && pnpm test
# Result: 74 passed (74)
```

## Architecture Verification

### 1. URL Matching with Param Extraction

**File**: `packages/msw-adapter/src/matching/url-matcher.ts`

```typescript
export const matchesUrl = (
  pattern: string | RegExp,
  requestUrl: string
): UrlMatchResult => {
  // ... handles RegExp patterns ...
  
  const patternPath = extractPathnameOrReturnAsIs(pattern);
  const requestPath = extractPathnameOrReturnAsIs(requestUrl);
  
  const matcher = match(patternPath, { decode: decodeURIComponent });
  const result = matcher(requestPath);
  
  if (result) {
    const params = extractParams(result.params);  // ✅ Extracts params
    return { matches: true, params };
  }
  
  return { matches: false };
};
```

**Capabilities:**
- ✅ Simple params: `/users/:id` → `{id: '123'}`
- ✅ Multiple params: `/users/:userId/posts/:postId` → `{userId: 'alice', postId: '42'}`
- ✅ Optional params: `/files/:name?` matches `/files` or `/files/doc.txt`
- ✅ Repeating params: `/files/:path+` → `{path: ['a','b','c']}`
- ✅ Custom regex: `/orders/:id(\d+)` matches digits only

### 2. Dynamic Handler Integration

**File**: `packages/msw-adapter/src/handlers/dynamic-handler.ts:79-115`

```typescript
const getMocksFromScenarios = (
  activeScenario: ActiveScenario | undefined,
  getScenarioDefinition: (scenarioId: string) => ScenaristScenario | undefined,
  method: string,
  url: string
): ReadonlyArray<ScenaristMockWithParams> => {
  const mocksWithParams: Array<ScenaristMockWithParams> = [];

  // Default scenario mocks
  const defaultScenario = getScenarioDefinition('default');
  if (defaultScenario) {
    defaultScenario.mocks.forEach((mock) => {
      const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
      const urlMatch = matchesUrl(mock.url, url);  // ✅ Extracts params
      if (methodMatches && urlMatch.matches) {
        mocksWithParams.push({ mock, params: urlMatch.params });  // ✅ Pairs mock with params
      }
    });
  }

  // Active scenario mocks (same pattern)
  // ...
  
  return mocksWithParams;
};
```

**Flow:**
1. URL matching extracts params from pattern
2. Params paired with mock via `ScenaristMockWithParams`
3. Passed to ResponseSelector for template replacement

### 3. Template Replacement

**File**: `packages/core/src/domain/response-selector.ts:139-148`

```typescript
// Apply templates to response (both state AND params)
let finalResponse = response;
if (stateManager || mockWithParams.params) {
  const currentState = stateManager ? stateManager.getAll(testId) : {};
  // Merge state and params for template replacement
  const templateData = {
    state: currentState,
    params: mockWithParams.params || {},  // ✅ Params available for templates
  };
  finalResponse = applyTemplates(response, templateData) as ScenaristResponse;
}
```

**File**: `packages/core/src/domain/template-replacement.ts`

```typescript
export const applyTemplates = (value: unknown, templateData: Record<string, unknown>): unknown => {
  // Backward compatibility wrapper
  const normalizedData = (templateData.state !== undefined || templateData.params !== undefined)
    ? templateData
    : { state: templateData, params: {} };
    
  if (typeof value === 'string') {
    // Pure template: {{params.id}} or {{state.key}}
    const pureTemplateMatch = /^\{\{(state|params)\.([^}]+)\}\}$/.exec(value);
    if (pureTemplateMatch) {
      const prefix = pureTemplateMatch[1]!;  // 'state' or 'params'
      const path = pureTemplateMatch[2]!;
      return resolveTemplatePath(normalizedData, prefix, path);  // ✅ Resolves params
    }
    
    // Mixed template: "User {{params.id}}"
    return value.replace(/\{\{(state|params)\.([^}]+)\}\}/g, (match, prefix, path) => {
      const resolvedValue = resolveTemplatePath(normalizedData, prefix, path);
      return resolvedValue === undefined ? match : String(resolvedValue);
    });
  }
  // ... handles arrays, objects recursively ...
};
```

**Capabilities:**
- ✅ Pure templates: `userId: "{{params.id}}"` → `userId: "123"` (preserves type)
- ✅ Mixed templates: `message: "User {{params.id}}"` → `message: "User 123"`
- ✅ Nested paths: `{{params.user.profile.name}}`
- ✅ Array properties: `{{params.path.length}}` (for repeating params)

## Example Usage

**Scenario Definition:**

```typescript
{
  method: 'GET',
  url: '/api/user-param/:id',  // Pattern with :id parameter
  response: {
    status: 200,
    body: {
      userId: '{{params.id}}',  // Template injection
      message: 'User {{params.id}} found'
    }
  }
}
```

**Request:**
```
GET /api/user-param/123
```

**Response:**
```json
{
  "userId": "123",
  "message": "User 123 found"
}
```

## Files Involved

**Core Package:**
- ✅ `packages/core/src/types/scenario.ts` - Type definitions (HttpRequestContext, ScenaristMockWithParams)
- ✅ `packages/core/src/domain/template-replacement.ts` - Template replacement with params support
- ✅ `packages/core/src/domain/response-selector.ts` - Merges params with state for templates

**MSW Adapter:**
- ✅ `packages/msw-adapter/src/matching/url-matcher.ts` - URL pattern matching with param extraction
- ✅ `packages/msw-adapter/src/handlers/dynamic-handler.ts` - Pairs mocks with params

**Tests:**
- ✅ `apps/express-example/tests/integration/*.test.ts` - All 74 tests passing

## Key Architectural Decisions

### 1. MSW Parity via path-to-regexp

**Decision:** Use same library as MSW (path-to-regexp v6) for URL matching

**Rationale:**
- Automatic MSW behavior compatibility
- No custom parsing logic needed
- Same param extraction semantics as MSW
- Supports all MSW path patterns

**Result:** Perfect MSW alignment for path parameters

### 2. Params Paired with Mocks (Not Added to Context)

**Decision:** Store params in `ScenaristMockWithParams`, not `HttpRequestContext`

**Rationale:**
- Different mocks for same URL can extract different params
- URL `/users/:id` and `/users/:userId` would conflict in single context
- Each mock gets its own extracted params
- Chosen mock's params used for template replacement

**Implementation:**
```typescript
type ScenaristMockWithParams = {
  readonly mock: ScenaristMock;
  readonly params?: Readonly<Record<string, string | ReadonlyArray<string>>>;
};
```

### 3. Template Syntax: `{{params.x}}` Not `{{x}}`

**Decision:** Explicit `params.` prefix required

**Rationale:**
- Clear distinction between state and params
- Avoids naming conflicts (what if state.userId and params.userId both exist?)
- Consistent with `{{state.x}}` syntax
- Self-documenting in response definitions

**Example:**
```typescript
{
  userId: '{{params.id}}',      // From URL path
  cartTotal: '{{state.total}}'  // From captured state
}
```

### 4. Backward Compatibility in applyTemplates()

**Decision:** Support both old flat object and new `{state, params}` structure

**Implementation:**
```typescript
const normalizedData = (templateData.state !== undefined || templateData.params !== undefined)
  ? templateData
  : { state: templateData, params: {} };
```

**Rationale:**
- Existing code using `applyTemplates(value, stateObject)` continues to work
- New code can use `applyTemplates(value, {state: {...}, params: {...}})`
- No breaking changes to public API

## Completion Verification

✅ **All Tests Passing:**
```bash
cd apps/express-example && pnpm test
# Test Files: 10 passed (10)
# Tests: 74 passed (74)
```

✅ **Path Parameter Tests (Tests 7-11) Included:**
- Simple param extraction (`:id`)
- Multiple params (`:userId/:postId`)
- Optional params (`:name?`)
- Repeating params (`:path+`)
- Custom regex params (`:id(\d+)`)

✅ **Type Safety:**
- TypeScript strict mode passing
- No `any` types
- Immutable data structures throughout

✅ **Architecture:**
- Hexagonal architecture maintained
- MSW adapter handles URL matching
- Core handles template replacement
- Clean separation of concerns

## Next Steps

This feature is **COMPLETE**. No implementation needed.

**Recommended actions:**

1. ✅ Verify all tests passing (DONE - 74/74 passing)
2. ✅ Document architecture decisions (DONE - in this WIP)
3. 🔲 Update user-facing documentation (if not already done)
4. 🔲 Add examples to docs site showing `{{params.x}}` usage
5. 🔲 Delete this WIP (feature complete, not in progress)

## Architectural Validation

**This implementation validates key architectural principles:**

✅ **Serialization Preserved** - Params extracted at runtime, not stored in mocks
✅ **Type Safety** - MSW-compatible param types (string | string[])
✅ **Dependency Injection** - path-to-regexp used via url-matcher (not hardcoded)
✅ **Single Responsibility** - URL matching separate from template replacement
✅ **Immutability** - All data structures readonly
✅ **Test Coverage** - 74/74 tests passing including path param tests

**Pattern Recognition:**

This follows the same pattern as state templates:
- **State**: Captured from requests → stored → injected via `{{state.x}}`
- **Params**: Extracted from URLs → paired with mocks → injected via `{{params.x}}`

Both use the same template replacement infrastructure, demonstrating excellent code reuse and compositional design.

## Conclusion

**Status:** ✅ FEATURE COMPLETE

The path parameter extraction feature was already fully implemented. All infrastructure is in place:
- URL matching extracts params
- Params flow through pipeline
- Template replacement handles `{{params.x}}`
- All tests passing

**No coding work required.** This WIP documents the existing implementation for future reference.

**Completed**: 2025-11-17
**Duration**: Investigation only (feature already existed)

---

**Action Required:** Delete this WIP and close the feature request as "Already Implemented".
