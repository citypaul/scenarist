---
title: Express
description: Using Scenarist with Express
---

## Testing Express with Scenarist

Scenarist provides first-class support for testing Express applications at the HTTP level, enabling you to test middleware, route handlers, and external API integrations with real HTTP requests.

### The Challenge

Testing Express applications traditionally requires choosing between:

- Unit testing route handlers in isolation (misses middleware integration)
- Mocking Express request/response objects (creates distance from production)
- Full E2E tests with browser automation (too slow for comprehensive coverage)

### How Scenarist Helps

Scenarist enables HTTP-level integration testing for Express:

- Test middleware chains with real HTTP requests
- Verify route handlers with different external API scenarios
- Test error handling and edge cases comprehensively
- Run parallel tests without interference

## Working Example

See Scenarist in action with a complete Express application:

[**Explore the Express Example App →**](/frameworks/express/example-app)

The example demonstrates:
- Testing Express middleware and route handlers
- Test ID isolation for parallel execution
- Request matching for content-based responses
- Sequences for polling and async operations
- Stateful mocks with state capture and injection
- Complete installation and usage instructions

**[View source on GitHub →](https://github.com/citypaul/scenarist/tree/main/apps/express-example)**

## Getting Started

Ready to integrate Scenarist into your Express application?

[Get started with Express →](/frameworks/express/getting-started)
