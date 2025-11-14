# Research: Regex Serialization & Template Helper Registry Patterns

**Date:** 2025-11-13
**Purpose:** Research best practices for implementing regex serialization with Zod and template helper registry patterns in TypeScript

---

## Task 1: Regex Serialization with Zod

### Summary

RegExp objects cannot be directly serialized to JSON because they're not primitive types. The community has established several patterns for handling regex serialization, with varying trade-offs between simplicity, security, and type safety.

### 1.1 Zod Schema for RegExp Objects

**Recommended Approach: `z.instanceof(RegExp)`**

```typescript
import { z } from 'zod';

// Validate runtime RegExp instances
const RegExpSchema = z.instanceof(RegExp);

// Use in object schemas
const ConfigSchema = z.object({
  pattern: z.string().or(z.instanceof(RegExp)),
  exclude: z.array(z.string().or(z.instanceof(RegExp))),
});

type Config = z.infer<typeof ConfigSchema>;
// type Config = {
//   pattern: string | RegExp;
//   exclude: (string | RegExp)[];
// }
```

**Source:** [GitHub Issue #2735](https://github.com/colinhacks/zod/issues/2735)

**Why this works:**
- ✅ Validates actual RegExp runtime type
- ✅ Proper TypeScript type inference for unions
- ✅ Idiomatic Zod approach
- ✅ No custom validation needed

### 1.2 Zod Schema for Serialized RegExp

When you need to store RegExp as JSON, use a serialized representation:

```typescript
import { z } from 'zod';

// Serialized regex format
const SerializedRegexSchema = z.object({
  source: z.string().min(1),
  flags: z.string().regex(/^[gimsuvy]*$/),  // Valid JS regex flags
});

type SerializedRegex = z.infer<typeof SerializedRegexSchema>;
// type SerializedRegex = {
//   source: string;
//   flags: string;
// }

// Helper to convert RegExp → SerializedRegex
const serializeRegex = (regex: RegExp): SerializedRegex => {
  return {
    source: regex.source,
    flags: regex.flags,
  };
};

// Helper to convert SerializedRegex → RegExp
const deserializeRegex = (data: SerializedRegex): RegExp => {
  // Validate with schema first
  const validated = SerializedRegexSchema.parse(data);
  return new RegExp(validated.source, validated.flags);
};
```

**TypeScript typing:**
```typescript
// Brand type for type safety
type RegexPattern = string & { readonly __brand: 'RegexPattern' };

const SerializedRegexBrandedSchema = z.object({
  source: z.string().min(1).transform((s) => s as RegexPattern),
  flags: z.string().regex(/^[gimsuvy]*$/),
});
```

### 1.3 Production Library Examples

#### SuperJSON Approach

**Source:** [flightcontrolhq/superjson](https://github.com/flightcontrolhq/superjson)

```typescript
// SuperJSON serializes RegExp to string representation
const object = {
  normal: 'string',
  timestamp: new Date(),
  test: /superjson/gi,
};

const { json, meta } = superjson.serialize(object);

/* Result:
json = {
  normal: 'string',
  timestamp: "2020-06-20T04:56:50.293Z",
  test: "/superjson/gi",  // String representation
};

meta = {
  values: {
    timestamp: ['Date'],
    test: ['regexp'],  // Type metadata
  }
};
*/

// Deserialize
const restored = superjson.deserialize({ json, meta });
// restored.test is a RegExp instance
```

**Key insight:** SuperJSON separates JSON-compatible data from type metadata. RegExp becomes a string in `json`, with type info in `meta.values`.

**Zod equivalent:**
```typescript
// Schema for SuperJSON-style serialized regex
const SuperJSONRegexSchema = z.object({
  json: z.object({
    pattern: z.string(),  // "/superjson/gi"
  }),
  meta: z.object({
    values: z.object({
      pattern: z.array(z.literal('regexp')),
    }),
  }),
});
```

#### serialize-javascript Approach

**Source:** [yahoo/serialize-javascript](https://github.com/yahoo/serialize-javascript)

```typescript
// Serializes to RegExp constructor syntax
const data = { pattern: /([^\s]+)/g };

const serialized = serialize(data);
// Output: '{"pattern":new RegExp("([^\\\\s]+)", "g")}'

// Can be eval'd or embedded in <script> tag
```

**Security features:**
- ✅ Auto-escapes HTML characters (prevents XSS)
- ✅ Escapes JavaScript line terminators
- ✅ Safe for embedding in `<script>` tags
- ⚠️ `unsafe: true` option disables protections (use with caution)

**Zod schema for constructor format:**
```typescript
// Not directly applicable - this format is meant for eval
// If you need to validate, use SerializedRegexSchema above
```

### 1.4 Security Considerations: ReDoS Prevention

**Problem:** User-provided regex patterns can cause catastrophic backtracking (ReDoS attacks).

**Detection Libraries:**

1. **safe-regex** (npm package)
   ```typescript
   import safeRegex from 'safe-regex';

   const pattern = '(a+)+';
   safeRegex(pattern);  // false - vulnerable!

   const safe = '^[a-z]+$';
   safeRegex(safe);  // true - safe
   ```

   **Limitation:** Has false positives/negatives. Use `vuln-regex-detector` for better accuracy.

2. **redos-detector** (npm package)
   ```typescript
   import { isSafe } from 'redos-detector';

   const result = isSafe('(a+)+');
   // { safe: false, score: 10 }

   const safeResult = isSafe('^[a-z]+$');
   // { safe: true, score: 0 }
   ```

   **Features:**
   - ✅ Scoring system (vulnerability severity)
   - ✅ Works in browser, Node, Deno
   - ✅ ESLint plugin available

3. **vuln-regex-detector** (npm package)
   ```typescript
   import { detect } from 'vuln-regex-detector';

   detect('(a+)+').then((result) => {
     console.log(result.vulnerable);  // true
   });
   ```

   **Guarantees:**
   - ✅ No false positives (if vulnerable, attack string exists)
   - ✅ Far fewer false negatives than safe-regex (~10% vs ~90%)

**Integration with Zod:**

```typescript
import { z } from 'zod';
import { isSafe } from 'redos-detector';

const SafeRegexSourceSchema = z.string().refine(
  (source) => {
    const result = isSafe(source);
    return result.safe;
  },
  {
    message: 'Regular expression is vulnerable to ReDoS attacks',
  }
);

const SafeSerializedRegexSchema = z.object({
  source: SafeRegexSourceSchema,
  flags: z.string().regex(/^[gimsuvy]*$/),
});

// Usage
try {
  SafeSerializedRegexSchema.parse({
    source: '(a+)+',  // Vulnerable pattern
    flags: '',
  });
} catch (error) {
  // Error: Regular expression is vulnerable to ReDoS attacks
}
```

**Best Practices:**

1. **Never allow user-defined regex patterns** without validation
2. **Set timeouts** for regex execution (Node.js 4.5+, Ruby 3.2+)
3. **Use non-backtracking engines** when possible (RE2, Rust regex crate)
4. **Validate with ReDoS detector** before creating RegExp
5. **Limit input length** to prevent complex patterns
6. **Use vetted patterns** from OWASP Regex Repository

**Regolith (Rust-backed alternative):**

```typescript
import { RegExp as SafeRegExp } from 'regolith';

// Drop-in replacement with guaranteed linear performance
const regex = new SafeRegExp('(a+)+');
// No catastrophic backtracking - safe by design
```

### 1.5 Database Storage Patterns

**PostgreSQL (JSON column):**
```sql
CREATE TABLE patterns (
  id SERIAL PRIMARY KEY,
  config JSONB
);

INSERT INTO patterns (config) VALUES (
  '{"pattern": {"source": "^[a-z]+$", "flags": "i"}}'::jsonb
);
```

**MongoDB:**
```javascript
db.patterns.insert({
  pattern: {
    source: '^[a-z]+$',
    flags: 'i'
  }
});
```

**Redis:**
```javascript
redis.set('pattern:1', JSON.stringify({
  source: '^[a-z]+$',
  flags: 'i'
}));
```

### 1.6 Recommended Implementation

**Complete Type-Safe Solution:**

```typescript
import { z } from 'zod';
import { isSafe } from 'redos-detector';

// Schema for serialized regex
export const SerializedRegexSchema = z.object({
  source: z.string()
    .min(1, 'Regex pattern cannot be empty')
    .refine(
      (source) => {
        const result = isSafe(source);
        return result.safe;
      },
      { message: 'Regex pattern is vulnerable to ReDoS attacks' }
    ),
  flags: z.string()
    .regex(/^[gimsuvy]*$/, 'Invalid regex flags')
    .optional()
    .default(''),
});

export type SerializedRegex = z.infer<typeof SerializedRegexSchema>;

// Serialize RegExp to JSON-safe format
export const serializeRegex = (regex: RegExp): SerializedRegex => {
  return {
    source: regex.source,
    flags: regex.flags,
  };
};

// Deserialize JSON to RegExp with validation
export const deserializeRegex = (data: unknown): RegExp => {
  const validated = SerializedRegexSchema.parse(data);
  return new RegExp(validated.source, validated.flags);
};

// Round-trip JSON serialization
export const toJSON = (regex: RegExp): string => {
  return JSON.stringify(serializeRegex(regex));
};

export const fromJSON = (json: string): RegExp => {
  const parsed = JSON.parse(json);
  return deserializeRegex(parsed);
};
```

**Usage:**

```typescript
// Serialize
const regex = /test/gi;
const serialized = serializeRegex(regex);
// { source: 'test', flags: 'gi' }

const json = toJSON(regex);
// '{"source":"test","flags":"gi"}'

// Deserialize
const restored = fromJSON(json);
// /test/gi

// Validation catches unsafe patterns
try {
  deserializeRegex({ source: '(a+)+', flags: '' });
} catch (error) {
  // Error: Regex pattern is vulnerable to ReDoS attacks
}
```

---

## Task 2: Template Helper Registry Pattern

### Summary

Template engines like Handlebars, Mustache, and Nunjucks use different approaches for helper functions. The key patterns are: (1) function registry with string lookup, (2) argument parsing via regex or AST, and (3) type-safe helper definitions.

### 2.1 Handlebars Helper Registry

**Source:** [handlebarsjs.com](https://handlebarsjs.com/guide/expressions.html)

**Registration API:**

```typescript
import Handlebars from 'handlebars';

// Basic helper
Handlebars.registerHelper('loud', (str: string) => {
  return str.toUpperCase();
});

// Usage: {{loud name}}
```

**TypeScript Type Definition:**

```typescript
// From @types/handlebars
declare namespace Handlebars {
  type HelperDelegate = (
    this: any,
    ...args: any[]
  ) => string | void;

  function registerHelper(
    name: string,
    fn: HelperDelegate
  ): void;

  function registerHelper(
    helpers: { [name: string]: HelperDelegate }
  ): void;
}
```

**Argument Parsing:**

Handlebars parses helpers as "a simple identifier, followed by zero or more parameters (separated by space)."

```handlebars
{{helper arg1 arg2 arg3}}
```

Each parameter is a Handlebars expression:
- **Literals:** `{{helper "string" 123 true false null}}`
- **Variables:** `{{helper user.name product.price}}`
- **Subexpressions:** `{{helper (otherHelper "arg")}}`

**Hash Arguments (named parameters):**

```handlebars
{{helper arg1 key1=value1 key2=value2}}
```

```typescript
Handlebars.registerHelper('helper', function(...args: any[]) {
  const options = args[args.length - 1];
  const hash = options.hash;
  // hash = { key1: value1, key2: value2 }
});
```

### 2.2 Nunjucks Helper Functions

**Source:** [Apostrophe Nunjucks Docs](https://v2.docs.apostrophecms.org/core-concepts/working-with-templates/nunjucks-helper-functions.html)

**Registration:**

```typescript
// Inside construct function
self.addHelpers({
  formatDate(date: Date, format: string) {
    return moment(date).format(format);
  },

  uppercase(str: string) {
    return str.toUpperCase();
  },
});
```

**Usage:**

```jinja2
{{ formatDate(post.publishedAt, 'YYYY-MM-DD') }}
{{ uppercase(user.name) }}
```

**Key Differences from Handlebars:**

- ✅ Helpers are synchronous (return value is what you get)
- ✅ Standard function call syntax with parentheses
- ✅ Added via `addGlobal()` or `addHelpers()`
- ❌ No async helpers in basic usage

### 2.3 Mustache (Logic-less)

**Source:** [Stack Overflow](https://stackoverflow.com/questions/6045165/calling-function-with-arguments-in-mustache-javascript)

Mustache is **logic-less** - no functions with arguments in templates.

**Workaround for arguments:**

```javascript
// Define wrapper function
data.FUNC = function() {
  return function(val, render) {
    const values = JSON.parse(render(val));
    return window[values.FUNCNAME].apply(this, values.FUNCARGS);
  };
};
```

```mustache
{{#FUNC}}{"FUNCNAME":"myFunc","FUNCARGS":["arg1", "arg2"]}{{/FUNC}}
```

**Not recommended** - too complex. Mustache is designed to be simple.

### 2.4 Template String Parsing Approaches

#### Approach 1: Regex-Based Parsing

**Simple template format:** `{{helperName(arg1, arg2)}}`

```typescript
const TEMPLATE_REGEX = /\{\{(\w+)\((.*?)\)\}\}/g;

const parseTemplate = (template: string) => {
  const matches = template.matchAll(TEMPLATE_REGEX);
  const calls = [];

  for (const match of matches) {
    const helperName = match[1];
    const argsString = match[2];
    const args = argsString.split(',').map(s => s.trim());

    calls.push({ helperName, args });
  }

  return calls;
};

// Usage
parseTemplate('{{uuid()}}');
// [{ helperName: 'uuid', args: [''] }]

parseTemplate('{{iso8601(+7days)}}');
// [{ helperName: 'iso8601', args: ['+7days'] }]
```

**Limitations:**
- ❌ Can't handle nested function calls
- ❌ Can't handle quoted strings with commas
- ❌ Can't handle complex expressions

#### Approach 2: AST-Based Parsing (Edge Parser)

**Source:** [edge-js/parser](https://github.com/edge-js/parser)

```typescript
import { Parser } from 'edge-parser';

const parser = new Parser();

// Generate AST from expression
const ast = parser.utils.generateAST('uuid()', loc, filename);

// Transform AST (e.g., prefix state references)
const transformed = parser.utils.transformAst(ast, filename, (node) => {
  if (node.type === 'Identifier') {
    // Transform identifier nodes
  }
  return node;
});

// Convert back to string
const code = parser.utils.stringify(transformed);
```

**Capabilities:**
- ✅ Handles complex JavaScript expressions
- ✅ Supports nested calls: `outer(inner(arg))`
- ✅ Supports object/array literals
- ✅ Supports arrow functions
- ✅ Supports optional chaining: `user?.name`

**Example AST for `{{uuid()}}`:**

```json
{
  "type": "CallExpression",
  "callee": {
    "type": "Identifier",
    "name": "uuid"
  },
  "arguments": []
}
```

#### Approach 3: Tokenizer-Based (Tokenizr)

**Source:** [rse/tokenizr](https://github.com/rse/tokenizr)

```typescript
import Tokenizr from 'tokenizr';

const lexer = new Tokenizr();

// Define tokens
lexer.rule(/\{\{/, (ctx) => {
  ctx.accept('open');
  ctx.state('inside');
});

lexer.rule('inside', /(\w+)/, (ctx, match) => {
  ctx.accept('identifier', match[1]);
});

lexer.rule('inside', /\(/, (ctx) => {
  ctx.accept('lparen');
  ctx.state('args');
});

lexer.rule('args', /([^,)]+)/, (ctx, match) => {
  ctx.accept('arg', match[1].trim());
});

lexer.rule('args', /,/, (ctx) => {
  ctx.accept('comma');
});

lexer.rule('args', /\)/, (ctx) => {
  ctx.accept('rparen');
  ctx.state('inside');
});

lexer.rule('inside', /\}\}/, (ctx) => {
  ctx.accept('close');
  ctx.state('default');
});

// Tokenize
lexer.input('{{uuid()}}');
const tokens = lexer.tokens();
// [
//   { type: 'open', value: '{{' },
//   { type: 'identifier', value: 'uuid' },
//   { type: 'lparen', value: '(' },
//   { type: 'rparen', value: ')' },
//   { type: 'close', value: '}}' }
// ]
```

**Benefits:**
- ✅ State-based parsing (can switch modes)
- ✅ Flexible token rules
- ✅ Can handle complex nested structures
- ✅ TypeScript support

### 2.5 Type-Safe Helper Registry

**Pattern from Handlebars + TypeScript:**

```typescript
// Define helper signature types
type HelperFn<TArgs extends any[] = any[], TReturn = string> = (
  ...args: TArgs
) => TReturn;

// Registry interface
interface HelperRegistry {
  [name: string]: HelperFn;
}

// Create registry
const helpers: HelperRegistry = {};

// Register helper with type safety
const registerHelper = <TArgs extends any[], TReturn = string>(
  name: string,
  fn: HelperFn<TArgs, TReturn>
) => {
  helpers[name] = fn;
};

// Usage
registerHelper('uuid', () => crypto.randomUUID());

registerHelper('iso8601', (offset?: string) => {
  const date = new Date();
  if (offset) {
    // Parse offset like "+7days"
    const match = offset.match(/^([+-])(\d+)(days?|hours?|minutes?)$/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const value = parseInt(match[2]);
      const unit = match[3];
      // Apply offset...
    }
  }
  return date.toISOString();
});

registerHelper('randomInt', (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
});
```

**Calling helpers:**

```typescript
const callHelper = (name: string, args: unknown[]): unknown => {
  const helper = helpers[name];
  if (!helper) {
    throw new Error(`Helper '${name}' not found`);
  }
  return helper(...args);
};

// Usage
callHelper('uuid', []);  // "550e8400-e29b-41d4-a716-446655440000"
callHelper('iso8601', ['+7days']);  // "2025-11-20T12:00:00.000Z"
callHelper('randomInt', [1, 100]);  // 42
```

### 2.6 Argument Validation with Zod

**Type-safe helper with validated arguments:**

```typescript
import { z } from 'zod';

// Define argument schema
const Iso8601ArgsSchema = z.tuple([
  z.string().regex(/^[+-]\d+(days?|hours?|minutes?)$/).optional(),
]);

// Create validated helper
const createValidatedHelper = <TSchema extends z.ZodTypeAny>(
  name: string,
  argsSchema: TSchema,
  fn: (args: z.infer<TSchema>) => string
) => {
  return (...args: unknown[]) => {
    const validated = argsSchema.parse(args);
    return fn(validated);
  };
};

// Register with validation
registerHelper(
  'iso8601',
  createValidatedHelper(
    'iso8601',
    Iso8601ArgsSchema,
    ([offset]) => {
      const date = new Date();
      if (offset) {
        // Apply offset...
      }
      return date.toISOString();
    }
  )
);
```

### 2.7 Parsing Template Calls

**Complete parser for `{{helper(arg1, arg2)}}`:**

```typescript
import { z } from 'zod';

// AST node types
type ASTNode =
  | { type: 'HelperCall'; name: string; args: Argument[] }
  | { type: 'Literal'; value: string | number | boolean }
  | { type: 'StateReference'; path: string };

type Argument = ASTNode;

// Parse template expression
const parseHelperCall = (expression: string): ASTNode => {
  const match = expression.match(/^(\w+)\((.*)\)$/);

  if (!match) {
    throw new Error('Invalid helper call syntax');
  }

  const [, name, argsString] = match;

  const args: Argument[] = argsString
    .split(',')
    .map(arg => arg.trim())
    .filter(arg => arg.length > 0)
    .map(parseArgument);

  return { type: 'HelperCall', name, args };
};

const parseArgument = (arg: string): Argument => {
  // String literal
  if (arg.startsWith('"') && arg.endsWith('"')) {
    return { type: 'Literal', value: arg.slice(1, -1) };
  }

  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(arg)) {
    return { type: 'Literal', value: parseFloat(arg) };
  }

  // Boolean literal
  if (arg === 'true' || arg === 'false') {
    return { type: 'Literal', value: arg === 'true' };
  }

  // State reference (e.g., state.userId)
  if (arg.startsWith('state.')) {
    return { type: 'StateReference', path: arg };
  }

  // Otherwise treat as string literal
  return { type: 'Literal', value: arg };
};

// Evaluate AST node
const evaluateNode = (node: ASTNode, state: Record<string, unknown>): unknown => {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'StateReference':
      const path = node.path.replace(/^state\./, '');
      return getNestedValue(state, path);

    case 'HelperCall':
      const args = node.args.map(arg => evaluateNode(arg, state));
      return callHelper(node.name, args);
  }
};

// Helper to get nested values
const getNestedValue = (obj: any, path: string): unknown => {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
};
```

**Usage:**

```typescript
const state = { userId: 'user-123' };

// Parse and evaluate
const ast1 = parseHelperCall('uuid()');
const result1 = evaluateNode(ast1, state);
// "550e8400-e29b-41d4-a716-446655440000"

const ast2 = parseHelperCall('iso8601("+7days")');
const result2 = evaluateNode(ast2, state);
// "2025-11-20T12:00:00.000Z"

const ast3 = parseHelperCall('randomInt(1, 100)');
const result3 = evaluateNode(ast3, state);
// 42

// With state reference
registerHelper('echo', (value: unknown) => String(value));
const ast4 = parseHelperCall('echo(state.userId)');
const result4 = evaluateNode(ast4, state);
// "user-123"
```

### 2.8 Recommended Implementation

**Complete type-safe template helper system:**

```typescript
import { z } from 'zod';

// 1. Helper function types
type HelperFn = (...args: unknown[]) => unknown;

interface HelperRegistry {
  [name: string]: HelperFn;
}

// 2. Global registry
const helpers: HelperRegistry = {};

// 3. Register helper
export const registerHelper = (name: string, fn: HelperFn): void => {
  if (helpers[name]) {
    throw new Error(`Helper '${name}' already registered`);
  }
  helpers[name] = fn;
};

// 4. Call helper
export const callHelper = (name: string, args: unknown[]): unknown => {
  const helper = helpers[name];
  if (!helper) {
    throw new Error(`Helper '${name}' not found`);
  }
  return helper(...args);
};

// 5. Parse template expression
const HELPER_CALL_REGEX = /^(\w+)\((.*)\)$/;

export const parseTemplate = (template: string): {
  name: string;
  args: unknown[];
} => {
  const match = template.match(HELPER_CALL_REGEX);

  if (!match) {
    throw new Error('Invalid template syntax');
  }

  const [, name, argsString] = match;

  const args = argsString
    .split(',')
    .map(arg => arg.trim())
    .filter(arg => arg.length > 0)
    .map(parseArgument);

  return { name, args };
};

const parseArgument = (arg: string): unknown => {
  // String literal
  if ((arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))) {
    return arg.slice(1, -1);
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(arg)) {
    return parseFloat(arg);
  }

  // Boolean
  if (arg === 'true') return true;
  if (arg === 'false') return false;

  // Null
  if (arg === 'null') return null;

  // Default: string
  return arg;
};

// 6. Execute template
export const executeTemplate = (template: string): unknown => {
  const { name, args } = parseTemplate(template);
  return callHelper(name, args);
};

// 7. Built-in helpers
registerHelper('uuid', () => {
  return crypto.randomUUID();
});

registerHelper('iso8601', (offset?: string) => {
  const date = new Date();

  if (offset && typeof offset === 'string') {
    const match = offset.match(/^([+-])(\d+)(days?|hours?|minutes?)$/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const value = parseInt(match[2]) * sign;
      const unit = match[3];

      switch (unit) {
        case 'day':
        case 'days':
          date.setDate(date.getDate() + value);
          break;
        case 'hour':
        case 'hours':
          date.setHours(date.getHours() + value);
          break;
        case 'minute':
        case 'minutes':
          date.setMinutes(date.getMinutes() + value);
          break;
      }
    }
  }

  return date.toISOString();
});

registerHelper('randomInt', (min: unknown, max: unknown) => {
  const minNum = typeof min === 'number' ? min : 0;
  const maxNum = typeof max === 'number' ? max : 100;
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
});

registerHelper('timestamp', () => {
  return Date.now();
});
```

**Usage:**

```typescript
// Execute templates
executeTemplate('uuid()');
// "550e8400-e29b-41d4-a716-446655440000"

executeTemplate('iso8601()');
// "2025-11-13T12:00:00.000Z"

executeTemplate('iso8601("+7days")');
// "2025-11-20T12:00:00.000Z"

executeTemplate('randomInt(1, 100)');
// 42

executeTemplate('timestamp()');
// 1699887600000

// Register custom helpers
registerHelper('uppercase', (str: unknown) => {
  return String(str).toUpperCase();
});

executeTemplate('uppercase("hello")');
// "HELLO"
```

---

## Comparison Matrix

### Regex Serialization Libraries

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **SuperJSON** | ✅ Simple API<br>✅ Metadata separation<br>✅ Multiple types supported | ❌ String representation only<br>❌ No ReDoS protection | Full-stack apps with tRPC/Next.js |
| **serialize-javascript** | ✅ XSS protection<br>✅ Constructor format<br>✅ Script embedding | ❌ Eval required<br>❌ No type safety | Server-side rendering |
| **Custom Zod** | ✅ Type safety<br>✅ Validation<br>✅ ReDoS protection | ❌ More code to write<br>❌ Manual implementation | Production APIs with user input |

### Template Parsing Approaches

| Approach | Complexity | Capabilities | Best For |
|----------|-----------|--------------|----------|
| **Regex** | Low | Simple patterns only | Basic template replacement |
| **AST (Edge)** | High | Full JavaScript expressions | Complex template engine |
| **Tokenizer** | Medium | Configurable rules | Custom DSL parsing |

### Template Engine Comparison

| Engine | Helper Support | Argument Parsing | Type Safety |
|--------|---------------|------------------|-------------|
| **Handlebars** | ✅ Excellent | Built-in subexpressions | TypeScript types available |
| **Nunjucks** | ✅ Good | Standard function calls | Limited types |
| **Mustache** | ❌ Logic-less | N/A (no arguments) | N/A |

---

## Recommendations

### For Regex Serialization

**Use Case: User-Provided Regex in API**

```typescript
// RECOMMENDED
import { z } from 'zod';
import { isSafe } from 'redos-detector';

const SafeSerializedRegexSchema = z.object({
  source: z.string().min(1).refine((s) => isSafe(s).safe),
  flags: z.string().regex(/^[gimsuvy]*$/).default(''),
});

// Serialize
export const serializeRegex = (regex: RegExp) => ({
  source: regex.source,
  flags: regex.flags,
});

// Deserialize with validation
export const deserializeRegex = (data: unknown): RegExp => {
  const validated = SafeSerializedRegexSchema.parse(data);
  return new RegExp(validated.source, validated.flags);
};
```

**Use Case: Internal Regex (No User Input)**

```typescript
// SIMPLER - No ReDoS check needed
const SerializedRegexSchema = z.object({
  source: z.string(),
  flags: z.string().regex(/^[gimsuvy]*$/),
});

// Can use SuperJSON for simplicity
import superjson from 'superjson';
const serialized = superjson.stringify({ pattern: /test/gi });
const deserialized = superjson.parse(serialized);
```

### For Template Helpers

**Use Case: Simple Template Replacement**

```typescript
// RECOMMENDED: Regex-based parsing
const HELPER_REGEX = /\{\{(\w+)\((.*?)\)\}\}/g;

const executeTemplate = (template: string) => {
  return template.replace(HELPER_REGEX, (match, name, argsString) => {
    const args = argsString.split(',').map(s => s.trim());
    return String(callHelper(name, args));
  });
};
```

**Use Case: Complex Template Engine**

```typescript
// RECOMMENDED: AST-based parsing (Edge parser)
import { Parser } from 'edge-parser';

const parser = new Parser();
const ast = parser.utils.generateAST(expression, loc, filename);
const code = parser.utils.stringify(ast);
```

**Use Case: Custom DSL**

```typescript
// RECOMMENDED: Tokenizer (Tokenizr)
import Tokenizr from 'tokenizr';

const lexer = new Tokenizr();
// Define rules...
const tokens = lexer.input(template).tokens();
```

---

## Code Examples from Production Libraries

### Example 1: SuperJSON RegExp Handling

**Source:** [GitHub](https://github.com/flightcontrolhq/superjson/blob/main/src/transformer.ts)

```typescript
// Simplified implementation
const isRegExp = (value: unknown): value is RegExp => {
  return value instanceof RegExp;
};

const transformRegExp = (regex: RegExp) => {
  return regex.toString();  // "/pattern/flags"
};

const untransformRegExp = (str: string): RegExp => {
  const match = str.match(/^\/(.*)\/([gimsuvy]*)$/);
  if (!match) throw new Error('Invalid regex string');
  return new RegExp(match[1], match[2]);
};
```

### Example 2: Handlebars Helper Registration

**Source:** [GitHub](https://github.com/handlebars-lang/handlebars.js/blob/master/lib/handlebars/helpers.js)

```typescript
// Simplified from source
export function registerHelper(name: string, fn: Function) {
  if (typeof name === 'object') {
    Utils.extend(this.helpers, name);
  } else {
    this.helpers[name] = fn;
  }
}

// Built-in helper example
registerHelper('if', function(conditional, options) {
  if (arguments.length !== 2) {
    throw new Exception('#if requires exactly one argument');
  }

  if (Utils.isFunction(conditional)) {
    conditional = conditional.call(this);
  }

  if (!options.hash.includeZero && !conditional || Utils.isEmpty(conditional)) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});
```

### Example 3: Edge Parser AST Generation

**Source:** [GitHub](https://github.com/edge-js/parser/blob/develop/src/Parser/index.ts)

```typescript
// Simplified from source
import * as acorn from 'acorn';

export function generateAST(
  expression: string,
  loc: object,
  filename: string
): any {
  try {
    return acorn.parse(expression, {
      ecmaVersion: 2020,
      locations: true,
    }).body[0];
  } catch (error) {
    throw new EdgeError(
      `Invalid JavaScript expression: ${expression}`,
      'E_INVALID_EXPRESSION',
      { filename, ...loc }
    );
  }
}
```

---

## Security Checklist

### For Regex Serialization

- [ ] **Validate source with ReDoS detector** before creating RegExp
- [ ] **Sanitize user input** - never allow arbitrary regex patterns
- [ ] **Set execution timeouts** (if language supports)
- [ ] **Escape special characters** when displaying patterns
- [ ] **Limit pattern length** (e.g., max 1000 characters)
- [ ] **Validate flags** against allowed set: `[gimsuvy]`
- [ ] **Log suspicious patterns** for security monitoring
- [ ] **Use safe regex engine** (RE2, Regolith) if possible

### For Template Helpers

- [ ] **Validate helper names** (alphanumeric only)
- [ ] **Sanitize arguments** before passing to helpers
- [ ] **Prevent arbitrary code execution** (no `eval`, `Function()`)
- [ ] **Validate argument types** with Zod schemas
- [ ] **Limit helper execution time** (prevent infinite loops)
- [ ] **Whitelist allowed helpers** (don't allow user-defined helpers)
- [ ] **Escape output** if rendering to HTML
- [ ] **Log helper execution** for audit trail

---

## References

### Regex Serialization

1. SuperJSON: https://github.com/flightcontrolhq/superjson
2. serialize-javascript: https://github.com/yahoo/serialize-javascript
3. Zod Issue #2735: https://github.com/colinhacks/zod/issues/2735
4. Stack Overflow: https://stackoverflow.com/questions/12075927/serialization-of-regexp
5. safe-regex: https://www.npmjs.com/package/safe-regex
6. redos-detector: https://www.npmjs.com/package/redos-detector
7. vuln-regex-detector: https://www.npmjs.com/package/vuln-regex-detector
8. Regolith: https://www.regolithjs.com/
9. OWASP ReDoS: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS

### Template Helpers

1. Handlebars Expressions: https://handlebarsjs.com/guide/expressions.html
2. Handlebars Block Helpers: https://handlebarsjs.com/guide/block-helpers.html
3. Nunjucks Helpers: https://v2.docs.apostrophecms.org/core-concepts/working-with-templates/nunjucks-helper-functions.html
4. Edge Parser: https://github.com/edge-js/parser
5. Tokenizr: https://github.com/rse/tokenizr
6. parse-literals: https://www.npmjs.com/package/parse-literals
7. TypeScript Template Literal Types: https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html

---

## Next Steps

**For Scenarist Implementation:**

1. **Choose regex serialization approach:**
   - Use `SerializedRegexSchema` (source + flags)
   - Integrate `redos-detector` for validation
   - Store as JSON in database/scenarios

2. **Choose template parser:**
   - Start with regex-based parser (simple)
   - Migrate to AST if complex expressions needed
   - Add helper registry with type safety

3. **Implement built-in helpers:**
   - `uuid()` - Generate unique IDs
   - `iso8601(offset?)` - Generate timestamps
   - `randomInt(min, max)` - Random numbers
   - `timestamp()` - Unix timestamp

4. **Add custom helper support:**
   - `registerHelper(name, fn)` API
   - Type-safe helper definitions
   - Zod validation for arguments
   - Documentation with examples

5. **Security hardening:**
   - ReDoS detection for regex patterns
   - Argument validation for helpers
   - Execution timeouts
   - Audit logging
