# Next.js React Server Components Example Plan

## Context

While creating the documentation plan, we discovered that React Server Components (RSC) pain points are central to our value proposition. The Next.js official docs state:

> "Since async Server Components are new to the React ecosystem, some tools do not fully support them. In the meantime, we recommend using End-to-End Testing over Unit Testing for async components."

**We need working RSC examples to prove Scenarist solves this pain.**

## Goals

1. **Validate Documentation Claims** - Prove that Scenarist handles RSC testing better than alternatives
2. **Demonstrate Real-World Patterns** - Show server-side data fetching, authentication, error handling
3. **Provide Copy-Paste Examples** - Developers can use these as templates
4. **Strengthen Value Proposition** - "Test Next.js App Router without spawning new instances"

## Scope: App Router Example Enhancement

**Target:** `apps/nextjs-app-router-example/` (already exists, needs RSC added)

**Current State:**
- Basic scaffolding complete
- Scenarist integration working
- Missing: Actual server components with data fetching

**What We'll Add:**
- Server components fetching from mocked APIs
- Multiple RSC examples (product listing, user profile, cart summary)
- Tests demonstrating RSC testing without Jest issues
- Clear before/after comparison (traditional MSW vs Scenarist)

## Implementation Plan

### Phase 1: Product Listing Server Component

**Why This First:**
- Matches existing product scenarios
- Demonstrates server-side data fetching
- Simple, clear use case

**Files to Create:**

```
apps/nextjs-app-router-example/
├── app/
│   ├── products/
│   │   └── page.tsx          # Server component (NEW)
│   └── layout.tsx             # Update with navigation
├── components/
│   └── ProductCard.tsx        # Client component for product display (NEW)
└── tests/
    └── playwright/
        └── products-rsc.spec.ts  # RSC testing (NEW)
```

**Server Component Example:**

```typescript
// app/products/page.tsx
import { ProductCard } from '@/components/ProductCard';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

// This is a React Server Component - runs on server only
export default async function ProductsPage() {
  // Fetch happens on server - Scenarist mocks this!
  const response = await fetch('http://localhost:3000/api/products', {
    headers: {
      'x-test-id': 'default-test', // Scenarist test isolation
    },
  });

  const products: Product[] = await response.json();

  return (
    <div>
      <h1>Products (Server Component)</h1>
      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

**Test Example:**

```typescript
// tests/playwright/products-rsc.spec.ts
import { test, expect } from '@playwright/test';
import { setScenario } from '@scenarist/playwright-helpers';

test.describe('Products Page (Server Component)', () => {
  test('should render products from server component', async ({ page }) => {
    // Set scenario - no Jest, no spawning new Next.js instance!
    await setScenario('products-available', { baseURL: 'http://localhost:3000' });

    // Navigate to RSC page
    await page.goto('http://localhost:3000/products');

    // Server component rendered products
    await expect(page.getByRole('heading', { name: 'Products (Server Component)' })).toBeVisible();
    await expect(page.getByText('Laptop')).toBeVisible();
    await expect(page.getByText('Smartphone')).toBeVisible();
  });

  test('should handle error scenario in server component', async ({ page }) => {
    // Switch scenario at runtime - no app restart!
    await setScenario('products-error', { baseURL: 'http://localhost:3000' });

    await page.goto('http://localhost:3000/products');

    // Error state rendered by server component
    await expect(page.getByText('Failed to load products')).toBeVisible();
  });

  test('should show loading state for slow server component', async ({ page }) => {
    // Scenario with delay (simulates slow API)
    await setScenario('products-slow', { baseURL: 'http://localhost:3000' });

    await page.goto('http://localhost:3000/products');

    // Suspense fallback shown
    await expect(page.getByText('Loading products...')).toBeVisible();

    // Eventually shows products
    await expect(page.getByText('Laptop')).toBeVisible({ timeout: 5000 });
  });
});
```

### Phase 2: Authentication Server Component

**Why:**
- Common RSC use case
- Demonstrates server-side auth checks
- Shows how Scenarist handles authenticated scenarios

**Files to Create:**

```
apps/nextjs-app-router-example/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Server component with auth (NEW)
│   └── login/
│       └── page.tsx          # Client component login form (NEW)
└── tests/
    └── playwright/
        └── auth-rsc.spec.ts  # Auth testing (NEW)
```

**Server Component with Auth:**

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';

async function getCurrentUser() {
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'x-test-id': 'default-test',
    },
  });

  if (!response.ok) {
    redirect('/login');
  }

  return response.json();
}

// Server component - authentication happens server-side
export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1>Dashboard (Server Component)</h1>
      <p>Welcome, {user.name}!</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

**Test Example:**

```typescript
// tests/playwright/auth-rsc.spec.ts
test('should redirect unauthenticated users from server component', async ({ page }) => {
  await setScenario('guest-user', { baseURL: 'http://localhost:3000' });

  await page.goto('http://localhost:3000/dashboard');

  // Server component redirected to login
  await expect(page).toHaveURL('http://localhost:3000/login');
});

test('should show dashboard for authenticated admin', async ({ page }) => {
  await setScenario('admin-user', { baseURL: 'http://localhost:3000' });

  await page.goto('http://localhost:3000/dashboard');

  // Server component rendered with user data
  await expect(page.getByText('Welcome, Admin User!')).toBeVisible();
  await expect(page.getByText('Role: admin')).toBeVisible();
});
```

### Phase 3: Shopping Cart Server Component

**Why:**
- Demonstrates stateful server components
- Shows Scenarist's stateful mocks feature
- Complex real-world scenario

**Files to Create:**

```
apps/nextjs-app-router-example/
├── app/
│   └── cart/
│       └── page.tsx          # Server component (NEW)
└── tests/
    └── playwright/
        └── cart-rsc.spec.ts  # Cart testing (NEW)
```

**Server Component with State:**

```typescript
// app/cart/page.tsx
async function getCart() {
  const response = await fetch('http://localhost:3000/api/cart', {
    headers: {
      'x-test-id': 'default-test',
    },
  });

  return response.json();
}

export default async function CartPage() {
  const cart = await getCart();

  return (
    <div>
      <h1>Shopping Cart (Server Component)</h1>
      <p>Items: {cart.items.length}</p>
      <p>Total: ${cart.total}</p>
      {cart.items.map((item) => (
        <div key={item.id}>
          {item.name} x {item.quantity} = ${item.subtotal}
        </div>
      ))}
    </div>
  );
}
```

**Test with Stateful Mocks:**

```typescript
test('should show updated cart after adding items', async ({ page }) => {
  // Start with empty cart
  await setScenario('cart-empty', {
    baseURL: 'http://localhost:3000',
    testId: 'test-cart-1'
  });

  await page.goto('http://localhost:3000/cart');
  await expect(page.getByText('Items: 0')).toBeVisible();

  // Add item (triggers state capture)
  await page.goto('http://localhost:3000/products');
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();

  // Switch to cart-with-items scenario (uses captured state)
  await setScenario('cart-with-items', {
    baseURL: 'http://localhost:3000',
    testId: 'test-cart-1'
  });

  // Cart shows added item
  await page.goto('http://localhost:3000/cart');
  await expect(page.getByText('Items: 1')).toBeVisible();
  await expect(page.getByText('Laptop x 1')).toBeVisible();
});
```

## Scenarios to Add

**New scenarios needed in App Router adapter setup:**

```typescript
// apps/nextjs-app-router-example/app/api/scenarist/scenarios.ts

export const productsAvailableScenario: ScenarioDefinition = {
  id: 'products-available',
  name: 'Products Available',
  description: 'Server component fetches product list successfully',
  mocks: [
    {
      method: 'GET',
      url: '/api/products',
      response: {
        status: 200,
        body: [
          { id: '1', name: 'Laptop', price: 999, stock: 5 },
          { id: '2', name: 'Smartphone', price: 599, stock: 10 },
        ],
      },
    },
  ],
};

export const productsErrorScenario: ScenarioDefinition = {
  id: 'products-error',
  name: 'Products Error',
  description: 'Server component handles API error',
  mocks: [
    {
      method: 'GET',
      url: '/api/products',
      response: {
        status: 500,
        body: { error: 'Failed to load products' },
      },
    },
  ],
};

export const productsSlowScenario: ScenarioDefinition = {
  id: 'products-slow',
  name: 'Products Slow',
  description: 'Server component with slow API (tests Suspense)',
  mocks: [
    {
      method: 'GET',
      url: '/api/products',
      response: {
        status: 200,
        body: [
          { id: '1', name: 'Laptop', price: 999, stock: 5 },
        ],
        delay: 3000, // 3 second delay
      },
    },
  ],
};

export const guestUserScenario: ScenarioDefinition = {
  id: 'guest-user',
  name: 'Guest User',
  description: 'Unauthenticated user (server component redirects)',
  mocks: [
    {
      method: 'GET',
      url: '/api/auth/me',
      response: {
        status: 401,
        body: { error: 'Not authenticated' },
      },
    },
  ],
};

export const adminUserScenario: ScenarioDefinition = {
  id: 'admin-user',
  name: 'Admin User',
  description: 'Authenticated admin (server component shows dashboard)',
  mocks: [
    {
      method: 'GET',
      url: '/api/auth/me',
      response: {
        status: 200,
        body: { name: 'Admin User', role: 'admin' },
      },
    },
  ],
};

export const cartEmptyScenario: ScenarioDefinition = {
  id: 'cart-empty',
  name: 'Empty Cart',
  description: 'Server component shows empty cart',
  mocks: [
    {
      method: 'GET',
      url: '/api/cart',
      response: {
        status: 200,
        body: { items: [], total: 0 },
      },
    },
  ],
};

export const cartWithItemsScenario: ScenarioDefinition = {
  id: 'cart-with-items',
  name: 'Cart with Items',
  description: 'Server component shows cart with items (uses state)',
  mocks: [
    {
      method: 'GET',
      url: '/api/cart',
      response: {
        status: 200,
        body: {
          items: [
            { id: '1', name: 'Laptop', quantity: 1, subtotal: 999 },
          ],
          total: 999,
        },
      },
    },
    {
      method: 'POST',
      url: '/api/cart/items',
      captureState: {
        'cart.lastAdded': '$.body.productId', // Capture product ID
      },
      response: {
        status: 201,
        body: { success: true },
      },
    },
  ],
};
```

## Testing Strategy

### What We're Proving

**Traditional Approach (Painful):**
```typescript
// ❌ Jest doesn't support RSC
import { render } from '@testing-library/react';
import ProductsPage from './page'; // Error: async components not supported

test('products page', () => {
  render(<ProductsPage />); // ❌ Objects are not valid as a React child
});

// Must spawn new Next.js instance per test instead
// Slow, complex, fragile
```

**Scenarist Approach (Easy):**
```typescript
// ✅ Playwright + Scenarist - no Jest needed
import { test } from '@playwright/test';
import { setScenario } from '@scenarist/playwright-helpers';

test('products page', async ({ page }) => {
  await setScenario('products-available'); // ✅ Works perfectly
  await page.goto('/products');
  // Test the rendered RSC
});
```

### Test Coverage Goals

**Each RSC page should have tests for:**
1. ✅ Happy path (data loads successfully)
2. ✅ Error handling (API fails)
3. ✅ Loading states (Suspense boundaries)
4. ✅ Scenario switching (runtime, no restart)
5. ✅ Parallel execution (test isolation via test IDs)

## Documentation Integration

### Pages to Update

**1. Homepage Before/After:**

```markdown
## What Framework Docs Won't Tell You

### Next.js App Router

> "Since async Server Components are new to the React ecosystem, some tools
> do not fully support them. In the meantime, we recommend using End-to-End
> Testing over Unit Testing for async components."
> — Next.js Official Docs

**Without Scenarist:**
```typescript
// ❌ Jest doesn't support RSC testing
import { render } from '@testing-library/react';
import ProductsPage from './page'; // Async server component

test('products page', () => {
  render(<ProductsPage />); // Error: Objects are not valid as a React child
});

// Must spawn new Next.js instance per test (slow, complex)
```

**With Scenarist:**
```typescript
// ✅ Test RSC with Playwright + Scenarist
import { test } from '@playwright/test';
import { setScenario } from '@scenarist/playwright-helpers';

test('products page', async ({ page }) => {
  await setScenario('products-available'); // Fast, easy, isolated
  await page.goto('/products'); // RSC renders with mocked data
  await expect(page.getByText('Laptop')).toBeVisible();
});
```
```

**2. Next.js Framework Guide:**

Add dedicated section:
- "Testing React Server Components"
- Show server component code
- Show Scenarist test
- Link to working example in repo

**3. Recipes:**

Add new recipes:
- "Testing Server Components with Data Fetching"
- "Server-Side Authentication in RSC"
- "Stateful Server Components"

## File Structure Summary

```
apps/nextjs-app-router-example/
├── app/
│   ├── products/
│   │   └── page.tsx                # Phase 1: Product listing RSC
│   ├── dashboard/
│   │   └── page.tsx                # Phase 2: Auth RSC
│   ├── cart/
│   │   └── page.tsx                # Phase 3: Stateful RSC
│   ├── login/
│   │   └── page.tsx                # Phase 2: Login client component
│   └── layout.tsx                  # Update with nav links
├── components/
│   └── ProductCard.tsx             # Client component for products
├── app/api/scenarist/
│   └── scenarios.ts                # Add new scenarios
└── tests/
    └── playwright/
        ├── products-rsc.spec.ts    # Phase 1 tests
        ├── auth-rsc.spec.ts        # Phase 2 tests
        └── cart-rsc.spec.ts        # Phase 3 tests
```

## Success Criteria

**Code:**
- ✅ 3 working server components (Products, Dashboard, Cart)
- ✅ 3 Playwright test suites (12+ tests total)
- ✅ All tests pass in parallel
- ✅ No Jest, no spawning Next.js instances
- ✅ Runtime scenario switching works

**Documentation:**
- ✅ Homepage shows RSC before/after
- ✅ Framework guide has RSC section
- ✅ 3 new recipes for RSC patterns
- ✅ Code examples copy-paste ready

**Value Proposition:**
- ✅ Proves "Test Next.js App Router without spawning new instances"
- ✅ Shows "No Jest issues with RSC"
- ✅ Demonstrates "Runtime scenario switching"
- ✅ Validates "Parallel test execution"

## Timeline

**Phase 1 (Products RSC):** 2-3 hours
- Create server component
- Create scenarios
- Write tests
- Update docs

**Phase 2 (Auth RSC):** 1-2 hours
- Create auth components
- Create scenarios
- Write tests
- Update docs

**Phase 3 (Cart RSC):** 2-3 hours
- Create cart component
- Create stateful scenarios
- Write tests
- Update docs

**Total Estimated Time:** 5-8 hours

**Priority:** HIGH - Validates core value proposition in docs

---

**Document Status:** PLAN - Ready for Implementation
**Created:** 2025-11-08
**Related:** Documentation Plan (PR #62)
**Next Action:** Implement Phase 1 (Products RSC)
