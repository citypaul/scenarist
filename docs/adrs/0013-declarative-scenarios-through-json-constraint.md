# ADR-0013: Declarative Scenarios Through JSON Serializability Constraint

**Status**: Accepted (Refined by ADR-0016)
**Date**: 2025-11-14
**Authors**: Claude Code

> **Note**: ADR-0016 refines this constraint from "JSON-serializable" to "declarative patterns". Native RegExp is now supported (as of 2025-01-16) as it satisfies the declarative principle. The core insight remains: we enforce declarative > imperative, and RegExp is declarative.

## Context

During analysis of Acquisition.Web's variant system (Issue #89), we evaluated whether Scenarist should adopt runtime variant interpolation instead of JSON-serializable scenario definitions.

Acquisition.Web uses runtime parameterization with imperative function-based handlers:

```typescript
// Acquisition.Web pattern (imperative, runtime)
http.get("/api/products", ({ request }) => {
  const tier = request.headers.get("x-tier");
  if (tier === "premium") {
    return HttpResponse.json(buildProducts("premium"));
  }
  return HttpResponse.json(buildProducts("standard"));
});
```

This pattern is more concise than Scenarist's declarative approach but represents a fundamentally different design philosophy. The question is not whether runtime functions are **possible** (they are), but whether they lead to **better patterns**.

### The Core Design Question

**Should Scenarist enforce declarative patterns through architectural constraints, or allow imperative function-based handlers?**

This mirrors React's choice: React **could** allow direct DOM manipulation (imperative), but instead **enforces** declarative JSX. Not because imperative is impossible, but because declarative is clearer, more composable, and easier to reason about.

The JSON serializability constraint serves the same purpose: it **forces** declarative patterns by making imperative code impossible.

## Problem

**How can we guide users toward clearer, more maintainable test scenarios while:**

1. Preventing routing hacks and imperative if/else chains
2. Making implicit logic explicit (match criteria, not hidden conditionals)
3. Enabling composition (specificity-based selection, automatic fallback)
4. Encouraging separation of concerns (data vs behavior)
5. Supporting future advanced features (distributed testing, storage adapters)

**The Fundamental Trade-off:**

- **Imperative (functions)**: More flexible, more concise, easier to write initially
- **Declarative (JSON)**: More explicit, more composable, easier to understand later

Which philosophy should Scenarist adopt?

## Decision

We will **enforce declarative scenario definitions through strict JSON serializability** and **reject imperative function-based handlers**.

This constraint is **not about what you can't do** (store in Redis), but about **what you're forced to do** (declare intent explicitly).

### Declarative vs Imperative Comparison

**Imperative (Acquisition.Web with functions):**

```typescript
// ❌ Implicit routing logic buried in function body
http.get("/api/products", ({ request }) => {
  const tier = request.headers.get("x-tier");
  const referer = request.headers.get("referer");

  // Routing hack: logic depends on where request came from
  if (referer?.includes("/dashboard")) {
    return HttpResponse.json(buildProducts("dashboard"));
  }

  // Nested conditionals become routing logic
  if (tier === "premium") {
    return HttpResponse.json(buildProducts("premium"));
  } else if (tier === "standard") {
    return HttpResponse.json(buildProducts("standard"));
  } else {
    return HttpResponse.json(buildProducts("free"));
  }
});

// Problem: Request matching logic is hidden in function body
// - Can't see what headers/paths matter until you read the code
// - No composition (can't override specific cases)
// - No automatic specificity-based selection
// - Testing the handler requires understanding imperative flow
```

**Declarative (Scenarist with JSON):**

```typescript
// ✅ Explicit match criteria - intent is clear
const mocks = [
  // Most specific: Premium tier
  {
    method: "GET",
    url: "/api/products",
    match: { headers: { "x-tier": "premium" } },
    response: { status: 200, body: { products: buildProducts("premium") } },
  },
  // Less specific: Standard tier
  {
    method: "GET",
    url: "/api/products",
    match: { headers: { "x-tier": "standard" } },
    response: { status: 200, body: { products: buildProducts("standard") } },
  },
  // Fallback: No match criteria
  {
    method: "GET",
    url: "/api/products",
    response: { status: 200, body: { products: buildProducts("free") } },
  },
];

// Benefits:
// - Intent is visible without reading code (headers that matter: 'x-tier')
// - Automatic specificity-based selection (no manual if/else ordering)
// - Composable (can add more specific mocks, they'll override automatically)
// - Testable (can verify match criteria without executing functions)
// - No routing hacks possible (referer checks force explicit mock, not hidden logic)
```

### How the Constraint Forces Better Patterns

The JSON constraint **prevents** imperative patterns and **forces** Scenarist's declarative features:

**Instead of if/else conditionals:**

```typescript
// ❌ Imperative (functions allow this)
const handler = (req) => {
  if (req.body.tier === "premium") return premiumResponse;
  if (req.body.tier === "standard") return standardResponse;
  return freeResponse;
};

// ✅ Declarative (JSON forces this)
const mocks = [
  { match: { body: { tier: "premium" } }, response: premiumResponse },
  { match: { body: { tier: "standard" } }, response: standardResponse },
  { response: freeResponse }, // Fallback
];
```

**Phase 1 benefit:** Match criteria become explicit data, not hidden logic.

**Instead of referer routing hacks:**

```typescript
// ❌ Imperative (routing based on where request came from)
const handler = (req) => {
  if (req.headers.referer?.includes("/premium-page")) {
    return premiumSequence[callCount++]; // Sequence + routing hack
  }
  return standardResponse;
};

// ✅ Declarative (JSON forces explicit sequence per scenario)
const mocks = [
  {
    sequence: {
      responses: [
        { status: 200, body: { step: 1 } },
        { status: 200, body: { step: 2 } },
        { status: 200, body: { step: 3 } },
      ],
      repeat: "last",
    },
  },
];
```

**Phase 2 benefit:** Sequences are first-class data structures, not manual counters.

**Instead of string concatenation:**

```typescript
// ❌ Imperative (manual state injection)
const handler = (req, state) => {
  const items = state.get("items") || [];
  return {
    status: 200,
    body: { message: `You have ${items.length} items` },
  };
};

// ✅ Declarative (JSON forces template-based injection)
const mock = {
  response: {
    status: 200,
    body: { message: "You have {{state.items.length}} items" },
  },
};
```

**Phase 3 benefit:** State templates make injection explicit, not scattered across functions.

### The React Analogy

React's design philosophy directly parallels this decision:

**React could allow imperative DOM manipulation:**

```typescript
// ❌ Imperative (possible but discouraged)
const component = () => {
  const div = document.createElement("div");
  if (user.isPremium) {
    div.className = "premium";
    div.textContent = "Premium User";
  } else {
    div.className = "standard";
    div.textContent = "Standard User";
  }
  return div;
};
```

**But React enforces declarative JSX:**

```typescript
// ✅ Declarative (enforced by architecture)
const Component = () => (
  <div className={user.isPremium ? 'premium' : 'standard'}>
    {user.isPremium ? 'Premium User' : 'Standard User'}
  </div>
);
```

**Why React chose declarative:**

- Easier to understand (intent is visible)
- Composable (can nest components)
- Testable (can verify props without rendering)
- Optimizable (React can diff virtual DOM)

**Why Scenarist chooses declarative:**

- Easier to understand (match criteria are visible)
- Composable (specificity-based selection)
- Testable (can verify scenarios without execution)
- Serializable (enables storage adapters)

The constraint is **intentional design pressure**, not a technical limitation.

### Serializable Means

- ✅ Primitives: `string`, `number`, `boolean`, `null`
- ✅ Objects: `{ key: value }`
- ✅ Arrays: `[item1, item2]`
- ✅ Nested structures: `{ data: { nested: [1, 2, 3] } }`
- ❌ Functions: `(x) => x * 2`
- ❌ Closures: `() => externalVar`
- ❌ Regex objects: `/pattern/gi`
- ❌ Class instances: `new MyClass()`
- ❌ Symbols, undefined, circular references

### For Variants: Build-Time Generation

When multiple scenarios share structure but differ in data, use `buildVariants`:

```typescript
// ✅ CORRECT - Build-time variant generation (Issue #89)
import { buildVariants } from "@scenarist/core";

const baseConfig = {
  mocks: [
    {
      method: "GET",
      url: "/api/products",
      response: { status: 200, body: { products: [] } }, // Placeholder
    },
  ],
};

const variantConfigs = [
  { tier: "premium", products: premiumProducts },
  { tier: "standard", products: standardProducts },
];

// Generate 2 separate scenarios at build time
const scenarios = buildVariants(baseConfig, variantConfigs, (base, config) => ({
  ...base,
  id: `products-${config.tier}`,
  mocks: base.mocks.map((mock) => ({
    ...mock,
    response: { ...mock.response, body: { products: config.products } },
  })),
}));

// Result: 2 fully expanded scenarios (declarative JSON)
// scenarios = [
//   { id: 'products-premium', mocks: [...] },
//   { id: 'products-standard', mocks: [...] },
// ]
```

This is more verbose than runtime interpolation, but:

- Makes all variants explicit (can see what exists)
- Enables composition (can override specific variants)
- Allows storage (variants are data, not functions)

## Alternatives Considered

### Alternative 1: Runtime Variant Interpolation (Acquisition.Web Pattern)

**Pattern:**

```typescript
const scenario = {
  id: "products",
  mocks: [
    {
      url: "/api/products",
      response: (variant) => ({ products: buildProducts(variant.tier) }),
    },
  ],
};
```

**Pros:**

- ✅ Minimal source code duplication
- ✅ DRY (single mock definition for all variants)
- ✅ Concise and readable

**Cons:**

- ❌ Enables imperative patterns (if/else in response functions)
- ❌ Hides routing logic (can't see what matters without reading function)
- ❌ Prevents composition (can't override specific cases with specificity)
- ❌ Not serializable (breaks storage adapters like Redis)
- ❌ No static analysis (can't validate scenarios without execution)
- ❌ Leads to routing hacks (referer checks, manual counters)

**Decision**: Rejected - imperative patterns lead to less maintainable code

### Alternative 2: Allow Both Patterns (Functions and JSON)

**Pattern:**

```typescript
// Support both:
const functionalScenario = {
  response: (variant) => buildProducts(variant.tier), // Imperative
};

const declarativeScenario = {
  match: { headers: { "x-tier": "premium" } },
  response: { products: premiumProducts }, // Declarative
};
```

**Pros:**

- ✅ Flexibility (users choose pattern)
- ✅ Migration path (can start imperative, migrate to declarative)

**Cons:**

- ❌ Two different mental models (confusing for users)
- ❌ Documentation burden (explain when to use which)
- ❌ Type system complexity (union types, conditional validation)
- ❌ No forcing function (users default to imperative, miss declarative benefits)
- ❌ Partial serialization (some scenarios storeable, others not)

**Decision**: Rejected - constraint is valuable, don't undermine it with escape hatches

### Alternative 3: Serialize Functions as Strings (eval)

**Pattern:**

```typescript
const scenario = {
  id: "products",
  mocks: [
    {
      url: "/api/products",
      responseFunction:
        "(variant) => ({ products: buildProducts(variant.tier) })",
    },
  ],
};

// In adapter:
const fn = eval(mock.responseFunction); // Reconstruct function
```

**Pros:**

- ✅ Technically serializable (functions stored as strings)
- ✅ Could enable runtime interpolation

**Cons:**

- ❌ Security risk (eval enables arbitrary code execution)
- ❌ Fragile (functions can't reference external variables)
- ❌ No type safety (function types lost during serialization)
- ❌ Still enables imperative patterns (doesn't solve core problem)
- ❌ Violates CSP (Content Security Policy) in browsers
- ❌ Maintenance nightmare (debugging serialized functions)

**Decision**: Rejected - security and reliability concerns outweigh benefits

## Consequences

### Positive

✅ **Enforces declarative design** - Impossible to write imperative routing logic:

- No if/else conditionals buried in handlers
- No referer routing hacks (hidden request dependencies)
- No manual sequence counters (state scattered across closures)
- All logic is explicit data (match criteria, sequences, templates)

✅ **Makes implicit logic explicit** - Intent is visible without executing code:

- Match criteria show what headers/body/query params matter
- Sequences show call progression (pending → processing → complete)
- Templates show state injection points (`{{state.items}}`)
- No hidden dependencies on request order or context

✅ **Enables composition** - Specificity-based selection works automatically:

- More specific mocks override less specific (automatic priority)
- Fallback mocks provide safety net (no 404 surprises)
- Default scenario + active scenario merge (automatic override)
- No manual if/else ordering required

✅ **Separation of concerns** - Data vs behavior cleanly separated:

- Scenarios are **data** (what to return)
- Adapters are **behavior** (how to return it)
- MSW handler conversion lives in adapter, not scenario
- Clean hexagonal architecture boundary

✅ **Testable without execution** - Can validate scenarios statically:

- Schema validation (Zod checks structure)
- Type checking (TypeScript enforces constraints)
- Linting (can detect duplicate mocks)
- No need to execute functions to understand behavior

### Side Benefits (Storage Adapters)

✅ **RedisScenarioRegistry is implementable** - Distributed testing across load-balanced servers:

```typescript
const registry = new RedisScenarioRegistry(redisClient);
await registry.register(scenario); // ✅ Serializes to Redis
const retrieved = await registry.get("premium"); // ✅ Deserializes from Redis
```

✅ **Hexagonal architecture preserved** - Multiple storage adapters remain viable:

- `InMemoryScenarioRegistry` - Fast, single process
- `RedisScenarioRegistry` - Distributed, multiple processes (edge case)
- `FileSystemScenarioRegistry` - Version control, git
- `RemoteScenarioRegistry` - Centralized management API
- `DatabaseScenarioRegistry` - PostgreSQL, MongoDB, etc.

✅ **Scenario portability** - Definitions can be:

- Stored in version control (JSON/YAML files)
- Fetched from remote APIs (HTTP)
- Shared across teams (import/export)
- Validated with JSON Schema

### Negative

❌ **Build-time variant expansion required** - More verbose than runtime interpolation:

```typescript
// Runtime (concise but imperative):
const scenario = { response: (v) => buildProducts(v.tier) };

// Build-time (verbose but declarative):
const scenarios = buildVariants(
  base,
  [{ tier: "premium" }, { tier: "standard" }],
  (base, config) => ({
    ...base,
    mocks: [
      ...base.mocks,
      {
        method: "GET",
        url: "/api/products",
        response: { status: 200, body: { products: config.products } },
      },
    ],
  }),
);
```

❌ **Memory overhead at runtime** - Variants stored as separate scenarios:

- 12 variants = 12 separate scenario objects in memory
- Acquisition.Web analysis: 5x memory (3 MB vs 500 KB)
- **Acceptable trade-off** for declarative clarity

❌ **Source code less DRY** - Shared mocks must be referenced, not duplicated:

```typescript
// Must extract shared mocks:
const sharedMocks = [
  { method: 'GET', url: '/api/base', response: { ... } }
];

// Then compose into variants:
const scenarios = buildVariants(
  { mocks: sharedMocks },
  variantConfigs,
  composeFn
);
```

### Neutral

⚖️ **Build-time generation complexity** - `buildVariants` utility adds indirection:

- More setup code than runtime interpolation
- But clearer separation of shared vs variant logic
- Forces thinking about what varies vs what's shared
- Documented in Issue #89

⚖️ **Learning curve** - Declarative patterns feel unfamiliar initially:

- Users accustomed to if/else need to learn match criteria
- Manual counters must become sequences
- String concatenation must become templates
- But patterns become second nature quickly (like React JSX)

## Implementation Notes

### buildVariants Utility (Issue #89)

```typescript
// packages/core/src/utils/build-variants.ts
import type { ScenaristScenario } from "../types";

export const buildVariants = <TConfig>(
  baseConfig: Partial<ScenaristScenario>,
  variantConfigs: ReadonlyArray<TConfig>,
  composeFn: (
    base: Partial<ScenaristScenario>,
    config: TConfig,
  ) => ScenaristScenario,
): ReadonlyArray<ScenaristScenario> => {
  return variantConfigs.map((config) => composeFn(baseConfig, config));
};
```

**Usage:**

```typescript
const scenarios = buildVariants(
  {
    // Shared configuration (90% of mocks)
    mocks: [
      { method: "GET", url: "/api/base", response: { status: 200, body: {} } },
    ],
  },
  [
    { tier: "premium", products: premiumProducts },
    { tier: "standard", products: standardProducts },
  ],
  (base, config) => ({
    id: `products-${config.tier}`,
    name: `Products - ${config.tier}`,
    mocks: [
      ...base.mocks,
      {
        method: "GET",
        url: "/api/products",
        response: { status: 200, body: { products: config.products } },
      },
    ],
  }),
);

// Result: 2 scenarios, fully expanded, declarative JSON
```

### Redis Adapter Example (Side Benefit)

```typescript
// packages/redis-adapter/src/redis-scenario-registry.ts
import { Redis } from "ioredis";
import type { ScenarioRegistry, ScenaristScenario } from "@scenarist/core";

export class RedisScenarioRegistry implements ScenarioRegistry {
  constructor(
    private redis: Redis,
    private keyPrefix = "scenarist:",
  ) {}

  async register(scenario: ScenaristScenario): Promise<void> {
    const key = `${this.keyPrefix}scenario:${scenario.id}`;
    // ✅ JSON.stringify works because scenario is declarative data
    await this.redis.set(key, JSON.stringify(scenario));
  }

  async get(id: string): Promise<ScenaristScenario | undefined> {
    const key = `${this.keyPrefix}scenario:${id}`;
    const json = await this.redis.get(key);
    if (!json) return undefined;
    // ✅ JSON.parse works because scenario was serialized
    return JSON.parse(json) as ScenaristScenario;
  }

  // ... other methods
}
```

## Related Decisions

- **ADR-0001**: Serializable Scenario Definitions (foundational requirement)
- **Issue #89**: buildVariants Utility Implementation
- **PR #88**: Acquisition.Web Analysis (variant use case discovery)
- **Phase 1**: Request Content Matching (explicit match criteria vs if/else)
- **Phase 2**: Response Sequences (first-class sequences vs manual counters)
- **Phase 3**: Stateful Mocks (templates vs string concatenation)

## References

- [React Documentation: Thinking in React](https://react.dev/learn/thinking-in-react) - Declarative UI philosophy
- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/) - Ports & adapters pattern
- [JSON Serialization (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- Internal: `docs/analysis/can-scenarist-replace-acquisition-web.md` (variant analysis)
- Internal: Issue #89 (buildVariants utility specification)
