---
title: Express - Getting Started
description: Set up Scenarist with Express in 5 minutes
---

# Express - Getting Started

Test your Express APIs with runtime scenario switching. Zero boilerplate setup using AsyncLocalStorage.

## Installation

```bash
npm install @scenarist/core @scenarist/express-adapter
npm install -D @playwright/test @scenarist/playwright-helpers
```

## Basic Setup

**1. Define your scenarios:**

```typescript
// src/scenarios.ts
import type { ScenarioDefinition } from '@scenarist/core';

export const successScenario: ScenarioDefinition = {
  id: 'success',
  name: 'All APIs Succeed',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: { id: 'ch_123', status: 'succeeded', amount: 5000 },
      },
    },
  ],
};

export const cardDeclinedScenario: ScenarioDefinition = {
  id: 'cardDeclined',
  name: 'Card Declined',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
          status: 402,
          body: { error: { code: 'card_declined', message: 'Your card was declined' } },
      },
    },
  ],
};
```

**2. Set up Scenarist in your Express app:**

```typescript
// src/server.ts
import express from 'express';
import { createScenarist } from '@scenarist/express-adapter';
import { successScenario, cardDeclinedScenario } from './scenarios';

const app = express();
app.use(express.json());

// Create Scenarist instance
const scenarist = createScenarist();

// Register scenarios
scenarist.registerScenarios([successScenario, cardDeclinedScenario]);

// Add Scenarist middleware BEFORE your routes
app.use(scenarist.middleware());

// Your routes run normally - Scenarist just mocks external APIs
app.post('/api/checkout', async (req, res) => {
  const { amount, token } = req.body;

  // Your validation runs
  if (amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // External Stripe call is mocked by Scenarist
  const charge = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.STRIPE_KEY}` },
    body: JSON.stringify({ amount, source: token }),
  });

  const result = await charge.json();

  // Your business logic runs
  if (charge.status === 200) {
    return res.json({ success: true, chargeId: result.id });
  } else {
    return res.status(402).json({ error: result.error.message });
  }
});

app.listen(3000, () => console.log('Server running on :3000'));
```

**3. Write your first test:**

```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { switchScenario } from '@scenarist/playwright-helpers';

test('processes payment successfully', async ({ page }) => {
  await switchScenario(page, 'success', {
    baseURL: 'http://localhost:3000',
  });

  // Make API request - your Express route runs normally
  const response = await page.request.post('http://localhost:3000/api/checkout', {
    data: { amount: 5000, token: 'tok_test' },
  });

  const data = await response.json();

  expect(response.status()).toBe(200);
  expect(data.success).toBe(true);
  expect(data.chargeId).toBe('ch_123');
});

test('handles card declined error', async ({ page }) => {
  await switchScenario(page, 'cardDeclined', {
    baseURL: 'http://localhost:3000',
  });

  const response = await page.request.post('http://localhost:3000/api/checkout', {
    data: { amount: 5000, token: 'tok_test' },
  });

  const data = await response.json();

  expect(response.status()).toBe(402);
  expect(data.error).toContain('declined');
});
```

## What Makes Express Setup Special

**Zero Boilerplate** - Scenarist uses `AsyncLocalStorage` to automatically track test IDs. No manual header passing required.

**Test Isolation** - Each test gets its own scenario state. Tests run in parallel without interference.

**Your Code Runs** - Your Express routes, middleware, validation, and business logic all execute normally. Only external API calls are mocked.

## Next Steps

- **Advanced features:** [Request matching](/concepts/request-matching), [sequences](/concepts/sequences), [stateful mocks](/concepts/stateful-mocks)
- **Example app:** See [complete Express example](https://github.com/citypaul/scenarist/tree/main/apps/express-example)
