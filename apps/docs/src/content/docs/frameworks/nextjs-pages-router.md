---
title: Next.js Pages Router
description: Using Scenarist with Next.js Pages Router (API Routes, getServerSideProps, getStaticProps)
---

## Testing Next.js Pages Router with Scenarist

The Pages Router is Next.js's traditional routing system using the pages directory. Scenarist enables testing API routes and server-side rendering without complex mocking, allowing you to test your application code with real HTTP requests.

### The Challenge

Testing Pages Router applications traditionally requires choosing between:

- **Unit testing API routes** in isolation (misses integration with middleware and framework features)
- **Mocking framework features** (getServerSideProps, request/response objects) which creates distance from production
- **Testing each API route separately** with mocked dependencies (creates test maintenance burden)

**Specific Pages Router challenges:**
- API routes need testing with different external API scenarios
- getServerSideProps executes server-side and requires mocking fetch or external APIs
- getStaticProps needs testing with various data states
- Framework internals must be mocked for unit tests

### How Scenarist Helps

Scenarist enables HTTP-level testing for Pages Router applications:

- **Test API routes** with real HTTP requests and different external API scenarios
- **Test getServerSideProps** without mocking Next.js internals
- **Test getStaticProps** with runtime scenario switching
- **Run parallel tests** without interference
- **Fast execution** - no browser overhead for every scenario
- **Automatic singleton protection** - Handles Next.js module duplication for you (no `globalThis` boilerplate needed)

## Pages Router Features Supported

### API Routes

Test API routes with different scenarios:

```typescript
// pages/api/checkout.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  res.status(200).json(data);
}

// Test with different payment scenarios
test('processes successful payment', async ({ page, switchScenario }) => {
  await switchScenario(page, 'paymentSuccess');
  const response = await page.request.post('/api/checkout', {
    data: { amount: 5000, token: 'tok_test' }
  });
  expect(response.ok()).toBe(true);
});
```

### getServerSideProps

Test server-side rendering with different external API responses:

```typescript
// pages/products.tsx
export async function getServerSideProps() {
  const response = await fetch('https://api.stripe.com/v1/products');
  const { data: products } = await response.json();
  return { props: { products } };
}

export default function ProductsPage({ products }) {
  return <ProductList products={products} />;
}

// Test without mocking Next.js internals
test('renders products from external API', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser');
  await page.goto('/products');
  await expect(page.getByText('Premium Product')).toBeVisible();
});
```

### getStaticProps

Test static generation with different data scenarios:

```typescript
// pages/index.tsx
export async function getStaticProps() {
  const response = await fetch('https://api.products.example.com/featured');
  const { data: featured } = await response.json();
  return {
    props: { featured },
    revalidate: 60 // ISR
  };
}

export default function HomePage({ featured }) {
  return <FeaturedProducts products={featured} />;
}

// Test with different featured product scenarios
test('renders featured products', async ({ page, switchScenario }) => {
  await switchScenario(page, 'holidaySale');
  await page.goto('/');
  await expect(page.getByText('Holiday Sale')).toBeVisible();
});
```

## Getting Started

Ready to integrate Scenarist into your Next.js Pages Router application?

[**Get started with Pages Router →**](/frameworks/nextjs-pages-router/getting-started)

## Key Benefits

**API Routes Execute Normally** - Your validation, error handling, and business logic all run as they would in production.

**Server-Side Rendering Works** - Your getServerSideProps and getStaticProps fetch data from mocked external APIs.

**Test Isolation** - Each test gets isolated scenario state. Run tests in parallel with zero interference.

**No App Restart** - Switch scenarios instantly during test execution.

**Real HTTP Requests** - Tests make actual HTTP requests to your Next.js app, exercising middleware and routing.

## Next Steps

- [Pages Router Getting Started →](/frameworks/nextjs-pages-router/getting-started) - Set up Scenarist in your Pages Router app
- [Next.js General Guide →](/frameworks/nextjs) - Learn about Next.js testing with Scenarist
