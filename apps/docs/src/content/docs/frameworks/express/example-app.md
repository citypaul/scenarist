---
title: Express Example App
description: Working example demonstrating Scenarist with Express
---

## Overview

The Express example demonstrates HTTP-level integration testing for Express applications using Scenarist. This example focuses on testing middleware, route handlers, and external API integrations.

**GitHub:** [apps/express-example](https://github.com/citypaul/scenarist/tree/main/apps/express-example)

## What It Demonstrates

This example app showcases all major Scenarist features with Express:

### Core Features
- **Middleware Testing** - Test Express middleware chains with real HTTP requests
- **Route Handlers** - Test route handlers with different external API responses
- **Test ID Isolation** - Parallel test execution without interference
- **Runtime Scenario Switching** - Switch scenarios during test execution

### Dynamic Response Features
- **Request Matching** - Different responses based on request content
- **Sequences** - Multi-step processes (polling, async operations)
- **Stateful Mocks** - State capture and injection across requests
- **Default Fallback** - Graceful handling when no scenario is active

## Installation

### Prerequisites
- Node.js 20+
- pnpm 9+

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/citypaul/scenarist.git
cd scenarist

# Install dependencies
pnpm install

# Navigate to Express example
cd apps/express-example
```

## Running the Example

### Development Mode

```bash
# Start the Express server
pnpm dev
```

Server runs on [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test scenario-switching

# Run with coverage
pnpm test:coverage
```

## Key Files

### Scenarist Setup

**`src/server.ts`** - Express server with Scenarist integration
```typescript
import express from 'express';
import { createScenarist } from '@scenarist/express-adapter';
import { scenarios } from './scenarios';

const app = express();

// Create Scenarist instance
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === 'test',
  scenarios,
});

// Register Scenarist middleware
app.use(scenarist.middleware());

// Your routes
app.get('/api/user', async (req, res) => {
  const response = await fetch('https://api.auth.example.com/user');
  const user = await response.json();
  res.json(user);
});

export default app;
```

### Scenario Definitions

**`src/scenarios.ts`** - All scenario definitions ([view on GitHub](https://github.com/citypaul/scenarist/blob/main/apps/express-example/src/scenarios.ts))

Key scenarios:

**`default`** - Standard responses for all tests

**`premiumUser`** - Premium tier user
```typescript
premiumUser: {
  id: 'premiumUser',
  name: 'Premium User',
  mocks: [{
    method: 'GET',
    url: 'https://api.auth.example.com/user',
    response: {
      status: 200,
      body: { id: 'user-123', tier: 'premium' }
    }
  }]
}
```

**`githubPolling`** - Polling sequence
```typescript
githubPolling: {
  id: 'githubPolling',
  mocks: [{
    method: 'GET',
    url: 'https://api.github.com/repos/user/repo/status',
    sequence: {
      responses: [
        { status: 200, body: { status: 'pending' } },
        { status: 200, body: { status: 'processing' } },
        { status: 200, body: { status: 'complete' } }
      ],
      repeat: 'last'
    }
  }]
}
```

**`shoppingCart`** - Stateful shopping cart
```typescript
shoppingCart: {
  id: 'shoppingCart',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.cart.example.com/add',
      captureState: {
        items: { from: 'body', path: 'productId' }
      },
      response: { status: 201 }
    },
    {
      method: 'GET',
      url: 'https://api.cart.example.com/items',
      response: {
        status: 200,
        body: { items: '{{state.items}}' }
      }
    }
  ]
}
```

### Test Examples

**`tests/scenario-switching.test.ts`** - Basic scenario switching
```typescript
import request from 'supertest';
import app from '../src/server';

describe('Scenario Switching', () => {
  it('should switch to premium user scenario', async () => {
    const testId = 'test-123';

    // Switch to premiumUser scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId)
      .send({ scenario: 'premiumUser' });

    // Request uses premium scenario
    const response = await request(app)
      .get('/api/user')
      .set('x-test-id', testId);

    expect(response.body.tier).toBe('premium');
  });
});
```

**`tests/test-id-isolation.test.ts`** - Parallel test isolation
```typescript
describe('Test ID Isolation', () => {
  it('should isolate scenarios by test ID', async () => {
    // Test 1 uses premiumUser
    const testId1 = 'test-1';
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId1)
      .send({ scenario: 'premiumUser' });

    // Test 2 uses standardUser
    const testId2 = 'test-2';
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId2)
      .send({ scenario: 'standardUser' });

    // Requests are isolated
    const res1 = await request(app)
      .get('/api/user')
      .set('x-test-id', testId1);
    expect(res1.body.tier).toBe('premium');

    const res2 = await request(app)
      .get('/api/user')
      .set('x-test-id', testId2);
    expect(res2.body.tier).toBe('standard');
  });
});
```

**`tests/dynamic-sequences.test.ts`** - Polling with sequences
```typescript
describe('Dynamic Sequences', () => {
  it('should progress through polling sequence', async () => {
    const testId = 'test-polling';

    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId)
      .send({ scenario: 'githubPolling' });

    // First request: pending
    const res1 = await request(app)
      .get('/api/poll')
      .set('x-test-id', testId);
    expect(res1.body.status).toBe('pending');

    // Second request: processing
    const res2 = await request(app)
      .get('/api/poll')
      .set('x-test-id', testId);
    expect(res2.body.status).toBe('processing');

    // Third request: complete
    const res3 = await request(app)
      .get('/api/poll')
      .set('x-test-id', testId);
    expect(res3.body.status).toBe('complete');
  });
});
```

**`tests/stateful-scenarios.test.ts`** - State capture and injection
```typescript
describe('Stateful Scenarios', () => {
  it('should capture and inject state', async () => {
    const testId = 'test-cart';

    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId)
      .send({ scenario: 'shoppingCart' });

    // Add item - state captured
    await request(app)
      .post('/api/cart/add')
      .set('x-test-id', testId)
      .send({ productId: 'prod-1' });

    // Get cart - state injected
    const response = await request(app)
      .get('/api/cart/items')
      .set('x-test-id', testId);

    expect(response.body.items).toContain('prod-1');
  });
});
```

## Architecture

### How It Works

1. **Middleware Registration** - Scenarist middleware added to Express app
2. **Test ID Extraction** - Middleware extracts `x-test-id` header from requests
3. **Scenario Activation** - Test calls `POST /__scenario__` to set active scenario
4. **Request Handling** - Express routes execute normally
5. **External API Interception** - MSW intercepts external API calls
6. **Scenario Response** - Returns response defined in scenario

### Middleware Flow

```
Incoming Request
      ↓
[Scenarist Middleware] - Extracts x-test-id header
      ↓
[Express Route] - Executes normally
      ↓
[External API Call] - fetch('https://api.example.com/...')
      ↓
[MSW Intercepts] - Checks active scenario for test ID
      ↓
[Scenario Response] - Returns mocked response
      ↓
[Express Route] - Continues with mocked data
      ↓
Response to Client
```

### File Structure

```
apps/express-example/
├── src/
│   ├── server.ts           # Express app with Scenarist
│   ├── scenarios.ts        # Scenario definitions
│   └── routes/             # Express routes
├── tests/
│   ├── scenario-switching.test.ts
│   ├── test-id-isolation.test.ts
│   ├── dynamic-sequences.test.ts
│   ├── dynamic-matching.test.ts
│   └── stateful-scenarios.test.ts
└── package.json
```

## Common Patterns

### Testing Middleware

```typescript
// Middleware that fetches user from external API
app.use(async (req, res, next) => {
  const response = await fetch('https://api.auth.example.com/user');
  req.user = await response.json();
  next();
});

// Test with different user scenarios
describe('Auth Middleware', () => {
  it('should set premium user', async () => {
    const testId = 'test-premium';

    await request(app)
      .post('/__scenario__')
      .set('x-test-id', testId)
      .send({ scenario: 'premiumUser' });

    const response = await request(app)
      .get('/api/profile')
      .set('x-test-id', testId);

    expect(response.body.user.tier).toBe('premium');
  });
});
```

### Testing with Request Matching

```typescript
// Different responses based on request body
const scenarios = {
  checkout: {
    id: 'checkout',
    mocks: [
      {
        method: 'POST',
        url: 'https://api.payment.example.com/charge',
        match: { body: { amount: 100 } },
        response: { status: 200, body: { success: true } }
      },
      {
        method: 'POST',
        url: 'https://api.payment.example.com/charge',
        match: { body: { amount: 10000 } },
        response: { status: 400, body: { error: 'Amount too large' } }
      }
    ]
  }
};
```

### Testing Default Fallback

```typescript
describe('Default Fallback', () => {
  it('should use default scenario when none specified', async () => {
    // No scenario switch - uses default
    const response = await request(app).get('/api/user');

    expect(response.status).toBe(200);
    expect(response.body.tier).toBe('standard'); // default scenario
  });
});
```

## Next Steps

- [Express Getting Started →](/frameworks/express/getting-started) - Integrate Scenarist into your Express app
- [Request Matching →](/core-concepts/dynamic-responses#request-matching) - Learn about request content matching
- [Sequences →](/core-concepts/dynamic-responses#sequences) - Learn about response sequences
- [Stateful Mocks →](/core-concepts/dynamic-responses#stateful-mocks) - Learn about state capture and injection
