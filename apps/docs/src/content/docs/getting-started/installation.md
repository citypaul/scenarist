---
title: Installation
description: How to install Scenarist in your project
---

Scenarist is distributed as a set of packages. Install the adapter for your framework and the appropriate testing tools.

## Package Overview

| Package                         | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `@scenarist/nextjs-adapter`     | Next.js App Router and Pages Router integration       |
| `@scenarist/express-adapter`    | Express middleware integration                        |
| `@scenarist/playwright-helpers` | Test utilities for Playwright (browser-based testing) |

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
import { createScenarist } from "@scenarist/nextjs-adapter/app";
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
import { createScenarist } from "@scenarist/nextjs-adapter/pages";
```

**Peer dependencies:** `next@^14.0.0 || ^15.0.0`, `msw@^2.0.0`

After installation, follow the [Next.js Pages Router Getting Started guide](/frameworks/nextjs-pages-router/getting-started) to configure your app.

## Express

### API Testing with Supertest (Recommended)

For testing Express APIs directly without a browser, use **Supertest** with **Vitest**:

```bash
# pnpm
pnpm add @scenarist/express-adapter msw
pnpm add -D vitest supertest @types/supertest

# npm
npm install @scenarist/express-adapter msw
npm install -D vitest supertest @types/supertest

# yarn
yarn add @scenarist/express-adapter msw
yarn add -D vitest supertest @types/supertest
```

This is the recommended approach for Express API testing—fast, parallel test execution without browser overhead.

**Example test with Supertest:**

```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";

it("processes payment successfully", async () => {
  await request(app)
    .post("/__scenario__")
    .set(SCENARIST_TEST_ID_HEADER, "test-1")
    .send({ scenario: "default" });

  const response = await request(app)
    .post("/api/checkout")
    .set(SCENARIST_TEST_ID_HEADER, "test-1")
    .send({ amount: 5000 });

  expect(response.status).toBe(200);
});
```

See the [complete Express example tests](https://github.com/citypaul/scenarist/tree/main/apps/express-example/tests) for comprehensive patterns including scenario switching, test isolation, and dynamic responses.

### Full-Stack Testing with Playwright (Optional)

If you have a **full-stack application** with an Express backend and want browser-based E2E testing, add the Playwright helpers:

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

Use Playwright helpers when you need to test user interactions through a browser (clicks, form submissions, visual verification).

**Peer dependencies:** `express@^4.18.0 || ^5.0.0`, `msw@^2.0.0`

After installation, follow the [Express Getting Started guide](/frameworks/express/getting-started) to configure your app.

## Requirements

- **Node.js 18+** - Required for all packages
- **TypeScript 5+** - Recommended for type-safe scenario IDs
- **MSW 2.x** - Peer dependency for all adapters

## Verifying Installation

After installing, verify the packages are correctly installed:

```bash
# Check package versions
pnpm list @scenarist/nextjs-adapter @scenarist/express-adapter @scenarist/playwright-helpers
```

You should see the installed packages and their versions listed.

## Next Steps

- Follow the [Quick Start](/getting-started/quick-start) to set up your first scenario
- Read the framework-specific guides for detailed configuration:
  - [Next.js App Router](/frameworks/nextjs-app-router/getting-started)
  - [Next.js Pages Router](/frameworks/nextjs-pages-router/getting-started)
  - [Express](/frameworks/express/getting-started)
