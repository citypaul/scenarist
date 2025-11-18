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
| See how Scenarist works | [How it works](/introduction/overview) |
| Learn about dynamic capabilities | [Capabilities](/introduction/capabilities) |
| Compare with unit/E2E tests | [Comparison](#comparison-with-other-testing-approaches) |
| Understand limitations | [Limitations](#limitations-and-trade-offs) |
| Start implementing | [Getting Started](#getting-started) |

---

## Testing Options and Their Trade-offs

**Unit tests** can test server-side logic, but require mocking framework internals (Next.js `fetch`, `cookies`, `headers`) or HTTP clients. This creates distance between test execution and production behavior.

**End-to-end tests** provide confidence by testing the complete system, but cannot reach most edge case states. How do you make Stripe return a specific decline code? Or Auth0 timeout? Or SendGrid fail with a particular error? You can't control real external APIs to test these scenarios. Testing the few scenarios you can reach would also be prohibitively slow.

**Between these approaches lies a gap:** Testing server-side HTTP behavior with different external API responses, without browser overhead or extensive framework mocking.

**Scenarist fills this gap** by testing your server-side HTTP layer with mocked external APIs. Your code—Server Components, loaders, middleware, business logic—executes normally. Only HTTP requests (fetch, axios, etc.) are intercepted, returning scenario-defined responses based on test ID. This enables testing full user journeys through the browser using Playwright helpers, with each test isolated and running in parallel.

**Test extensive external API scenarios in parallel** without expensive cloud API calls or complex test infrastructure.

## What Scenarist Intercepts

Scenarist intercepts **HTTP/HTTPS requests** made via fetch, axios, or other HTTP clients to external services (Stripe, Auth0, SendGrid, REST APIs).

**It does not intercept:**
- Direct database access (PostgreSQL, MongoDB, Prisma)
- File system operations
- WebSocket connections
- Non-HTTP protocols

**If your app uses direct database access:** You have two options: (1) add thin API routes to make database calls testable via HTTP, or (2) use Testcontainers to spin up real database containers with seeded scenarios, combined with Scenarist to mock external APIs. The hybrid approach requires no code changes.

[Database testing guide →](/guides/testing-database-apps)

[Learn how it works →](/introduction/overview)

### Why Framework Documentation Recommends E2E

This gap is evident in how framework authors struggle to provide testing guidance. The Next.js documentation states: *"Since async Server Components are new to the React ecosystem, Next.js recommends using end-to-end testing."* Remix notes: *"There aren't standard ways of testing components that have Remix code."* SvelteKit faces similar challenges with server route testing.

The pattern is clear: when "frontend" components run on the server and call external APIs directly, traditional testing approaches break down. **Scenarist fills this gap** by testing real server-side code with mocked external APIs.

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
| Tests behavior over implementation | No (mocks internals) | Yes | Yes |
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

- Testing isolated functions (use unit tests) or complete user workflows with browser interactions (use E2E tests)
- Validating integration with real third-party services or API contract specifications (use integration/contract tests)
- Working with frontend-only applications with no HTTP layer

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
