# Scenarist Next.js App Router Example

> E-commerce example demonstrating Scenarist usage with Next.js App Router

## Status

✅ **Phase 9 Complete** - Full e-commerce implementation with all Scenarist features demonstrated.

## What This Example Demonstrates

This app showcases Scenarist's complete feature set with Next.js App Router:

- ✅ **Product Catalog** - Browse products with tier-based pricing (request matching)
- ✅ **Shopping Cart** - Add items with state management (stateful mocks)
- ✅ **Route Handler Testing** - Test Next.js Route Handlers with MSW integration
- ✅ **Scenario-Based Browser Testing** - Full browser testing with Playwright and scenario switching
- ✅ **Test ID Isolation** - Run multiple tests concurrently with independent scenarios
- ✅ **Runtime Scenario Switching** - Change backend behavior without app restart
- ✅ **Request Content Matching** - Dynamic responses based on headers (tier: standard/premium)
- ✅ **Stateful Mocks** - Cart state persistence across requests
- ✅ **Playwright Helpers** - Type-safe scenario management with `withScenarios()`

## Installation

This example app is part of the Scenarist monorepo. For external projects, install the Next.js adapter and MSW:

```bash
npm install @scenarist/nextjs-adapter msw
# or
pnpm add @scenarist/nextjs-adapter msw
# or
yarn add @scenarist/nextjs-adapter msw
```

**Note:** MSW is a required peer dependency. The Next.js adapter re-exports all necessary types including `ScenaristScenario`, `ScenaristMock`, etc.

**Important:** When using the App Router, import from the `/app` subpath:

```typescript
import type { ScenaristScenario } from "@scenarist/nextjs-adapter/app";
import { createScenarist } from "@scenarist/nextjs-adapter/app";
```

## Getting Started

```bash
# Install dependencies (from workspace root)
pnpm install

# Run development server (port 3002)
pnpm --filter=@scenarist/nextjs-app-router-example dev

# Run all tests (E2E + API)
pnpm --filter=@scenarist/nextjs-app-router-example test

# Run E2E tests only
pnpm --filter=@scenarist/nextjs-app-router-example test:e2e

# Run E2E tests with UI
pnpm --filter=@scenarist/nextjs-app-router-example test:e2e:ui

# Run API tests only
pnpm --filter=@scenarist/nextjs-app-router-example test:api

# Type checking
pnpm --filter=@scenarist/nextjs-app-router-example typecheck

# Linting
pnpm --filter=@scenarist/nextjs-app-router-example lint

# Build for production
pnpm --filter=@scenarist/nextjs-app-router-example build
```

## Debugging with Logs

Scenarist includes comprehensive logging to help you understand scenario matching, state management, and request handling.

### Enable Logging

```bash
# Run tests with Scenarist logs visible
pnpm test:logs

# Run dev server with logs
pnpm dev:logs
```

### What You'll See

With logging enabled, you'll see detailed output for:

- **Scenario events**: When scenarios are registered, switched, or cleared
- **Mock matching**: Which mocks were evaluated, their specificity scores, and which one was selected
- **State management**: State capture and injection for stateful mocks (like shopping cart)
- **Sequences**: Position tracking for response sequences

Example output:

```
09:49:09.713 INF [test-shopping-cart] 🎬 scenario   scenario_switched scenarioId="shoppingCart"
09:49:09.715 DBG [test-shopping-cart] 🎯 matching   mock_candidates_found candidateCount=3 url="/cart/add" method="POST"
09:49:09.716 INF [test-shopping-cart] 💾 state      state_captured key="items[]" pathExpression="body.productId"
```

### Learn More About Logging

- [Logging Reference](https://scenarist.dev/reference/logging) - Full logging configuration options
- [Log Levels & Categories](https://scenarist.dev/reference/logging#log-levels) - Understanding log levels and filtering

## Project Structure

```
apps/nextjs-app-router-example/
├── app/                    # Next.js App Router structure
│   ├── page.tsx           # Home page / product catalog
│   ├── cart/              # Shopping cart page
│   │   └── page.tsx
│   ├── layout.tsx         # Root layout
│   └── api/               # Route Handlers (App Router API routes)
│       ├── __scenario__/  # Scenarist scenario endpoint
│       │   └── route.ts
│       ├── products/      # Products API
│       │   └── route.ts
│       ├── cart/          # Cart GET endpoint
│       │   └── route.ts
│       └── cart/add/      # Cart POST endpoint
│           └── route.ts
├── components/            # React components
│   ├── ProductCard.tsx    # Product display with tier-specific pricing
│   └── TierSelector.tsx   # Tier selection UI (header-based)
├── lib/                   # Application logic
│   ├── scenarist.ts       # Scenarist setup with auto-start
│   └── scenarios.ts       # Scenario definitions
├── data/                  # Mock data
│   └── products.ts        # Product data builder
├── types/                 # TypeScript types
│   └── product.ts         # Domain types
├── tests/
│   ├── playwright/        # Playwright E2E tests
│   │   ├── smoke.spec.ts
│   │   ├── scenario-switching.spec.ts
│   │   ├── products.spec.ts
│   │   ├── products.baseline.spec.ts
│   │   └── shopping-cart.spec.ts
│   └── api/               # Vitest API route tests
│       └── placeholder.test.ts
├── public/                # Static assets
└── tsconfig.json          # TypeScript configuration (strict mode)
```

## Key App Router Differences

This example uses **Next.js App Router** (Next.js 13+). Key differences from Pages Router:

### 1. Directory Structure

| Aspect         | App Router                             | Pages Router                         |
| -------------- | -------------------------------------- | ------------------------------------ |
| **Routing**    | `app/` directory with `page.tsx` files | `pages/` directory with `.tsx` files |
| **API Routes** | Route Handlers in `app/api/*/route.ts` | API routes in `pages/api/*.ts`       |
| **Layouts**    | `layout.tsx` files for nested layouts  | `_app.tsx` and `_document.tsx`       |
| **Components** | Server Components by default           | Client Components by default         |

### 2. Route Handler Pattern

**App Router (Route Handlers):**

```typescript
// app/api/products/route.ts
import { NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

export async function GET(request: Request) {
  const response = await fetch("http://localhost:3001/products", {
    headers: {
      ...getScenaristHeaders(request), // Extract test ID
      "x-user-tier": request.headers.get("x-user-tier") || "standard",
    },
  });
  const data = await response.json();
  return NextResponse.json({ products: data });
}
```

**Pages Router (API Routes):**

```typescript
// pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const response = await fetch("http://localhost:3001/products", {
    headers: {
      ...getScenaristHeaders(req), // Extract test ID
      "x-user-tier": req.headers["x-user-tier"] || "standard",
    },
  });
  const data = await response.json();
  res.json({ products: data });
}
```

### 3. Component Patterns

**App Router:**

- Server Components by default (can fetch data directly)
- Client Components with `'use client'` directive
- Async components supported

**Pages Router:**

- Client Components by default
- Data fetching via `getServerSideProps` or `getStaticProps`
- No async components

### 4. Import Paths

```typescript
// App Router
import { createScenarist } from "@scenarist/nextjs-adapter/app";

// Pages Router
import { createScenarist } from "@scenarist/nextjs-adapter/pages";
```

## Scenarist Integration

### Setup (`lib/scenarist.ts`)

```typescript
import { createScenarist } from "@scenarist/nextjs-adapter/app";
import { scenarios } from "./scenarios";

const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios,
  defaultScenarioId: "default",
  strictMode: false,
});

// Auto-start in test environment (server-side MSW)
if (typeof window === "undefined" && scenarist.config.enabled) {
  scenarist.start();
}

export { scenarist };
```

### Scenario Definitions (`lib/scenarios.ts`)

Demonstrates all three Scenarist features:

```typescript
import type { ScenaristScenarios } from "@scenarist/nextjs-adapter/app";

export const scenarios = {
  // Phase 1: Request Content Matching (tier-based pricing)
  premiumUser: {
    id: "premiumUser",
    name: "Premium User Scenario",
    mocks: [
      {
        method: "GET",
        url: "http://localhost:3001/products",
        match: {
          headers: { "x-user-tier": "premium" }, // Only matches premium tier
        },
        response: {
          status: 200,
          body: buildProducts("premium"), // Different prices for premium
        },
      },
    ],
  },

  // Phase 3: Stateful Mocks (shopping cart)
  shoppingCart: {
    id: "shoppingCart",
    name: "Shopping Cart Scenario",
    mocks: [
      {
        method: "POST",
        url: "http://localhost:3001/cart/add",
        captureState: {
          "items[]": "body.productId", // Append to array
        },
        response: { status: 200, body: { success: true } },
      },
      {
        method: "GET",
        url: "http://localhost:3001/cart",
        response: {
          status: 200,
          body: {
            items: "{{state.items}}", // Inject captured state
            count: "{{state.items.length}}",
          },
        },
      },
    ],
  },
} as const satisfies ScenaristScenarios;
```

### Route Handler Usage

```typescript
// app/api/products/route.ts
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

export async function GET(request: Request) {
  const response = await fetch("http://localhost:3001/products", {
    headers: {
      ...getScenaristHeaders(request), // Extract test ID
      "x-user-tier": request.headers.get("x-user-tier") || "standard",
    },
  });
  const data = await response.json();
  return NextResponse.json({ products: data });
}
```

## Testing

This example uses a **dual testing strategy**:

### E2E Tests (Playwright)

Browser-based tests that verify the full application flow:

```bash
pnpm test:e2e
```

- Located in `tests/playwright/`
- Runs in real browsers (Chromium)
- Tests user interactions and full page loads
- Configured in `playwright.config.ts`

**Example Tests:**

- `smoke.spec.ts` - Basic app functionality
- `scenario-switching.spec.ts` - Scenarist scenario management
- `products.spec.ts` - Tier-based pricing (request matching)
- `products.baseline.spec.ts` - Baseline tests without Scenarist
- `shopping-cart.spec.ts` - Cart state management (stateful mocks)

**Playwright Helpers:**

```typescript
// tests/fixtures.ts
import { withScenarios, expect } from "@scenarist/playwright-helpers";
import { scenarios } from "../lib/scenarios";

export const test = withScenarios(scenarios);
export { expect };
```

```typescript
// tests/my-test.spec.ts
import { test, expect } from "./fixtures";

test("premium user sees premium pricing", async ({ page, switchScenario }) => {
  await switchScenario(page, "premiumUser"); // Type-safe scenario ID
  await page.goto("/");
  // Test premium pricing...
});
```

### API Tests (Vitest)

Fast unit/integration tests for Route Handlers:

```bash
pnpm test:api
```

- Located in `tests/api/`
- Fast execution with jsdom
- Tests Route Handler logic directly
- Configured in `vitest.config.ts`

### Baseline Tests

Comparison tests that run without Scenarist to demonstrate value:

```bash
pnpm test:e2e:all  # Includes baseline project
```

- Separate Playwright project (`comparison`)
- Runs with `SKIP_MSW=true` to disable mocking
- Tests against real json-server backend
- Demonstrates Scenarist's benefits

See [TESTING.md](./TESTING.md) for complete testing philosophy and coverage strategy.

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Runtime:** React 18
- **E2E Testing:** Playwright
- **Unit Testing:** Vitest + jsdom
- **Type Safety:** TypeScript strict mode
- **Styling:** Tailwind CSS
- **API Mocking:** MSW (Mock Service Worker)
- **Scenario Management:** Scenarist
- **Test Helpers:** @scenarist/playwright-helpers

## TypeScript Strict Mode

This example enforces **full TypeScript strict mode** with all flags explicitly enabled:

- ✅ `strict: true`
- ✅ `noImplicitAny: true`
- ✅ `strictNullChecks: true`
- ✅ `noUnusedLocals: true`
- ✅ `noUnusedParameters: true`
- ✅ `noImplicitReturns: true`
- ✅ `noFallthroughCasesInSwitch: true`

See `tsconfig.json` for complete configuration.

## Current Test Results

**Phase 9 Complete:**

- ✅ 7 Playwright E2E tests passing
- ✅ 1 Vitest API test passing
- ✅ TypeScript: 0 errors
- ✅ Build: Successful
- ✅ All Scenarist features demonstrated

**Test Breakdown:**

- Smoke tests: 1 passing
- Scenario switching: 2 passing (verbose + helper)
- Product catalog: 2 passing (standard + premium tiers)
- Shopping cart: 2 passing (add items + state persistence)
- Baseline comparison: 2 passing

## Implementation Phases

### Phase 0: Infrastructure Setup ✅ COMPLETE

- ✅ Next.js App Router scaffolding
- ✅ Playwright configuration
- ✅ Vitest configuration
- ✅ TypeScript strict mode
- ✅ Smoke tests passing

### Phase 1: Product Catalog ✅ COMPLETE

- ✅ Product listing page with Server Components
- ✅ Scenarist integration with auto-start
- ✅ Request content matching (tier-based pricing)
- ✅ Playwright tests with type-safe helpers
- ✅ Baseline comparison tests

### Phase 3: Shopping Cart ✅ COMPLETE

- ✅ Shopping cart page
- ✅ Stateful mocks (cart state capture/injection)
- ✅ Add to cart functionality
- ✅ E2E tests verifying state persistence
- ✅ Product aggregation display

## Key Learnings

### App Router Auto-Start Pattern

Server-side MSW must start automatically in test environment:

```typescript
// lib/scenarist.ts
if (typeof window === "undefined" && scenarist.config.enabled) {
  scenarist.start(); // Starts MSW server on first import
}
```

This ensures MSW intercepts Route Handler fetch calls without manual setup.

### Server Components and Data Fetching

App Router pages are Server Components by default - they can fetch data directly:

```typescript
// app/page.tsx (Server Component)
export default async function Home() {
  const response = await fetch('http://localhost:3002/api/products', {
    headers: { 'x-user-tier': 'standard' },
  });
  const { products } = await response.json();

  return <ProductList products={products} />;
}
```

No `useEffect` or client-side fetching needed for initial page load.

### Route Handler Request Types

App Router uses Web `Request` objects, not Next.js-specific types:

```typescript
// Different from Pages Router NextApiRequest
export async function GET(request: Request) {
  const tier = request.headers.get("x-user-tier"); // .get(), not array access
  // ...
}
```

### Helper Function Best Practices

**For Route Handlers** - use `getScenaristHeaders(request)`:

```typescript
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

// In your route handler: export async function GET(request: Request)
const scenaristHeaders = getScenaristHeaders(request);
// Returns: { 'x-scenarist-test-id': '...' }
```

**For Server Components** - use `getScenaristHeadersFromReadonlyHeaders`:

```typescript
import { headers } from "next/headers";
import { getScenaristHeadersFromReadonlyHeaders } from "@scenarist/nextjs-adapter/app";

const headersList = await headers();
const scenaristHeaders = getScenaristHeadersFromReadonlyHeaders(headersList);
// Returns: { 'x-scenarist-test-id': '...' }
```

This ensures proper test isolation and mock activation.

## Comparison: Pages Router vs App Router

| Feature           | App Router (this example)   | Pages Router             |
| ----------------- | --------------------------- | ------------------------ |
| **Directory**     | `app/`                      | `pages/`                 |
| **Components**    | Server by default           | Client by default        |
| **API Routes**    | Route Handlers (`route.ts`) | API Routes (`/api/*.ts`) |
| **Request Type**  | Web `Request`               | `NextApiRequest`         |
| **Response Type** | Web `Response`              | `NextApiResponse`        |
| **Import Path**   | `/app`                      | `/pages`                 |
| **Port**          | 3002                        | 3000                     |
| **Data Fetching** | Async Server Components     | `getServerSideProps`     |

Both examples demonstrate identical Scenarist features with router-specific implementations.

## Custom Server Support

Scenarist works with custom Next.js servers (Express + Next.js). To verify:

```bash
pnpm test:custom
```

This runs all E2E tests against a custom Express server instead of `next dev`.

## CI/CD

This example is tested in CI with:

- ✅ Playwright browser caching for fast CI runs
- ✅ Version-specific cache keys
- ✅ Automated test execution on every PR
- ✅ Separate baseline test job

See `.github/workflows/ci.yml` for details.

## Learn More

- [Scenarist Documentation](https://scenarist.dev) - Full documentation site
- [Next.js App Router Guide](https://scenarist.dev/frameworks/nextjs-app-router/getting-started) - Step-by-step setup guide
- [Logging Reference](https://scenarist.dev/reference/logging) - Debug your scenarios with logging
- [Scenario Patterns](https://scenarist.dev/scenarios/overview) - Learn about matching, sequences, and stateful mocks
- [Testing Philosophy](./TESTING.md) - Why example apps differ from production code
- [Next.js Adapter Package](../../packages/nextjs-adapter/README.md) - Package-level documentation
- [Playwright Helpers Package](../../packages/playwright-helpers/README.md) - Type-safe test helpers

## Related Examples

- [Pages Router Example](../nextjs-pages-router-example/) - Same features with Pages Router
- [Express Example](../express-example/) - Backend-only example with Bruno tests

## License

MIT
