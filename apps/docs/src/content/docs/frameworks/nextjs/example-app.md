---
title: Next.js Example App
description: Working example demonstrating Scenarist with Next.js App Router
---

## Overview

The Next.js App Router example demonstrates HTTP-level testing for Server Components, Client Components, API routes, and Server Actions using Scenarist.

**GitHub:** [apps/nextjs-app-router-example](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-app-router-example)

## What It Demonstrates

This example app showcases all major Scenarist features:

### Core Features
- **Server Components** - Test async Server Components without mocking Next.js internals
- **Client Components** - Test client-side hydration with backend scenarios
- **API Routes** - Test Route Handlers with different external API responses
- **Runtime Scenario Switching** - Multiple scenarios running concurrently

### Dynamic Response Features
- **Request Matching** - Different responses based on request content (tier-based pricing)
- **Sequences** - Polling scenarios (pending → processing → complete)
- **Stateful Mocks** - Shopping cart with state capture and injection

## Installation

### Prerequisites
- Node.js 20+
- pnpm 9+

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/citypaul/scenarist.git
cd scenarist

# Install dependencies
pnpm install

# Navigate to Next.js example
cd apps/nextjs-app-router-example
```

## Running the Example

### Development Mode

```bash
# Start the Next.js dev server
pnpm dev
```

Visit [http://localhost:3002](http://localhost:3002) to see the app.

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run specific test file
pnpm test products-server-components
```

## Key Files

### Scenarist Setup

**`lib/scenarist.ts`** - Scenarist configuration
```typescript
import { createScenarist } from '@scenarist/nextjs-adapter';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,
});
```

**`app/api/[[...route]]/route.ts`** - Catch-all route for Scenarist endpoints
```typescript
import { scenarist } from '@/lib/scenarist';

export const { GET, POST } = scenarist;
```

This creates the `/__scenario__` endpoint used by tests to switch scenarios.

### Scenario Definitions

**`lib/scenarios.ts`** - All scenario definitions ([view on GitHub](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/lib/scenarios.ts))

Key scenarios:

**`default`** - Standard user, successful API responses

**`premiumUser`** - Premium tier with request matching
```typescript
premiumUser: {
  id: 'premiumUser',
  mocks: [{
    method: 'GET',
    url: 'https://api.products.example.com/pricing',
    match: { query: { tier: 'premium' } },
    response: { status: 200, body: { price: 799, discount: 20 } }
  }]
}
```

**`githubPolling`** - Polling sequence (pending → processing → complete)
```typescript
githubPolling: {
  id: 'githubPolling',
  mocks: [{
    method: 'GET',
    url: 'https://api.github.com/repos/user/repo/status',
    sequence: {
      responses: [
        { status: 200, body: { status: 'pending' } },
        { status: 200, body: { status: 'processing' } },
        { status: 200, body: { status: 'complete' } }
      ],
      repeat: 'last'
    }
  }]
}
```

**`cartWithState`** - Stateful shopping cart
```typescript
cartWithState: {
  id: 'cartWithState',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.cart.example.com/add',
      captureState: {
        cartItems: { from: 'body', path: 'productId' }
      },
      response: { status: 201 }
    },
    {
      method: 'GET',
      url: 'https://api.cart.example.com/items',
      response: {
        status: 200,
        body: { items: '{{state.cartItems}}' }
      }
    }
  ]
}
```

### Test Examples

**`tests/playwright/products-server-components.spec.ts`** - Server Components with request matching
```typescript
test('premium users see discounted pricing', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser');

  await page.goto('/products');

  // Server Component fetches pricing with tier=premium query param
  // Scenarist returns mock matching { query: { tier: 'premium' } }
  await expect(page.getByText('$799')).toBeVisible();
  await expect(page.getByText('20% off')).toBeVisible();
});
```

**`tests/playwright/sequences.spec.ts`** - Polling with sequences
```typescript
test('polling updates status through sequence', async ({ page, switchScenario }) => {
  await switchScenario(page, 'githubPolling');

  await page.goto('/polling');

  // First request: pending
  await expect(page.getByText('Status: pending')).toBeVisible();

  await page.getByRole('button', { name: 'Refresh' }).click();
  // Second request: processing
  await expect(page.getByText('Status: processing')).toBeVisible();

  await page.getByRole('button', { name: 'Refresh' }).click();
  // Third request: complete
  await expect(page.getByText('Status: complete')).toBeVisible();
});
```

**`tests/playwright/cart-server-rsc.spec.ts`** - Stateful mocks with Server Components
```typescript
test('cart maintains state across requests', async ({ page, switchScenario }) => {
  const testId = await switchScenario(page, 'cartWithState');

  // Add product - state captured
  await page.request.post('http://localhost:3002/api/cart/add', {
    headers: { 'x-test-id': testId },
    data: { productId: 'prod-1' }
  });

  await page.goto('/cart-server');

  // Cart shows added product - state injected
  await expect(page.getByText('Product A')).toBeVisible();
});
```

## Architecture

### How It Works

1. **Setup** - Next.js app includes Scenarist catch-all route
2. **Test starts** - Calls `switchScenario()` to set active scenario
3. **HTTP request** - Test makes request to Next.js app
4. **Backend execution** - Server Components, API routes execute normally
5. **External API call** - Intercepted by MSW with scenario-defined response
6. **Test assertion** - Verifies rendered output or API response

### Test Isolation

Each test gets a unique test ID:
- Scenario switching: `POST /__scenario__` with `x-test-id` header
- All requests include `x-test-id` header automatically (Playwright helper)
- Server routes requests to correct scenario based on test ID
- Parallel tests don't interfere with each other

### File Structure

```
apps/nextjs-app-router-example/
├── app/
│   ├── api/
│   │   └── [[...route]]/route.ts   # Scenarist endpoints
│   ├── products/                    # Server Components
│   ├── polling/                     # Sequence example
│   └── cart-server/                 # Stateful mock example
├── lib/
│   ├── scenarist.ts                 # Scenarist setup
│   └── scenarios.ts                 # Scenario definitions
└── tests/
    └── playwright/
        ├── products-server-components.spec.ts
        ├── sequences.spec.ts
        └── cart-server-rsc.spec.ts
```

## Common Patterns

### Testing Server Components

```typescript
// Server Component fetches external API
export default async function ProductsPage() {
  const response = await fetch('https://api.products.example.com/list');
  const products = await response.json();
  return <div>{products.map(p => <Product key={p.id} {...p} />)}</div>;
}

// Test with different scenarios
test('standard products', async ({ page, switchScenario }) => {
  await switchScenario(page, 'default');
  await page.goto('/products');
  await expect(page.getByText('Product A')).toBeVisible();
});

test('premium products', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser');
  await page.goto('/products');
  await expect(page.getByText('Premium Product')).toBeVisible();
});
```

### Testing with Request Matching

Use request content to determine response:

```typescript
// Scenario with tier-based pricing
mocks: [{
  method: 'GET',
  url: 'https://api.products.example.com/pricing',
  match: { query: { tier: 'premium' } },
  response: { status: 200, body: { price: 799, discount: 20 } }
}, {
  method: 'GET',
  url: 'https://api.products.example.com/pricing',
  // No match criteria - fallback for standard tier
  response: { status: 200, body: { price: 999, discount: 0 } }
}]
```

### Testing Polling Scenarios

Use sequences to simulate async operations:

```typescript
// Scenario with polling sequence
mocks: [{
  method: 'GET',
  url: 'https://api.github.com/repos/user/repo/status',
  sequence: {
    responses: [
      { status: 200, body: { status: 'pending' } },
      { status: 200, body: { status: 'processing' } },
      { status: 200, body: { status: 'complete' } }
    ],
    repeat: 'last'  // After sequence exhausts, repeat last response
  }
}]
```

## Next Steps

- [Next.js Getting Started →](/frameworks/nextjs/getting-started) - Integrate Scenarist into your Next.js app
- [Request Matching →](/core-concepts/dynamic-responses#request-matching) - Learn about request content matching
- [Sequences →](/core-concepts/dynamic-responses#sequences) - Learn about response sequences
- [Stateful Mocks →](/core-concepts/dynamic-responses#stateful-mocks) - Learn about state capture and injection
