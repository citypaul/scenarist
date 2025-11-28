---
title: Verification Guide
description: How to verify Scenarist is working correctly in your project
---

Use this guide to verify Scenarist is correctly configured and working in your project. For troubleshooting issues, see the [Troubleshooting Guide](/reference/troubleshooting).

## Core Functionality Checks

### Header Propagation Verification

Test that headers propagate correctly through server-side fetches:

```typescript
test('headers propagate through server-side fetch', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premium-user');

  await page.goto('/dashboard');

  // If headers propagated correctly, should see premium content
  await expect(page.getByText('Premium Features')).toBeVisible();
});
```

**What to verify:**
- Test passes when run individually
- Test passes when run in parallel with other tests
- Different scenarios produce different results

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

## Integration Quality Checks

### External APIs Only

**Verify:** Only external API calls are mocked, not framework internals

**Check your test setup:**

```typescript
import type { ScenaristScenarios } from '@scenarist/express-adapter';

// GOOD - Only external APIs mocked
const scenarios = {
  stripe: {
    mocks: [{
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: { /* ... */ }
    }]
  }
} as const satisfies ScenaristScenarios;

// BAD - Mocking framework internals
const badScenarios = {
  nextjs: {
    mocks: [{
      method: 'GET',
      url: '/api/my-endpoint',  // Your own endpoint!
      response: { /* ... */ }
    }]
  }
};  // Don't do this - mocking your own routes defeats the purpose
```

**What to mock:**
- Stripe API calls
- Auth0 API calls
- SendGrid API calls
- Any external HTTP service

**What NOT to mock:**
- Your own API routes
- Framework request/response objects
- Internal middleware

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

### Mock Accuracy

**Verify:** Mock definitions accurately represent external API contracts

```typescript
// GOOD - Matches real Stripe response structure
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

// BAD - Doesn't match real API structure
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

## Production Tree-Shaking Verification

When deploying Scenarist to production, verify that implementation code is NOT being delivered. Modern bundlers with code splitting enabled automatically tree-shake Scenarist with zero configuration.

### How Code Splitting Works

When you use dynamic imports with code splitting:

1. **DefinePlugin** replaces `process.env.NODE_ENV` with literal `'production'`
2. **Dead code elimination** makes the `if (process.env.NODE_ENV === 'production')` branch unreachable
3. **Code splitting** puts implementation code in a separate chunk (e.g., `impl-ABC123.js`)
4. **Tree-shaking** eliminates the unreachable import statement from the entry point
5. **Result:** Implementation chunk exists on disk but is NEVER loaded into memory

### Step 1: Build Your Application

Build your application with code splitting enabled:

```bash
# esbuild (requires --splitting for ESM)
esbuild src/server.ts --bundle --splitting --outdir=dist \
  --platform=node --format=esm \
  --define:process.env.NODE_ENV='"production"'

# webpack (code splitting automatic for dynamic imports)
NODE_ENV=production webpack --mode production

# Vite (code splitting automatic)
NODE_ENV=production vite build
```

**Expected output:**
```
dist/
  server.js           ~27kb    # Entry point (small!)
  impl-ABC123.js      ~242kb   # Implementation chunk (exists but never loaded)
  chunk-XYZ789.js     ...      # Other chunks
```

### Step 2: Verify Implementation is NOT in Entry Point

Check that implementation code is NOT bundled into the main entry point:

```bash
# Search for Scenarist implementation code in entry point
grep -rE '(createScenaristImpl|setupWorker|HttpResponse\.json)' dist/server.js

# Should output nothing (no matches)
```

**Expected result:** No matches. If you see matches, implementation code is being bundled inline.

### Step 3: Verify Implementation Chunk is Never Loaded (Runtime)

Prove the implementation chunk exists but never loads into memory:

```bash
# Start production server in background
NODE_ENV=production node dist/server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check which files are loaded into memory
lsof -p $SERVER_PID | grep -E 'impl-.*\.js'

# Should output nothing (chunk not loaded)

# Clean up
kill $SERVER_PID
```

**Expected result:** No output. The `impl-*.js` chunk file exists on disk but is NOT loaded into the Node.js process memory.

**What `lsof` proves:**
- Lists all files opened by a process
- If implementation chunk was loaded, it would appear in the output
- No output = chunk never touched by runtime = zero delivery overhead

### Step 4: Verify Build Artifact Sizes

Check that your entry point is significantly smaller than total build output:

```bash
# Check entry point size
ls -lh dist/server.js
# Should be small (~27kb for typical Express app)

# Check implementation chunk size (exists but never loads)
ls -lh dist/impl-*.js
# ~242kb (this is normal - it's tree-shaken by never loading)

# Total on-disk size vs delivered size:
# On disk: ~27kb + ~242kb = ~269kb
# Delivered: ~27kb (impl chunk never loads)
```

**Expected behavior:**
- Entry point is 85-95% smaller than it would be without code splitting
- Implementation chunk exists (this is normal and expected)
- Runtime verification (step 3) proves chunk never loads

### Framework-Specific Verification

#### Express

```bash
# Build
pnpm build:production

# Verify implementation not in entry point
grep 'createScenaristImpl' dist/server.js
# (no matches)

# Runtime verification
NODE_ENV=production node dist/server.js &
SERVER_PID=$!
sleep 2
lsof -p $SERVER_PID | grep 'impl-.*\.js'
# (no output - chunk not loaded)
kill $SERVER_PID
```

#### Next.js App Router

Next.js automatically handles code splitting:

```bash
# Build
pnpm build

# Check .next/standalone output
ls -lh .next/standalone/server.js

# Verification: Check that Scenarist implementation is NOT in main bundle
grep -r 'createScenaristImpl' .next/standalone
# Should only appear in separate chunks, not main bundle
```

#### Next.js Pages Router

```bash
# Build
pnpm build

# Similar to App Router - check build output
grep -r 'createScenaristImpl' .next/server/pages
# Should be in separate chunks only
```

### What This Proves

- **Zero delivery overhead** - Implementation code never reaches production runtime
- **Code splitting works** - Bundler correctly creates separate chunks
- **DefinePlugin works** - `process.env.NODE_ENV` replaced with literal
- **Tree-shaking works** - Unreachable import eliminated
- **Production safety** - Test infrastructure code completely absent from production execution

## Next Steps

If verification reveals issues, see the [Troubleshooting Guide](/reference/troubleshooting).

For more information:
- [Framework Guides](/frameworks/nextjs-app-router/getting-started) - Adapter setup
- [Scenario Format](/concepts/scenarios) - Mock definitions
- [How It Works](/concepts/how-it-works) - Architecture details
