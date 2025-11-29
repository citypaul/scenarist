---
title: Next.js
description: Using Scenarist with Next.js (App Router and Pages Router)
---

## Testing Next.js with Scenarist

Scenarist provides first-class support for testing Next.js applications, addressing the challenges outlined in the [official Next.js testing documentation](https://nextjs.org/docs/app/building-your-application/testing).

### The Challenge

Next.js recommends end-to-end testing for Server Components because _"async Server Components are new to the React ecosystem."_ Unit testing requires mocking Next.js internals (fetch, cookies, headers), creating distance from production execution.

Traditional testing approaches face similar challenges across both routing paradigms:

- Mocking framework internals creates distance from production behavior
- Testing server-side logic requires complex setup
- End-to-end tests are too slow for comprehensive scenario coverage

### How Scenarist Helps

Scenarist enables testing Next.js applications through real HTTP requests:

- Test server-side code without mocking framework internals
- Verify different external API scenarios with runtime switching
- Run parallel tests without interference
- Fast execution without browser overhead for every scenario
- **Automatic singleton protection** - Handles Next.js module duplication for you (no `globalThis` boilerplate needed)

## Next.js Support

Scenarist supports both Next.js routing patterns:

- **[App Router](/frameworks/nextjs-app-router)** - Server Components, Server Actions, Route Handlers
- **[Pages Router](/frameworks/nextjs-pages-router)** - API Routes, getServerSideProps, getStaticProps

## Choose Your Router

### App Router (Modern)

The App Router introduces React Server Components, allowing server-side rendering with direct data fetching. Scenarist enables testing these components without mocking Next.js internals.

[**Get started with App Router →**](/frameworks/nextjs-app-router)

**Best for:**

- New Next.js projects (Next.js 13+)
- Server Components and streaming
- Server Actions for mutations
- Route Handlers for API endpoints

### Pages Router (Traditional)

The Pages Router uses the traditional pages directory with API routes and data fetching methods. Scenarist enables testing API routes and server-side rendering without complex mocking.

[**Get started with Pages Router →**](/frameworks/nextjs-pages-router)

**Best for:**

- Existing Next.js projects
- Traditional API routes
- getServerSideProps and getStaticProps
- Gradual migration strategies

## What Makes Next.js Testing Different

**Server-Side Execution** - Both routers execute code on the server that needs testing with different external API scenarios.

**Framework Internals** - Traditional unit testing requires mocking Next.js internals (fetch, cookies, headers), creating distance from production.

**Parallel Testing** - Scenarist's test ID isolation allows concurrent tests with different scenarios, maintaining fast test execution.

## Next Steps

Choose your routing paradigm to get started:

- [App Router Guide →](/frameworks/nextjs-app-router)
- [Pages Router Guide →](/frameworks/nextjs-pages-router)
