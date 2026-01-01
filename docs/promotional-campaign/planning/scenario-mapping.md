# Scenario Mapping: Testing Problem Table → Scenarist Scenarios

This document maps the Testing Problem Table scenarios from Video 2 to concrete Scenarist scenario definitions for Video 3 and beyond.

## PayFlow Architecture

PayFlow's Next.js server calls four backend services:

| Service           | Endpoint         | Purpose                          | Port |
| ----------------- | ---------------- | -------------------------------- | ---- |
| User Service      | `/users/current` | Returns user tier (pro/free)     | 3001 |
| Inventory Service | `/inventory`     | Returns all product availability | 3001 |
| Shipping Service  | `/shipping`      | Returns shipping options & rates | 3001 |
| Payment Service   | `/payments`      | Processes payments               | 3001 |

All four are served by json-server on port 3001 for the demo.

**Key architectural point:** All four are server-side HTTP calls. The browser never talks to these services directly - only the Next.js server does. This makes them 100% mockable with Scenarist.

**Request flow:**

```
Browser → Next.js API Routes → Backend Services (json-server:3001)
                             ├→ GET /users/current
                             ├→ GET /inventory
                             ├→ GET /shipping
                             └→ POST /payments
```

---

## Testing Problem Table

| Scenario                      | User Service | Inventory       | Shipping    | Payment   | Difficulty     |
| ----------------------------- | ------------ | --------------- | ----------- | --------- | -------------- |
| Happy path                    | Pro member   | In stock        | All options | Success   | Easy           |
| Pro member discount           | Pro member   | In stock        | Any         | Success   | Annoying       |
| Free user full price          | Free user    | In stock        | Any         | Success   | Annoying       |
| Sold out                      | Any          | 0 units left    | N/A         | N/A       | Hard           |
| Low stock (urgency)           | Any          | 3 units left    | N/A         | Success   | Hard           |
| Express shipping unavailable  | Any          | In stock        | No express  | Success   | Hard           |
| Shipping service down         | Any          | In stock        | 500 error   | N/A       | Hard           |
| **Payment declined**          | Any          | In stock        | Any         | Declined  | **Hard**       |
| **Payment service down**      | Any          | In stock        | Any         | 500 error | **Hard**       |
| **Sells out during checkout** | Any          | In stock → Gone | Any         | N/A       | **Impossible** |
| **50 parallel tests**         | Various      | Various         | Various     | Various   | **Impossible** |

---

## Scenarist Scenario Definitions

### 1. `default` - Happy Path (Pro Member)

```typescript
{
  id: "default",
  name: "Happy Path - Pro User",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 50, reserved: 0 },
          { id: "2", productId: "2", quantity: 15, reserved: 0 },
          { id: "3", productId: "3", quantity: 3, reserved: 0 }
        ]
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
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "free" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 50, reserved: 0 },
          { id: "2", productId: "2", quantity: 15, reserved: 0 },
          { id: "3", productId: "3", quantity: 3, reserved: 0 }
        ]
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

### 3. `soldOut` - Out of Stock

```typescript
{
  id: "soldOut",
  name: "Sold Out - No Stock",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 0, reserved: 0 },  // Product 1: SOLD OUT
          { id: "2", productId: "2", quantity: 0, reserved: 0 },  // Product 2: SOLD OUT
          { id: "3", productId: "3", quantity: 0, reserved: 0 }   // Product 3: SOLD OUT
        ]
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

### 4. `lowStock` - Urgency Messaging

```typescript
{
  id: "lowStock",
  name: "Low Stock - Urgency",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 3, reserved: 0 },  // Only 3 left!
          { id: "2", productId: "2", quantity: 3, reserved: 0 },  // Only 3 left!
          { id: "3", productId: "3", quantity: 3, reserved: 0 }   // Only 3 left!
        ]
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

### 5. `expressUnavailable` - No Express Shipping

```typescript
{
  id: "expressUnavailable",
  name: "Express Shipping Unavailable",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 50, reserved: 0 },
          { id: "2", productId: "2", quantity: 15, reserved: 0 },
          { id: "3", productId: "3", quantity: 3, reserved: 0 }
        ]
      }
    },
    {
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: [
          { id: "standard", name: "Standard Shipping", price: 5.99, estimatedDays: "5-7 business days" }
          // No express or overnight options available
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
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 50, reserved: 0 },
          { id: "2", productId: "2", quantity: 15, reserved: 0 },
          { id: "3", productId: "3", quantity: 3, reserved: 0 }
        ]
      }
    },
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

### 7. `sellsOutDuringCheckout` - Sequence Scenario (Video 4)

```typescript
{
  id: "sellsOutDuringCheckout",
  name: "Sells Out During Checkout",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      sequence: {
        responses: [
          // First call (products page): in stock
          { status: 200, body: [
            { id: "1", productId: "1", quantity: 15, reserved: 0 },
            { id: "2", productId: "2", quantity: 15, reserved: 0 },
            { id: "3", productId: "3", quantity: 15, reserved: 0 }
          ]},
          // Second call (checkout verification): sold out
          { status: 200, body: [
            { id: "1", productId: "1", quantity: 0, reserved: 0 },
            { id: "2", productId: "2", quantity: 0, reserved: 0 },
            { id: "3", productId: "3", quantity: 0, reserved: 0 }
          ]}
        ],
        repeat: "last"
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

### 8. `paymentDeclined` - Card Declined

```typescript
{
  id: "paymentDeclined",
  name: "Payment Declined",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 50, reserved: 0 },
          { id: "2", productId: "2", quantity: 15, reserved: 0 },
          { id: "3", productId: "3", quantity: 3, reserved: 0 }
        ]
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
    },
    {
      url: "http://localhost:3001/payments",
      method: "POST",
      response: {
        status: 402,
        body: {
          id: "pay_failed_123",
          status: "failed",
          error: "card_declined",
          message: "Your card was declined"
        }
      }
    }
  ]
}
```

### 9. `paymentServiceDown` - Payment API Error

```typescript
{
  id: "paymentServiceDown",
  name: "Payment Service Down",
  mocks: [
    {
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: { id: "current", email: "demo@payflow.com", name: "Demo User", tier: "pro" }
      }
    },
    {
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: [
          { id: "1", productId: "1", quantity: 50, reserved: 0 },
          { id: "2", productId: "2", quantity: 15, reserved: 0 },
          { id: "3", productId: "3", quantity: 3, reserved: 0 }
        ]
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
    },
    {
      url: "http://localhost:3001/payments",
      method: "POST",
      response: {
        status: 500,
        body: { error: "Service unavailable", message: "Payment service is temporarily unavailable" }
      }
    }
  ]
}
```

---

## Video Progression

| Video   | Scenarios Demonstrated                                                     |
| ------- | -------------------------------------------------------------------------- |
| Video 2 | None (shows the problem - manual testing, Testing Problem Table)           |
| Video 3 | `default`, `freeUser`, `soldOut`, `shippingServiceDown`, `paymentDeclined` |
| Video 4 | `sellsOutDuringCheckout` (sequences)                                       |
| Video 5 | Parallel isolation (multiple scenarios running simultaneously)             |

---

## Implementation Notes

### Server-Side vs Browser-Side

Scenarist intercepts **server-side HTTP calls**. This means:

- ✅ **Mockable**: Next.js API routes → User Service (server calls backend)
- ✅ **Mockable**: Next.js API routes → Inventory Service (server calls backend)
- ✅ **Mockable**: Next.js API routes → Shipping Service (server calls backend)
- ✅ **Mockable**: Next.js API routes → Payment Service (server calls backend)

The PayFlow architecture is designed so all critical business logic flows through server-side API calls, making them 100% testable with Scenarist.

### API Route to Backend Service Mapping

| Next.js API Route    | Backend Service Call    |
| -------------------- | ----------------------- |
| `GET /api/user`      | `GET /users/current`    |
| `GET /api/inventory` | `GET /inventory`        |
| `GET /api/shipping`  | `GET /shipping`         |
| `POST /api/checkout` | Calls all four services |

### Proving Interception

To prove Scenarist is intercepting requests:

1. Run json-server with logging enabled (`pnpm inventory`)
2. Run tests with Scenarist
3. Observe: json-server terminal shows **zero requests**

The backend services are running but never receive requests - Scenarist intercepts at the server level.
