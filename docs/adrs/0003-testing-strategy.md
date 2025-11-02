# ADR-0003: Testing Strategy

**Status**: Accepted
**Date**: 2025-10-23
**Authors**: Claude Code

## Context

Scenarist follows hexagonal architecture with a strict separation between domain logic (core package) and framework integration (adapters). This architectural decision requires a carefully designed testing strategy that validates each layer's responsibility without duplication.

### The Testing Challenge

Without a clear testing strategy, projects often suffer from:
- **Logic duplication in tests**: Testing the same domain logic at multiple layers (unit, integration, E2E)
- **Slow feedback loops**: Over-reliance on slow E2E tests for fast unit test scenarios
- **Brittle tests**: Testing implementation details instead of behavior
- **Unclear test ownership**: Confusion about what to test where
- **Coverage gaps**: Important behaviors untested because "someone else will test it"

### Scenarist's Architectural Constraints

Our hexagonal architecture imposes specific testing requirements:

1. **Domain logic lives in core** (`packages/core/src/domain/`)
   - Must be tested independently of frameworks
   - Must achieve 100% coverage of domain logic
   - Tests must be fast (no framework overhead)

2. **Adapters are thin translation layers** (`packages/express-adapter/`, `packages/fastify-adapter/`)
   - Should NOT contain domain logic (nothing to test!)
   - Must test translation between framework and domain
   - Must test framework-specific quirks

3. **Ports enable multiple implementations** (`packages/core/src/ports/`)
   - Interface contracts must be testable
   - Each implementation must be independently testable
   - Tests must not depend on specific implementations

4. **Test-Driven Development (TDD) is mandatory**
   - Every line of production code must be driven by a failing test
   - RED → GREEN → REFACTOR cycle is non-negotiable

## Decision

We adopt a **four-layer testing strategy** where each layer tests its own responsibility without duplication. This strategy aligns with our hexagonal architecture and ensures fast feedback, maintainability, and comprehensive coverage.

### Four Testing Layers

#### Layer 1: Core Package Tests (`packages/core/tests/`)

**Purpose:** Comprehensive unit testing of ALL domain logic

**What to test:**
- Domain services (business logic orchestration)
- Port implementations (in-memory, etc.)
- Type guards and validators
- Domain algorithms and calculations
- Edge cases, error conditions, boundary conditions
- Result types and error handling
- Pure functions and transformations

**Characteristics:**
- ✅ **Fast** - Pure TypeScript, no framework overhead (milliseconds)
- ✅ **Isolated** - Tests pure business logic, no external dependencies
- ✅ **Comprehensive** - 100% coverage of domain logic
- ✅ **Single source of truth** - Domain behavior defined here

**Example:**
```typescript
// packages/core/tests/scenario-manager.test.ts
import { describe, it, expect } from 'vitest';
import { createScenarioManager } from '../src/domain/scenario-manager';
import { createInMemoryScenarioStore } from '../src/domain/in-memory-scenario-store';

describe('ScenarioManager - switchScenario', () => {
  it('should switch scenario for given test ID', () => {
    const store = createInMemoryScenarioStore();
    const manager = createScenarioManager({ store, config: { enabled: true } });

    const scenario = { id: 'test-scenario', mocks: [] };
    manager.registerScenario(scenario);

    const result = manager.switchScenario('test-1', 'test-scenario');

    expect(result.success).toBe(true);

    const active = manager.getActiveScenario('test-1');
    expect(active.success).toBe(true);
    expect(active.data?.scenarioId).toBe('test-scenario');
  });

  it('should return error when scenario does not exist', () => {
    const store = createInMemoryScenarioStore();
    const manager = createScenarioManager({ store, config: { enabled: true } });

    const result = manager.switchScenario('test-1', 'nonexistent');

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('not found');
  });
});
```

**What NOT to test here:**
- ❌ Express-specific request handling
- ❌ Framework type conversions
- ❌ HTTP-level integration
- ❌ External system behavior

---

#### Layer 2: Adapter Package Tests (`packages/express-adapter/tests/`)

**Purpose:** Focused testing of translation layer between framework and domain

**What to test:**
- Request context extraction from framework (req → domain types)
- Response application to framework (domain types → res)
- Integration with core domain services (calling, not implementing!)
- Framework-specific quirks (header normalization, query parsing)
- Type conversions (framework types → domain types)
- Error handling in translation layer

**Characteristics:**
- ✅ **Fast** - Mock framework req/res, no full server (milliseconds)
- ✅ **Focused** - Only translation, not domain logic
- ✅ **Framework-specific** - Tests Express/Fastify/etc. quirks
- ❌ **No duplication** - Doesn't re-test core logic

**Example:**
```typescript
// packages/express-adapter/tests/request-translation.test.ts
import { describe, it, expect } from 'vitest';
import { extractRequestContext } from '../src/utils/request-translation';
import { mockExpressRequest } from './mocks';

describe('Express Adapter - Request Translation', () => {
  it('should extract all RequestContext fields from Express request', () => {
    const req = mockExpressRequest({
      method: 'POST',
      url: '/api/items',
      body: { itemId: 'premium' },
      query: { filter: 'active' },
      headers: { 'x-user-tier': 'gold' }
    });

    const context = extractRequestContext(req);

    expect(context).toEqual({
      method: 'POST',
      url: '/api/items',
      body: { itemId: 'premium' },
      query: { filter: 'active' },
      headers: expect.objectContaining({ 'x-user-tier': 'gold' })
    });
  });

  it('should handle missing optional fields gracefully', () => {
    const req = mockExpressRequest({ method: 'GET', url: '/api/data' });
    const context = extractRequestContext(req);

    expect(context.body).toBeUndefined();
    expect(context.query).toEqual({});
  });
});
```

**What NOT to test here:**
- ❌ Match criteria logic (core's responsibility)
- ❌ Sequence advancement (core's responsibility)
- ❌ State management (core's responsibility)
- ❌ Business rules (core's responsibility)

**Important Exception:**
For extremely thin adapters (≤50 lines, minimal logic), real dependencies MAY be used instead of mocks. See [ADR-0006: When Thin Adapters Can Use Real Integration Tests](./0006-thin-adapters-real-integration-tests.md) for decision criteria.

**This exception is rare** (target ≤10% of adapters). Most adapters should follow the mocking guideline above.

**Examples:**
- **General rule (mocks)**: Express, Next.js adapters - complex translation logic (90%+ of adapters)
- **Exception (real deps)**: Playwright helpers - thin wrapper, 40 lines, stable API

---

#### Layer 3: Integration Tests (`apps/express-example/tests/`)

**Purpose:** End-to-end testing of real-world user journeys with full framework

**What to test:**
- Complete flows from HTTP request to response
- Real-world scenarios and user journeys
- Scenario switching with test ID isolation
- Multi-request flows (shopping cart, multi-step forms)
- Feature composition (multiple features working together)
- Edge cases in full context

**Characteristics:**
- ✅ **Realistic** - Full server, real HTTP (supertest, Playwright, Cypress)
- ✅ **Comprehensive flows** - Tests complete user journeys
- ✅ **Confidence** - Validates entire stack integration
- ❌ **Slower** - Full server startup/teardown (seconds)

**Example:**
```typescript
// apps/express-example/tests/scenario-switching.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, scenarist } from '../src/server';

describe('Scenario Switching', () => {
  beforeAll(() => {
    scenarist.start();
  });

  afterAll(() => {
    scenarist.stop();
  });

  it('should switch scenarios per test ID without interference', async () => {
    // Test 1 uses success scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-1')
      .send({ scenario: 'success' });

    // Test 2 uses error scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-2')
      .send({ scenario: 'github-not-found' });

    // Test 1 gets success response
    const res1 = await request(app)
      .get('/api/github/user/testuser')
      .set('x-test-id', 'test-1');
    expect(res1.status).toBe(200);

    // Test 2 gets error response (no interference)
    const res2 = await request(app)
      .get('/api/github/user/testuser')
      .set('x-test-id', 'test-2');
    expect(res2.status).toBe(404);
  });
});
```

**What NOT to test here:**
- ❌ Translation edge cases (faster to test in adapter tests)
- ❌ Domain logic edge cases (faster to test in core tests)
- ❌ Every permutation (use core tests for exhaustive coverage)

---

#### Layer 4: Bruno Tests (`apps/express-example/bruno/`)

**Purpose:** Executable API documentation with selective automated tests

**What to test:**
- Happy path scenarios (success flows)
- Common patterns (2-3 examples per feature)
- Key user journeys (not every edge case)
- API contract validation

**Characteristics:**
- ✅ **Human-readable** - Non-developers can understand
- ✅ **Executable docs** - Tests are documentation
- ✅ **CI-ready** - Run via `bru run` in CI pipeline
- ❌ **Selective** - Not comprehensive like Vitest

**Example:**
```javascript
// apps/express-example/bruno/Scenarios/Set Scenario - Success.bru

meta {
  name: Set Scenario - Success
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/__scenario__
  body: json
}

headers {
  x-test-id: {{testId}}
}

body:json {
  {
    "scenario": "success"
  }
}

tests {
  test("should set scenario successfully", function() {
    expect(res.getStatus()).to.equal(200);
  });

  test("should confirm scenario is active", function() {
    const body = res.getBody();
    expect(body.scenarioId).to.equal('success');
  });
}

docs {
  Sets the active scenario to "success" for the current test ID.

  This scenario makes all external API calls succeed:
  - GitHub API returns valid user data
  - Weather API returns current weather
  - Payment API processes successfully

  Use this to test happy path user journeys.
}
```

---

### Testing Strategy Decision Matrix

| Layer | Tests | Doesn't Test | Speed | Coverage | Tools |
|-------|-------|--------------|-------|----------|-------|
| **Core** | Domain logic | Framework integration | Fast (ms) | 100% of domain | Vitest |
| **Adapter** | Translation (req↔domain) | Domain logic | Fast (ms) | Translation layer | Vitest |
| **Integration** | Full flows, user journeys | Translation details | Slow (sec) | Real scenarios | Vitest + supertest |
| **Bruno** | Key flows, API docs | Every edge case | Medium (sec) | Happy paths | Bruno CLI |

### Why This Strategy Works

**No Duplication:**
- Each layer tests its **own responsibility**
- Core tests domain logic, adapters test translation, E2E tests flows
- Bruno documents key patterns without duplicating Vitest tests

**Clear Debugging:**
- Core test failure → domain logic bug
- Adapter test failure → translation bug (req/res handling)
- Integration test failure → integration issue or missed scenario
- Bruno test failure → API contract change

**Fast Feedback:**
- Core tests run in milliseconds (pure TypeScript, no frameworks)
- Adapter tests run in milliseconds (mocked req/res)
- Integration tests run in seconds (full server)
- Bruno tests run in seconds (real HTTP in CI)

**Maintainability:**
- Domain logic changes only affect core tests
- Framework changes only affect adapter tests
- New scenarios just need integration + selective Bruno tests
- No cascading test updates across layers

### Anti-Patterns to Avoid

❌ **Testing domain logic in adapter tests**
```typescript
// WRONG - This belongs in core tests
describe('Express Adapter', () => {
  it('should match on body fields', () => {
    // Testing match criteria logic in adapter layer
  });
});
```

❌ **Testing translation in core tests**
```typescript
// WRONG - This belongs in adapter tests
describe('Core Domain', () => {
  it('should extract Express query params', () => {
    // Testing Express-specific behavior in core
  });
});
```

❌ **Duplicating all Vitest tests in Bruno**
```javascript
// WRONG - Bruno should be selective, not comprehensive
// Don't create Bruno test for every single edge case
```

❌ **E2E testing translation edge cases**
```typescript
// WRONG - This should be in adapter tests (faster feedback)
describe('Integration', () => {
  it('should handle missing headers in Express request', () => {
    // Testing adapter translation behavior in slow E2E test
  });
});
```

❌ **Testing implementation details**
```typescript
// WRONG - Testing how, not what
describe('ScenarioManager', () => {
  it('should call store.set internally', () => {
    const spy = vi.spyOn(store, 'set');
    manager.switchScenario('test', 'scenario');
    expect(spy).toHaveBeenCalled(); // Testing implementation!
  });
});
```

✅ **Testing behavior through public API**
```typescript
// CORRECT - Testing observable behavior
describe('ScenarioManager', () => {
  it('should make scenario active when switched', () => {
    manager.switchScenario('test', 'scenario');
    const active = manager.getActiveScenario('test');
    expect(active.data?.scenarioId).toBe('scenario');
  });
});
```

### TDD Workflow (RED-GREEN-REFACTOR)

Every feature must follow TDD:

**1. RED - Write Failing Test**
```typescript
// Write test FIRST - it fails (no implementation)
it('should return error when scenario not found', () => {
  const result = manager.switchScenario('test', 'nonexistent');
  expect(result.success).toBe(false);
});
```

**2. GREEN - Minimum Implementation**
```typescript
// Write MINIMUM code to pass test
switchScenario(testId: string, scenarioId: string): Result<void> {
  if (!this.registry.has(scenarioId)) {
    return { success: false, error: new Error('Scenario not found') };
  }
  // ... rest of implementation
}
```

**3. REFACTOR - Improve Structure**
```typescript
// Extract, clean up, keep tests green
const validateScenario = (registry: Map, scenarioId: string): Result<void> => {
  if (!registry.has(scenarioId)) {
    return { success: false, error: new Error('Scenario not found') };
  }
  return { success: true, data: undefined };
};

switchScenario(testId: string, scenarioId: string): Result<void> {
  const validation = validateScenario(this.registry, scenarioId);
  if (!validation.success) return validation;
  // ... rest
}
```

**NO production code without a red test first.**

## Alternatives Considered

### Alternative 1: Unified Test Suite (All Layers Together)

**Approach:** Put all tests in one location, mix unit/integration/E2E

**Why rejected:**
- ❌ Unclear what each test validates
- ❌ Slow feedback (can't run fast tests separately)
- ❌ High maintenance (unclear where to add new tests)
- ❌ Doesn't align with hexagonal architecture

### Alternative 2: Integration-Heavy Testing

**Approach:** Rely primarily on E2E tests, minimal unit tests

**Why rejected:**
- ❌ Slow feedback loop (seconds instead of milliseconds)
- ❌ Brittle (tests break when framework changes)
- ❌ Hard to debug (large surface area)
- ❌ Doesn't scale (more features = exponentially slower)

### Alternative 3: Test Implementation Details

**Approach:** Test internal methods, private functions, implementation choices

**Why rejected:**
- ❌ Brittle tests (break during refactoring)
- ❌ Doesn't test actual behavior
- ❌ Couples tests to implementation
- ❌ Doesn't provide confidence in public API

### Alternative 4: No Adapter Tests

**Approach:** Skip adapter tests, rely on core + integration

**Why rejected:**
- ❌ Translation bugs caught late (in slow integration tests)
- ❌ Framework-specific issues unclear
- ❌ Type conversion bugs harder to debug
- ❌ Missing fast feedback on adapter changes

**Our chosen approach** (four-layer strategy) addresses all these issues while aligning with hexagonal architecture.

## Consequences

### Positive

✅ **Fast feedback loops** - Core tests run in milliseconds, find bugs instantly

✅ **Clear test ownership** - Each layer has defined responsibility

✅ **No duplication** - Each behavior tested once at the right level

✅ **Easy debugging** - Test failure location indicates bug location

✅ **Maintainable** - Changes to one layer don't cascade to others

✅ **Comprehensive coverage** - 100% domain logic + critical paths covered

✅ **CI efficiency** - Can run fast tests first, gate on those

✅ **Onboarding clarity** - New contributors know where to add tests

✅ **Documentation as tests** - Bruno tests serve as executable API docs

✅ **Aligns with architecture** - Testing strategy mirrors code architecture

### Negative

❌ **More test files** - Tests split across multiple locations

❌ **Learning curve** - Developers must understand four-layer model

❌ **Discipline required** - Easy to accidentally test wrong thing in wrong place

❌ **Initial setup cost** - More boilerplate for test infrastructure

**Mitigation:** Clear documentation, examples, PR review checklist, linting rules

### Risks & Mitigation

**Risk 1: Developers test domain logic in adapter tests**
- *Mitigation*: PR review checklist, clear documentation, linting rules, examples

**Risk 2: Slow integration tests become bottleneck**
- *Mitigation*: Run core tests first in CI, parallel test execution, test splitting

**Risk 3: Coverage gaps between layers**
- *Mitigation*: Integration tests verify layers work together, PR checklist

**Risk 4: Bruno tests duplicating Vitest**
- *Mitigation*: Clear guidance that Bruno is selective (happy paths only)

## Implementation Guidelines

### Core Package Tests

**Location:** `packages/core/tests/`

**File Structure:**
```
packages/core/
├── src/
│   ├── domain/
│   │   ├── scenario-manager.ts
│   │   └── in-memory-scenario-store.ts
│   └── ports/
│       └── scenario-store.ts
└── tests/
    ├── scenario-manager.test.ts
    └── in-memory-scenario-store.test.ts
```

**Test Naming:** `{feature}.test.ts` (no 1:1 mapping to source files)

**Coverage Target:** 100% of domain logic

### Adapter Package Tests

**Location:** `packages/{adapter}-adapter/tests/`

**File Structure:**
```
packages/express-adapter/
├── src/
│   ├── middleware.ts
│   └── utils/
│       └── request-translation.ts
└── tests/
    ├── request-translation.test.ts
    └── response-application.test.ts
```

**Test Naming:** `{translation-concern}.test.ts`

**Coverage Target:** 100% of translation functions

### Integration Tests

**Location:** `apps/{app}/tests/`

**File Structure:**
```
apps/express-example/
├── src/
│   └── server.ts
└── tests/
    ├── scenario-switching.test.ts
    ├── test-id-isolation.test.ts
    └── default-fallback.test.ts
```

**Test Naming:** `{feature-or-flow}.test.ts`

**Coverage Target:** All user journeys, all composition patterns

### Bruno Tests

**Location:** `apps/{app}/bruno/`

**File Structure:**
```
apps/express-example/bruno/
├── bruno.json
├── environments/
│   └── Local.bru
├── Scenarios/
│   ├── Set Scenario - Success.bru
│   └── Get Active Scenario.bru
└── API/
    └── GitHub - Get User.bru
```

**Test Naming:** `{Feature} - {Action}.bru`

**Coverage Target:** Happy paths, 2-3 examples per feature

## Related Decisions

- **ADR-0001**: Serializable Scenario Definitions (enables predictable testing)
- **CLAUDE.md**: TDD principles (RED-GREEN-REFACTOR mandatory)
- **review-prompt.md**: PR review checklist (enforces testing standards)

## References

- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds - Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- [Martin Fowler - Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [Hexagonal Architecture Testing](https://alistair.cockburn.us/hexagonal-architecture/)

## Update History

- **2025-10-23**: Initial version (accepted)
