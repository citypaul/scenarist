# Hybrid Testing Strategy: Server Components with Databases and External APIs

**Status:** In Progress
**Created:** 2025-11-18
**Branches:**
- `demo/api-proxy-pattern` (PR #1) - ✅ Complete
- `demo/database-testing-api-route-abstraction` (PR #2) - ✅ Complete (documentation)
- `feature/repository-pattern-example` (PR #3) - Repository Pattern Implementation

### PR #3: Repository Pattern Implementation
**What it demonstrates:** Test ID-isolated database testing using the repository pattern we recommend in documentation

**Example scenario:** Product catalog with user-specific pricing that:
- Abstracts database access behind repository interfaces
- Injects in-memory test implementations with test ID isolation
- Enables parallel test execution without database conflicts
- Complements Scenarist's HTTP mocking

**Value:** Proves the repository pattern works in practice and shows how it integrates with Scenarist

## Critical Realizations

After initial implementation, we discovered a **fundamental architectural constraint**:

**What Scenarist CAN do:**
- ✅ Mock outgoing HTTP requests to external APIs
- ✅ Intercept calls to third-party services
- ✅ Test Server Components that fetch from external services

**What Scenarist CANNOT do:**
- ❌ Mock database queries (they're not HTTP requests)
- ❌ Intercept Prisma/Drizzle/SQL calls directly
- ❌ Replace database integration testing

**The Honest Solution:**
Use the right tool for each job:
- **Scenarist:** Mocks external HTTP APIs
- **Testcontainers:** Provides real databases for integration tests
- **Together:** Complete testing strategy for Next.js Server Components

## Overview

This demonstrates the **honest, complete approach** to testing Next.js Server Components that interact with both databases AND external APIs - the reality of most production apps.

We'll show TWO complementary patterns through separate PRs:

### PR #1: API Proxy Pattern
**What it demonstrates:** Server Components calling external services through API route proxies (where Scenarist shines)

**Example scenario:** E-commerce checkout page that:
- Calls external recommendation service (Scenarist mocks this ✅)
- Calls external shipping calculator (Scenarist mocks this ✅)
- Calls external payment gateway (Scenarist mocks this ✅)

**Value:** Shows Scenarist's sweet spot - mocking third-party HTTP APIs

### PR #2: Hybrid Testing with Testcontainers
**What it demonstrates:** Complete testing strategy for realistic Server Components (databases + external APIs)

**Example scenario:** Same checkout page but realistic:
- Queries user from PostgreSQL via Prisma (Testcontainers provides real DB ✅)
- Queries cart items from PostgreSQL (Testcontainers ✅)
- Calls external recommendation service (Scenarist mocks HTTP API ✅)

**Value:** Shows how to test the full stack honestly

## Why This Matters

Most Next.js apps have a **mixed pattern**:

```typescript
async function CheckoutPage() {
  // Direct database queries - NOT HTTP requests
  const user = await prisma.user.findUnique({ where: { id } });
  const cart = await prisma.cartItem.findMany({ where: { userId } });

  // External API calls - HTTP requests Scenarist can mock
  const recommendations = await fetch('https://api.recommendations.com');
  const shipping = await fetch('https://api.shipping.com/calculate');

  return <CheckoutView user={user} cart={cart} recommendations={recommendations} />;
}
```

**The mistake we almost made:** Trying to force Scenarist to mock databases by creating fake HTTP proxies. This doesn't match reality.

**The honest approach:** Use Testcontainers for database testing, Scenarist for API mocking.

## PR #1: API Proxy Pattern (External Services Only)

**Branch:** `demo/api-proxy-pattern`
**Goal:** Demonstrate Scenarist mocking external services through API route proxies

### User Story

> As a customer checking out, I want to see personalized product recommendations and accurate shipping costs, which come from external third-party services.

**Scope:** NO database queries - only external HTTP APIs

### Page: `/checkout-external`

Server Component that calls multiple external services:

```typescript
// app/checkout-external/page.tsx
import { headers } from 'next/headers';
import { scenarist } from '@/lib/scenarist';

export default async function CheckoutExternalPage({ searchParams }) {
  const { userId } = await searchParams;

  const headersList = await headers();
  const testId = headersList.get(scenarist.config.headers.testId);
  const testHeaders = { [scenarist.config.headers.testId]: testId };

  // All calls go through API routes that proxy external services
  const [userResponse, recsResponse, shippingResponse, paymentResponse] = await Promise.all([
    fetch(`http://localhost:3002/api/external/user/${userId}`, { headers: testHeaders }),
    fetch(`http://localhost:3002/api/external/recommendations?tier=premium`, { headers: testHeaders }),
    fetch(`http://localhost:3002/api/external/shipping/calculate`, {
      method: 'POST',
      headers: { ...testHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: 3, weight: 2.5 })
    }),
    fetch(`http://localhost:3002/api/external/payment/methods/${userId}`, { headers: testHeaders }),
  ]);

  const { user } = await userResponse.json();
  const { products } = await recsResponse.json();
  const { cost, estimatedDays } = await shippingResponse.json();
  const { methods } = await paymentResponse.json();

  return (
    <div className="checkout-container">
      <h1>Checkout - External Services Demo</h1>
      <UserInfo user={user} />
      <Recommendations products={products} />
      <ShippingInfo cost={cost} days={estimatedDays} />
      <PaymentMethods methods={methods} />
    </div>
  );
}
```

### API Routes (Proxy External Services)

```typescript
// app/api/external/user/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const testId = request.headers.get('x-test-id');

  // Proxy to external user service (Scenarist intercepts this)
  const response = await fetch(`https://api.users.example.com/users/${params.id}`, {
    headers: {
      'Authorization': `Bearer ${process.env.USER_SERVICE_API_KEY}`,
      ...(testId && { 'x-test-id': testId }),
    },
  });

  return NextResponse.json(await response.json());
}

// app/api/external/recommendations/route.ts
export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get('tier') || 'standard';
  const testId = request.headers.get('x-test-id');

  // Proxy to external recommendation engine (Scenarist intercepts this)
  const response = await fetch(`https://api.recommendations.example.com/products`, {
    headers: {
      'Authorization': `Bearer ${process.env.RECS_API_KEY}`,
      'X-User-Tier': tier,
      ...(testId && { 'x-test-id': testId }),
    },
  });

  return NextResponse.json(await response.json());
}

// app/api/external/shipping/calculate/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const testId = request.headers.get('x-test-id');

  // Proxy to external shipping calculator (Scenarist intercepts this)
  const response = await fetch(`https://api.shipping.example.com/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SHIPPING_API_KEY}`,
      'Content-Type': 'application/json',
      ...(testId && { 'x-test-id': testId }),
    },
    body: JSON.stringify(body),
  });

  return NextResponse.json(await response.json());
}
```

### Scenarist Scenarios

```typescript
// lib/scenarios-external.ts
export const premiumExternalScenario: ScenaristScenario = {
  id: 'premiumExternal',
  name: 'Premium User - External Services',
  description: 'Premium tier user with personalized recommendations and express shipping',
  mocks: [
    // External user service
    {
      method: 'GET',
      url: 'https://api.users.example.com/users/user-1',
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
    // External recommendation engine
    {
      method: 'GET',
      url: 'https://api.recommendations.example.com/products',
      match: {
        headers: { 'X-User-Tier': 'premium' },
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
    // External shipping calculator
    {
      method: 'POST',
      url: 'https://api.shipping.example.com/calculate',
      response: {
        status: 200,
        body: {
          cost: 0, // Free shipping for premium
          estimatedDays: 1, // Express shipping
        },
      },
    },
    // External payment gateway
    {
      method: 'GET',
      url: 'https://api.payments.example.com/methods/user-1',
      response: {
        status: 200,
        body: {
          methods: [
            { id: 'card-1', type: 'credit', last4: '4242', preferred: true },
            { id: 'card-2', type: 'debit', last4: '5555', preferred: false },
          ],
        },
      },
    },
  ],
};
```

### Test Strategy

```typescript
// tests/playwright/checkout-external.spec.ts
test.describe('Checkout Page - External Services Pattern', () => {
  test('[API-PROXY] Premium user sees personalized recommendations and free shipping', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'premiumExternal');
    await page.goto('/checkout-external?userId=user-1');

    // User info from external service
    await expect(page.getByRole('heading', { name: 'Welcome, Jane Premium' })).toBeVisible();
    await expect(page.getByText('premium@example.com')).toBeVisible();

    // Recommendations from external service
    await expect(page.getByText('Premium Laptop Stand')).toBeVisible();
    await expect(page.getByText('Premium USB-C Hub')).toBeVisible();

    // Shipping from external calculator
    await expect(page.getByText('Free Express Shipping (1 day)')).toBeVisible();

    // Payment methods from external gateway
    await expect(page.getByText('•••• 4242')).toBeVisible();
    await expect(page.getByText('Preferred')).toBeVisible();
  });

  test('[API-PROXY] Standard user sees basic recommendations and standard shipping', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'standardExternal');
    await page.goto('/checkout-external?userId=user-2');

    // Different responses from external services
    await expect(page.getByText('Basic Mouse Pad')).toBeVisible();
    await expect(page.getByText('Standard Shipping: £5.99 (3-5 days)')).toBeVisible();
  });
});
```

### What This Demonstrates

✅ **Scenarist's sweet spot:** Mocking external HTTP APIs
✅ **API routes as proxies:** Common pattern for wrapping third-party services
✅ **Test ID isolation:** Multiple tests running in parallel with different mocks
✅ **Real-world pattern:** How production apps call external services

❌ **NOT shown:** Database testing (that's PR #2)

## PR #2: Hybrid Testing (Testcontainers + Scenarist)

**Branch:** `demo/hybrid-testing`
**Goal:** Demonstrate complete testing strategy for realistic Server Components

### User Story

> As a customer checking out, I want to see my cart items from the database AND personalized recommendations from an external service.

**Scope:** Realistic mix of database queries + external API calls

### Page: `/checkout-hybrid`

```typescript
// app/checkout-hybrid/page.tsx
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { scenarist } from '@/lib/scenarist';

export default async function CheckoutHybridPage({ searchParams }) {
  const { userId } = await searchParams;

  // Database queries (NOT mocked by Scenarist - tested with Testcontainers)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // External API call (Scenarist mocks this)
  const headersList = await headers();
  const testId = headersList.get(scenarist.config.headers.testId);
  const recommendationsResponse = await fetch('https://api.recommendations.example.com/products', {
    headers: {
      'Authorization': `Bearer ${process.env.RECS_API_KEY}`,
      'X-User-Tier': user.tier,
      ...(testId && { 'x-test-id': testId }),
    },
  });
  const { products } = await recommendationsResponse.json();

  return (
    <div className="checkout-container">
      <UserInfo user={user} />              {/* From database */}
      <Cart items={cartItems} />            {/* From database */}
      <OrderHistory orders={orders} />      {/* From database */}
      <Recommendations products={products} /> {/* From external API */}
    </div>
  );
}
```

### Test Strategy (Hybrid)

```typescript
// tests/playwright/checkout-hybrid.spec.ts
import { test, expect } from '@playwright/test';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';

let postgresContainer: PostgreSqlContainer;
let prisma: PrismaClient;

test.beforeAll(async () => {
  // Start real PostgreSQL with Testcontainers
  postgresContainer = await new PostgreSqlContainer().start();

  // Connect Prisma to test database
  prisma = new PrismaClient({
    datasources: {
      db: { url: postgresContainer.getConnectionUri() },
    },
  });

  // Run migrations
  await prisma.$executeRaw`CREATE TABLE users ...`;
  await prisma.$executeRaw`CREATE TABLE cart_items ...`;
});

test.afterAll(async () => {
  await prisma.$disconnect();
  await postgresContainer.stop();
});

test.describe('Checkout Page - Hybrid Testing', () => {
  test('[HYBRID] Premium user with full cart and recommendations', async ({ page, switchScenario }) => {
    // 1. Set up database with Testcontainers (real PostgreSQL)
    await prisma.user.create({
      data: {
        id: 'user-1',
        email: 'premium@example.com',
        firstName: 'Jane',
        lastName: 'Premium',
        tier: 'premium',
      },
    });

    await prisma.cartItem.createMany({
      data: [
        { id: 'cart-1', userId: 'user-1', productId: 'prod-1', quantity: 2 },
        { id: 'cart-2', userId: 'user-1', productId: 'prod-2', quantity: 1 },
      ],
    });

    await prisma.order.createMany({
      data: [
        { id: 'order-1', userId: 'user-1', total: 25000, status: 'delivered' },
        { id: 'order-2', userId: 'user-1', total: 18000, status: 'delivered' },
      ],
    });

    // 2. Mock external API with Scenarist
    await switchScenario(page, 'premiumRecommendations');

    // 3. Test the page (database + external API)
    await page.goto('/checkout-hybrid?userId=user-1');

    // Verify database content
    await expect(page.getByText('Jane Premium')).toBeVisible();
    await expect(page.getByText('2 items in cart')).toBeVisible();
    await expect(page.getByText('2 previous orders')).toBeVisible();

    // Verify external API content (mocked by Scenarist)
    await expect(page.getByText('Premium Laptop Stand')).toBeVisible();
  });
});
```

### What This Demonstrates

✅ **Complete testing strategy:** Database (Testcontainers) + External APIs (Scenarist)
✅ **Realistic Next.js pattern:** Mix of Prisma queries and fetch calls
✅ **Honest approach:** Using the right tool for each job
✅ **Production-ready:** Matches how real apps are built

## PR #3: Repository Pattern Implementation

**Branch:** `feature/repository-pattern-example`
**Goal:** Demonstrate the repository pattern we recommend in documentation, showing test ID isolation for database access

### User Story

> As a developer, I want to see a working implementation of the repository pattern that enables parallel database tests with test ID isolation.

**Scope:** Repository interfaces, in-memory test implementations, and integration with Scenarist

### Why Repository Pattern

The repository pattern solves the fundamental database testing problem:

**Problem:** Databases have no equivalent to HTTP's test ID header. Without isolation, parallel tests corrupt each other's data.

**Solution:** Abstract database access behind interfaces and inject test implementations that partition data by test ID—the same isolation model as Scenarist's HTTP mocking.

### Repository Interface

```typescript
// lib/repositories/user-repository.ts
export type User = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly tier: 'standard' | 'premium';
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<User>;
}
```

### Production Implementation

```typescript
// lib/repositories/prisma-user-repository.ts
import { PrismaClient } from '@prisma/client';
import type { UserRepository, User } from './user-repository';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    return user ? this.toUser(user) : null;
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return this.toUser(user);
  }

  private toUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      tier: prismaUser.tier,
    };
  }
}
```

### Test Implementation with Test ID Isolation

```typescript
// lib/repositories/in-memory-user-repository.ts
import type { UserRepository, User } from './user-repository';

export class InMemoryUserRepository implements UserRepository {
  // Map<testId, Map<userId, User>>
  private store = new Map<string, Map<string, User>>();
  private idCounter = new Map<string, number>();

  constructor(private getTestId: () => string) {}

  private getTestStore(): Map<string, User> {
    const testId = this.getTestId();
    if (!this.store.has(testId)) {
      this.store.set(testId, new Map());
      this.idCounter.set(testId, 0);
    }
    return this.store.get(testId)!;
  }

  private generateId(): string {
    const testId = this.getTestId();
    const counter = (this.idCounter.get(testId) ?? 0) + 1;
    this.idCounter.set(testId, counter);
    return `user-${counter}`;
  }

  async findById(id: string): Promise<User | null> {
    return this.getTestStore().get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.getTestStore().values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      id: this.generateId(),
      ...data,
    };
    this.getTestStore().set(user.id, user);
    return user;
  }
}
```

### Dependency Injection Container

```typescript
// lib/container.ts
import { AsyncLocalStorage } from 'node:async_hooks';
import type { UserRepository } from './repositories/user-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { InMemoryUserRepository } from './repositories/in-memory-user-repository';
import { prisma } from './prisma';

// AsyncLocalStorage carries test ID through async request lifecycle
const testIdStorage = new AsyncLocalStorage<string>();

export const getTestId = (): string => {
  return testIdStorage.getStore() ?? 'default-test';
};

export const runWithTestId = <T>(testId: string, fn: () => T): T => {
  return testIdStorage.run(testId, fn);
};

// Create repositories based on environment
export const createRepositories = (): { userRepository: UserRepository } => {
  const isTest = process.env.NODE_ENV === 'test';

  const userRepository: UserRepository = isTest
    ? new InMemoryUserRepository(getTestId)
    : new PrismaUserRepository(prisma);

  return { userRepository };
};
```

### Middleware to Extract Test ID

```typescript
// middleware.ts (Next.js middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runWithTestId } from './lib/container';

export function middleware(request: NextRequest) {
  const testId = request.headers.get('x-test-id') ?? 'default-test';

  // Store test ID for downstream use
  const response = NextResponse.next();
  response.headers.set('x-test-id-internal', testId);

  return response;
}
```

### Page Using Repository

```typescript
// app/products-repo/page.tsx
import { headers } from 'next/headers';
import { createRepositories } from '@/lib/container';
import { scenarist } from '@/lib/scenarist';

export default async function ProductsRepoPage() {
  const headersList = await headers();
  const testId = headersList.get(scenarist.config.headers.testId) ?? 'default-test';

  // Get repository (in-memory in test mode, Prisma in production)
  const { userRepository } = createRepositories();

  // Database query (uses test ID isolation in test mode)
  const user = await userRepository.findById('user-1');

  // External API call (Scenarist mocks this)
  const productsResponse = await fetch('http://localhost:3001/products', {
    headers: {
      'x-test-id': testId,
      'x-user-tier': user?.tier ?? 'standard',
    },
  });
  const { products } = await productsResponse.json();

  return (
    <div>
      <h1>Products for {user?.name ?? 'Guest'}</h1>
      <p>Tier: {user?.tier ?? 'standard'}</p>
      <ul>
        {products.map((product: any) => (
          <li key={product.id}>
            {product.name} - £{(product.price / 100).toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### API Route for Test Data Setup

```typescript
// app/api/test/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRepositories, runWithTestId } from '@/lib/container';

// Only available in test mode
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const testId = request.headers.get('x-test-id') ?? 'default-test';
  const userData = await request.json();

  const user = await runWithTestId(testId, async () => {
    const { userRepository } = createRepositories();
    return userRepository.create(userData);
  });

  return NextResponse.json({ user });
}
```

### Playwright Tests

```typescript
// tests/playwright/products-repo.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Products with Repository Pattern', () => {
  test('should show premium pricing for premium user', async ({ page, switchScenario }) => {
    // 1. Switch to premium scenario (Scenarist mocks external API)
    const testId = await switchScenario(page, 'premiumUser');

    // 2. Set up test data via API route (uses in-memory repository)
    await page.request.post('http://localhost:3002/api/test/users', {
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      data: {
        email: 'premium@example.com',
        name: 'Premium User',
        tier: 'premium',
      },
    });

    // 3. Navigate to page
    await page.goto('/products-repo');

    // 4. Verify user from repository
    await expect(page.getByText('Products for Premium User')).toBeVisible();
    await expect(page.getByText('Tier: premium')).toBeVisible();

    // 5. Verify products from Scenarist mock
    await expect(page.getByText('£99.99')).toBeVisible(); // Premium pricing
  });

  test('should show standard pricing for standard user', async ({ page, switchScenario }) => {
    const testId = await switchScenario(page, 'standardUser');

    await page.request.post('http://localhost:3002/api/test/users', {
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      data: {
        email: 'standard@example.com',
        name: 'Standard User',
        tier: 'standard',
      },
    });

    await page.goto('/products-repo');

    await expect(page.getByText('Products for Standard User')).toBeVisible();
    await expect(page.getByText('Tier: standard')).toBeVisible();
    await expect(page.getByText('£149.99')).toBeVisible(); // Standard pricing
  });

  // These tests run in PARALLEL with full isolation:
  // - Test A (x-test-id: abc-123) → repository uses store['abc-123']
  // - Test B (x-test-id: def-456) → repository uses store['def-456']
  // - Same user ID in different tests → no conflict
});
```

### What This Demonstrates

✅ **Test ID isolation:** Repository partitions data by test ID (same pattern as Scenarist)
✅ **True parallelism:** Tests run concurrently without database conflicts
✅ **In-memory speed:** No database round-trips during tests
✅ **Clean architecture:** Repository pattern benefits beyond testing
✅ **Scenarist integration:** Repository + HTTP mocking working together
✅ **Practical example:** Shows the pattern we recommend in documentation

### Files to Create

1. `lib/repositories/user-repository.ts` - Interface definition
2. `lib/repositories/prisma-user-repository.ts` - Production implementation
3. `lib/repositories/in-memory-user-repository.ts` - Test implementation
4. `lib/container.ts` - Dependency injection container
5. `app/products-repo/page.tsx` - Page using repository
6. `app/api/test/users/route.ts` - Test data setup endpoint
7. `tests/playwright/products-repo.spec.ts` - Playwright tests

## Test Labeling Strategy

### PR #1: API Proxy Pattern
- Prefix: `[API-PROXY]`
- Example: `[API-PROXY] Premium user sees personalized recommendations and free shipping`
- Focus: External service mocking only

### PR #2: Hybrid Testing
- Prefix: `[HYBRID]`
- Example: `[HYBRID] Premium user with full cart and recommendations`
- Focus: Complete testing strategy (DB + APIs)

### PR #3: Repository Pattern
- Prefix: `[REPO]`
- Example: `[REPO] Premium user from repository with premium pricing from Scenarist`
- Focus: Test ID isolation for database access

## Documentation Updates

### External Docs (apps/docs)

#### 1. Landing Page (`src/content/docs/index.mdx`)

Add prominent "What Scenarist Is (and Isn't)" section:

```mdx
## What Scenarist Does

✅ **Mocks external HTTP APIs** - Third-party services, microservices, REST APIs
✅ **Test Server Components** - Next.js App Router, Server Actions
✅ **Parallel test execution** - Each test gets isolated scenarios
✅ **Runtime scenario switching** - No app restarts needed

## What Scenarist Does NOT Do

❌ **Mock databases** - Use Testcontainers, Prisma mocks, or real test databases
❌ **Replace integration testing** - Complements it for external API calls
❌ **Mock internal functions** - Only intercepts outgoing HTTP requests

## When to Use Scenarist

**Perfect for:**
- Server Components calling third-party APIs
- Testing different API responses (success, error, timeout)
- Microservice integration testing
- API rate limiting scenarios

**Not suitable for:**
- Database query testing (use Testcontainers instead)
- Unit testing pure functions (use Vitest/Jest)
- Mocking non-HTTP dependencies

**Best approach:**
Combine Scenarist (external APIs) + Testcontainers (databases) for complete Server Component testing.
```

#### 2. Database Testing Guide (`guides/testing-database-apps/`)

Rename and restructure:
- **Old:** `api-route-abstraction.mdx`
- **New:** `hybrid-testing-strategy.mdx`

```mdx
---
title: Hybrid Testing Strategy for Server Components
description: Combine Testcontainers (databases) and Scenarist (external APIs) for complete testing
---

# Hybrid Testing Strategy

Most Next.js Server Components interact with **both** databases and external APIs. Here's how to test them completely.

## The Reality

```typescript
async function CheckoutPage() {
  // Database queries (NOT HTTP requests)
  const user = await prisma.user.findUnique({ where: { id } });
  const cart = await prisma.cartItem.findMany({ where: { userId } });

  // External API calls (HTTP requests)
  const recommendations = await fetch('https://api.recommendations.com');

  return <div>...</div>;
}
```

## The Complete Solution

| What to Test | Tool to Use | Why |
|--------------|-------------|-----|
| Database queries | Testcontainers | Provides real PostgreSQL/MySQL |
| External APIs | Scenarist | Mocks HTTP requests |

## Working Example

See our [hybrid testing demo](https://github.com/citypaul/scenarist/blob/main/apps/nextjs-app-router-example/app/checkout-hybrid/page.tsx) showing:
- Database queries with Testcontainers
- External API mocking with Scenarist
- Complete test coverage

[Full guide continues...]
```

#### 3. Update All References

Search and replace:
- "Test database-heavy Server Components" → "Test Server Components calling external APIs"
- "API Route Abstraction for databases" → "API Route Proxies for external services"
- Any claims that Scenarist can mock databases directly

### Internal Docs

#### Update `docs/core-functionality.md`

Add scope section:

```markdown
## Scenarist's Scope

Scenarist intercepts **outgoing HTTP requests** made by your application. This includes:

- ✅ Calls to external APIs (`fetch('https://api.example.com')`)
- ✅ Third-party service requests
- ✅ Microservice communication
- ✅ Any HTTP/HTTPS request leaving your app

Scenarist does NOT intercept:

- ❌ Database queries (use Testcontainers, Prisma mocks, or real test DBs)
- ❌ File system operations
- ❌ Internal function calls
- ❌ WebSocket connections (planned for future)
```

## GitHub Issue Update

Update the original issue that prompted this work with:

```markdown
## Update: Architectural Constraint Discovered

After implementation, we discovered that the "API Route Abstraction for databases" pattern is fundamentally flawed.

### The Constraint

**Scenarist mocks outgoing HTTP requests.** Databases don't use HTTP.

Any attempt to "mock databases with Scenarist" requires:
1. Making fake HTTP calls (doesn't match real apps)
2. Building a non-HTTP mocking system (out of scope)
3. Mixing test code into production (bad practice)

### The Honest Solution

Use the right tool for each job:
- **Testcontainers:** Real databases for integration testing
- **Scenarist:** External HTTP API mocking
- **Together:** Complete testing strategy

### Updated Plan

We're proceeding with a **hybrid testing demonstration** showing:

**PR #1:** API Proxy Pattern - Server Components calling external services (Scenarist's sweet spot)
**PR #2:** Hybrid Testing - Testcontainers (DB) + Scenarist (APIs) working together

This is MORE valuable to users because it:
- ✅ Shows Scenarist's actual strengths
- ✅ Provides a complete testing strategy
- ✅ Matches real-world Next.js patterns
- ✅ Is honest about scope and limitations

### Documentation Updates

All docs (internal and external) will be updated to:
- Clearly state what Scenarist is and is NOT
- Show the hybrid approach as the recommended pattern
- Remove any misleading claims about database mocking
```

## Success Criteria

### PR #1: API Proxy Pattern
- [ ] Working `/checkout-external` page
- [ ] 4 API routes proxying external services
- [ ] 2+ Scenarist scenarios (premium, standard)
- [ ] Playwright tests passing with `[API-PROXY]` labels
- [ ] No database queries (external services only)
- [ ] Clear documentation showing the pattern

### PR #2: Hybrid Testing
- [ ] Working `/checkout-hybrid` page
- [ ] Testcontainers setup in `beforeAll()`
- [ ] Real Prisma queries for user/cart/orders
- [ ] Scenarist mocking for recommendations API
- [ ] Playwright tests passing with `[HYBRID]` labels
- [ ] Documentation showing complete strategy

### PR #3: Repository Pattern
- [ ] Working `/products-repo` page
- [ ] UserRepository interface defined
- [ ] PrismaUserRepository production implementation
- [ ] InMemoryUserRepository test implementation with test ID isolation
- [ ] Container with dependency injection
- [ ] API route for test data setup
- [ ] Playwright tests passing with `[REPO]` labels
- [ ] Tests demonstrate parallel execution without conflicts
- [ ] Integration with Scenarist for HTTP mocking

### Documentation
- [ ] Landing page has "What Scenarist Is (and Isn't)" section
- [ ] Database guide renamed to "Hybrid Testing Strategy"
- [ ] All references to "database mocking" corrected
- [ ] GitHub issue updated with findings
- [ ] CLAUDE.md updated with architectural learnings

## Timeline

- **PR #1 (API Proxy):** ✅ Complete
- **PR #2 (Hybrid):** ✅ Complete (documentation)
- **PR #3 (Repository Pattern):** Current session - demonstrate the recommended pattern
- **Docs updates:** Complete with PR #1
- **Issue update:** Complete with PR #1

## Key Learnings to Document in CLAUDE.md

1. **MSW's fundamental constraint:** Only intercepts HTTP requests
2. **The database mocking trap:** Trying to force non-HTTP mocking leads to fake patterns
3. **The honest approach:** Combine tools - Testcontainers + Scenarist
4. **Scope clarity:** Being explicit about what a tool does/doesn't do builds trust
5. **Value in honesty:** The hybrid approach is MORE valuable than a compromised solution
