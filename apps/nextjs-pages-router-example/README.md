# Scenarist Next.js Pages Router Example

> E-commerce example demonstrating Scenarist usage with Next.js Pages Router

## Status

🚧 **Phase 0 Complete** - Infrastructure scaffolding complete, feature implementation in progress.

## What This Example Will Demonstrate

Once implementation phases are complete, this app will demonstrate:

- ✅ **Product Catalog** - Browse products with Scenarist scenario switching
- ✅ **API Route Testing** - Test Next.js API routes with MSW integration
- ✅ **Scenario-Based Browser Testing** - Full browser testing with Playwright and scenario switching
- ✅ **Test ID Isolation** - Run multiple tests concurrently with independent scenarios
- ✅ **Runtime Scenario Switching** - Change backend behavior without app restart

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

**Important:** When using the Pages Router, import from the `/pages` subpath:

```typescript
import type { ScenaristScenario } from "@scenarist/nextjs-adapter/pages";
import { createScenarist } from "@scenarist/nextjs-adapter/pages";
```

## Getting Started

```bash
# Install dependencies (from workspace root)
pnpm install

# Run development server
pnpm --filter=@scenarist/nextjs-pages-router-example dev

# Run all tests (E2E + API)
pnpm --filter=@scenarist/nextjs-pages-router-example test

# Run E2E tests only
pnpm --filter=@scenarist/nextjs-pages-router-example test:e2e

# Run API tests only
pnpm --filter=@scenarist/nextjs-pages-router-example test:api

# Type checking
pnpm --filter=@scenarist/nextjs-pages-router-example typecheck

# Linting
pnpm --filter=@scenarist/nextjs-pages-router-example lint

# Build for production
pnpm --filter=@scenarist/nextjs-pages-router-example build
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
- **State management**: State capture and injection for stateful mocks
- **Sequences**: Position tracking for response sequences

Example output:

```
09:49:09.713 INF [test-checkout] 🎬 scenario   scenario_switched scenarioId="checkout-flow"
09:49:09.715 DBG [test-checkout] 🎯 matching   mock_candidates_found candidateCount=5 url="/api/cart" method="GET"
09:49:09.716 INF [test-checkout] 🎯 matching   mock_selected mockIndex=2 specificity=5
```

### Learn More About Logging

- [Logging Reference](https://scenarist.dev/reference/logging) - Full logging configuration options
- [Log Levels & Categories](https://scenarist.dev/reference/logging#log-levels) - Understanding log levels and filtering

## Project Structure

```
apps/nextjs-pages-router-example/
├── pages/              # Next.js pages (file-based routing)
│   ├── index.tsx      # Home page / product catalog
│   └── api/           # Next.js API routes
├── tests/
│   ├── playwright/    # Playwright E2E tests
│   │   └── smoke.spec.ts
│   └── api/           # Vitest API route tests
│       └── placeholder.test.ts
├── bruno/             # Bruno API tests (Phase 1+)
├── public/            # Static assets
├── styles/            # CSS files
└── tsconfig.json      # TypeScript configuration (strict mode)
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

### API Tests (Vitest)

Fast unit/integration tests for API routes:

```bash
pnpm test:api
```

- Located in `tests/api/`
- Fast execution with jsdom
- Tests API route logic directly
- Configured in `vitest.config.ts`

## Technology Stack

- **Framework:** Next.js 15 (Pages Router)
- **Runtime:** React 18
- **E2E Testing:** Playwright
- **Unit Testing:** Vitest + jsdom
- **Type Safety:** TypeScript strict mode
- **Styling:** Tailwind CSS
- **API Mocking:** MSW (Mock Service Worker)
- **Scenario Management:** Scenarist

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

**Phase 0 Scaffolding:**

- ✅ 1 Playwright smoke test passing
- ✅ 1 Vitest API test passing
- ✅ TypeScript: 0 errors
- ✅ Build: Successful

## Development Roadmap

### Phase 0: Infrastructure Setup ✅ COMPLETE

- ✅ Next.js app scaffolding
- ✅ Playwright configuration
- ✅ Vitest configuration
- ✅ TypeScript strict mode
- ✅ Smoke tests passing

### Phase 1: Product Catalog (In Progress)

- 🔄 Product listing page
- 🔄 Scenarist integration
- 🔄 Scenario switching tests
- 🔄 Playwright helper utilities

### Phase 2+: Advanced Features

- 📋 Shopping cart
- 📋 Checkout flow
- 📋 Payment integration
- 📋 Bruno API collection

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

See `.github/workflows/ci.yml` for details.

## Learn More

- [Scenarist Documentation](https://scenarist.dev) - Full documentation site
- [Next.js Pages Router Guide](https://scenarist.dev/frameworks/nextjs-pages-router/getting-started) - Step-by-step setup guide
- [Logging Reference](https://scenarist.dev/reference/logging) - Debug your scenarios with logging
- [Scenario Patterns](https://scenarist.dev/scenarios/overview) - Learn about matching, sequences, and stateful mocks
- [Next.js Adapter Package](../../packages/nextjs-adapter/README.md) - Package-level documentation
- [Playwright Helpers Package](../../packages/playwright-helpers/README.md) - Type-safe test helpers

## License

MIT
