# Code Review Guidelines for Scenarist

This file contains specific rules and guidelines for reviewing code in the Scenarist repository. Use these rules when reviewing pull requests.

## Critical Architecture Rules

### 1. Hexagonal Architecture (Ports & Adapters)

**MUST enforce strict separation:**

```typescript
// ✅ CORRECT - Core package with zero framework dependencies
packages/core/src/
  ├── types/          // Data structures (use `type` with `readonly`)
  ├── ports/          // Interfaces (use `interface`)
  └── domain/         // Business logic (implementations)

// ❌ WRONG - Core importing framework code
import express from 'express';  // Never in core!
import { FastifyRequest } from 'fastify';  // Never in core!
```

**Review checklist:**
- [ ] Core package has zero framework dependencies (except MSW types)
- [ ] Ports use `interface`, types use `type`
- [ ] All data types use `readonly` for immutability
- [ ] Adapters are in separate packages
- [ ] No adapter depends on another adapter

### 2. Declarative Scenario Definitions

**CRITICAL:** Scenarios must use declarative patterns (no imperative functions).

```typescript
// ❌ WRONG - Imperative function-based (hidden logic)
type Scenario = {
  readonly mocks: ReadonlyArray<HttpHandler>;  // Functions with closures!
  readonly shouldMatch: (request: Request) => boolean;  // Imperative logic!
};

// ✅ CORRECT - Declarative data structures
type ScenaristScenario = {
  readonly mocks: ReadonlyArray<ScenaristMock>;  // Declarative patterns
};

type ScenaristMock = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly url: string | RegExp;  // ✅ RegExp is declarative (pattern matching)
  readonly match?: MatchCriteria;  // ✅ Declarative criteria (not functions)
  readonly response: {
    readonly status: number;
    readonly body?: unknown;
  };
};
```

**Review checklist:**
- [ ] No functions, closures, or methods in scenario types (declarative patterns only)
- [ ] Native RegExp is ALLOWED (declarative pattern matching) per ADR-0016
- [ ] Match criteria use data structures, not functions
- [ ] No class instances with imperative methods
- [ ] ActiveScenario stores only references (scenarioId + variantName)

### 3. Dependency Injection

**CRITICAL:** Domain logic must NEVER create port implementations internally.

```typescript
// ❌ WRONG - Creating implementation internally
export const createScenarioManager = (config: ScenaristConfig) => {
  const registry = new Map<string, ScenaristScenario>();  // ❌ Hardcoded!
  // ...
};

// ✅ CORRECT - Injecting both ports
export const createScenarioManager = ({
  registry,  // ✅ Injected
  store,     // ✅ Injected
  config,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
  config: ScenaristConfig;
}): ScenarioManager => {
  // Delegate to injected ports
};
```

**Review checklist:**
- [ ] All ports are injected as dependencies
- [ ] No `new` for port implementations in domain logic
- [ ] Factory functions use options objects
- [ ] Implementations delegate to injected ports
- [ ] ScenarioManager injects BOTH registry and store

### 4. Explicit Port Implementation

**Adapters MUST explicitly implement port interfaces:**

```typescript
// ❌ WRONG - Implicit (structural) typing
export class InMemoryScenarioRegistry {
  register(definition: ScenaristScenario): void { ... }
  // Missing methods won't cause compile errors!
}

// ✅ CORRECT - Explicit implementation
export class InMemoryScenarioRegistry implements ScenarioRegistry {
  register(definition: ScenaristScenario): void { ... }
  // TypeScript will error if methods are missing
}
```

**Review checklist:**
- [ ] All adapter classes use `implements PortName`
- [ ] No implicit/structural typing for adapters
- [ ] Port changes will cause compile errors in adapters

## TypeScript Standards

### Strict Mode (Non-Negotiable)

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

**Review checklist:**
- [ ] No `any` types (use `unknown` if truly unknown)
- [ ] No type assertions (`as Type`) without clear justification
- [ ] No `@ts-ignore` or `@ts-expect-error` without explanation
- [ ] These rules apply to test code too

### Type vs Interface

```typescript
// ✅ Ports (behavior contracts) - use `interface`
export interface ScenarioRegistry {
  register(definition: ScenaristScenario): void;
}

// ✅ Types (data structures) - use `type` with `readonly`
export type ScenaristScenario = {
  readonly id: string;
  readonly name: string;
  readonly mocks: ReadonlyArray<ScenaristMock>;
};
```

**Review checklist:**
- [ ] Ports use `interface` (in packages/core/src/ports/)
- [ ] Data structures use `type` (in packages/core/src/types/)
- [ ] All data fields use `readonly`
- [ ] Arrays use `ReadonlyArray<T>` not `T[]`

## Test-Driven Development (TDD)

### RED → GREEN → REFACTOR

**Every line of production code must be written in response to a failing test.**

```typescript
// ❌ WRONG - Production code without tests
export const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ CORRECT - Test first, then implementation
describe('calculateTotal', () => {
  it('should sum item prices', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
```

**Review checklist:**
- [ ] All new production code has corresponding tests
- [ ] Tests verify behavior, not implementation details
- [ ] No testing of internal/private functions
- [ ] Test coverage is 100% for business behavior
- [ ] No 1:1 mapping between test files and implementation files

### Testing Principles

```typescript
// ❌ WRONG - Testing implementation details
it('should call the validateAmount method', () => {
  const spy = jest.spyOn(manager, 'validateAmount');
  manager.processPayment(payment);
  expect(spy).toHaveBeenCalled();  // Implementation detail!
});

// ✅ CORRECT - Testing behavior
it('should reject payment with negative amount', () => {
  const payment = { amount: -100 };
  const result = manager.processPayment(payment);
  expect(result.success).toBe(false);
  expect(result.error.message).toContain('Invalid amount');
});
```

**Review checklist:**
- [ ] Tests verify business behavior
- [ ] Tests use public API only
- [ ] No mocking of internal functions
- [ ] Test data uses factory functions with optional overrides
- [ ] Tests prove the code does what it's supposed to do

## Code Style

### Functional Programming

```typescript
// ❌ WRONG - Mutation
const addItem = (items: Item[], newItem: Item) => {
  items.push(newItem);  // Mutates!
  return items;
};

// ✅ CORRECT - Immutable
const addItem = (items: Item[], newItem: Item): Item[] => {
  return [...items, newItem];
};
```

**Review checklist:**
- [ ] No data mutation
- [ ] Pure functions wherever possible
- [ ] Use `map`, `filter`, `reduce` over imperative loops
- [ ] All function parameters are immutable

### No Nested Logic

```typescript
// ❌ WRONG - Nested conditionals
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      // do something
    }
  }
}

// ✅ CORRECT - Early returns
if (!user || !user.isActive || !user.hasPermission) {
  return;
}
// do something
```

**Review checklist:**
- [ ] No nested if/else (use early returns)
- [ ] Max 2 levels of nesting
- [ ] Guard clauses at function start
- [ ] Flat, readable code

### Options Objects

```typescript
// ❌ WRONG - Multiple positional parameters
const createPayment = (
  amount: number,
  currency: string,
  cardId: string,
  customerId: string,
  description?: string
): Payment => { ... };

// ✅ CORRECT - Options object
type CreatePaymentOptions = {
  amount: number;
  currency: string;
  cardId: string;
  customerId: string;
  description?: string;
};

const createPayment = (options: CreatePaymentOptions): Payment => {
  const { amount, currency, cardId, customerId, description } = options;
  // ...
};
```

**Review checklist:**
- [ ] Functions with 3+ parameters use options objects
- [ ] Options objects for functions with optional parameters
- [ ] Destructure options at function start

### No Comments (Self-Documenting Code)

```typescript
// ❌ WRONG - Comments explaining code
const calculateDiscount = (price: number, customer: Customer): number => {
  // Check if customer is premium
  if (customer.tier === 'premium') {
    // Apply 20% discount for premium customers
    return price * 0.8;
  }
  return price * 0.9;
};

// ✅ CORRECT - Self-documenting
const PREMIUM_DISCOUNT_MULTIPLIER = 0.8;
const STANDARD_DISCOUNT_MULTIPLIER = 0.9;

const isPremiumCustomer = (customer: Customer): boolean => {
  return customer.tier === 'premium';
};

const calculateDiscount = (price: number, customer: Customer): number => {
  const multiplier = isPremiumCustomer(customer)
    ? PREMIUM_DISCOUNT_MULTIPLIER
    : STANDARD_DISCOUNT_MULTIPLIER;
  return price * multiplier;
};
```

**Review checklist:**
- [ ] Code is self-documenting through clear naming
- [ ] No comments explaining what code does
- [ ] JSDoc only for public APIs (and code is still clear without it)
- [ ] Extract to functions instead of adding comments

## Common Anti-Patterns

### ❌ In Core Package
- Importing framework-specific code (Express, Fastify, etc.)
- Using classes for ports (use `interface`)
- Using interfaces for types (use `type` with `readonly`)
- Mutable data structures
- Creating port implementations internally

### ❌ In Tests
- Testing implementation details
- Mocking internal functions
- 1:1 test file to implementation file mapping
- Not testing business behavior
- Writing production code without tests first

### ❌ General
- Any use of `any` type
- Nested if/else statements
- Deep function nesting (>2 levels)
- Type assertions without justification
- Comments explaining code

## Review Process

When reviewing a PR:

1. **Architecture First**
   - Verify hexagonal architecture is maintained
   - Check dependency injection is correct
   - Ensure serialization is preserved

2. **Types & Interfaces**
   - Verify `interface` for ports, `type` for data
   - Check all data is `readonly`
   - Ensure no `any` types

3. **Testing**
   - Verify tests exist for all production code
   - Check tests verify behavior, not implementation
   - Ensure test coverage is complete

4. **Code Quality**
   - No mutations, nested logic, or comments
   - Functions are small and focused
   - Options objects for multiple parameters

5. **Documentation**
   - Update CLAUDE.md if new patterns emerge
   - Create ADR for significant architectural decisions
   - Update implementation plan if approach changes

## Providing Feedback

When leaving review comments:

✅ **Be constructive and specific:**
```
This violates dependency injection - `registry` should be injected as a
parameter, not created internally. See CLAUDE.md "Dependency Injection Pattern"
section for the correct approach.
```

❌ **Don't be vague:**
```
This doesn't look right.
```

✅ **Reference documentation:**
```
Per ADR-0001, scenarios must be serializable. This `mocks` field contains
HttpHandler which includes functions. Use ScenaristMock instead.
```

✅ **Provide examples:**
```
Instead of:
  const registry = new Map();

Use dependency injection:
  const createManager = ({ registry }: { registry: ScenarioRegistry }) => {
    // Use injected registry
  }
```

## Quick Reference

**File structure check:**
- `packages/core/` - No framework imports
- `packages/core/src/ports/` - All `interface`
- `packages/core/src/types/` - All `type` with `readonly`
- `packages/core/src/domain/` - Inject all ports
- Adapters - Explicitly `implements` ports

**Type system check:**
- No `any` types anywhere
- No type assertions without justification
- Ports = `interface`, Data = `type`
- Everything `readonly`

**Testing check:**
- Test first (TDD)
- Test behavior (not implementation)
- 100% business behavior coverage
- No mocking internals

**Code style check:**
- No mutations
- No nested if/else
- No comments
- Options objects for 3+ params
