---
title: SvelteKit
description: Using Scenarist with SvelteKit
---

## Testing SvelteKit with Scenarist

SvelteKit developers face a testing gap: there's no standard middle ground between mocking the framework's request/response handling and running full end-to-end tests.

### The Challenge

Testing SvelteKit server routes requires choosing between incomplete approaches:

- Mock SvelteKit's request/response handling (creates distance from production)
- Run full E2E tests with browser automation (too slow for comprehensive coverage)
- Test server code in isolation (misses framework integration)

### How Scenarist Helps

Scenarist provides HTTP-level testing without browser overhead:

- Test server routes with real HTTP requests
- Verify load functions with different external API scenarios
- Test form actions with runtime scenario switching
- Run parallel tests without interference

## SvelteKit Support

:::note[Coming Soon]
Full SvelteKit support is currently in development. The adapter will support:

- Testing +page.server.ts and +layout.server.ts load functions
- Testing form actions with state capture
- Testing server-only modules
- Testing with SvelteKit hooks and middleware
- Example applications demonstrating patterns

**Interested in SvelteKit support?** [Open a discussion on GitHub](https://github.com/citypaul/scenarist/discussions) to share your use case and help prioritize development.
:::

## Getting Started

Documentation and examples for SvelteKit will be added once the adapter is available.

In the meantime, explore how Scenarist works with similar frameworks:

- [Next.js →](/frameworks/nextjs) - Similar full-stack patterns
- [Express →](/frameworks/express) - HTTP-level testing concepts
