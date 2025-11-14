# Implementation Plan: Template Helper Registry

**Feature:** Dynamic value generation via template helpers (UUID, timestamps, hashing, etc.)
**Priority:** P2 (High Value, Medium Risk)
**Status:** Planned
**GitHub Issue:** TBD

---

## Problem Statement

### Current Limitation

Scenarist responses are **static JSON only**:

```typescript
{
  response: {
    body: {
      id: 'mock-doc-id-12345',              // ❌ Static ID
      timestamp: '2025-01-15T10:30:00Z',    // ❌ Static timestamp
      hash: 'abc123',                        // ❌ Static hash
    },
  },
}
```

**Problems:**
- ❌ Cannot generate dynamic UUIDs (`v4()`)
- ❌ Cannot generate current timestamps (`new Date()`)
- ❌ Cannot compute values (hashing, encoding)
- ❌ Tests with static IDs are less realistic

### User Needs (From Acquisition.Web Analysis)

**Real-world pattern:**
```typescript
// Acquisition.Web generates dynamic values
http.post('/api/upload', ({ request }) => {
  const docId = v4();                        // UUID generation
  const uploadTime = new Date().toISOString(); // Timestamp
  const hash = createHash('sha256').update(fileName).digest('hex');

  return HttpResponse.json({ id: docId, uploadedAt: uploadTime, hash });
});
```

**Need:** Generate dynamic values at response time while maintaining JSON serializability.

---

## Solution Design

### Core Concept

**Template helpers = Predefined functions referenced by name in templates.**

```typescript
// Scenario definition (JSON-serializable)
{
  response: {
    body: {
      id: '{{uuid()}}',                    // ✅ Function call (string)
      timestamp: '{{iso8601()}}',          // ✅ Current time
      expiresAt: '{{iso8601(+7days)}}',    // ✅ With argument
      hash: '{{sha256(state.fileName)}}',  // ✅ Using state
    },
  },
}

// Runtime evaluation
const helpers = {
  uuid: () => crypto.randomUUID(),
  iso8601: (offset?: string) => computeDate(offset),
  sha256: (value: string) => crypto.createHash('sha256').update(value).digest('hex'),
};

// Result
{
  id: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '2025-11-13T14:30:00.000Z',
  expiresAt: '2025-11-20T14:30:00.000Z',
  hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
}
```

### Key Design Decisions

**1. Predefined Registry (NOT arbitrary functions)**
- ✅ Safe (no eval, no arbitrary code execution)
- ✅ Serializable (function names are strings)
- ✅ Type-safe (TypeScript knows about helpers)
- ✅ Extensible (users can register custom helpers)
- ❌ Limited (can't do arbitrary computation)

**2. String-Based Syntax (Handlebars-style)**
- ✅ Familiar pattern (`{{helper(args)}}`)
- ✅ Easy to parse with regex
- ✅ Clear visual distinction from static values
- ✅ JSON-compatible (helpers are strings)

**3. State References in Arguments**
- ✅ Can use captured state (`{{sha256(state.fileName)}}`)
- ✅ Composable with existing state system
- ✅ No new state mechanism needed

---

## API Design

### Built-in Helpers

```typescript
/**
 * UUID generation
 */
uuid(): string
// {{uuid()}} → '550e8400-e29b-41d4-a716-446655440000'

/**
 * Current timestamp in ISO 8601 format
 */
iso8601(offset?: string): string
// {{iso8601()}} → '2025-11-13T14:30:00.000Z'
// {{iso8601(+7days)}} → '2025-11-20T14:30:00.000Z'
// {{iso8601(-1hour)}} → '2025-11-13T13:30:00.000Z'

/**
 * Random number in range [min, max]
 */
random(min: number, max: number): number
// {{random(1000, 9999)}} → 4567

/**
 * SHA-256 hash
 */
sha256(value: string): string
// {{sha256(state.fileName)}} → 'e3b0c442...'

/**
 * Base64 encoding
 */
base64(value: string): string
// {{base64(state.token)}} → 'dG9rZW4='

/**
 * Sequential counter (resets per test ID)
 */
counter(key?: string): number
// {{counter()}} → 1, 2, 3, ...
// {{counter(invoice)}} → invoice-1, invoice-2, ...

/**
 * Formatted timestamp
 */
format(pattern: string): string
// {{format(YYYY-MM-DD)}} → '2025-11-13'
// {{format(HH:mm:ss)}} → '14:30:00'
```

### Custom Helper Registration

```typescript
// User code (apps/express-example/src/server.ts)
import { registerHelper } from '@scenarist/core';

// Register custom helper
registerHelper('customerId', () => {
  return `CUST-${Math.random().toString(36).substring(7).toUpperCase()}`;
});

// Use in scenario
{
  response: {
    body: {
      id: '{{customerId()}}', // → 'CUST-A7F3X2'
    },
  },
}
```

---

## Architecture

### Type System Changes

```typescript
// packages/core/src/types/helpers.types.ts

/**
 * Helper function signature
 */
export type HelperFn = (...args: unknown[]) => unknown;

/**
 * Helper registry
 */
export type HelperRegistry = {
  readonly [name: string]: HelperFn;
};

/**
 * Template evaluation context
 */
export type TemplateContext = {
  /** Current state */
  readonly state: Record<string, unknown>;

  /** Test ID */
  readonly testId: string;

  /** Scenario ID */
  readonly scenarioId: string;

  /** Request context (for advanced helpers) */
  readonly request?: RequestContext;
};
```

### Template Parser

```typescript
// packages/core/src/domain/template-parser.ts

/**
 * Parsed template expression
 */
type ParsedTemplate = {
  /** Helper function name */
  readonly helperName: string;

  /** Parsed arguments */
  readonly args: ReadonlyArray<TemplateArg>;
};

/**
 * Template argument (literal or state reference)
 */
type TemplateArg =
  | { type: 'literal'; value: string | number | boolean }
  | { type: 'state'; path: string };

/**
 * Parse template string to extract helper call
 *
 * Examples:
 * - "{{uuid()}}" → { helperName: 'uuid', args: [] }
 * - "{{iso8601(+7days)}}" → { helperName: 'iso8601', args: [{ type: 'literal', value: '+7days' }] }
 * - "{{sha256(state.fileName)}}" → { helperName: 'sha256', args: [{ type: 'state', path: 'fileName' }] }
 */
export const parseTemplate = (template: string): ParsedTemplate | null => {
  // Regex to match {{helper(args)}}
  const match = template.match(/^\{\{(\w+)\((.*?)\)\}\}$/);

  if (!match) {
    return null; // Not a template
  }

  const [, helperName, argsString] = match;

  // Parse arguments
  const args: TemplateArg[] = [];

  if (argsString.trim()) {
    // Split by comma, handle nested parens
    const argTokens = splitArguments(argsString);

    for (const token of argTokens) {
      const trimmed = token.trim();

      // State reference: state.fieldName
      if (trimmed.startsWith('state.')) {
        const path = trimmed.substring(6); // Remove 'state.'
        args.push({ type: 'state', path });
        continue;
      }

      // Number literal
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        args.push({ type: 'literal', value: parseFloat(trimmed) });
        continue;
      }

      // Boolean literal
      if (trimmed === 'true' || trimmed === 'false') {
        args.push({ type: 'literal', value: trimmed === 'true' });
        continue;
      }

      // String literal (remove quotes if present)
      const stringValue = trimmed.replace(/^['"]|['"]$/g, '');
      args.push({ type: 'literal', value: stringValue });
    }
  }

  return { helperName, args };
};

/**
 * Split comma-separated arguments, respecting nested parentheses
 */
const splitArguments = (argsString: string): string[] => {
  const args: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of argsString) {
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      args.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
};
```

### Template Evaluator

```typescript
// packages/core/src/domain/template-evaluator.ts

/**
 * Evaluate template string with helpers
 */
export const evaluateTemplate = (
  value: unknown,
  context: TemplateContext,
  helpers: HelperRegistry
): unknown => {
  // Only process strings
  if (typeof value !== 'string') {
    return value;
  }

  // Check if it's a template
  const parsed = parseTemplate(value);

  if (!parsed) {
    return value; // Not a template, return as-is
  }

  // Look up helper
  const helper = helpers[parsed.helperName];

  if (!helper) {
    console.warn(`[Scenarist] Unknown helper: ${parsed.helperName}`);
    return value; // Return original template string
  }

  // Resolve arguments
  const resolvedArgs = parsed.args.map((arg) => {
    if (arg.type === 'literal') {
      return arg.value;
    }

    // State reference
    const stateValue = getNestedValue(context.state, arg.path);
    return stateValue;
  });

  // Call helper
  try {
    return helper(...resolvedArgs);
  } catch (error) {
    console.error(`[Scenarist] Helper '${parsed.helperName}' error:`, error);
    return value; // Return original on error
  }
};

/**
 * Recursively evaluate templates in object/array
 */
export const evaluateTemplatesDeep = (
  obj: unknown,
  context: TemplateContext,
  helpers: HelperRegistry
): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // String: evaluate template
  if (typeof obj === 'string') {
    return evaluateTemplate(obj, context, helpers);
  }

  // Array: evaluate each element
  if (Array.isArray(obj)) {
    return obj.map((item) => evaluateTemplatesDeep(item, context, helpers));
  }

  // Object: evaluate each value
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = evaluateTemplatesDeep(value, context, helpers);
    }
    return result;
  }

  // Primitive: return as-is
  return obj;
};

/**
 * Get nested value from object by path
 */
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
};
```

### Helper Registry

```typescript
// packages/core/src/domain/helper-registry.ts
import crypto from 'crypto';

/**
 * Global helper registry
 */
const HELPERS: HelperRegistry = {};

/**
 * Counter state (per test ID)
 */
const COUNTERS = new Map<string, Map<string, number>>();

/**
 * Register a custom helper
 */
export const registerHelper = (name: string, fn: HelperFn): void => {
  if (HELPERS[name]) {
    console.warn(`[Scenarist] Overwriting existing helper: ${name}`);
  }
  HELPERS[name] = fn;
};

/**
 * Get helper by name
 */
export const getHelper = (name: string): HelperFn | undefined => {
  return HELPERS[name];
};

/**
 * Get all registered helpers
 */
export const getAllHelpers = (): HelperRegistry => {
  return { ...HELPERS };
};

/**
 * Register built-in helpers
 */
export const registerBuiltInHelpers = (): void => {
  // UUID generation
  registerHelper('uuid', () => {
    return crypto.randomUUID();
  });

  // Current timestamp in ISO 8601
  registerHelper('iso8601', (offset?: string) => {
    const now = new Date();

    if (offset) {
      const parsed = parseTimeOffset(offset);
      if (parsed) {
        now.setTime(now.getTime() + parsed.milliseconds);
      }
    }

    return now.toISOString();
  });

  // Random number
  registerHelper('random', (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });

  // SHA-256 hash
  registerHelper('sha256', (value: string) => {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
  });

  // Base64 encoding
  registerHelper('base64', (value: string) => {
    return Buffer.from(String(value)).toString('base64');
  });

  // Sequential counter
  registerHelper('counter', function(this: TemplateContext, key = 'default') {
    const testId = this.testId;
    const counterKey = `${testId}:${key}`;

    let testCounters = COUNTERS.get(testId);
    if (!testCounters) {
      testCounters = new Map();
      COUNTERS.set(testId, testCounters);
    }

    const current = testCounters.get(counterKey) || 0;
    const next = current + 1;
    testCounters.set(counterKey, next);

    return next;
  });

  // Date formatting
  registerHelper('format', (pattern: string) => {
    const now = new Date();
    return formatDate(now, pattern);
  });
};

/**
 * Parse time offset string (+7days, -1hour, etc.)
 */
const parseTimeOffset = (offset: string): { milliseconds: number } | null => {
  const match = offset.match(/^([+-])(\d+)(days?|hours?|minutes?|seconds?)$/i);

  if (!match) {
    return null;
  }

  const [, sign, amount, unit] = match;
  const value = parseInt(amount, 10);
  const multiplier = sign === '+' ? 1 : -1;

  const unitMilliseconds: Record<string, number> = {
    second: 1000,
    seconds: 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };

  const ms = unitMilliseconds[unit.toLowerCase()];
  if (!ms) {
    return null;
  }

  return { milliseconds: value * ms * multiplier };
};

/**
 * Simple date formatting
 */
const formatDate = (date: Date, pattern: string): string => {
  const tokens: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    DD: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  };

  let result = pattern;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(token, value);
  }

  return result;
};

// Initialize built-in helpers on module load
registerBuiltInHelpers();
```

---

## Implementation Steps

### Phase 1: Template Parser (TDD)

**Files to create:**
- `packages/core/src/domain/template-parser.ts`
- `packages/core/tests/template-parser.test.ts`

**Steps:**
1. ✅ Write tests for `parseTemplate()` function
2. ✅ Write tests for argument parsing (literals, state refs)
3. ✅ Implement parser
4. ✅ Verify all tests pass

**Tests:**
```typescript
describe('parseTemplate', () => {
  it('should parse helper with no arguments', () => {
    const result = parseTemplate('{{uuid()}}');
    expect(result).toEqual({
      helperName: 'uuid',
      args: [],
    });
  });

  it('should parse helper with string literal', () => {
    const result = parseTemplate('{{iso8601(+7days)}}');
    expect(result).toEqual({
      helperName: 'iso8601',
      args: [{ type: 'literal', value: '+7days' }],
    });
  });

  it('should parse helper with state reference', () => {
    const result = parseTemplate('{{sha256(state.fileName)}}');
    expect(result).toEqual({
      helperName: 'sha256',
      args: [{ type: 'state', path: 'fileName' }],
    });
  });

  it('should parse helper with multiple arguments', () => {
    const result = parseTemplate('{{random(1000, 9999)}}');
    expect(result).toEqual({
      helperName: 'random',
      args: [
        { type: 'literal', value: 1000 },
        { type: 'literal', value: 9999 },
      ],
    });
  });

  it('should return null for non-template strings', () => {
    expect(parseTemplate('hello')).toBeNull();
    expect(parseTemplate('{{notATemplate')).toBeNull();
    expect(parseTemplate('noDoublebraces()')).toBeNull();
  });
});
```

### Phase 2: Helper Registry (TDD)

**Files to create:**
- `packages/core/src/domain/helper-registry.ts`
- `packages/core/tests/helper-registry.test.ts`

**Steps:**
1. ✅ Write tests for `registerHelper()` and `getHelper()`
2. ✅ Write tests for built-in helpers (uuid, iso8601, etc.)
3. ✅ Implement helper registry
4. ✅ Implement built-in helpers
5. ✅ Verify all tests pass

**Tests:**
```typescript
describe('Helper Registry', () => {
  it('should register and retrieve custom helper', () => {
    registerHelper('test', () => 'hello');
    const helper = getHelper('test');
    expect(helper()).toBe('hello');
  });

  it('should have uuid helper', () => {
    const helper = getHelper('uuid');
    const result = helper();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('should have iso8601 helper', () => {
    const helper = getHelper('iso8601');
    const result = helper();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should support iso8601 with offset', () => {
    const helper = getHelper('iso8601');
    const now = new Date();
    const future = helper('+1day');
    const futureDate = new Date(future);
    const diff = futureDate.getTime() - now.getTime();
    expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000); // ~24 hours
    expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it('should have random helper', () => {
    const helper = getHelper('random');
    const result = helper(1000, 9999);
    expect(result).toBeGreaterThanOrEqual(1000);
    expect(result).toBeLessThanOrEqual(9999);
  });

  it('should have sha256 helper', () => {
    const helper = getHelper('sha256');
    const result = helper('test');
    expect(result).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });
});
```

### Phase 3: Template Evaluator (TDD)

**Files to create:**
- `packages/core/src/domain/template-evaluator.ts`
- `packages/core/tests/template-evaluator.test.ts`

**Steps:**
1. ✅ Write tests for `evaluateTemplate()`
2. ✅ Write tests for `evaluateTemplatesDeep()`
3. ✅ Write tests for state reference resolution
4. ✅ Implement evaluator
5. ✅ Verify all tests pass

**Tests:**
```typescript
describe('evaluateTemplate', () => {
  const context: TemplateContext = {
    state: { fileName: 'test.txt' },
    testId: 'test-1',
    scenarioId: 'scenario-1',
  };

  it('should evaluate uuid() template', () => {
    const result = evaluateTemplate('{{uuid()}}', context, getAllHelpers());
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should evaluate template with state reference', () => {
    const result = evaluateTemplate('{{sha256(state.fileName)}}', context, getAllHelpers());
    expect(result).toBe('f29bc64a9d3732b4b9035125fdb3285f5b6455778edca72414671e0ca3b2e0de');
  });

  it('should return non-template strings unchanged', () => {
    const result = evaluateTemplate('hello world', context, getAllHelpers());
    expect(result).toBe('hello world');
  });

  it('should return original template for unknown helpers', () => {
    const result = evaluateTemplate('{{unknown()}}', context, getAllHelpers());
    expect(result).toBe('{{unknown()}}');
  });
});

describe('evaluateTemplatesDeep', () => {
  const context: TemplateContext = {
    state: { fileName: 'test.txt' },
    testId: 'test-1',
    scenarioId: 'scenario-1',
  };

  it('should evaluate templates in nested objects', () => {
    const input = {
      id: '{{uuid()}}',
      nested: {
        timestamp: '{{iso8601()}}',
        static: 'unchanged',
      },
      array: ['{{uuid()}}', 'static'],
    };

    const result = evaluateTemplatesDeep(input, context, getAllHelpers());

    expect(typeof result.id).toBe('string');
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof result.nested.timestamp).toBe('string');
    expect(result.nested.static).toBe('unchanged');
    expect(result.array[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.array[1]).toBe('static');
  });
});
```

### Phase 4: Integration with Response Transformation (TDD)

**Files to modify:**
- `packages/core/src/domain/response-selector.ts`
- `packages/core/tests/response-selector.test.ts`

**Steps:**
1. ✅ Add template evaluation to response transformation
2. ✅ Write integration tests
3. ✅ Verify backward compatibility (no templates = no change)

---

## Testing Strategy

### Unit Tests

**Coverage targets:** 100% (per TDD requirements)

**Test categories:**
1. Template parsing
   - Valid templates
   - Invalid templates
   - Edge cases (empty args, nested parens)

2. Helper execution
   - Each built-in helper
   - Custom helper registration
   - Error handling

3. Template evaluation
   - Simple templates
   - Nested objects
   - State references
   - Unknown helpers

### Integration Tests

**Response transformation:**
- Templates in response body
- Templates combined with state capture
- Templates in headers
- No performance degradation

### E2E Tests (Example Apps)

**Express example:**
- File upload with UUID generation
- Timestamp validation
- Hash verification

---

## Security Considerations

### No Arbitrary Code Execution

✅ **Safe:** Template syntax ONLY supports predefined helpers.

```typescript
// ✅ SAFE - Predefined helper
{
  id: '{{uuid()}}',
}

// ❌ IMPOSSIBLE - Cannot execute arbitrary code
{
  id: '{{() => require("fs").readFileSync("/etc/passwd")}}',
}
// This is just a string, not executable code
```

### Helper Function Validation

All helpers are registered by developers, not end users.

**Risk mitigation:**
- ✅ Whitelist approach (only registered helpers work)
- ✅ No eval() anywhere
- ✅ Argument parsing is safe (no code execution)
- ✅ Clear documentation on custom helper security

---

## Performance Considerations

### Template Parsing Cost

**Pattern:** Parse templates ONCE at response selection, not per request.

**Optimization:** Cache parsed templates per mock definition.

### Helper Execution Cost

**Benchmark targets:**
- Single helper call: < 1ms
- 100 helper calls: < 10ms
- UUID generation: ~0.1ms (crypto.randomUUID)
- SHA-256 hashing: ~0.5ms (small inputs)

---

## Migration Path

### Backward Compatibility

✅ **No breaking changes** - Existing scenarios work unchanged.

**Existing static responses:**
```typescript
{
  response: {
    body: {
      id: 'static-id', // Still works
    },
  },
}
```

**New template responses:**
```typescript
{
  response: {
    body: {
      id: '{{uuid()}}', // New feature
    },
  },
}
```

---

## Rollout Plan

### Phase 1: Core Implementation (Week 1)
- Template parser
- Helper registry
- Built-in helpers
- Unit tests (100% coverage)

### Phase 2: Integration (Week 2)
- Response transformation
- Integration tests
- Backward compatibility verification

### Phase 3: Documentation & Examples (Week 3)
- API documentation
- Helper reference guide
- Custom helper examples
- E2E tests

### Phase 4: Release (Week 4)
- Code review
- Performance benchmarking
- Security audit
- Release notes
- GitHub issue closure

---

## Success Criteria

### Functional
- ✅ All built-in helpers work correctly
- ✅ Custom helper registration works
- ✅ State references resolve properly
- ✅ Backward compatibility maintained
- ✅ 100% test coverage
- ✅ TypeScript types fully inferred

### Non-Functional
- ✅ Helper execution < 1ms per call
- ✅ No performance degradation for non-template scenarios
- ✅ Clear error messages for invalid templates
- ✅ Comprehensive documentation

---

**End of Implementation Plan**
