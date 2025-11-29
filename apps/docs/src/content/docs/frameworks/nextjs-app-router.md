---
title: Next.js App Router
description: Using Scenarist with Next.js App Router (Server Components, Route Handlers, Server Actions)
---

## Testing Next.js App Router with Scenarist

The Next.js App Router introduces React Server Components, enabling server-side rendering with direct data fetching. Scenarist provides first-class support for testing App Router applications, addressing the challenges outlined in the [official Next.js testing documentation](https://nextjs.org/docs/app/building-your-application/testing).

### The Challenge

Next.js recommends end-to-end testing for Server Components because _"async Server Components are new to the React ecosystem."_ Unit testing requires mocking Next.js internals (fetch, cookies, headers), creating distance from production execution.

**Specific App Router challenges:**

- Server Components execute asynchronously with no standard testing approach
- Route Handlers need testing with different external API scenarios
- Server Actions require testing mutations without complex mocking
- Framework internals (fetch, cookies, headers) must be mocked for unit tests

### How Scenarist Helps

Scenarist enables HTTP-level testing for App Router applications:

- **Test Server Components** without mocking Next.js internals
- **Test Route Handlers** with different external API scenarios
- **Test Server Actions** with runtime scenario switching
- **Run parallel tests** without interference
- **Fast execution** - no browser overhead for every scenario
- **Automatic singleton protection** - Handles Next.js module duplication for you (no `globalThis` boilerplate needed)

## App Router Features Supported

### Server Components

Test async Server Components with real HTTP requests:

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const response = await fetch('https://api.stripe.com/v1/products');
  const { data: products } = await response.json();
  return <ProductList products={products} />;
}

// Test without mocking Next.js internals
test('renders products from external API', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumUser');
  await page.goto('/products');
  await expect(page.getByText('Premium Product')).toBeVisible();
});
```

### Route Handlers

Test API routes with different scenarios:

```typescript
// app/api/checkout/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return Response.json(await response.json());
}

// Test with different payment scenarios
test("processes successful payment", async ({ page, switchScenario }) => {
  await switchScenario(page, "paymentSuccess");
  const response = await page.request.post("/api/checkout", {
    data: { amount: 5000, token: "tok_test" },
  });
  expect(response.ok()).toBe(true);
});
```

### Server Actions

Test mutations with state capture:

```typescript
// app/cart/actions.ts
export async function addToCart(productId: string) {
  await fetch("https://api.cart.example.com/add", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
  revalidatePath("/cart");
}

// Test with stateful mocks
test("cart maintains state across requests", async ({
  page,
  switchScenario,
}) => {
  await switchScenario(page, "cartWithState");
  await page.goto("/products");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await page.goto("/cart");
  await expect(page.getByText("Product A")).toBeVisible();
});
```

## Working Example

See Scenarist in action with a complete Next.js App Router application:

[**Explore the Next.js App Router Example →**](/frameworks/nextjs-app-router/example-app)

The example demonstrates:

- Testing Server Components without mocking Next.js internals
- Request matching for tier-based pricing
- Sequences for polling scenarios
- Stateful mocks for shopping cart functionality
- Complete installation and usage instructions

**[View source on GitHub →](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-app-router-example)**

## Getting Started

Ready to integrate Scenarist into your Next.js App Router application?

[**Get started with App Router →**](/frameworks/nextjs-app-router/getting-started)

## Key Benefits

**Server Components Execute** - Your React Server Components render and run your application logic, not mocked stubs.

**API Routes Run Normally** - Your validation, error handling, and business logic all execute.

**Test Isolation** - Each test gets isolated scenario state. Run tests in parallel with zero interference.

**No App Restart** - Switch scenarios instantly during test execution.

**Real HTTP Requests** - Tests make actual HTTP requests to your Next.js app, exercising middleware and routing.
