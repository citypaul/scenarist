---
title: Quick Start
description: Get up and running with Scenarist in 5 minutes
---

# Quick Start

**Time to complete:** 5 minutes

Get started with Scenarist. This guide is framework-agnostic—the concepts apply to Express, Next.js, Fastify, Hono, Remix, and any Node.js framework.

## Prerequisites

- Node.js 18 or later
- Basic knowledge of Playwright
- A working Node.js application

## What You'll Build

By the end of this guide, you'll have:
- ✅ Two test scenarios (success + error) running in parallel
- ✅ Runtime scenario switching without app restarts
- ✅ Type-safe scenario IDs with autocomplete
- ✅ Tests completing in seconds, not minutes

## Installation

```bash
# Install Scenarist core + adapter for your framework
npm install @scenarist/core @scenarist/[your-framework]-adapter

# Install Playwright helpers
npm install -D @playwright/test @scenarist/playwright-helpers
```

## Step 1: Define Scenarios

Create a file to define your mock scenarios:

```typescript
// scenarios.ts
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/core';

const successScenario: ScenaristScenario = {
  id: 'success',
  name: 'Payment Success',
  description: 'External payment API succeeds',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: { id: 'ch_123', status: 'succeeded' },
      },
    },
  ],
};

const errorScenario: ScenaristScenario = {
  id: 'error',
  name: 'Payment Error',
  description: 'External payment API returns error',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 402,
        body: { error: { code: 'card_declined', message: 'Card declined' } },
      },
    },
  ],
};

export const scenarios = {
  default: successScenario,
  success: successScenario,
  error: errorScenario,
} as const satisfies ScenaristScenarios;
```

## Step 2: Set Up Scenarist in Your App

**For Express:**
```typescript
import { createScenarist } from '@scenarist/express-adapter';
import { scenarios } from './scenarios';

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,
});

app.use(scenarist.middleware);
```

**For Next.js Pages Router:**
```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,
});

// pages/api/__scenario__.ts
import { scenarist } from '@/lib/scenarist';
export default scenarist.createScenarioEndpoint();
```

**For Next.js App Router:**
```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,
});

// app/api/__scenario__/route.ts
import { scenarist } from '@/lib/scenarist';

const handler = scenarist.createScenarioEndpoint();
export const POST = handler;
export const GET = handler;
```

## Step 3: Write Your First Test

```typescript
import { test, expect } from '@scenarist/playwright-helpers';
import { withScenarios } from '@scenarist/playwright-helpers';
import { scenarios } from './scenarios';

// Create type-safe test helper
export const test = withScenarios(scenarios);

test('successful payment flow', async ({ page, switchScenario }) => {
  await switchScenario(page, 'success'); // ✅ Autocomplete works!

  await page.goto('/checkout');
  await page.fill('[name="amount"]', '100');
  await page.click('button[type="submit"]');

  // Your backend validation runs, Server Components render
  await expect(page.locator('.success')).toBeVisible();
});

test('handles payment error', async ({ page, switchScenario }) => {
  await switchScenario(page, 'error'); // ✅ Type-safe scenario ID

  await page.goto('/checkout');
  await page.fill('[name="amount"]', '100');
  await page.click('button[type="submit"]');

  // Your error handling executes
  await expect(page.locator('.error')).toContainText('Card declined');
});
```

## Step 4: Run Your Tests

```bash
npx playwright test
```

**That's it!** Your tests now switch scenarios instantly without restarting your app.

## What Happens Under the Hood

1. **`switchScenario()`** calls your app's `/__scenario__` endpoint
2. Scenarist activates the scenario for this test's unique ID
3. Your backend runs normally, but external API calls are mocked
4. Each test gets isolated state—tests run in parallel without interference

## Common Issues

### Tests fail with 404 on `/__scenario__`

**Problem:** Scenario endpoint not found.

**Solution:** Check middleware/endpoint setup order:
- Express: `app.use(scenarist.middleware)` must come BEFORE your routes
- Next.js: Verify `__scenario__.ts` or `__scenario__/route.ts` exists in correct location

### Scenarios don't switch between tests

**Problem:** Test ID not propagating to requests.

**Solution:** Use `withScenarios()` helper for automatic test ID management:
```typescript
export const test = withScenarios(scenarios);
```

### MSW not intercepting requests

**Problem:** External API calls hitting real endpoints.

**Solution:**
1. Verify MSW setup for your adapter (check framework-specific guide)
2. Ensure `enabled: true` in config
3. Check mock URL matches exactly (including https://)

### Type errors: "Scenario ID not found"

**Problem:** TypeScript complaining about scenario IDs.

**Solution:** Ensure scenario object keys match scenario IDs:
```typescript
export const scenarios = {
  success: { id: 'success', ... }, // ✅ Key and ID match
  error: { id: 'error', ... },     // ✅ Key and ID match
} as const satisfies ScenaristScenarios;
```

## Next Steps

- **Framework-specific guides:** See detailed setup for [Express](/frameworks/express/getting-started) or [Next.js](/frameworks/nextjs/getting-started)
- **Example apps:** Explore [working examples](https://github.com/citypaul/scenarist/tree/main/apps) with comprehensive test suites
- **Architecture:** Learn [how Scenarist works](/concepts/architecture)
