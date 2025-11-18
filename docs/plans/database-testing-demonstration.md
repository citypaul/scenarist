# Database Testing Demonstration Plan

## Overview

Create working demonstrations of both database testing approaches in the Next.js App Router example app, showing how teams can test Server Components that need database access.

**User Story:** E-commerce checkout page showing cart items, order history, and user tier-based pricing.

**Two Implementations:**
1. **PR #1: API Route Abstraction** - Refactor to use API routes, mock with Scenarist
2. **PR #2: Testcontainers Hybrid** - Keep direct database access, use Testcontainers + Scenarist

## User Story

**As a** shopper
**I want to** view my checkout page
**So that I can** review my cart, see my order history, and complete my purchase

**Business Rules:**
- Premium users see discounted pricing (20% off)
- Standard users see regular pricing
- Cart shows product details, quantities, and subtotal
- Order history shows last 5 orders with status
- Recommended products fetched from external recommendation API

## Database Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  firstName String
  lastName  String
  tier      String     // 'standard' | 'premium'
  createdAt DateTime   @default(now())
  cartItems CartItem[]
  orders    Order[]
}

model CartItem {
  id        String   @id @default(uuid())
  userId    String
  productId String
  quantity  Int
  price     Int      // Price in cents at time of adding
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model Order {
  id        String   @id @default(uuid())
  userId    String
  total     Int      // Total in cents
  status    String   // 'pending' | 'processing' | 'shipped' | 'delivered'
  items     Json     // Array of {productId, quantity, price}
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Test Scenarios

### Scenario 1: Premium User Checkout

**User State:**
- Email: premium@example.com
- Tier: premium
- Cart: 3 items (Product A, Product B, Product C)
- Order History: 5 completed orders

**Expected Behavior:**
- Cart shows premium pricing (20% discount applied)
- Cart subtotal reflects discounted prices
- Order history shows 5 previous orders
- Premium badge visible
- Recommended products API returns premium suggestions

### Scenario 2: Standard User (First-Time Buyer)

**User State:**
- Email: standard@example.com
- Tier: standard
- Cart: 1 item (Product A)
- Order History: No previous orders

**Expected Behavior:**
- Cart shows standard pricing
- Cart subtotal reflects regular prices
- "First order!" message shown (no order history)
- Standard tier indicator
- Recommended products API returns standard suggestions

## PR #1: API Route Abstraction Approach

### Objective

Demonstrate testing database-heavy Server Components by abstracting database access behind API routes that Scenarist can mock.

### Implementation Steps

#### Step 1: Define API Routes

**`app/api/user/[id]/route.ts`** - Get user details
```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      tier: true,
    },
  });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({ user });
}
```

**`app/api/user/[id]/cart/route.ts`** - Get cart items
```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({ cartItems });
}
```

**`app/api/user/[id]/orders/route.ts`** - Get order history
```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orders = await prisma.order.findMany({
    where: { userId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return Response.json({ orders });
}
```

**`app/api/recommendations/route.ts`** - Get product recommendations (external API)
```typescript
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const tier = request.headers.get('x-user-tier') || 'standard';

  // Call external recommendation service
  const response = await fetch('https://api.recommendations.example.com/products', {
    headers: {
      'Authorization': `Bearer ${process.env.RECOMMENDATIONS_API_KEY}`,
      'X-User-Tier': tier,
    },
  });

  const data = await response.json();
  return Response.json(data);
}
```

#### Step 2: Create Server Component Using API Routes

**`app/checkout-api/page.tsx`**
```typescript
import { scenarist } from '@/lib/scenarist';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: 'standard' | 'premium';
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
};

type Recommendation = {
  id: string;
  name: string;
  price: number;
};

const PRODUCT_NAMES: Record<string, string> = {
  'prod-1': 'Premium Headphones',
  'prod-2': 'Wireless Mouse',
  'prod-3': 'Mechanical Keyboard',
};

export default async function CheckoutApiPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const userId = searchParams.userId || 'user-1';

  // Fetch user details from API route
  const userResponse = await fetch(`http://localhost:3002/api/user/${userId}`, {
    headers: scenarist.getHeaders(),
  });
  const { user }: { user: User } = await userResponse.json();

  // Fetch cart items from API route
  const cartResponse = await fetch(`http://localhost:3002/api/user/${userId}/cart`, {
    headers: scenarist.getHeaders(),
  });
  const { cartItems }: { cartItems: CartItem[] } = await cartResponse.json();

  // Fetch order history from API route
  const ordersResponse = await fetch(`http://localhost:3002/api/user/${userId}/orders`, {
    headers: scenarist.getHeaders(),
  });
  const { orders }: { orders: Order[] } = await ordersResponse.json();

  // Fetch recommendations from external API (via our proxy route)
  const recommendationsResponse = await fetch('http://localhost:3002/api/recommendations', {
    headers: {
      ...scenarist.getHeaders(),
      'x-user-tier': user.tier,
    },
  });
  const { products }: { products: Recommendation[] } = await recommendationsResponse.json();

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = user.tier === 'premium' ? Math.floor(subtotal * 0.2) : 0;
  const total = subtotal - discount;

  return (
    <div className="checkout-container">
      <h1>Checkout - API Route Approach</h1>

      {/* User Info */}
      <section className="user-info">
        <h2>Welcome, {user.firstName} {user.lastName}</h2>
        <p className="user-email">{user.email}</p>
        <span className={`tier-badge ${user.tier}`}>
          {user.tier === 'premium' ? '⭐ Premium' : 'Standard'} Member
        </span>
      </section>

      {/* Cart */}
      <section className="cart">
        <h2>Your Cart ({cartItems.length} items)</h2>
        {cartItems.map((item) => (
          <article key={item.id} className="cart-item">
            <h3>{PRODUCT_NAMES[item.productId]}</h3>
            <p>Quantity: {item.quantity}</p>
            <p className="item-price">£{(item.price / 100).toFixed(2)} each</p>
            <p className="item-total">£{(item.price * item.quantity / 100).toFixed(2)}</p>
          </article>
        ))}

        <div className="cart-summary">
          <p>Subtotal: £{(subtotal / 100).toFixed(2)}</p>
          {discount > 0 && (
            <p className="discount">Premium Discount (20%): -£{(discount / 100).toFixed(2)}</p>
          )}
          <p className="total">Total: £{(total / 100).toFixed(2)}</p>
        </div>
      </section>

      {/* Order History */}
      <section className="order-history">
        <h2>Order History</h2>
        {orders.length === 0 ? (
          <p className="first-order">This is your first order! 🎉</p>
        ) : (
          <ul>
            {orders.map((order) => (
              <li key={order.id} className="order-item">
                <span>Order #{order.id.slice(0, 8)}</span>
                <span>£{(order.total / 100).toFixed(2)}</span>
                <span className={`status ${order.status}`}>{order.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recommendations */}
      <section className="recommendations">
        <h2>Recommended for You</h2>
        <div className="product-grid">
          {products.map((product) => (
            <article key={product.id} className="recommended-product">
              <h3>{product.name}</h3>
              <p className="price">£{(product.price / 100).toFixed(2)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
```

#### Step 3: Define Scenarist Scenarios

**`lib/scenarios-checkout.ts`**
```typescript
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/nextjs-adapter/app';

export const premiumUserCheckoutScenario: ScenaristScenario = {
  id: 'premiumUserCheckout',
  name: 'Premium User Checkout',
  description: 'Premium user with full cart and order history',
  mocks: [
    // User API
    {
      method: 'GET',
      url: 'http://localhost:3002/api/user/user-1',
      response: {
        status: 200,
        body: {
          user: {
            id: 'user-1',
            email: 'premium@example.com',
            firstName: 'Jane',
            lastName: 'Premium',
            tier: 'premium',
          },
        },
      },
    },
    // Cart API
    {
      method: 'GET',
      url: 'http://localhost:3002/api/user/user-1/cart',
      response: {
        status: 200,
        body: {
          cartItems: [
            { id: 'cart-1', productId: 'prod-1', quantity: 2, price: 15000 }, // £150 each
            { id: 'cart-2', productId: 'prod-2', quantity: 1, price: 8000 },  // £80
            { id: 'cart-3', productId: 'prod-3', quantity: 1, price: 12000 }, // £120
          ],
        },
      },
    },
    // Orders API
    {
      method: 'GET',
      url: 'http://localhost:3002/api/user/user-1/orders',
      response: {
        status: 200,
        body: {
          orders: [
            { id: 'order-1', total: 25000, status: 'delivered', createdAt: '2024-01-15T10:00:00Z' },
            { id: 'order-2', total: 18000, status: 'delivered', createdAt: '2024-01-10T14:30:00Z' },
            { id: 'order-3', total: 32000, status: 'shipped', createdAt: '2024-01-05T09:15:00Z' },
            { id: 'order-4', total: 15000, status: 'delivered', createdAt: '2023-12-20T16:45:00Z' },
            { id: 'order-5', total: 28000, status: 'delivered', createdAt: '2023-12-15T11:20:00Z' },
          ],
        },
      },
    },
    // Recommendations API (external)
    {
      method: 'GET',
      url: 'http://localhost:3002/api/recommendations',
      match: {
        headers: { 'x-user-tier': 'premium' },
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: 'rec-1', name: 'Premium Laptop Stand', price: 8000 },
            { id: 'rec-2', name: 'Premium USB-C Hub', price: 12000 },
            { id: 'rec-3', name: 'Premium Desk Mat', price: 5000 },
          ],
        },
      },
    },
  ],
};

export const standardUserCheckoutScenario: ScenaristScenario = {
  id: 'standardUserCheckout',
  name: 'Standard User Checkout (First-Time)',
  description: 'Standard user with minimal cart, no order history',
  mocks: [
    // User API
    {
      method: 'GET',
      url: 'http://localhost:3002/api/user/user-1',
      response: {
        status: 200,
        body: {
          user: {
            id: 'user-1',
            email: 'standard@example.com',
            firstName: 'John',
            lastName: 'Standard',
            tier: 'standard',
          },
        },
      },
    },
    // Cart API
    {
      method: 'GET',
      url: 'http://localhost:3002/api/user/user-1/cart',
      response: {
        status: 200,
        body: {
          cartItems: [
            { id: 'cart-1', productId: 'prod-1', quantity: 1, price: 15000 }, // £150
          ],
        },
      },
    },
    // Orders API (empty)
    {
      method: 'GET',
      url: 'http://localhost:3002/api/user/user-1/orders',
      response: {
        status: 200,
        body: {
          orders: [],
        },
      },
    },
    // Recommendations API (external)
    {
      method: 'GET',
      url: 'http://localhost:3002/api/recommendations',
      match: {
        headers: { 'x-user-tier': 'standard' },
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: 'rec-1', name: 'Basic Mouse Pad', price: 1500 },
            { id: 'rec-2', name: 'Basic Cable Organizer', price: 2000 },
          ],
        },
      },
    },
  ],
};

// Combine with existing scenarios
export const checkoutScenarios = {
  premiumUserCheckout: premiumUserCheckoutScenario,
  standardUserCheckout: standardUserCheckoutScenario,
} as const satisfies ScenaristScenarios;
```

#### Step 4: Write Playwright Tests

**Test Labeling Strategy:**
- Prefix: `[DB-API]` for API Route Abstraction tests
- Prefix: `[DB-TC]` for Testcontainers tests
- Clear scenario names in test descriptions
- Link examples directly from documentation

**`tests/playwright/checkout-api.spec.ts`**
```typescript
import { test, expect } from './fixtures';

test.describe('Checkout Page - API Route Abstraction Approach', () => {
  test('[DB-API] Premium user checkout - shows 20% discount, full cart, order history', async ({ page, switchScenario }) => {
    await switchScenario(page, 'premiumUserCheckout');

    await page.goto('/checkout-api?userId=user-1');

    // User info
    await expect(page.getByRole('heading', { name: 'Welcome, Jane Premium' })).toBeVisible();
    await expect(page.getByText('premium@example.com')).toBeVisible();
    await expect(page.getByText('⭐ Premium Member')).toBeVisible();

    // Cart items (3 items)
    await expect(page.getByRole('heading', { name: 'Your Cart (3 items)' })).toBeVisible();
    await expect(page.getByText('Premium Headphones')).toBeVisible();
    await expect(page.getByText('Wireless Mouse')).toBeVisible();
    await expect(page.getByText('Mechanical Keyboard')).toBeVisible();

    // Pricing with discount
    await expect(page.getByText('Subtotal: £430.00')).toBeVisible(); // (150*2 + 80 + 120)
    await expect(page.getByText('Premium Discount (20%): -£86.00')).toBeVisible();
    await expect(page.getByText('Total: £344.00')).toBeVisible();

    // Order history (5 orders)
    await expect(page.getByRole('heading', { name: 'Order History' })).toBeVisible();
    const orders = page.locator('.order-item');
    await expect(orders).toHaveCount(5);
    await expect(orders.first()).toContainText('delivered');

    // Recommendations (premium)
    await expect(page.getByText('Premium Laptop Stand')).toBeVisible();
    await expect(page.getByText('Premium USB-C Hub')).toBeVisible();
    await expect(page.getByText('Premium Desk Mat')).toBeVisible();
  });

  test('[DB-API] Standard user first-time checkout - no discount, minimal cart, first order message', async ({ page, switchScenario }) => {
    await switchScenario(page, 'standardUserCheckout');

    await page.goto('/checkout-api?userId=user-1');

    // User info
    await expect(page.getByRole('heading', { name: 'Welcome, John Standard' })).toBeVisible();
    await expect(page.getByText('standard@example.com')).toBeVisible();
    await expect(page.getByText('Standard Member')).toBeVisible();

    // Cart items (1 item)
    await expect(page.getByRole('heading', { name: 'Your Cart (1 items)' })).toBeVisible();
    await expect(page.getByText('Premium Headphones')).toBeVisible();

    // Pricing without discount
    await expect(page.getByText('Subtotal: £150.00')).toBeVisible();
    await expect(page.getByText('Premium Discount')).not.toBeVisible();
    await expect(page.getByText('Total: £150.00')).toBeVisible();

    // Order history (empty - first order)
    await expect(page.getByText('This is your first order! 🎉')).toBeVisible();

    // Recommendations (standard)
    await expect(page.getByText('Basic Mouse Pad')).toBeVisible();
    await expect(page.getByText('Basic Cable Organizer')).toBeVisible();
    await expect(page.getByText('Premium Laptop Stand')).not.toBeVisible(); // Premium recs not shown
  });
});
```

### Files Created (PR #1)

```
apps/nextjs-app-router-example/
  app/
    api/
      user/
        [id]/
          route.ts              # User details API
          cart/
            route.ts            # Cart items API
          orders/
            route.ts            # Order history API
      recommendations/
        route.ts                # External recommendations proxy
    checkout-api/
      page.tsx                  # Server Component using API routes
  lib/
    scenarios-checkout.ts       # Checkout scenarios
  tests/
    playwright/
      checkout-api.spec.ts      # Playwright tests (2 tests)
```

### Acceptance Criteria (PR #1)

- ✅ All API routes return correct JSON structure
- ✅ Server Component fetches from all 4 API routes
- ✅ Premium user shows 20% discount
- ✅ Standard user shows no discount
- ✅ Order history displays correctly (5 orders vs. empty state)
- ✅ Recommendations differ by tier (premium vs. standard)
- ✅ Both Playwright tests pass
- ✅ No direct database calls in Server Component
- ✅ All fetches go through localhost API routes

## PR #2: Testcontainers Hybrid Approach

### Objective

Demonstrate testing the SAME checkout functionality but keeping direct database access in the Server Component, using Testcontainers for real database and Scenarist for external APIs.

### Implementation Steps

#### Step 1: Install Dependencies

```bash
cd apps/nextjs-app-router-example
pnpm add -D @testcontainers/postgresql
pnpm add @prisma/client
pnpm add -D prisma
```

#### Step 2: Create Prisma Schema (Already shown above)

Run migrations:
```bash
npx prisma migrate dev --name init
```

#### Step 3: Create Server Component with Direct Database Access

**`app/checkout-db/page.tsx`**
```typescript
import { PrismaClient } from '@prisma/client';
import { scenarist } from '@/lib/scenarist';

const prisma = new PrismaClient();

type Recommendation = {
  id: string;
  name: string;
  price: number;
};

const PRODUCT_NAMES: Record<string, string> = {
  'prod-1': 'Premium Headphones',
  'prod-2': 'Wireless Mouse',
  'prod-3': 'Mechanical Keyboard',
};

export default async function CheckoutDbPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const userId = searchParams.userId || 'user-1';

  // Direct Prisma queries (NOT going through API routes)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // External API call (Scenarist mocks this)
  const recommendationsResponse = await fetch('https://api.recommendations.example.com/products', {
    headers: {
      ...scenarist.getHeaders(),
      'Authorization': `Bearer ${process.env.RECOMMENDATIONS_API_KEY}`,
      'X-User-Tier': user.tier,
    },
  });
  const { products }: { products: Recommendation[] } = await recommendationsResponse.json();

  // Calculate totals (same logic as API route approach)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = user.tier === 'premium' ? Math.floor(subtotal * 0.2) : 0;
  const total = subtotal - discount;

  return (
    <div className="checkout-container">
      <h1>Checkout - Testcontainers Approach</h1>

      {/* Same UI as API route approach */}
      {/* ... (identical to checkout-api/page.tsx UI) ... */}
    </div>
  );
}
```

#### Step 4: Create Database Seeding Helpers

**`tests/helpers/seed-checkout.ts`**
```typescript
import { PrismaClient } from '@prisma/client';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export const seedPremiumUser = async (container: StartedPostgreSqlContainer) => {
  const prisma = new PrismaClient({
    datasources: { db: { url: container.getConnectionUrl() } },
  });

  // Create premium user
  await prisma.user.create({
    data: {
      id: 'user-1',
      email: 'premium@example.com',
      firstName: 'Jane',
      lastName: 'Premium',
      tier: 'premium',
      cartItems: {
        create: [
          { id: 'cart-1', productId: 'prod-1', quantity: 2, price: 15000 },
          { id: 'cart-2', productId: 'prod-2', quantity: 1, price: 8000 },
          { id: 'cart-3', productId: 'prod-3', quantity: 1, price: 12000 },
        ],
      },
      orders: {
        create: [
          { id: 'order-1', total: 25000, status: 'delivered', items: [] },
          { id: 'order-2', total: 18000, status: 'delivered', items: [] },
          { id: 'order-3', total: 32000, status: 'shipped', items: [] },
          { id: 'order-4', total: 15000, status: 'delivered', items: [] },
          { id: 'order-5', total: 28000, status: 'delivered', items: [] },
        ],
      },
    },
  });

  await prisma.$disconnect();
};

export const seedStandardUser = async (container: StartedPostgreSqlContainer) => {
  const prisma = new PrismaClient({
    datasources: { db: { url: container.getConnectionUrl() } },
  });

  // Create standard user (first-time buyer)
  await prisma.user.create({
    data: {
      id: 'user-1',
      email: 'standard@example.com',
      firstName: 'John',
      lastName: 'Standard',
      tier: 'standard',
      cartItems: {
        create: [
          { id: 'cart-1', productId: 'prod-1', quantity: 1, price: 15000 },
        ],
      },
      // No orders (first-time buyer)
    },
  });

  await prisma.$disconnect();
};
```

**`tests/helpers/setup-checkout-db.ts`**
```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

export const createCheckoutTestContainer = async (): Promise<StartedPostgreSqlContainer> => {
  // Start PostgreSQL container (takes 5-30 seconds)
  const container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('checkout_test')
    .withUsername('testuser')
    .withPassword('testpass')
    .start();

  // Set DATABASE_URL for Next.js app
  process.env.DATABASE_URL = container.getConnectionUrl();

  // Run Prisma migrations
  execSync('npx prisma migrate deploy', {
    env: process.env,
    cwd: process.cwd(),
  });

  return container;
};
```

#### Step 5: Write Playwright Tests with Testcontainers

**`tests/playwright/checkout-testcontainers.spec.ts`**
```typescript
import { test, expect } from './fixtures';
import { createCheckoutTestContainer } from '../helpers/setup-checkout-db';
import { seedPremiumUser, seedStandardUser } from '../helpers/seed-checkout';

test.describe('Checkout Page - Testcontainers Hybrid Approach', () => {
  const setup = test.beforeAll(async () => {
    const container = await createCheckoutTestContainer();
    return { container };
  });

  test.afterAll(async () => {
    const { container } = await setup;
    await container.stop();
  });

  test('[DB-TC] Premium user checkout - real DB queries, Scenarist mocks external API only', async ({ page, switchScenario }) => {
    const { container } = await setup;

    // Seed database with premium user data
    await seedPremiumUser(container);

    // Mock external recommendations API with Scenarist
    await switchScenario(page, 'premiumRecommendations');

    await page.goto('/checkout-db?userId=user-1');

    // User info (from real database)
    await expect(page.getByRole('heading', { name: 'Welcome, Jane Premium' })).toBeVisible();
    await expect(page.getByText('premium@example.com')).toBeVisible();
    await expect(page.getByText('⭐ Premium Member')).toBeVisible();

    // Cart items (from real database)
    await expect(page.getByRole('heading', { name: 'Your Cart (3 items)' })).toBeVisible();
    await expect(page.getByText('Premium Headphones')).toBeVisible();
    await expect(page.getByText('Wireless Mouse')).toBeVisible();
    await expect(page.getByText('Mechanical Keyboard')).toBeVisible();

    // Pricing with discount (calculated from real DB data)
    await expect(page.getByText('Subtotal: £430.00')).toBeVisible();
    await expect(page.getByText('Premium Discount (20%): -£86.00')).toBeVisible();
    await expect(page.getByText('Total: £344.00')).toBeVisible();

    // Order history (from real database - 5 orders)
    await expect(page.getByRole('heading', { name: 'Order History' })).toBeVisible();
    const orders = page.locator('.order-item');
    await expect(orders).toHaveCount(5);

    // Recommendations (from Scenarist mock - external API)
    await expect(page.getByText('Premium Laptop Stand')).toBeVisible();
    await expect(page.getByText('Premium USB-C Hub')).toBeVisible();
  });

  test('[DB-TC] Standard user first-time checkout - real DB shows empty order history, Scenarist mocks API', async ({ page, switchScenario }) => {
    const { container } = await setup;

    // Seed database with standard user data
    await seedStandardUser(container);

    // Mock external recommendations API with Scenarist
    await switchScenario(page, 'standardRecommendations');

    await page.goto('/checkout-db?userId=user-1');

    // User info (from real database)
    await expect(page.getByRole('heading', { name: 'Welcome, John Standard' })).toBeVisible();
    await expect(page.getByText('standard@example.com')).toBeVisible();
    await expect(page.getByText('Standard Member')).toBeVisible();

    // Cart items (from real database)
    await expect(page.getByRole('heading', { name: 'Your Cart (1 items)' })).toBeVisible();
    await expect(page.getByText('Premium Headphones')).toBeVisible();

    // Pricing without discount (calculated from real DB data)
    await expect(page.getByText('Subtotal: £150.00')).toBeVisible();
    await expect(page.getByText('Total: £150.00')).toBeVisible();

    // Order history (from real database - empty)
    await expect(page.getByText('This is your first order! 🎉')).toBeVisible();

    // Recommendations (from Scenarist mock - external API)
    await expect(page.getByText('Basic Mouse Pad')).toBeVisible();
    await expect(page.getByText('Basic Cable Organizer')).toBeVisible();
  });
});
```

#### Step 6: Add Recommendation Scenarios

**`lib/scenarios-checkout.ts`** (additional scenarios)
```typescript
export const premiumRecommendationsScenario: ScenaristScenario = {
  id: 'premiumRecommendations',
  name: 'Premium Recommendations',
  description: 'Mock external recommendation API for premium users',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.recommendations.example.com/products',
      match: {
        headers: { 'x-user-tier': 'premium' },
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: 'rec-1', name: 'Premium Laptop Stand', price: 8000 },
            { id: 'rec-2', name: 'Premium USB-C Hub', price: 12000 },
            { id: 'rec-3', name: 'Premium Desk Mat', price: 5000 },
          ],
        },
      },
    },
  ],
};

export const standardRecommendationsScenario: ScenaristScenario = {
  id: 'standardRecommendations',
  name: 'Standard Recommendations',
  description: 'Mock external recommendation API for standard users',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.recommendations.example.com/products',
      match: {
        headers: { 'x-user-tier': 'standard' },
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: 'rec-1', name: 'Basic Mouse Pad', price: 1500 },
            { id: 'rec-2', name: 'Basic Cable Organizer', price: 2000 },
          ],
        },
      },
    },
  ],
};
```

### Files Created (PR #2)

```
apps/nextjs-app-router-example/
  app/
    checkout-db/
      page.tsx                  # Server Component with direct Prisma calls
  prisma/
    schema.prisma               # Database schema
    migrations/                 # Prisma migrations
  tests/
    helpers/
      seed-checkout.ts          # Database seeding functions
      setup-checkout-db.ts      # Testcontainer setup helper
    playwright/
      checkout-testcontainers.spec.ts  # Playwright tests with DB (2 tests)
  lib/
    scenarios-checkout.ts       # Updated with recommendation scenarios
  .env.test                     # Test environment variables
```

### Acceptance Criteria (PR #2)

- ✅ Prisma schema defined and migrations created
- ✅ Server Component uses direct Prisma queries (no API routes)
- ✅ Testcontainer setup creates PostgreSQL container
- ✅ Database seeding functions create realistic test data
- ✅ Premium user test seeds 3 cart items + 5 orders
- ✅ Standard user test seeds 1 cart item + 0 orders
- ✅ Scenarist mocks external recommendations API
- ✅ Both Playwright tests pass
- ✅ Container cleanup happens after tests
- ✅ Tests are idempotent (can run multiple times)

## Comparison Summary

| Aspect | PR #1: API Routes | PR #2: Testcontainers |
|--------|-------------------|----------------------|
| **Code Changes** | Add 4 API routes | Add Prisma schema |
| **Server Component** | Fetches from localhost APIs | Direct Prisma queries |
| **Database** | Mocked via Scenarist | Real PostgreSQL container |
| **Test Setup** | Switch scenarios | Seed database + switch scenarios |
| **Test Speed** | Fast (~500ms per test) | Slower (~10-15s with container startup) |
| **External APIs** | Mocked via Scenarist | Mocked via Scenarist |
| **Production Overhead** | ~5-10ms per request | None |
| **Refactoring Required** | Yes (add API routes) | No |
| **Tests Real Queries** | No | Yes |
| **Parallel Tests** | Easy | Requires multiple containers |

## Implementation Order

### PR #1 (Week 1)
1. Create API routes (4 files)
2. Create Server Component using API routes
3. Define Scenarist scenarios
4. Write Playwright tests
5. Verify all tests pass
6. Update scenarios in lib/scenarist.ts
7. Documentation updates

### PR #2 (Week 2)
1. Install Prisma + Testcontainers
2. Create database schema
3. Run migrations
4. Create Server Component with Prisma
5. Create seeding helpers
6. Create container setup helper
7. Write Playwright tests with DB
8. Verify tests pass and are idempotent
9. Documentation updates

## Success Metrics

**PR #1 Success:**
- ✅ 2 Playwright tests passing
- ✅ 100% Scenarist scenario coverage
- ✅ No direct database calls in Server Component
- ✅ CI/CD build passes
- ✅ Documentation PR submitted

**PR #2 Success:**
- ✅ 2 Playwright tests passing with Testcontainers
- ✅ Real database queries executed
- ✅ Scenarist mocks external API only
- ✅ Tests are idempotent
- ✅ Container cleanup verified
- ✅ CI/CD build passes (with Docker)
- ✅ Documentation PR submitted

## Documentation Updates

### Links to Working Examples

**After PR #1 - Update `/guides/testing-database-apps/api-route-abstraction.mdx`:**

Add "Working Example" section:
```markdown
## Working Example

See a complete working implementation in the Next.js App Router example app:

**Live Code:**
- [Checkout Page (Server Component)](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/app/checkout-api/page.tsx)
- [API Routes](https://github.com/citypaul/scenarist/tree/main/apps/nextjs-app-router-example/app/api/user)
- [Scenarist Scenarios](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/lib/scenarios-checkout.ts)
- [Playwright Tests](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/tests/playwright/checkout-api.spec.ts)

**Test Output:**
```
✓ [DB-API] Premium user checkout - shows 20% discount, full cart, order history (1.2s)
✓ [DB-API] Standard user first-time checkout - no discount, minimal cart, first order message (0.8s)
```

**What This Demonstrates:**
- ✅ Server Component fetches from 4 API routes (user, cart, orders, recommendations)
- ✅ Scenarist mocks all API routes (database + external API)
- ✅ Premium vs. Standard scenarios show different data
- ✅ Tests run in parallel, fast (~1 second each)
- ✅ No real database needed
```

**After PR #2 - Update `/guides/testing-database-apps/testcontainers-hybrid.mdx`:**

Add "Working Example" section:
```markdown
## Working Example

See a complete working implementation in the Next.js App Router example app:

**Live Code:**
- [Checkout Page (Server Component with Prisma)](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/app/checkout-db/page.tsx)
- [Prisma Schema](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/prisma/schema.prisma)
- [Database Seeding Helpers](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/tests/helpers/seed-checkout.ts)
- [Testcontainer Setup](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/tests/helpers/setup-checkout-db.ts)
- [Playwright Tests](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/tests/playwright/checkout-testcontainers.spec.ts)

**Test Output:**
```
✓ [DB-TC] Premium user checkout - real DB queries, Scenarist mocks external API only (12.3s)
✓ [DB-TC] Standard user first-time checkout - real DB shows empty order history, Scenarist mocks API (11.8s)
```

**What This Demonstrates:**
- ✅ Server Component uses direct Prisma queries (no API routes)
- ✅ Real PostgreSQL container with migrations
- ✅ Database seeded with test data (premium vs. standard users)
- ✅ Scenarist mocks ONLY external recommendation API
- ✅ Tests validate real database queries
- ✅ Slower but validates actual SQL behavior
```

### Documentation Structure

**API Route Abstraction Guide:**
```markdown
## Step-by-Step Guide
1. Create API Routes
2. Update Server Component
3. Define Scenarist Scenarios
4. Write Tests

## Working Example ← NEW
[Links to checkout-api implementation]

## Performance Impact
[Existing content]
```

**Testcontainers Hybrid Guide:**
```markdown
## Installation
[Existing content]

## Step-by-Step Implementation
[Existing content]

## Working Example ← NEW
[Links to checkout-db implementation]

## Performance Optimization
[Existing content]
```

### Cross-Reference Updates

**Update `/introduction/why-scenarist.md`:**
```markdown
**If your app uses direct database access:** You have two options:

1. **[API Route Abstraction](/guides/testing-database-apps/api-route-abstraction)** - Add thin HTTP layer ([see working example](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/app/checkout-api/page.tsx))

2. **[Testcontainers Hybrid](/guides/testing-database-apps/testcontainers-hybrid)** - Real database with Scenarist for external APIs ([see working example](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/app/checkout-db/page.tsx))
```

### Screenshots

**After PR #1:**
- Screenshot: `/checkout-api?userId=user-1` showing premium checkout
- Screenshot: Test output showing `[DB-API]` test names
- Add to API Route Abstraction guide

**After PR #2:**
- Screenshot: `/checkout-db?userId=user-1` showing identical UI
- Screenshot: Test output showing `[DB-TC]` test names with longer duration
- Add to Testcontainers Hybrid guide
- Side-by-side comparison showing same UI, different approaches

## Notes

- Both PRs test the SAME user-facing functionality
- UI is identical between approaches
- Demonstrates two valid architectural choices
- Teams can choose based on constraints (refactoring willingness, test speed, database validation needs)
- Both approaches use Scenarist for external APIs
- Clear trade-offs documented for decision-making
