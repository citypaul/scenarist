---
title: Verification Guide
description: How to verify Scenarist is working correctly in your project
---

When evaluating whether Scenarist is working correctly in your project, use this guide to verify core functionality, integration quality, and test coverage.

## Core Functionality Checks

### Header Propagation in Parallel Tests

**Issue:** When tests fail in parallel but pass sequentially, the root cause is usually **test ID headers not being propagated** through server-side fetch calls.

**How Test Isolation Works:**

Each test gets a unique test ID (automatically generated). This test ID must be sent with EVERY request to ensure the test uses the correct scenario. If headers aren't propagated through internal server-side fetches, those requests will use the default scenario instead of the test's scenario.

**Common Symptom:**

- ✅ Tests pass when run individually (`--workers=1`)
- ❌ Tests fail when run in parallel (`--workers=4`)
- ❌ Flaky results that change between runs
- ❌ Wrong data appearing in tests (from different scenario)

**Root Cause: Missing Header Propagation**

When your server-side code makes internal fetch calls, headers don't automatically propagate. You must explicitly include them.

#### Next.js: Header Propagation Helpers

**Problem:**

```typescript
// ❌ BAD - Headers not propagated to internal fetch
export default async function Page() {
  // This fetch doesn't include test ID header!
  const response = await fetch('https://api.stripe.com/v1/products');
  const data = await response.json();
  return <div>{/* render */}</div>;
}
```

**Solution for Server Components** (use `getScenaristHeadersFromReadonlyHeaders`):

```typescript
import { headers } from 'next/headers';
import { getScenaristHeadersFromReadonlyHeaders } from '@scenarist/nextjs-adapter/app';

// ✅ GOOD - Headers propagated correctly in Server Components
export default async function Page() {
  const headersList = await headers();  // Get ReadonlyHeaders from Next.js

  const response = await fetch('https://api.stripe.com/v1/products', {
    headers: {
      ...getScenaristHeadersFromReadonlyHeaders(headersList),  // Include test ID header
    },
  });

  const data = await response.json();
  return <div>{/* render */}</div>;
}
```

**Solution for Route Handlers** (use `getScenaristHeaders`):

```typescript
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

// ✅ GOOD - Headers propagated correctly in Route Handlers
export async function GET(request: Request) {
  const response = await fetch("https://api.stripe.com/v1/products", {
    headers: {
      ...getScenaristHeaders(request), // Include test ID header
    },
  });

  const data = await response.json();
  return Response.json(data);
}
```

**What these helpers do:**

- Extract test ID from request/headers
- Return `{ 'x-scenarist-test-id': 'generated-uuid' }` object
- Safe to call even when Scenarist is disabled (returns empty object)

#### Express: Headers Already Tracked

Express adapter uses AsyncLocalStorage to automatically track test IDs per request. No manual header propagation needed for middleware chains.

**Internal fetch calls** still need headers:

```typescript
// ✅ GOOD - Include test ID in internal fetches
app.get("/api/dashboard", async (req, res) => {
  const testId = req.get(SCENARIST_TEST_ID_HEADER);

  const response = await fetch("http://localhost:3001/api/user", {
    headers: {
      [SCENARIST_TEST_ID_HEADER]: testId || "default-test",
    },
  });

  const data = await response.json();
  res.json(data);
});
```

#### Verification: Use Playwright Tests

**Verify headers are propagating correctly:**

```typescript
// tests/header-propagation.spec.ts
test("headers propagate through server-side fetch", async ({
  page,
  switchScenario,
}) => {
  await switchScenario(page, "premium-user");

  await page.goto("/dashboard");

  // If headers propagated correctly, should see premium content
  await expect(page.getByText("Premium Features")).toBeVisible();

  // If headers DIDN'T propagate, would see default content
  // This would fail in parallel tests (wrong scenario)
});
```

**Debugging failed tests:**

1. Add logging to see which scenario is active
2. Check server logs for test ID headers
3. Verify header helpers are called before fetch
4. Confirm headers object includes test ID

#### Red Flags

**❌ Tests fail only in parallel:**

```bash
# Pass individually
pnpm exec playwright test --workers=1
# ✅ All tests pass

# Fail in parallel
pnpm exec playwright test --workers=4
# ❌ Some tests fail with wrong data
```

**Root cause:** Missing header propagation. Tests interfere because they're all using the default scenario.

**❌ Wrong data in tests:**

```typescript
// Test expects premium pricing
await expect(page.getByText("£99.99")).toBeVisible();
// ❌ Error: element not found

// But sees standard pricing instead
await expect(page.getByText("£149.99")).toBeVisible();
// ✅ This passes (wrong scenario!)
```

**Root cause:** Internal fetch didn't include test ID header, used default scenario instead of premium scenario.

**❌ Flaky test results:**

- Sometimes premium pricing, sometimes standard
- Different results on different runs
- Race conditions between parallel tests

**Root cause:** Tests sharing scenarios due to missing header propagation.

#### Fix Checklist

When parallel tests fail:

1. ✅ **Next.js:** Add header helpers before all internal fetch calls (use `getScenaristHeadersFromReadonlyHeaders` in Server Components, `getScenaristHeaders` in Route Handlers)
2. ✅ **Express:** Include test ID header in internal fetch calls
3. ✅ **Playwright:** Verify tests switch scenarios before navigation
4. ✅ **Logging:** Add debug logs to confirm headers are present
5. ✅ **Isolation:** Ensure each test calls `switchScenario()` independently

**Quick fix for Next.js Server Components:**

```typescript
import { headers } from "next/headers";
import { getScenaristHeadersFromReadonlyHeaders } from "@scenarist/nextjs-adapter/app";

// Add this before EVERY external fetch in Server Components
const headersList = await headers();

fetch(url, {
  headers: { ...getScenaristHeadersFromReadonlyHeaders(headersList) },
}); // Always include
```

**Quick fix for Next.js Route Handlers:**

```typescript
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

// In your route handler: export async function GET(request: Request)
fetch(url, {
  headers: { ...getScenaristHeaders(request) },
}); // Always include
```

### Runtime Scenario Switching

**Verify:** Scenarios can be switched without server restarts

```typescript
test("scenario switching", async ({ page, switchScenario }) => {
  await switchScenario(page, "premium");
  await page.goto("/dashboard");
  await expect(page.getByText("Premium Features")).toBeVisible();

  await switchScenario(page, "free");
  await page.goto("/dashboard");
  await expect(page.getByText("Upgrade to Premium")).toBeVisible();
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
test("test 1: add item to cart", async ({ page, switchScenario }) => {
  await switchScenario(page, "cart");

  await page.goto("/cart");
  await page.click('[data-testid="add-product-1"]');

  const items = await page.locator('[data-testid="cart-item"]').count();
  expect(items).toBe(1);
});

test("test 2: empty cart", async ({ page, switchScenario }) => {
  await switchScenario(page, "cart");

  await page.goto("/cart");

  const items = await page.locator('[data-testid="cart-item"]').count();
  expect(items).toBe(0); // Should be empty, not affected by test 1
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
test("middleware executes", async ({ page, switchScenario }) => {
  await switchScenario(page, "logged-in");

  // Should trigger auth middleware
  const response = await page.goto("/protected");

  // Middleware should have run and allowed access
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Protected Content")).toBeVisible();
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
import type { ScenaristScenarios } from "@scenarist/express-adapter";

// ✅ GOOD - Only external APIs mocked
const scenarios = {
  stripe: {
    mocks: [
      {
        method: "POST",
        url: "https://api.stripe.com/v1/charges", // External API
        response: {
          /* ... */
        },
      },
    ],
  },
} as const satisfies ScenaristScenarios;

// ❌ BAD - Mocking framework internals
const badScenarios = {
  nextjs: {
    mocks: [
      {
        method: "GET",
        url: "/api/my-endpoint", // Your own endpoint!
        response: {
          /* ... */
        },
      },
    ],
  },
}; // Don't do this - mocking your own routes defeats the purpose
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
  id: "premium",
  mocks: [
    /* ... */
  ],
};

// Used in multiple test files:
// tests/dashboard.spec.ts
test("dashboard shows premium features", async ({ page, switchScenario }) => {
  await switchScenario(page, "premium");
  // ...
});

// tests/checkout.spec.ts
test("checkout with premium discount", async ({ page, switchScenario }) => {
  await switchScenario(page, "premium");
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
test("handles payment declined", async ({ page, switchScenario }) => {
  await switchScenario(page, "payment-declined");

  await page.goto("/checkout");
  await page.click('[data-testid="submit-payment"]');

  await expect(page.getByText("Payment declined")).toBeVisible();
});

test("handles auth timeout", async ({ page, switchScenario }) => {
  await switchScenario(page, "auth-timeout");

  const response = await page.goto("/dashboard");
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
test.describe.parallel("User tiers", () => {
  test("premium user experience", async ({ page, switchScenario }) => {
    await switchScenario(page, "premium-user");
    // ... test premium features
  });

  test("free user experience", async ({ page, switchScenario }) => {
    await switchScenario(page, "free-user");
    // ... test limited features
  });

  test("trial user experience", async ({ page, switchScenario }) => {
    await switchScenario(page, "trial-user");
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
  mocks: [
    {
      method: "POST",
      url: "https://api.example.com/action",
      sequence: {
        responses: [
          { status: 500, body: { error: "Server error" } },
          { status: 500, body: { error: "Server error" } },
          { status: 200, body: { success: true } },
        ],
        repeat: "last",
      },
    },
  ];
}

test("retries on failure", async ({ page, switchScenario }) => {
  await switchScenario(page, "retry-scenario");

  // First two attempts fail, third succeeds
  await page.click('[data-testid="submit"]');

  // Should eventually show success after retries
  await expect(page.getByText("Success")).toBeVisible({ timeout: 10000 });
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

## Production Tree-Shaking Verification

When deploying Scenarist to production, it's critical to verify that implementation code is NOT being delivered to production. Modern bundlers with code splitting enabled automatically tree-shake Scenarist with zero configuration, but you should verify this is working correctly in your build.

### How Code Splitting Works

When you use dynamic imports with code splitting:

1. **DefinePlugin** replaces `process.env.NODE_ENV` with literal `'production'`
2. **Dead code elimination** makes the `if (process.env.NODE_ENV === 'production')` branch unreachable
3. **Code splitting** puts implementation code in a separate chunk (e.g., `impl-ABC123.js`)
4. **Tree-shaking** eliminates the unreachable import statement from the entry point
5. **Result:** Implementation chunk exists on disk but is NEVER loaded into memory

### Step 1: Build Your Application

First, build your application with code splitting enabled:

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
  server.js           ~27kb    ← Entry point (small!)
  impl-ABC123.js      ~242kb   ← Implementation chunk (exists but never loaded)
  chunk-XYZ789.js     ...      ← Other chunks
```

### Step 2: Verify Implementation is NOT in Entry Point

Check that implementation code is NOT bundled into the main entry point:

```bash
# Search for Scenarist implementation code in entry point
grep -rE '(createScenaristImpl|setupWorker|HttpResponse\.json)' dist/server.js

# Should output nothing (no matches) ✅
```

**Expected result:** No matches. If you see matches, implementation code is being bundled inline (bad).

### Step 3: Verify Implementation Chunk is Never Loaded (Runtime)

This is the **critical verification** - prove the implementation chunk exists but never loads into memory:

```bash
# Start production server in background
NODE_ENV=production node dist/server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check which files are loaded into memory
lsof -p $SERVER_PID | grep -E 'impl-.*\.js'

# Should output nothing (chunk not loaded) ✅

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

### Red Flags

**❌ Implementation code in entry point:**

```bash
$ grep 'createScenaristImpl' dist/server.js
# Found matches ← BAD: Implementation bundled inline
```

**Fix:** Enable code splitting:

- esbuild: Add `--splitting --outdir=dist` (requires ESM format)
- webpack: Check that dynamic imports aren't being forced inline
- Vite: Code splitting should be automatic (check build config)

**❌ Implementation chunk loads into memory:**

```bash
$ lsof -p $SERVER_PID | grep 'impl-.*\.js'
dist/impl-ABC123.js  ← BAD: Chunk is being loaded!
```

**Fix:** Check that `process.env.NODE_ENV` is being set to `'production'`:

- Verify DefinePlugin configuration
- Check that `if (process.env.NODE_ENV === 'production')` branch is unreachable
- Ensure bundler is actually replacing `process.env.NODE_ENV` with literal value

**❌ No code splitting (single bundle):**

```bash
$ ls dist/
server.js  ← Only one file, no chunks

$ ls -lh dist/server.js
618kb  ← Much larger than expected
```

**Fix:** Enable code splitting in your bundler configuration.

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

Next.js automatically handles code splitting, but you can verify:

```bash
# Build
pnpm build

# Check .next/standalone output
ls -lh .next/standalone/server.js

# Next.js tree-shaking is automatic for dynamic imports
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

✅ **Zero delivery overhead** - Implementation code never reaches production runtime
✅ **Code splitting works** - Bundler correctly creates separate chunks
✅ **DefinePlugin works** - `process.env.NODE_ENV` replaced with literal
✅ **Tree-shaking works** - Unreachable import eliminated
✅ **Production safety** - Test infrastructure code completely absent from production execution

### Next Steps

If verification fails:

1. Check bundler configuration for code splitting support
2. Verify DefinePlugin is replacing `process.env.NODE_ENV`
3. Ensure you're using dynamic imports (not static imports)
4. Review [Production Safety Guide](/concepts/production-safety) for detailed configuration

If verification succeeds:
✅ Your production deployment is safe - Scenarist implementation code is completely tree-shaken!

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
test("test 1", async ({ page, switchScenario }) => {
  await switchScenario(page, "scenario1"); // Isolates this test
  // ...
});

// ❌ BAD - Shared scenario across tests
const scenarioId = "shared";
test("test 1", async ({ page, switchScenario }) => {
  await switchScenario(page, scenarioId); // Don't share!
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
   - [Writing Scenarios →](/scenarios/overview)

3. **Examine test setup** - Ensure test isolation is working
   - [How it works: Test Isolation →](/concepts/how-it-works#how-test-isolation-works-complete-request-flow)

4. **Consult architecture docs** - Understand how pieces fit together
   - [Architecture →](/concepts/architecture)
