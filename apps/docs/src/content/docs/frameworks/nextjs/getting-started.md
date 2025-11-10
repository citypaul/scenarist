---
title: Next.js - Getting Started
description: Set up Scenarist with Next.js (Pages or App Router) in 5 minutes
---

# Next.js - Getting Started

Test your Next.js application with Server Components, Server Actions, and API routes all executing. Supports both Pages Router and App Router.

## Which Router Are You Using?

Choose your setup guide:

- **[Pages Router Setup](#pages-router-setup)** - Traditional Next.js with `pages/` directory
- **[App Router Setup](#app-router-setup)** - Modern Next.js with `app/` directory and React Server Components

---

## Pages Router Setup

### Installation

```bash
npm install @scenarist/core @scenarist/nextjs-adapter
npm install -D @playwright/test @scenarist/playwright-helpers
```

### 1. Define Scenarios

```typescript
// src/scenarios.ts
import type { ScenarioDefinition } from '@scenarist/core';

export const successScenario: ScenarioDefinition = {
  id: 'success',
  name: 'Payment Success',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.stripe.com/v1/products',
      response: {
        status: 200,
        body: { data: [{ id: 'prod_123', name: 'Premium Plan', price: 5000 }] },
      },
    },
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
```

### 2. Create Scenario Endpoint

```typescript
// pages/api/__scenario__.ts
import { createScenaristHandler } from '@scenarist/nextjs-adapter/pages';
import { successScenario } from '@/scenarios';

const scenarist = createScenaristHandler();
scenarist.registerScenarios([successScenario]);

export default scenarist.handler();
```

### 3. Add MSW Setup

```typescript
// pages/api/_msw.ts
import { createMSWHandler } from '@scenarist/nextjs-adapter/pages';

export default createMSWHandler();

export const config = {
  api: { externalResolver: true },
};
```

### 4. Write Tests

```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { switchScenario } from '@scenarist/playwright-helpers';

test('renders Server-Side page with product data', async ({ page }) => {
  await switchScenario(page, 'success', {
    baseURL: 'http://localhost:3000',
  });

  await page.goto('/products');

  // Your getServerSideProps runs, fetches from mocked Stripe API
  await expect(page.locator('h2')).toContainText('Premium Plan');
});

test('processes payment via API route', async ({ page }) => {
  await switchScenario(page, 'success', {
    baseURL: 'http://localhost:3000',
  });

  // Your API route validation runs
  const response = await page.request.post('/api/checkout', {
    data: { amount: 5000, token: 'tok_test' },
  });

  expect(response.status()).toBe(200);
});
```

---

## App Router Setup

### Installation

```bash
npm install @scenarist/core @scenarist/nextjs-adapter
npm install -D @playwright/test @scenarist/playwright-helpers
```

### 1. Define Scenarios

```typescript
// src/scenarios.ts
import type { ScenarioDefinition } from '@scenarist/core';

export const successScenario: ScenarioDefinition = {
  id: 'success',
  name: 'Payment Success',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.stripe.com/v1/products',
      response: {
        status: 200,
        body: { data: [{ id: 'prod_123', name: 'Premium Plan', price: 5000 }] },
      },
    },
  ],
};
```

### 2. Create Scenario Endpoint

```typescript
// app/api/__scenario__/route.ts
import { createScenaristHandler } from '@scenarist/nextjs-adapter/app';
import { successScenario } from '@/scenarios';

const scenarist = createScenaristHandler();
scenarist.registerScenarios([successScenario]);

export const { GET, POST } = scenarist.handlers();
```

### 3. Add MSW Setup

```typescript
// app/api/_msw/route.ts
import { createMSWHandler } from '@scenarist/nextjs-adapter/app';

export const { GET } = createMSWHandler();
```

### 4. Test Server Components

```typescript
// tests/products.spec.ts
import { test, expect } from '@playwright/test';
import { switchScenario } from '@scenarist/playwright-helpers';

test('Server Component fetches and renders product data', async ({ page }) => {
  await switchScenario(page, 'success', {
    baseURL: 'http://localhost:3000',
  });

  await page.goto('/products');

  // Your Server Component executes and renders
  // fetch() call to Stripe API is mocked
  await expect(page.locator('h2')).toContainText('Premium Plan');
  await expect(page.locator('.price')).toContainText('$50.00');
});
```

**Example Server Component:**

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  // This fetch is mocked by Scenarist
  const response = await fetch('https://api.stripe.com/v1/products', {
    headers: { 'Authorization': `Bearer ${process.env.STRIPE_KEY}` },
  });

  const { data: products } = await response.json();

  // Your component renders with mocked data
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <span className="price">${(product.price / 100).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## What Makes Next.js Setup Special

**Server Components Actually Execute** - Unlike traditional mocking, your React Server Components render and run your application logic.

**API Routes Run Normally** - Your validation, error handling, and business logic all execute.

**Test Isolation** - Each test gets isolated scenario state. Run tests in parallel with zero interference.

**No App Restart** - Switch scenarios instantly during test execution.

## Next Steps

- **Advanced features:** [Request matching](/concepts/request-matching), [sequences](/concepts/sequences), [stateful mocks](/concepts/stateful-mocks)
- **Example apps:** See complete examples for [Pages Router](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-pages-router-example) and [App Router](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-app-router-example)
