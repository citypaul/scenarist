---
title: Quick Start
description: Get up and running with Scenarist in 5 minutes
---

# Quick Start

Get started with Scenarist in 5 minutes. This guide is framework-agnostic—the concepts apply to Express, Next.js, Fastify, Hono, Remix, and any Node.js framework.

## What You'll Build

A simple test that switches between success and error scenarios without restarting your app.

## Installation

```bash
# Install Scenarist core + adapter for your framework
npm install @scenarist/core @scenarist/[your-framework]-adapter

# Install Playwright (if not already installed)
npm install -D @playwright/test
```

## Step 1: Define Scenarios

Create a file to define your mock scenarios:

```typescript
// scenarios.ts
import type { ScenarioDefinition } from '@scenarist/core';

export const successScenario: ScenarioDefinition = {
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

export const errorScenario: ScenarioDefinition = {
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
```

## Step 2: Set Up Scenarist in Your App

**For Express:**
```typescript
import { createScenarist } from '@scenarist/express-adapter';
import { successScenario, errorScenario } from './scenarios';

const scenarist = createScenarist();
scenarist.registerScenarios([successScenario, errorScenario]);

app.use(scenarist.middleware());
```

**For Next.js Pages Router:**
```typescript
// pages/api/__scenario__.ts
import { createScenaristHandler } from '@scenarist/nextjs-adapter/pages';
import { successScenario, errorScenario } from '@/scenarios';

const scenarist = createScenaristHandler();
scenarist.registerScenarios([successScenario, errorScenario]);

export default scenarist.handler();
```

**For Next.js App Router:**
```typescript
// app/api/__scenario__/route.ts
import { createScenaristHandler } from '@scenarist/nextjs-adapter/app';
import { successScenario, errorScenario } from '@/scenarios';

const scenarist = createScenaristHandler();
scenarist.registerScenarios([successScenario, errorScenario]);

export const { GET, POST } = scenarist.handlers();
```

## Step 3: Write Your First Test

```typescript
import { test, expect } from '@playwright/test';
import { switchScenario } from '@scenarist/playwright-helpers';

test('successful payment flow', async ({ page }) => {
  await switchScenario(page, 'success', {
    baseURL: 'http://localhost:3000',
  });

  await page.goto('/checkout');
  await page.fill('[name="amount"]', '100');
  await page.click('button[type="submit"]');

  // Your backend validation runs, Server Components render
  await expect(page.locator('.success')).toBeVisible();
});

test('handles payment error', async ({ page }) => {
  await switchScenario(page, 'error', {
    baseURL: 'http://localhost:3000',
  });

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

## Next Steps

- **Framework-specific guides:** See detailed setup for [Express](/frameworks/express/getting-started), [Next.js Pages](/frameworks/nextjs/pages/getting-started), or [Next.js App](/frameworks/nextjs/app/getting-started)
- **Advanced features:** Learn about [request matching](/concepts/request-matching), [sequences](/concepts/sequences), and [stateful mocks](/concepts/stateful-mocks)
- **Example apps:** Explore [working examples](https://github.com/citypaul/scenarist/tree/main/apps) with comprehensive test suites
