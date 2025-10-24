# Testing Guidelines

This document provides practical guidance for testing in the Scenarist codebase. For the architectural decision behind our testing strategy, see [ADR-0003: Testing Strategy](./adrs/0003-testing-strategy.md).

## Quick Reference

**Framework:** Vitest
**Coverage Target:** 100% behavior coverage (not implementation coverage)
**Approach:** Test-Driven Development (TDD) - RED → GREEN → REFACTOR
**Philosophy:** Test behavior, not implementation

## Test-Driven Development Workflow

Every line of production code must be written in response to a failing test.

### The RED → GREEN → REFACTOR Cycle

1. **RED**: Write a failing test for the desired behavior
   - Run the test to confirm it fails
   - No production code until you have a failing test

2. **GREEN**: Write the minimum code to make the test pass
   - Resist the urge to write more than needed
   - Just enough to turn the test green

3. **REFACTOR**: Assess and improve the code
   - Only refactor if it adds clear value
   - Keep tests green while improving structure
   - Commit after refactoring

**Example Workflow:**

```typescript
// 1. RED - Write failing test
describe('calculateDiscount', () => {
  it('should apply 10% discount to order total', () => {
    const order = { total: 100, customerTier: 'standard' };
    const result = calculateDiscount(order);
    expect(result).toBe(90);
  });
});

// Run test - it fails (function doesn't exist)

// 2. GREEN - Minimal implementation
const calculateDiscount = (order: { total: number; customerTier: string }): number => {
  return order.total * 0.9;
};

// Run test - it passes

// 3. REFACTOR - Improve if valuable
const STANDARD_DISCOUNT_RATE = 0.1;

const calculateDiscount = (order: { total: number; customerTier: string }): number => {
  return order.total * (1 - STANDARD_DISCOUNT_RATE);
};

// Run test - still passes, commit
```

## Four-Layer Testing Strategy

### Layer 1: Core Tests

**Location:** `packages/core/tests/`
**Purpose:** Test domain logic in isolation
**Dependencies:** None (pure TypeScript)
**Speed:** Very fast (milliseconds)
**Coverage:** 100% of domain behavior

**What to test:**
- Business logic correctness
- Edge cases and error conditions
- Type safety and contracts
- Result type success/failure paths

**Anti-patterns to avoid:**
- ❌ Testing implementation details
- ❌ Mocking internal functions
- ❌ Testing framework-specific behavior

**Example:**

```typescript
// packages/core/tests/scenario-manager.test.ts
import { createScenarioManager } from '../src/domain/scenario-manager';
import { createInMemoryScenarioStore } from '../../in-memory-store/src';

describe('ScenarioManager - registerScenario', () => {
  it('should register a scenario and make it available', () => {
    const store = createInMemoryScenarioStore();
    const registry = createInMemoryScenarioRegistry();
    const manager = createScenarioManager({
      registry,
      store,
      config: { enabled: true }
    });

    const scenario = {
      id: 'test-scenario',
      name: 'Test Scenario',
      mocks: []
    };

    const result = manager.registerScenario(scenario);

    expect(result.success).toBe(true);

    const retrieved = manager.getScenario('test-scenario');
    expect(retrieved.success).toBe(true);
    expect(retrieved.data?.id).toBe('test-scenario');
  });

  it('should return error when registering duplicate scenario ID', () => {
    const store = createInMemoryScenarioStore();
    const registry = createInMemoryScenarioRegistry();
    const manager = createScenarioManager({ registry, store, config: { enabled: true } });

    const scenario = { id: 'duplicate', name: 'First', mocks: [] };
    manager.registerScenario(scenario);

    const duplicate = { id: 'duplicate', name: 'Second', mocks: [] };
    const result = manager.registerScenario(duplicate);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('already registered');
  });
});
```

#### When to Test Port Implementations (Adapters in Core)

**Key Question:** Should we test adapters that implement port interfaces in the core package?

**Answer:** It depends on the adapter's complexity and whether it could have multiple implementations.

**Test port implementations when:**
1. **Multiple implementations are expected** (InMemoryStateManager, RedisStateManager, FileSystemStateManager)
2. **Complex contracts** (nested paths, array append syntax, test ID isolation)
3. **Similar to existing adapter patterns** (InMemoryScenarioStore, InMemoryScenarioRegistry have tests)
4. **Behavior can't be fully tested until later PRs** (e.g., capture without injection in incremental work)

**Don't test port implementations when:**
1. **Simple implementation** (trivial mapping or delegation)
2. **Only one realistic implementation** (unlikely to have Redis/file variants)
3. **Behavior is fully testable through domain logic** (no need for separate adapter tests)

**Example: StateManager Decision**

In Phase 3 (Stateful Mocks), we split implementation across incremental PRs:
- **PR #31**: State capture (but no template injection yet)
- **PR #32**: Template injection (completes the feature)

**Problem:** Can't test full behavior (capture → inject) until PR #32.

**Solution:** Adapter-level tests in PR #31, full behavior tests in PR #32.

```typescript
// packages/core/tests/in-memory-state-manager.test.ts (PR #31)
// Adapter contract tests - proves adapter implements port correctly

describe('InMemoryStateManager', () => {
  // These test the adapter, not business behavior

  it('should isolate state between test IDs', () => {
    const manager = createInMemoryStateManager();

    manager.set('test-1', 'userId', '123');
    manager.set('test-2', 'userId', '456');

    expect(manager.get('test-1', 'userId')).toBe('123');
    expect(manager.get('test-2', 'userId')).toBe('456');
  });

  it('should handle array append syntax', () => {
    const manager = createInMemoryStateManager();

    manager.set('test-1', 'items[]', 'item1');
    manager.set('test-1', 'items[]', 'item2');

    expect(manager.get('test-1', 'items')).toEqual(['item1', 'item2']);
  });

  it('should reset all state for test ID', () => {
    const manager = createInMemoryStateManager();
    manager.set('test-1', 'key1', 'value1');
    manager.set('test-1', 'key2', 'value2');

    manager.reset('test-1');

    expect(manager.get('test-1', 'key1')).toBeUndefined();
    expect(manager.get('test-1', 'key2')).toBeUndefined();
  });

  // ... more adapter contract tests
});

// packages/core/tests/response-selector.test.ts (PR #32)
// Full behavior tests - proves capture + injection works end-to-end

describe('ResponseSelector - State Capture and Injection', () => {
  it('should capture value from first request and inject into second request', () => {
    const selector = createResponseSelector({
      stateManager: createInMemoryStateManager()
    });

    const mocks: MockDefinition[] = [{
      method: 'POST',
      url: '/api/cart/add',
      captureState: { 'cartItems[]': 'body.item' },
      response: { status: 200, body: { added: true } }
    }, {
      method: 'GET',
      url: '/api/cart',
      response: {
        status: 200,
        body: { items: '{{state.cartItems}}' }  // Template injection
      }
    }];

    // First request: capture item
    const addContext = {
      method: 'POST',
      url: '/api/cart/add',
      body: { item: 'Widget' }
    };
    selector.selectResponse('test-1', 'cart-scenario', addContext, mocks);

    // Second request: should see captured item injected
    const getContext = { method: 'GET', url: '/api/cart' };
    const result = selector.selectResponse('test-1', 'cart-scenario', getContext, mocks);

    expect(result.success).toBe(true);
    expect(result.data.body).toEqual({ items: ['Widget'] });  // Captured value injected!
  });
});
```

**Why This Approach Works:**

✅ **PR #31**: Adapter tests prove StateManager contract is correctly implemented
✅ **PR #32**: Behavior tests prove capture + injection works end-to-end
✅ **Incremental**: Each PR is independently testable
✅ **Follows precedent**: Same pattern as InMemoryScenarioStore and InMemoryScenarioRegistry
✅ **Architecture-aligned**: Testing adapters that implement ports is different from testing implementation details

**Precedent in Codebase:**

- ✅ `packages/core/tests/in-memory-store.test.ts` (12 tests for ScenarioStore adapter)
- ✅ `packages/core/tests/in-memory-registry.test.ts` (12 tests for ScenarioRegistry adapter)
- ❌ No `in-memory-sequence-tracker.test.ts` (simple enough to test through ResponseSelector)

**The Pattern:**

Complex port implementations with multiple possible adapters → Get adapter-level tests
Simple port implementations with obvious behavior → Test through domain logic only

### Layer 2: Adapter Tests

**Location:** `packages/*/tests/` (in adapter packages)
**Purpose:** Test framework integration (translation layer only)
**Dependencies:** Framework libraries (Express, etc.)
**Speed:** Fast (still under 1 second per test)
**Coverage:** Translation correctness only

**What to test:**
- Request parsing (headers, body, params)
- Response formatting
- Error translation
- Framework-specific edge cases

**Anti-patterns to avoid:**
- ❌ Re-testing domain logic
- ❌ Testing mock behavior
- ❌ Complex business scenarios (those belong in integration tests)

**Example:**

```typescript
// packages/express-adapter/tests/request-context.test.ts
import express from 'express';
import request from 'supertest';
import { extractRequestContext } from '../src/request-context';

describe('Express Adapter - extractRequestContext', () => {
  it('should extract test ID from x-test-id header', async () => {
    const app = express();

    app.get('/test', (req, res) => {
      const context = extractRequestContext(req);
      res.json({ testId: context.testId });
    });

    const response = await request(app)
      .get('/test')
      .set('x-test-id', 'my-test-123');

    expect(response.body.testId).toBe('my-test-123');
  });

  it('should use default test ID when header is missing', async () => {
    const app = express();

    app.get('/test', (req, res) => {
      const context = extractRequestContext(req);
      res.json({ testId: context.testId });
    });

    const response = await request(app).get('/test');

    expect(response.body.testId).toBe('default-test');
  });

  it('should extract request body', async () => {
    const app = express();
    app.use(express.json());

    app.post('/test', (req, res) => {
      const context = extractRequestContext(req);
      res.json({ body: context.body });
    });

    const response = await request(app)
      .post('/test')
      .send({ foo: 'bar' });

    expect(response.body.body).toEqual({ foo: 'bar' });
  });
});
```

### Layer 3: Integration Tests

**Location:** `apps/*/tests/` (in example apps)
**Purpose:** Test complete user journeys end-to-end
**Dependencies:** Full stack (app + MSW + adapters + core)
**Speed:** Slower (1-5 seconds per test)
**Coverage:** Critical user flows

**What to test:**
- Complete scenario lifecycles
- Multiple requests in sequence
- State management across requests
- Error recovery scenarios
- Real-world user journeys

**Anti-patterns to avoid:**
- ❌ Testing every edge case (core tests cover that)
- ❌ Testing framework internals
- ❌ Duplicate coverage of core behavior

**Example:**

```typescript
// apps/express-example/tests/integration/payment-flow.test.ts
import { setupTestApp } from '../helpers/test-app';
import request from 'supertest';

describe('Payment Flow Integration', () => {
  it('should complete full payment journey with scenario switching', async () => {
    const { app, scenarist } = await setupTestApp();
    const testId = 'payment-test-001';

    // 1. Start with success scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId)
      .send({ scenario: 'success' })
      .expect(200);

    // 2. Create payment - should succeed
    const payment = await request(app)
      .post('/api/payment')
      .set('x-test-id', testId)
      .send({ amount: 1000, currency: 'usd' })
      .expect(200);

    expect(payment.body.status).toBe('succeeded');

    // 3. Switch to failure scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId)
      .send({ scenario: 'stripe-failure' })
      .expect(200);

    // 4. Create payment - should fail with 402
    const failedPayment = await request(app)
      .post('/api/payment')
      .set('x-test-id', testId)
      .send({ amount: 1000, currency: 'usd' })
      .expect(402);

    expect(failedPayment.body.error.code).toBe('insufficient_funds');
  });

  it('should isolate scenarios between different test IDs', async () => {
    const { app } = await setupTestApp();

    // Set test-1 to success
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-1')
      .send({ scenario: 'success' })
      .expect(200);

    // Set test-2 to failure
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-2')
      .send({ scenario: 'stripe-failure' })
      .expect(200);

    // test-1 still succeeds
    await request(app)
      .post('/api/payment')
      .set('x-test-id', 'test-1')
      .send({ amount: 1000, currency: 'usd' })
      .expect(200);

    // test-2 still fails
    await request(app)
      .post('/api/payment')
      .set('x-test-id', 'test-2')
      .send({ amount: 1000, currency: 'usd' })
      .expect(402);
  });
});
```

### Layer 4: Bruno Tests (Executable Documentation)

**Location:** `apps/*/bruno/`
**Purpose:** Exploratory testing and documentation
**Dependencies:** Running application
**Speed:** Manual execution
**Coverage:** Selective (key scenarios only)

**What to test:**
- Happy path scenarios
- Common error cases
- Developer onboarding examples
- API exploration workflows

**Anti-patterns to avoid:**
- ❌ Comprehensive test coverage (not the goal)
- ❌ Automated CI execution (keep manual)
- ❌ Complex assertions (simple validations only)

**Example:**

```
# Payment - Create Charge.bru
meta {
  name: Payment - Create Charge
  type: http
  seq: 3
}

post {
  url: {{baseUrl}}/api/payment
  body: json
  auth: none
}

headers {
  x-test-id: {{testId}}
}

body:json {
  {
    "amount": 1000,
    "currency": "usd"
  }
}

docs {
  Create a payment charge via Stripe.

  Try different scenarios:
  - "success": Payment succeeds
  - "stripe-failure": Payment fails (402)
  - "slow-network": 1 second delay
}
```

## Running Tests

### All Tests

```bash
# Run all tests across all packages
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Specific Package Tests

```bash
# Core package tests
cd packages/core && pnpm test

# Core tests in watch mode
cd packages/core && pnpm test:watch

# Express adapter tests
cd packages/express-adapter && pnpm test

# Integration tests
cd apps/express-example && pnpm test
```

### Single Test File

```bash
# Run specific test file
cd packages/core && pnpm test scenario-manager.test.ts

# Run with pattern
pnpm test --filter=@scenarist/core scenario-manager
```

### Bruno Tests

Bruno tests are run manually through the Bruno application:

1. Open Bruno app
2. Load collection from `apps/*/bruno/`
3. Set environment variables (baseUrl, testId)
4. Execute requests manually
5. Inspect responses

## Test Data Factories

Use factory functions with optional overrides for consistent test data:

```typescript
// packages/core/tests/helpers/factories.ts
export const getMockScenario = (
  overrides?: Partial<ScenarioDefinition>
): ScenarioDefinition => {
  return {
    id: 'test-scenario',
    name: 'Test Scenario',
    description: 'A test scenario',
    mocks: [],
    ...overrides,
  };
};

export const getMockConfig = (
  overrides?: Partial<ScenaristConfig>
): ScenaristConfig => {
  return {
    enabled: true,
    testIdHeader: 'x-test-id',
    defaultTestId: 'default-test',
    ...overrides,
  };
};

// Usage
const scenario = getMockScenario({ name: 'Custom Name' });
const config = getMockConfig({ enabled: false });
```

**Factory guidelines:**
- Always return complete, valid objects
- Accept optional `Partial<T>` for overrides
- Provide sensible defaults
- Compose factories for complex objects
- Keep factories close to tests that use them

## Behavior Testing Best Practices

### Test Through Public APIs

```typescript
// ✅ Good - Test through public API
describe('ScenarioManager', () => {
  it('should retrieve active scenario for test ID', () => {
    const manager = createScenarioManager({ store, config });

    manager.switchScenario('test-1', 'scenario-a');
    const result = manager.getActiveScenario('test-1');

    expect(result.success).toBe(true);
    expect(result.data?.scenarioId).toBe('scenario-a');
  });
});

// ❌ Bad - Testing implementation details
describe('ScenarioManager', () => {
  it('should call store.get internally', () => {
    const mockStore = { get: vi.fn() };
    const manager = createScenarioManager({ store: mockStore, config });

    manager.getActiveScenario('test-1');

    expect(mockStore.get).toHaveBeenCalledWith('test-1');
  });
});
```

### Test Business Behavior, Not Code Structure

```typescript
// ✅ Good - Tests business behavior
describe('Payment validation', () => {
  it('should reject negative payment amounts', () => {
    const result = processPayment({ amount: -100, currency: 'usd' });

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('amount must be positive');
  });
});

// ❌ Bad - Tests implementation structure
describe('Payment validation', () => {
  it('should have a validateAmount function', () => {
    expect(typeof validateAmount).toBe('function');
  });
});
```

### Use Descriptive Test Names

```typescript
// ✅ Good - Describes behavior
it('should apply free shipping for orders over £50', () => { ... });
it('should return 404 when scenario does not exist', () => { ... });
it('should isolate scenarios between different test IDs', () => { ... });

// ❌ Bad - Describes implementation
it('should call calculateShipping', () => { ... });
it('should return false', () => { ... });
it('should work correctly', () => { ... });
```

## Common Testing Patterns

### Testing Result Types

```typescript
describe('Result type handling', () => {
  it('should return success result with data', () => {
    const result = someOperation();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(expectedValue);
    }
  });

  it('should return error result when validation fails', () => {
    const result = someOperation(invalidInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('expected error');
    }
  });
});
```

### Testing Immutability

```typescript
describe('Immutability', () => {
  it('should not mutate original object', () => {
    const original = { id: '1', name: 'Original' };
    const originalCopy = { ...original };

    const updated = updateName(original, 'New Name');

    expect(original).toEqual(originalCopy); // Original unchanged
    expect(updated.name).toBe('New Name');
    expect(updated).not.toBe(original); // Different object
  });
});
```

### Testing Edge Cases

```typescript
describe('Edge cases', () => {
  it('should handle empty array', () => {
    const result = processItems([]);
    expect(result).toEqual([]);
  });

  it('should handle undefined input', () => {
    const result = processItem(undefined);
    expect(result.success).toBe(false);
  });

  it('should handle boundary values', () => {
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(0.01)).toBe(true);
    expect(isValidAmount(10000)).toBe(true);
    expect(isValidAmount(10000.01)).toBe(false);
  });
});
```

## Coverage Expectations

### Core Package: 100% Behavior Coverage

All business logic must have tests covering:
- Happy path
- Error conditions
- Edge cases
- Boundary values

**How to check:**

```bash
cd packages/core
pnpm test:coverage
```

Look for:
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%

**Note:** 100% coverage is achieved by testing behavior, not by testing every line of code in isolation.

### Adapter Packages: Translation Coverage

Adapters should have tests covering:
- All request parsing paths
- All response formatting paths
- Error translation cases

**Not required:**
- Re-testing core domain logic
- Testing MSW internals
- Complex business scenarios

### Integration Tests: Critical Flows Only

Focus on:
- Common user journeys (3-5 key flows)
- Scenario switching mechanics
- Test isolation verification

**Not required:**
- Every possible scenario combination
- Every edge case (core tests cover those)

## Debugging Tests

### Running Single Test

```bash
# Run specific test file
pnpm test scenario-manager.test.ts

# Run specific test by name pattern
pnpm test -t "should register scenario"

# Run with verbose output
pnpm test --reporter=verbose
```

### Watch Mode

```bash
# Watch mode (re-runs on file changes)
pnpm test:watch

# Watch specific file
pnpm test:watch scenario-manager.test.ts
```

### Debug Output

```typescript
// Add console.log for debugging
it('should process scenario', () => {
  const result = processScenario(scenario);
  console.log('Result:', JSON.stringify(result, null, 2));
  expect(result.success).toBe(true);
});
```

### Using Vitest UI

```bash
# Run tests with UI
pnpm test --ui
```

Opens browser interface for:
- Viewing test hierarchy
- Filtering tests
- Seeing console output
- Inspecting failures

## TypeScript and Testing

All test code must follow strict TypeScript rules:

```typescript
// ✅ Good - Fully typed
const getMockScenario = (
  overrides?: Partial<ScenarioDefinition>
): ScenarioDefinition => {
  return {
    id: 'test',
    name: 'Test',
    mocks: [],
    ...overrides,
  };
};

// ❌ Bad - Using any
const getMockScenario = (overrides?: any): any => {
  return { ...defaults, ...overrides };
};

// ❌ Bad - Type assertion without justification
const result = someFunction() as SuccessResult;

// ✅ Good - Type guard
const result = someFunction();
if (result.success) {
  // TypeScript knows result.data exists here
  expect(result.data).toBeDefined();
}
```

## Continuous Integration

All tests must pass before merging:

```bash
# CI runs all these checks
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm check-types  # TypeScript type checking
```

See `.github/workflows/` for full CI configuration.

## Common Mistakes to Avoid

### 1. Testing Implementation Details

```typescript
// ❌ Don't do this
it('should call validateAmount function', () => {
  const spy = vi.spyOn(validator, 'validateAmount');
  processPayment({ amount: 100 });
  expect(spy).toHaveBeenCalled();
});

// ✅ Do this instead
it('should reject invalid payment amounts', () => {
  const result = processPayment({ amount: -100 });
  expect(result.success).toBe(false);
});
```

### 2. Writing Tests After Implementation

```typescript
// ❌ Wrong workflow:
// 1. Write function
// 2. Write test

// ✅ Correct workflow (TDD):
// 1. Write failing test
// 2. Write minimal code to pass
// 3. Refactor if valuable
```

### 3. Over-Mocking

```typescript
// ❌ Don't mock everything
it('should process payment', () => {
  const mockValidator = { validate: vi.fn(() => true) };
  const mockProcessor = { process: vi.fn(() => ({ success: true })) };
  const mockLogger = { log: vi.fn() };

  // Tests nothing real
});

// ✅ Use real implementations where possible
it('should process payment', () => {
  const manager = createPaymentManager({
    validator: createRealValidator(),
    processor: createRealProcessor(),
  });

  const result = manager.processPayment({ amount: 100 });
  expect(result.success).toBe(true);
});
```

### 4. Not Testing Edge Cases

```typescript
// ❌ Only testing happy path
it('should calculate total', () => {
  expect(calculateTotal([10, 20])).toBe(30);
});

// ✅ Test edge cases too
it('should handle empty array', () => {
  expect(calculateTotal([])).toBe(0);
});

it('should handle negative numbers', () => {
  expect(calculateTotal([-10, 20])).toBe(10);
});

it('should handle decimals correctly', () => {
  expect(calculateTotal([10.50, 20.75])).toBe(31.25);
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds - Testing JavaScript](https://testingjavascript.com/)
- [ADR-0003: Testing Strategy](./adrs/0003-testing-strategy.md)
- [CLAUDE.md - TDD Guidelines](../CLAUDE.md#test-driven-development-tdd---non-negotiable)

## Summary

**Remember:**
1. **Always TDD** - No production code without a failing test
2. **Test behavior** - Not implementation details
3. **Four layers** - Core, Adapter, Integration, Bruno
4. **100% coverage** - Through behavior testing (core package)
5. **Keep tests fast** - Core and adapter tests under 1 second
6. **Descriptive names** - Tests should read like documentation
7. **Strict types** - No `any`, proper type safety in tests too
