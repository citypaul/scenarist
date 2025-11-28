---
title: Installation
description: How to install Scenarist in your project
---

Scenarist is distributed as a set of packages. Install the adapter for your framework and the Playwright helpers for your tests.

## Package Overview

| Package | Purpose |
|---------|---------|
| `@scenarist/express-adapter` | Express middleware integration |
| `@scenarist/nextjs-adapter` | Next.js App Router and Pages Router integration |
| `@scenarist/playwright-helpers` | Test utilities for Playwright |

## Express

Install the Express adapter and Playwright helpers:

```bash
# pnpm
pnpm add @scenarist/express-adapter msw
pnpm add -D @scenarist/playwright-helpers @playwright/test

# npm
npm install @scenarist/express-adapter msw
npm install -D @scenarist/playwright-helpers @playwright/test

# yarn
yarn add @scenarist/express-adapter msw
yarn add -D @scenarist/playwright-helpers @playwright/test
```

**Peer dependencies:** `express@^4.18.0 || ^5.0.0`, `msw@^2.0.0`

After installation, follow the [Express Getting Started guide](/frameworks/express/getting-started) to configure your app.

## Next.js App Router

Install the Next.js adapter and Playwright helpers:

```bash
# pnpm
pnpm add @scenarist/nextjs-adapter msw
pnpm add -D @scenarist/playwright-helpers @playwright/test

# npm
npm install @scenarist/nextjs-adapter msw
npm install -D @scenarist/playwright-helpers @playwright/test

# yarn
yarn add @scenarist/nextjs-adapter msw
yarn add -D @scenarist/playwright-helpers @playwright/test
```

Import from the `/app` subpath:

```typescript
import { createScenarist } from '@scenarist/nextjs-adapter/app';
```

**Peer dependencies:** `next@^14.0.0 || ^15.0.0`, `msw@^2.0.0`

After installation, follow the [Next.js App Router Getting Started guide](/frameworks/nextjs-app-router/getting-started) to configure your app.

## Next.js Pages Router

Install the Next.js adapter and Playwright helpers:

```bash
# pnpm
pnpm add @scenarist/nextjs-adapter msw
pnpm add -D @scenarist/playwright-helpers @playwright/test

# npm
npm install @scenarist/nextjs-adapter msw
npm install -D @scenarist/playwright-helpers @playwright/test

# yarn
yarn add @scenarist/nextjs-adapter msw
yarn add -D @scenarist/playwright-helpers @playwright/test
```

Import from the `/pages` subpath:

```typescript
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
```

**Peer dependencies:** `next@^14.0.0 || ^15.0.0`, `msw@^2.0.0`

After installation, follow the [Next.js Pages Router Getting Started guide](/frameworks/nextjs-pages-router/getting-started) to configure your app.

## Requirements

- **Node.js 18+** - Required for all packages
- **TypeScript 5+** - Recommended for type-safe scenario IDs
- **MSW 2.x** - Peer dependency for all adapters

## Verifying Installation

After installing, verify the packages are correctly installed:

```bash
# Check package versions
pnpm list @scenarist/express-adapter @scenarist/nextjs-adapter @scenarist/playwright-helpers
```

You should see the installed packages and their versions listed.

## Next Steps

- Follow the [Quick Start](/introduction/quick-start) to set up your first scenario
- Read the framework-specific guides for detailed configuration:
  - [Express](/frameworks/express/getting-started)
  - [Next.js App Router](/frameworks/nextjs-app-router/getting-started)
  - [Next.js Pages Router](/frameworks/nextjs-pages-router/getting-started)
