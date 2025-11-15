---
title: Verification Guide
description: How to verify Scenarist is working correctly in your project
---

When evaluating whether Scenarist is working correctly in your project, use this guide to verify core functionality, integration quality, and test coverage.

## Core Functionality Checks

### Parallel Test Execution

**Verify:** Tests run in parallel without interference

```typescript
// tests/parallel.spec.ts
test.describe.parallel('Parallel scenarios', () => {
  test('scenario A', async ({ page, switchScenario }) => {
    await switchScenario(page, 'scenarioA');
    // ... test with scenario A
  });

  test('scenario B', async ({ page, switchScenario }) => {
    await switchScenario(page, 'scenarioB');
    // ... test with scenario B - runs simultaneously
  });
});
```

**Expected behavior:**
- Both tests execute concurrently
- Each test uses its own scenario
- No interference between tests
- Results are consistent across runs

**Red flags:**
- Tests fail when run in parallel but pass when run sequentially
- Flaky test results that change between runs
- Tests affecting each other's state

### Runtime Scenario Switching

**Verify:** Scenarios can be switched without server restarts

```typescript
test('scenario switching', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premium');
  await page.goto('/dashboard');
  await expect(page.getByText('Premium Features')).toBeVisible();

  await switchScenario(page, 'free');
  await page.goto('/dashboard');
  await expect(page.getByText('Upgrade to Premium')).toBeVisible();
});
```

**Expected behavior:**
- Scenario changes take effect immediately
- No server restart required
- Different responses from same endpoints
- State is cleared when switching scenarios

**Red flags:**
- Need to restart server between scenario changes
- Scenario switches not taking effect
- Previous scenario behavior persisting

### Test ID Isolation

**Verify:** Each test has isolated state via unique test ID

```typescript
test('test 1: add item to cart', async ({ page, switchScenario }) => {
  await switchScenario(page, 'cart');

  await page.goto('/cart');
  await page.click('[data-testid="add-product-1"]');

  const items = await page.locator('[data-testid="cart-item"]').count();
  expect(items).toBe(1);
});

test('test 2: empty cart', async ({ page, switchScenario }) => {
  await switchScenario(page, 'cart');

  await page.goto('/cart');

  const items = await page.locator('[data-testid="cart-item"]').count();
  expect(items).toBe(0);  // Should be empty, not affected by test 1
});
```

**Expected behavior:**
- Each test starts with clean state
- Test 2 doesn't see items added in Test 1
- Tests can run in any order

**Red flags:**
- Tests depend on execution order
- State leaking between tests
- Need to manually clean up state

### Real Backend Execution

**Verify:** Backend code executes with real middleware and routing

```typescript
test('middleware executes', async ({ page, switchScenario }) => {
  await switchScenario(page, 'logged-in');

  // Should trigger auth middleware
  const response = await page.goto('/protected');

  // Middleware should have run and allowed access
  expect(response?.status()).toBe(200);
  await expect(page.getByText('Protected Content')).toBeVisible();
});
```

**Expected behavior:**
- Middleware chains execute normally
- Route handlers run with production logic
- Business logic processes responses correctly
- Only external API calls are mocked

**Red flags:**
- Middleware is being skipped or mocked
- Business logic not executing as in production
- Framework internals are mocked

## Integration Quality Checks

### External APIs Only

**Verify:** Only external API calls are mocked, not framework internals

**Check your test setup:**

```typescript
// ✅ GOOD - Only external APIs mocked
const scenarios = {
  stripe: {
    mocks: [{
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',  // External API
      response: { /* ... */ }
    }]
  }
};

// ❌ BAD - Mocking framework internals
const scenarios = {
  nextjs: {
    mocks: [{
      method: 'GET',
      url: '/api/my-endpoint',  // Your own endpoint!
      response: { /* ... */ }
    }]
  }
};
```

**What to mock:**
- ✅ Stripe API calls
- ✅ Auth0 API calls
- ✅ SendGrid API calls
- ✅ Any external HTTP service

**What NOT to mock:**
- ❌ Your own API routes
- ❌ Framework request/response objects
- ❌ Internal middleware

### Scenario Reusability

**Verify:** Scenario definitions work across different test suites

```typescript
// scenarios.ts - Shared across all tests
export const premiumScenario = {
  id: 'premium',
  mocks: [/* ... */]
};

// Used in multiple test files:
// tests/dashboard.spec.ts
test('dashboard shows premium features', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premium');
  // ...
});

// tests/checkout.spec.ts
test('checkout with premium discount', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premium');
  // ...
});
```

**Expected behavior:**
- Same scenario definition works everywhere
- No need to duplicate scenario logic
- Changes to scenario affect all tests using it

**Red flags:**
- Duplicating scenario definitions across test files
- Different scenarios for same behavior
- Scenarios tightly coupled to specific tests

### Mock Accuracy

**Verify:** Mock definitions accurately represent external API contracts

```typescript
// ✅ GOOD - Matches real Stripe response structure
{
  method: 'POST',
  url: 'https://api.stripe.com/v1/charges',
  response: {
    status: 200,
    body: {
      id: 'ch_123',
      object: 'charge',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded'
      // Matches Stripe API documentation
    }
  }
}

// ❌ BAD - Doesn't match real API structure
{
  method: 'POST',
  url: 'https://api.stripe.com/v1/charges',
  response: {
    status: 200,
    body: {
      success: true,
      chargeId: '123'
      // This is not how Stripe responds
    }
  }
}
```

**How to verify:**
- Compare mock responses against API documentation
- Use TypeScript types from API client libraries
- Validate responses against API schemas if available
- Test against real API in staging to verify mock accuracy

## Test Coverage Checks

### Edge Cases and Error States

**Verify:** Can test edge cases without complex setup

```typescript
test('handles payment declined', async ({ page, switchScenario }) => {
  await switchScenario(page, 'payment-declined');

  await page.goto('/checkout');
  await page.click('[data-testid="submit-payment"]');

  await expect(page.getByText('Payment declined')).toBeVisible();
});

test('handles auth timeout', async ({ page, switchScenario }) => {
  await switchScenario(page, 'auth-timeout');

  const response = await page.goto('/dashboard');
  expect(response?.status()).toBe(401);
});
```

**Expected behavior:**
- Can test decline codes, timeouts, rate limits easily
- No need to manipulate external APIs
- Error states are deterministic and repeatable

**Red flags:**
- Can't test specific error codes
- Need complex setup to trigger errors
- Error scenarios are flaky

### User Types and Tiers

**Verify:** Multiple user types can be tested concurrently

```typescript
test.describe.parallel('User tiers', () => {
  test('premium user experience', async ({ page, switchScenario }) => {
    await switchScenario(page, 'premium-user');
    // ... test premium features
  });

  test('free user experience', async ({ page, switchScenario }) => {
    await switchScenario(page, 'free-user');
    // ... test limited features
  });

  test('trial user experience', async ({ page, switchScenario }) => {
    await switchScenario(page, 'trial-user');
    // ... test trial features
  });
});
```

**Expected behavior:**
- All tier tests run in parallel
- Each test uses correct tier data
- No interference between tiers

### API Retry Logic

**Verify:** Retry logic and rate limiting can be tested

```typescript
{
  mocks: [{
    method: 'POST',
    url: 'https://api.example.com/action',
    sequence: {
      responses: [
        { status: 500, body: { error: 'Server error' } },
        { status: 500, body: { error: 'Server error' } },
        { status: 200, body: { success: true } }
      ],
      repeat: 'last'
    }
  }]
}

test('retries on failure', async ({ page, switchScenario }) => {
  await switchScenario(page, 'retry-scenario');

  // First two attempts fail, third succeeds
  await page.click('[data-testid="submit"]');

  // Should eventually show success after retries
  await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
});
```

**Expected behavior:**
- Sequence advances through responses
- Retry logic can be verified
- Rate limiting scenarios testable

### Performance

**Verify:** Tests remain fast for frequent execution

**Benchmarks to aim for:**
- Test setup (scenario switch): < 100ms
- HTTP requests to your backend: Same speed as without Scenarist
- Mock response time: < 10ms
- Full test suite: Suitable for watch mode during development

**Red flags:**
- Tests are slower than unit tests
- Scenario switching takes multiple seconds
- Mock overhead is noticeable

## Common Issues to Watch

### Issue: Tests Interfere With Each Other

**Symptoms:**
- Tests pass individually but fail in parallel
- Flaky results
- State leaking between tests

**Check:**
- Verify each test calls `switchScenario()` before actions
- Ensure test IDs are unique (generated automatically by helper)
- Check that state is isolated per test ID

**Fix:**
```typescript
// ✅ GOOD - Each test switches scenario
test('test 1', async ({ page, switchScenario }) => {
  await switchScenario(page, 'scenario1');  // Isolates this test
  // ...
});

// ❌ BAD - Shared scenario across tests
const scenarioId = 'shared';
test('test 1', async ({ page, switchScenario }) => {
  await switchScenario(page, scenarioId);  // Don't share!
  // ...
});
```

### Issue: Framework Internals Are Mocked

**Symptoms:**
- Middleware doesn't execute
- Business logic is bypassed
- Tests don't reflect production behavior

**Check:**
- Review mock URLs - should all be external APIs
- Verify your route handlers execute normally
- Check that middleware chains run

**Fix:**
```typescript
// ❌ BAD - Mocking your own routes
{
  url: 'http://localhost:3000/api/my-route',  // Your app!
  response: { /* ... */ }
}

// ✅ GOOD - Mocking external APIs only
{
  url: 'https://api.stripe.com/v1/charges',  // External!
  response: { /* ... */ }
}
```

### Issue: Scenarios Can't Switch at Runtime

**Symptoms:**
- Need to restart server to change scenarios
- Scenario changes don't take effect
- Old scenario behavior persists

**Check:**
- Verify `/__scenario__` endpoint is registered
- Check that `enabled: true` in config
- Ensure test ID headers are being sent

**Fix:**
- Check adapter setup in your application
- Verify Playwright helpers are configured correctly
- Check for errors in scenario registration

### Issue: Tests Are Slow

**Symptoms:**
- Tests slower than expected
- Long wait times for responses
- Unsuitable for watch mode

**Check:**
- Look for unnecessary `delay` in mock responses
- Check for browser interactions that could be HTTP-only
- Verify parallel execution is enabled

**Fix:**
```typescript
// Remove unnecessary delays
{
  response: {
    status: 200,
    body: { /* ... */ },
    // delay: 5000  ← Remove this
  }
}

// Use parallel execution
test.describe.parallel('Fast tests', () => {
  // Tests run concurrently
});
```

## Next Steps

If verification reveals issues:

1. **Review framework guides** - Ensure adapter is set up correctly
   - [Next.js →](/frameworks/nextjs-app-router/getting-started)
   - [Express →](/frameworks/express/getting-started)

2. **Check scenario definitions** - Verify mocks match external APIs
   - [Scenario Format →](/introduction/scenario-format)

3. **Examine test setup** - Ensure test isolation is working
   - [How it works: Test Isolation →](/introduction/overview#how-test-isolation-works-complete-request-flow)

4. **Consult architecture docs** - Understand how pieces fit together
   - [Architecture →](/concepts/architecture)
