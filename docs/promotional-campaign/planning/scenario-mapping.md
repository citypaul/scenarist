# Scenario Mapping: Testing Problem Table → Scenarist Scenarios

This document maps the Testing Problem Table scenarios from Video 2 to concrete Scenarist scenario definitions for Video 3 and beyond.

## PayFlow Architecture

PayFlow's Next.js server calls three backend services:

| Service           | Endpoint         | Purpose                          | Port |
| ----------------- | ---------------- | -------------------------------- | ---- |
| User Service      | `/users/current` | Returns user tier (pro/free)     | 3001 |
| Inventory Service | `/inventory/:id` | Returns offer availability       | 3001 |
| Shipping Service  | `/shipping`      | Returns shipping options & rates | 3001 |

All three are served by json-server on port 3001 for the demo.

**Key architectural point:** All three are server-side HTTP calls. The browser never talks to these services directly - only the Next.js server does. This makes them 100% mockable with Scenarist.

---

## Testing Problem Table

| Scenario                       | User Service | Inventory     | Shipping    | Difficulty     |
| ------------------------------ | ------------ | ------------- | ----------- | -------------- |
| Happy path                     | Pro user     | Available     | All options | Easy           |
| Premium user discount          | Pro user     | Available     | Any         | Annoying       |
| Free user full price           | Free user    | Available     | Any         | Annoying       |
| Offer ended                    | Any          | 0 spots       | N/A         | Hard           |
| Limited spots (urgency)        | Any          | 3 spots left  | N/A         | Hard           |
| Express shipping unavailable   | Any          | Available     | No express  | Hard           |
| Shipping service down          | Any          | Available     | 500 error   | Hard           |
| **Offer ends during checkout** | Any          | Available → 0 | Any         | **Impossible** |
| **50 parallel tests**          | Various      | Various       | Various     | **Impossible** |

---

## Scenarist Scenario Definitions

### 1. `default` - Happy Path (Pro User)

```typescript
{
  id: "default",
  name: "Happy Path - Pro User",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "1", email: "pro@payflow.com", name: "Pro User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory/1",
      response: {
        status: 200,
        body: { id: "1", productId: "1", quantity: 50, reserved: 0 }
      }
    },
    {
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: [
          { id: "standard", name: "Standard Shipping", price: 5.99, estimatedDays: "5-7 business days" },
          { id: "express", name: "Express Shipping", price: 14.99, estimatedDays: "2-3 business days" },
          { id: "overnight", name: "Overnight Shipping", price: 29.99, estimatedDays: "Next business day" }
        ]
      }
    }
  ]
}
```

### 2. `freeUser` - Free Tier (No Discount)

```typescript
{
  id: "freeUser",
  name: "Free User - No Discount",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "2", email: "free@payflow.com", name: "Free User", tier: "free" }
      }
    }
    // Inventory and shipping inherit from default or use fallback
  ]
}
```

### 3. `offerEnded` - Promotional Offer Expired

```typescript
{
  id: "offerEnded",
  name: "Offer Ended - Sold Out",
  mocks: [
    {
      url: "http://localhost:3001/inventory/1",
      response: {
        status: 200,
        body: { id: "1", productId: "1", quantity: 0, reserved: 0 }
      }
    }
  ]
}
```

### 4. `limitedSpots` - Urgency Messaging

```typescript
{
  id: "limitedSpots",
  name: "Limited Spots - Urgency",
  mocks: [
    {
      url: "http://localhost:3001/inventory/1",
      response: {
        status: 200,
        body: { id: "1", productId: "1", quantity: 3, reserved: 0 }
      }
    }
  ]
}
```

### 5. `expressUnavailable` - No Express Shipping

```typescript
{
  id: "expressUnavailable",
  name: "Express Shipping Unavailable",
  mocks: [
    {
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: [
          { id: "standard", name: "Standard Shipping", price: 5.99, estimatedDays: "5-7 business days" }
          // No express or overnight options
        ]
      }
    }
  ]
}
```

### 6. `shippingServiceDown` - Shipping API Error

```typescript
{
  id: "shippingServiceDown",
  name: "Shipping Service Down",
  mocks: [
    {
      url: "http://localhost:3001/shipping",
      response: {
        status: 500,
        body: { error: "Service unavailable", message: "Unable to load shipping options" }
      }
    }
  ]
}
```

### 7. `offerEndsDuringCheckout` - Sequence Scenario (Video 4)

```typescript
{
  id: "offerEndsDuringCheckout",
  name: "Offer Ends During Checkout",
  mocks: [
    {
      url: "http://localhost:3001/inventory/1",
      sequence: [
        { status: 200, body: { id: "1", productId: "1", quantity: 15, reserved: 0 } },  // First call: available
        { status: 200, body: { id: "1", productId: "1", quantity: 0, reserved: 0 } }    // Second call: sold out
      ]
    }
  ]
}
```

---

## Video Progression

| Video   | Scenarios Demonstrated                                           |
| ------- | ---------------------------------------------------------------- |
| Video 2 | None (shows the problem - manual testing, Testing Problem Table) |
| Video 3 | `default`, `freeUser`, `offerEnded`, `shippingServiceDown`       |
| Video 4 | `offerEndsDuringCheckout` (sequences)                            |
| Video 5 | Parallel isolation (multiple scenarios running simultaneously)   |

---

## Implementation Notes

### Server-Side vs Browser-Side

Scenarist intercepts **server-side HTTP calls**. This means:

- ✅ **Mockable**: Next.js → User Service (server calls backend)
- ✅ **Mockable**: Next.js → Inventory Service (server calls backend)
- ✅ **Mockable**: Next.js → Shipping Service (server calls backend)
- ❌ **Not Mockable**: Browser → External login page (browser redirect)
- ❌ **Not Mockable**: Browser → External checkout page (browser redirect)

The PayFlow architecture is designed so all critical business logic flows through server-side API calls, making them testable with Scenarist.

### Proving Interception

To prove Scenarist is intercepting requests:

1. Run json-server with logging enabled (`pnpm inventory`)
2. Run tests with Scenarist
3. Observe: json-server terminal shows **zero requests**

The backend services are running but never receive requests - Scenarist intercepts at the server level.
