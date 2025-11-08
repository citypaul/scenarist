# Scenarist Next.js Pages Router Example

> E-commerce example demonstrating Scenarist usage with Next.js Pages Router

## Status

🚧 **Phase 0 Complete** - Infrastructure scaffolding complete, feature implementation in progress.

## What This Example Will Demonstrate

Once implementation phases are complete, this app will demonstrate:

- ✅ **Product Catalog** - Browse products with Scenarist scenario switching
- ✅ **API Route Testing** - Test Next.js API routes with MSW integration
- ✅ **E2E Testing** - Full browser testing with Playwright
- ✅ **Test ID Isolation** - Run multiple tests concurrently with independent scenarios
- ✅ **Runtime Scenario Switching** - Change backend behavior without app restart

## Installation

This example app is part of the Scenarist monorepo. For external projects, install only the Next.js adapter:

```bash
npm install @scenarist/nextjs-adapter
# or
pnpm add @scenarist/nextjs-adapter
# or
yarn add @scenarist/nextjs-adapter
```

**Note:** You only need to install the Next.js adapter package. It re-exports all necessary types including `ScenaristScenario`, `ScenaristMock`, etc.

**Important:** When using the Pages Router, import from the `/pages` subpath:

```typescript
import type { ScenaristScenario } from '@scenarist/nextjs-adapter/pages';
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
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

## CI/CD

This example is tested in CI with:
- ✅ Playwright browser caching for fast CI runs
- ✅ Version-specific cache keys
- ✅ Automated test execution on every PR

See `.github/workflows/ci.yml` for details.

## Learn More

- [Scenarist Documentation](../../README.md)
- [Next.js Adapter Documentation](../../packages/nextjs-adapter/README.md) _(Phase -1 complete)_
- [Playwright Helpers Documentation](../../packages/playwright-helpers/README.md) _(Phase 1+)_
- [Implementation Plan](../../docs/plans/nextjs-pages-and-playwright-helpers.md)
- [Architecture Guide](../../CLAUDE.md)

## License

MIT
