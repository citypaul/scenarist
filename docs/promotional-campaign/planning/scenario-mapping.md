# Scenario Mapping: Testing Problem Table → Scenarist Scenarios

This document maps the Testing Problem Table from Video 2 to the Scenarist scenario definitions that will be implemented in Stage 3.

## The Testing Problem Table (from Video 2)

| Scenario                       | Auth0     | Inventory        | Stripe     | Without Scenarist |
| ------------------------------ | --------- | ---------------- | ---------- | ----------------- |
| Happy path                     | Pro user  | Offer available  | Success    | Easy              |
| Premium user discount          | Pro user  | Offer available  | Success    | Annoying          |
| Free user sees full price      | Free user | Offer available  | Success    | Annoying          |
| Payment declined               | Any       | Offer available  | Declined   | Annoying          |
| Offer ended                    | Any       | 0 spots left     | N/A        | Hard              |
| Limited offer urgency          | Any       | 3 spots left     | N/A        | Hard              |
| **Offer ends during checkout** | Any       | Available → Gone | N/A        | **Impossible**    |
| Inventory service down         | Any       | 500 error        | N/A        | Hard              |
| Auth0 returns error            | Error     | Any              | N/A        | Hard              |
| Webhook never arrives          | Any       | Offer available  | No webhook | **Impossible**    |
| 50 tests in parallel           | Various   | Various          | Various    | **Impossible**    |

---

## Scenarist Scenario Definitions

### Core Scenarios (Video 3 Demo)

These are the primary scenarios demonstrated in Video 3 to show runtime scenario switching.

#### `default` - Happy Path

```typescript
default: {
  auth0: {
    user: {
      sub: 'auth0|test-user',
      email: 'test@example.com',
      name: 'Test User',
      'https://payflow.demo/tier': 'pro',
    },
  },
  inventory: {
    // All products have offer available
    products: {
      'prod-1': { quantity: 100, reserved: 0 },
      'prod-2': { quantity: 50, reserved: 0 },
      'prod-3': { quantity: 25, reserved: 0 },
    },
  },
  stripe: {
    checkout: { status: 'complete' },
    webhook: { delivered: true },
  },
}
```

#### `premiumUser` - Pro Tier (20% Discount)

```typescript
premiumUser: {
  auth0: {
    user: {
      sub: 'auth0|premium-user',
      email: 'premium@example.com',
      name: 'Premium User',
      'https://payflow.demo/tier': 'pro',
    },
  },
  // Inventory and Stripe inherit from default or specify explicitly
}
```

#### `freeUser` - Free Tier (Full Price)

```typescript
freeUser: {
  auth0: {
    user: {
      sub: 'auth0|free-user',
      email: 'free@example.com',
      name: 'Free User',
      'https://payflow.demo/tier': 'free',
    },
  },
}
```

#### `offerEnded` - Promotional Offer Expired

```typescript
offerEnded: {
  inventory: {
    products: {
      'prod-1': { quantity: 0, reserved: 0 },  // No spots left
      'prod-2': { quantity: 0, reserved: 0 },
      'prod-3': { quantity: 0, reserved: 0 },
    },
  },
}
```

#### `paymentDeclined` - Stripe Returns Decline

```typescript
paymentDeclined: {
  stripe: {
    checkout: {
      status: 'failed',
      error: { code: 'card_declined', message: 'Your card was declined' },
    },
  },
}
```

---

### Advanced Scenarios (Video 4+)

These scenarios demonstrate more advanced features like request matching and sequences.

#### `limitedOffer` - 3 Spots Left (Urgency)

```typescript
limitedOffer: {
  inventory: {
    products: {
      'prod-1': { quantity: 3, reserved: 0 },  // Limited!
    },
  },
}
```

#### `inventoryServiceDown` - 500 Error

```typescript
inventoryServiceDown: {
  inventory: {
    error: { status: 500, message: 'Internal Server Error' },
  },
}
```

#### `auth0Error` - Auth0 Returns Error

```typescript
auth0Error: {
  auth0: {
    error: { status: 401, message: 'Unauthorized' },
  },
}
```

#### `webhookNeverArrives` - Payment Success, No Webhook

```typescript
webhookNeverArrives: {
  stripe: {
    checkout: { status: 'complete' },
    webhook: { delivered: false },  // Webhook intentionally not delivered
  },
}
```

---

### Sequence Scenarios (The Killer Demo)

#### `offerEndsDuringCheckout` - State Changes Mid-Test

This is the "impossible" scenario that demonstrates Scenarist's sequence feature.

```typescript
offerEndsDuringCheckout: {
  inventory: {
    // Sequence: first call returns available, subsequent calls return ended
    sequence: [
      { quantity: 15, reserved: 0 },   // First call: available
      { quantity: 0, reserved: 0 },    // Second call: offer ended
    ],
  },
}
```

**Test implementation:**

```typescript
test("offer ends during checkout", async ({ page, switchScenario }) => {
  await switchScenario("offerEndsDuringCheckout");

  // First inventory call - offer available
  await page.goto("/products");
  await expect(page.getByText("15 left at this price")).toBeVisible();

  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');

  // Second inventory call - offer ended
  await page.click('[data-testid="pay"]');

  // App should handle this gracefully
  await expect(page.getByText("Offer no longer available")).toBeVisible();
});
```

---

## How Scenarios Enable Parallel Testing

With test ID isolation, all these scenarios can run simultaneously:

```
Test 1 (x-scenarist-test-id: test-1) → default scenario
Test 2 (x-scenarist-test-id: test-2) → premiumUser scenario
Test 3 (x-scenarist-test-id: test-3) → freeUser scenario
Test 4 (x-scenarist-test-id: test-4) → offerEnded scenario
Test 5 (x-scenarist-test-id: test-5) → paymentDeclined scenario
...
Test 50 (x-scenarist-test-id: test-50) → offerEndsDuringCheckout scenario
```

All 50 tests hit the same server, same endpoints. Scenarist uses the test ID to determine which scenario's responses to return.

---

## Video Progression

| Video | Scenarios Demonstrated                   | Features Shown             |
| ----- | ---------------------------------------- | -------------------------- |
| 3     | default, paymentDeclined, offerEnded     | Runtime scenario switching |
| 4     | premiumUser, freeUser + request matching | Request content matching   |
| 5     | offerEndsDuringCheckout                  | Sequences & state machines |
| 6     | All scenarios in parallel                | Test ID isolation          |

---

## Implementation Notes for Stage 3

1. **Start simple:** Implement `default`, `offerEnded`, `paymentDeclined` first
2. **Add user tiers:** `premiumUser`, `freeUser` with request matching
3. **Add sequences:** `offerEndsDuringCheckout` for the killer demo
4. **Add error scenarios:** `inventoryServiceDown`, `auth0Error`, `webhookNeverArrives`

The scenarios should be defined in a central `scenarios.ts` file that both the app and tests import.
