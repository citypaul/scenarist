---
title: Why Scenarist?
description: Understanding the testing gap in modern full-stack frameworks and how Scenarist addresses it
---

## The Testing Gap

Modern web development has blurred the traditional separation between frontend and backend code. Frameworks like **Next.js**, **Remix**, **SvelteKit**, and **SolidStart** run server-side logic alongside UI components. Traditional backends built with **Express**, **Hono**, or **Fastify** face the same challenge: all make HTTP calls to external services (Stripe, Auth0, SendGrid) that need different behaviors in tests.

This creates a testing challenge:

**Server Components, loaders, and API routes** execute server-side but are defined alongside components. Your UI code calls external APIs directly on the server. Testing this requires either mocking framework internals or running full end-to-end tests.

**Traditional backend services** call the same external APIs. Testing payment flows, authentication errors, or email delivery requires simulating different API responses.

## Quick Navigation

**Choose your path based on what you need:**

| If you want to... | Go to... |
|-------------------|----------|
| See how Scenarist works | [Overview](/introduction/overview) |
| Learn about dynamic capabilities | [Capabilities](/introduction/capabilities) |
| Compare with unit/E2E tests | [Comparison](#comparison-with-other-testing-approaches) |
| Understand limitations | [Limitations](#limitations-and-trade-offs) |
| Start implementing | [Getting Started](#getting-started) |

---

## Testing Options and Their Trade-offs

**Unit tests** can test server-side logic, but require mocking framework internals (Next.js `fetch`, `cookies`, `headers`) or HTTP clients. This creates distance between test execution and production behavior.

**End-to-end tests** provide confidence by testing the complete system, but cannot reach most edge case states. How do you make Stripe return a specific decline code? Or Auth0 timeout? Or SendGrid fail with a particular error? You can't control real external APIs to test these scenarios. Testing the few scenarios you can reach would also be prohibitively slow.

**Between these approaches lies a gap:** Testing server-side HTTP behavior with different external API responses, without browser overhead or extensive framework mocking.

**Scenarist fills this gap** by testing your server-side HTTP layer with mocked external APIs. Your code—Server Components, loaders, middleware, business logic—executes normally. Only the external API calls are intercepted, returning scenario-defined responses based on test ID. This enables testing full user journeys through the browser using Playwright helpers, with each test isolated and running in parallel.

[Learn how it works →](/introduction/overview)

### Why Framework Documentation Recommends E2E

This gap is evident in how framework authors struggle to provide testing guidance:

**Next.js Server Components** - The [official Next.js documentation](https://nextjs.org/docs/app/building-your-application/testing#async-server-components) states: *"Since async Server Components are new to the React ecosystem, Next.js recommends using end-to-end testing."* Unit testing requires mocking Next.js internals (fetch, cookies, headers), creating distance from production execution.

→ **Scenarist solves this** by testing Server Components with real HTTP requests to your Next.js routes. [See how →](/frameworks/nextjs)

**Remix Loaders & Actions** - The [Remix documentation](https://remix.run/docs/en/main/discussion/testing) notes: *"There aren't standard ways of testing components that have Remix code."* Developers must test loaders and actions separately from components, then hope they integrate correctly.

→ **Scenarist solves this** by testing loaders and actions at the HTTP layer where they naturally integrate. [See how →](/frameworks/remix)

**SvelteKit Server Routes** - Testing server-side logic requires either mocking the framework's request/response handling or running full end-to-end tests, with no standard middle ground.

→ **Scenarist solves this** by providing HTTP-level testing without browser overhead. [See how →](/frameworks/sveltekit)

:::note[The Pattern]
When your "frontend" components run on the server and call external APIs directly, traditional testing approaches break down:

- **Unit tests** mock too much (framework internals) → not testing real execution
- **E2E tests** are too slow → can't test all scenarios
- **No middle ground exists** → until Scenarist

**Scenarist fills this gap** by testing your real server-side code with mocked external APIs. Your Next.js Server Components, Remix loaders, TanStack server functions—they all execute normally. Only the external API calls (Stripe, Auth0, SendGrid) are intercepted.
:::

## Testing Behavior, Not Implementation

Scenarist enables behavior-focused testing by letting you test your server's response to different external API behaviors without mocking internal implementation details.

**Your tests describe scenarios:**
- "Premium user checkout with valid payment"
- "Payment declined due to insufficient funds"
- "Auth0 timeout during login"

**Not implementation details:**
- ~~"Mock stripe.charges.create to throw error"~~
- ~~"Stub authClient.getSession to return null"~~
- ~~"Mock sendgrid.send to resolve with 500"~~

This follows Test-Driven Development principles: tests document expected behavior, implementation details can change as long as behavior stays consistent.

[Learn about declarative design →](/introduction/declarative-design)

## Comparison with Other Testing Approaches

| Aspect | Unit Tests | E2E Tests | Scenarist |
|--------|-----------|-----------|-----------|
| HTTP layer | Mocked | Real | Real |
| Backend execution | Real (but isolated) | Real | Real |
| External APIs | Mocked | Real or mocked | Mocked via scenarios |
| Parallel execution | Yes | Typically no | Yes |
| Speed | Fast | Slow | Fast |
| Scenario coverage | High (with mocking) | Low (speed constraint) | High |

None of these approaches replaces the others—they serve different purposes:

- **Unit tests** verify individual functions and modules in isolation
- **Scenarist** verifies HTTP-level behavior with different external API scenarios
- **E2E tests** verify the complete user experience including browser interactions

## When to Use Scenarist

Consider Scenarist when:

- Testing middleware chains, routing logic, or request/response handling
- Verifying backend behavior under different external API responses
- Testing scenarios where external APIs are slow, rate-limited, or expensive
- Running many test scenarios in parallel against the same server
- Testing modern frameworks (Next.js Server Components, Remix loaders) where unit testing requires complex framework mocking

Consider alternatives when:

- Testing individual functions in isolation (use unit tests)
- Verifying complete user workflows including browser interactions (use E2E tests)
- Validating integration with real third-party services (use E2E or integration tests with real services)
- Testing frontend-only applications with no backend HTTP layer
- Verifying API contracts match specifications (consider contract testing tools)

:::caution[Not a Replacement for E2E Testing]
Scenarist tests HTTP-level backend behavior, not complete user workflows. Browser interactions, JavaScript execution, visual rendering, and client-side state management still require end-to-end tests. Use Scenarist to complement E2E tests, not replace them.
:::

## Limitations and Trade-offs

**Single-server deployment**: Scenarist stores test ID to scenario mappings in memory. This works well for local development and single-instance CI environments. Load-balanced deployments would require additional state management.

**Mock maintenance**: Scenario definitions need updates when external APIs change. Scenarist doesn't validate that mocks match real API contracts—this is a deliberate trade-off for test isolation and speed.

**Learning curve**: Understanding scenario definitions, test ID isolation, and the relationship between mocks and real backend code requires initial investment. The documentation and examples aim to reduce this learning time.

**Not a replacement for E2E testing**: Scenarist tests backend HTTP behavior, not complete user workflows. Browser interactions, JavaScript execution, and visual verification still require E2E tests.

## Getting Started

Choose your framework to see specific installation and usage instructions:

- [Next.js →](/frameworks/nextjs) - Test Server Components and API routes
- [Express →](/frameworks/express) - Test middleware and route handlers
- [Remix →](/frameworks/remix) - Test loaders and actions (coming soon)
- [SvelteKit →](/frameworks/sveltekit) - Test server routes (coming soon)

Or explore core concepts that apply to all frameworks:

- [Overview: How It Works →](/introduction/overview)
- [Capabilities: Dynamic Responses →](/introduction/capabilities)
- [Scenarios & Format →](/introduction/scenario-format)
- [Architecture →](/concepts/architecture)
