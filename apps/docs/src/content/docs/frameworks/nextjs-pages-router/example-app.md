---
title: Next.js Pages Router Example App
description: Working example demonstrating Scenarist with Next.js Pages Router
---

## Overview

The Next.js Pages Router example demonstrates HTTP-level testing for API routes, getServerSideProps, and client components using Scenarist.

**GitHub:** [apps/nextjs-pages-router-example](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-pages-router-example)

## What It Demonstrates

This example app showcases all major Scenarist features with Pages Router:

### Core Features
- **API Routes** - Test Next.js API routes with different external API responses
- **getServerSideProps** - Test server-side rendering with mocked external APIs
- **Client Components** - Test client-side hydration with backend scenarios
- **Runtime Scenario Switching** - Multiple scenarios running concurrently

### Dynamic Response Features
- **Request Matching** - Different responses based on request content (tier-based pricing)
- **Sequences** - Polling scenarios (pending → processing → complete)
- **Stateful Mocks** - Shopping cart with state capture and injection
- **Feature Composition** - Checkout flow combining matching and stateful mocks

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

# Navigate to Pages Router example
cd apps/nextjs-pages-router-example
```

## Running the Example

### Development Mode

```bash
# Start the Next.js dev server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run specific test file
pnpm test products-server-side
```

## Key Files

### Scenarist Setup

**`lib/scenarist.ts`** - Scenarist configuration
```typescript
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

// Auto-start MSW server for server-side API route interception
if (typeof window === 'undefined') {
  scenarist.start();
}
```

**`pages/api/__scenario__.ts`** - Scenario control endpoint
```typescript
import { scenarist } from '@/lib/scenarist';
export default scenarist.createScenarioEndpoint();
```

This creates the `/__scenario__` endpoint used by tests to switch scenarios.

### Scenario Definitions

**`lib/scenarios.ts`** - All scenario definitions ([view on GitHub](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-pages-router-example/lib/scenarios.ts))

Key scenarios:

**`default`** - Default baseline behavior

**`premiumUser`** - Premium tier with request matching
```typescript
premiumUser: {
  id: 'premiumUser',
  mocks: [{
    method: 'GET',
    url: 'http://localhost:3001/products',
    match: { headers: { 'x-user-tier': 'premium' } },
    response: { status: 200, body: { products: buildProducts('premium') } }
  }]
}
```

**`githubPolling`** - Polling sequence (pending → processing → complete)
```typescript
githubPolling: {
  id: 'githubPolling',
  mocks: [{
    method: 'GET',
    url: 'http://localhost:3001/github/jobs/:id',
    sequence: {
      responses: [
        { status: 200, body: { status: 'pending', progress: 0 } },
        { status: 200, body: { status: 'processing', progress: 50 } },
        { status: 200, body: { status: 'complete', progress: 100 } }
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
      url: 'http://localhost:3001/cart/add',
      captureState: {
        'cartItems[]': 'body.productId'
      },
      response: { status: 200, body: { success: true } }
    },
    {
      method: 'GET',
      url: 'http://localhost:3001/cart',
      response: {
        status: 200,
        body: { items: '{{state.cartItems}}' }
      }
    }
  ]
}
```

**`checkout`** - Feature composition (matching + state)
```typescript
checkout: {
  id: 'checkout',
  mocks: [
    // UK free shipping
    {
      method: 'POST',
      url: 'http://localhost:3001/checkout/shipping',
      match: { body: { country: 'UK' } },
      captureState: { country: 'body.country', address: 'body.address' },
      response: { status: 200, body: { shippingCost: 0 } }
    },
    // Order with captured address
    {
      method: 'POST',
      url: 'http://localhost:3001/checkout/order',
      response: {
        status: 200,
        body: {
          shippingAddress: {
            country: '{{state.country}}',
            address: '{{state.address}}'
          }
        }
      }
    }
  ]
}
```

### API Route Examples

**`pages/api/products.ts`** - Products API route with tier-based pricing
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tier = req.headers['x-user-tier'] || 'standard';

  // This fetch is mocked by Scenarist
  const response = await fetch('http://localhost:3001/products', {
    headers: { 'x-user-tier': tier },
  });

  const data = await response.json();
  res.status(200).json(data);
}
```

**`pages/api/cart.ts`** - Cart API route with state capture
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Add to cart - state captured by Scenarist
    const response = await fetch('http://localhost:3001/cart/add', {
      method: 'POST',
      body: JSON.stringify(req.body),
    });
    return res.json(await response.json());
  }

  // Get cart - state injected by Scenarist
  const response = await fetch('http://localhost:3001/cart');
  res.json(await response.json());
}
```

### Test Examples

**`tests/playwright/products-server-side.spec.ts`** - getServerSideProps with request matching
```typescript
test('premium users see discounted pricing', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser');

  await page.goto('/');

  // getServerSideProps fetches from API route with x-user-tier header
  // Scenarist returns mock matching { headers: { 'x-user-tier': 'premium' } }
  await expect(page.getByText('£99.99')).toBeVisible();
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

**`tests/playwright/cart-server-side.spec.ts`** - Stateful mocks with API routes
```typescript
test('cart maintains state across requests', async ({ page, switchScenario }) => {
  const testId = await switchScenario(page, 'cartWithState');

  // Add product via API route - state captured
  const response = await page.request.post('http://localhost:3000/api/cart', {
    headers: { 'x-test-id': testId },
    data: { productId: 'prod-1' }
  });

  expect(response.ok()).toBe(true);

  await page.goto('/cart');

  // Cart shows added product - state injected
  await expect(page.getByText('Product A')).toBeVisible();
});
```

**`tests/playwright/checkout.spec.ts`** - Feature composition
```typescript
test('checkout captures address and applies UK free shipping', async ({ page, switchScenario }) => {
  const testId = await switchScenario(page, 'checkout');

  // Calculate shipping - matches UK, captures address
  await page.request.post('http://localhost:3000/api/checkout/shipping', {
    headers: { 'x-test-id': testId },
    data: {
      country: 'UK',
      address: '123 Test St',
      city: 'London',
      postcode: 'SW1A 1AA'
    }
  });

  // Place order - injects captured address
  const orderResponse = await page.request.post('http://localhost:3000/api/checkout/order', {
    headers: { 'x-test-id': testId },
    data: { orderId: 'order-123' }
  });

  const order = await orderResponse.json();

  // Verify state was captured and injected
  expect(order.shippingAddress.country).toBe('UK');
  expect(order.shippingAddress.address).toBe('123 Test St');
});
```

## Architecture

### How It Works

1. **Setup** - Pages Router app includes Scenarist API endpoint
2. **Test starts** - Calls `switchScenario()` to set active scenario
3. **HTTP request** - Test makes request to Next.js page or API route
4. **Route execution** - API routes and getServerSideProps execute normally
5. **External API call** - Intercepted by MSW with scenario-defined response
6. **Test assertion** - Verifies API response or rendered output

### Test Isolation

Each test gets a unique test ID:
- Scenario switching: `POST /api/__scenario__` with `x-test-id` header
- All requests include `x-test-id` header automatically (Playwright helper)
- Server routes requests to correct scenario based on test ID
- Parallel tests don't interfere with each other

### File Structure

```text
apps/nextjs-pages-router-example/
├── pages/
│   ├── index.tsx                    # Products page (getServerSideProps)
│   ├── cart.tsx                     # Cart page
│   ├── polling.tsx                  # Polling example
│   └── api/
│       ├── __scenario__.ts          # Scenarist endpoint
│       ├── products.ts              # Products API route
│       ├── cart.ts                  # Cart API route
│       └── checkout/                # Checkout API routes
├── lib/
│   ├── scenarist.ts                 # Scenarist setup
│   └── scenarios.ts                 # Scenario definitions
└── tests/
    └── playwright/
        ├── products-server-side.spec.ts
        ├── sequences.spec.ts
        ├── cart-server-side.spec.ts
        └── checkout.spec.ts
```

## Common Patterns

### Testing API Routes

```typescript
// API route with external API call
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch('https://api.external.com/data');
  const data = await response.json();
  res.json(data);
}

// Test with different scenarios
test('standard data', async ({ page, switchScenario }) => {
  const testId = await switchScenario(page, 'default');

  const response = await page.request.get('/api/data', {
    headers: { 'x-test-id': testId }
  });

  expect(await response.json()).toMatchObject({ tier: 'standard' });
});

test('premium data', async ({ page, switchScenario }) => {
  const testId = await switchScenario(page, 'premiumUser');

  const response = await page.request.get('/api/data', {
    headers: { 'x-test-id': testId }
  });

  expect(await response.json()).toMatchObject({ tier: 'premium' });
});
```

### Testing getServerSideProps

```typescript
// Page with getServerSideProps
export async function getServerSideProps() {
  const response = await fetch('https://api.external.com/products');
  const { products } = await response.json();
  return { props: { products } };
}

// Test with different data scenarios
test('renders products from getServerSideProps', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser');
  await page.goto('/products');
  await expect(page.getByText('Premium Product')).toBeVisible();
});
```

### Testing Request Matching

Use request content to determine response:

```typescript
// Scenario with tier-based pricing
mocks: [{
  method: 'GET',
  url: 'http://localhost:3001/products',
  match: { headers: { 'x-user-tier': 'premium' } },
  response: { status: 200, body: { products: buildProducts('premium') } }
}, {
  method: 'GET',
  url: 'http://localhost:3001/products',
  // No match criteria - fallback for standard tier
  response: { status: 200, body: { products: buildProducts('standard') } }
}]
```

### Testing Polling Scenarios

Use sequences to simulate async operations:

```typescript
// Scenario with polling sequence
mocks: [{
  method: 'GET',
  url: 'http://localhost:3001/github/jobs/:id',
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

- [Pages Router Getting Started →](/frameworks/nextjs-pages-router/getting-started) - Integrate Scenarist into your Pages Router app
- [Request Matching →](/core-concepts/dynamic-responses#request-matching) - Learn about request content matching
- [Sequences →](/core-concepts/dynamic-responses#sequences) - Learn about response sequences
- [Stateful Mocks →](/core-concepts/dynamic-responses#stateful-mocks) - Learn about state capture and injection
