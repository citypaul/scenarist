---
title: Next.js
description: Using Scenarist with Next.js (App Router and Pages Router)
---

## Testing Next.js with Scenarist

Scenarist provides first-class support for testing Next.js applications, addressing the challenges outlined in the [official Next.js testing documentation](https://nextjs.org/docs/app/building-your-application/testing).

### The Challenge

Next.js recommends end-to-end testing for Server Components because *"async Server Components are new to the React ecosystem."* Unit testing requires mocking Next.js internals (fetch, cookies, headers), creating distance from production execution.

### How Scenarist Helps

Scenarist enables testing Next.js Server Components, API routes, and server actions through real HTTP requests:

- Test Server Components without mocking framework internals
- Verify API routes with different external API scenarios
- Test server actions with runtime scenario switching
- Run parallel tests without interference

## Next.js Support

Scenarist supports both Next.js routing patterns:

- **App Router** - Server Components, Server Actions, Route Handlers
- **Pages Router** - API Routes, getServerSideProps, getStaticProps

## Getting Started

Ready to test your Next.js application with Scenarist?

[Get started with Next.js →](/frameworks/nextjs/getting-started)

## Coming Soon

Additional Next.js-specific guides:

- Testing Server Components with dynamic scenarios
- Testing Server Actions with state capture
- Testing Route Handlers with request matching
- Testing with App Router layouts and middleware
- Testing Pages Router with getServerSideProps
- Example applications and patterns
