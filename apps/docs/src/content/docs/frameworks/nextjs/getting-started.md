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
// lib/scenarios.ts
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/core';

const successScenario: ScenaristScenario = {
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

export const scenarios = {
  default: successScenario,
  success: successScenario,
} as const satisfies ScenaristScenarios;
```

### 2. Set Up Scenarist

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
import { expect, withScenarios } from '@scenarist/playwright-helpers';
import { scenarios } from '../lib/scenarios';

export const test = withScenarios(scenarios);

test('renders Server-Side page with product data', async ({ page, switchScenario }) => {
  await switchScenario(page, 'success'); // ✅ Type-safe!

  await page.goto('/products');

  // Your getServerSideProps runs, fetches from mocked Stripe API
  await expect(page.locator('h2')).toContainText('Premium Plan');
});

test('processes payment via API route', async ({ page, switchScenario }) => {
  await switchScenario(page, 'success');

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
// lib/scenarios.ts
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/core';

const successScenario: ScenaristScenario = {
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

export const scenarios = {
  default: successScenario,
  success: successScenario,
} as const satisfies ScenaristScenarios;
```

### 2. Set Up Scenarist

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
export const GET = handler;
export const POST = handler;
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
import { expect, withScenarios } from '@scenarist/playwright-helpers';
import { scenarios } from '../lib/scenarios';

export const test = withScenarios(scenarios);

test('Server Component fetches and renders product data', async ({ page, switchScenario }) => {
  await switchScenario(page, 'success'); // ✅ Type-safe!

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

- **Example apps:** See complete examples for [Pages Router](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-pages-router-example) and [App Router](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-app-router-example)
- **Architecture:** Learn [how Scenarist works](/concepts/architecture)
