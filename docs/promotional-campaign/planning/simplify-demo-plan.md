# Plan: Simplify PayFlow Demo

**Branch:** `feat/payflow-simplify-demo`
**Goal:** Remove Auth0 and Stripe to create a 100% mockable demo

## Context

The PayFlow demo currently includes Auth0 (authentication) and Stripe (payments), which involve browser redirects that Scenarist cannot mock. This dilutes the demonstration of Scenarist's capabilities.

**Current architecture:**

```
Browser → Auth0 (redirect)           ❌ Not mockable
Browser → Next.js → User Service     ✅ Mockable
Browser → Next.js → Inventory        ✅ Mockable
Browser → Next.js → Shipping         ✅ Mockable
Browser → Stripe Checkout (redirect) ❌ Not mockable
```

**Target architecture:**

```
Browser → Next.js → User Service     ✅ Mockable
Browser → Next.js → Inventory        ✅ Mockable
Browser → Next.js → Shipping         ✅ Mockable
Browser → Next.js → Payment Service  ✅ Mockable (NEW)
```

## Files to Modify

### Remove Auth0

| File                            | Action                                      |
| ------------------------------- | ------------------------------------------- |
| `src/lib/auth0.ts`              | DELETE                                      |
| `src/proxy.ts`                  | DELETE (Auth0 proxy)                        |
| `src/app/auth/[auth0]/route.ts` | DELETE (if exists)                          |
| `src/contexts/auth-context.tsx` | REWRITE - fetch user from User Service only |
| `src/components/nav-user.tsx`   | SIMPLIFY - remove login/logout              |
| `src/components/login-form.tsx` | DELETE                                      |
| `src/app/(auth)/login/page.tsx` | DELETE or SIMPLIFY                          |
| `src/app/api/checkout/route.ts` | REMOVE Auth0 session checks                 |
| `src/app/api/orders/route.ts`   | REMOVE Auth0 session checks                 |

### Remove Stripe

| File                                    | Action                                 |
| --------------------------------------- | -------------------------------------- |
| `src/lib/stripe.ts`                     | DELETE                                 |
| `src/app/api/webhooks/stripe/route.ts`  | DELETE                                 |
| `src/app/api/checkout/route.ts`         | REWRITE - call Payment Service instead |
| `src/app/(dashboard)/checkout/page.tsx` | SIMPLIFY - no Stripe redirect          |

### Add Payment Service

| File                           | Action                          |
| ------------------------------ | ------------------------------- |
| `src/lib/payment.ts`           | CREATE - Payment Service client |
| `src/app/api/payment/route.ts` | CREATE - Payment API route      |
| `db.json`                      | ADD - payments endpoint         |

### Update Dependencies

| Package               | Action |
| --------------------- | ------ |
| `@auth0/nextjs-auth0` | REMOVE |
| `@stripe/stripe-js`   | REMOVE |
| `stripe`              | REMOVE |

### Update Documentation

| File                  | Action                                   |
| --------------------- | ---------------------------------------- |
| `video-scripts/*.md`  | UPDATE - remove Auth0/Stripe mentions    |
| `blog-posts/*.md`     | UPDATE - remove Auth0/Stripe mentions    |
| `PROGRESS.md`         | UPDATE - reflect simplified architecture |
| `scenario-mapping.md` | ADD - Payment Service scenarios          |

---

## Implementation Stages

### Stage 1: Remove Auth0 Dependencies

- [ ] Delete `src/lib/auth0.ts`
- [ ] Delete `src/proxy.ts`
- [ ] Delete auth routes if they exist
- [ ] Rewrite `auth-context.tsx` to use User Service only
- [ ] Simplify `nav-user.tsx` (remove login/logout buttons)
- [ ] Delete or simplify login page
- [ ] Remove Auth0 from `checkout/route.ts`
- [ ] Remove Auth0 from `orders/route.ts`
- [ ] Remove `@auth0/nextjs-auth0` from package.json
- [ ] Verify build passes

### Stage 2: Add Payment Service

- [ ] Create `src/lib/payment.ts` (Payment Service client)
- [ ] Create `src/app/api/payment/route.ts` (API route)
- [ ] Add payments data to `db.json`
- [ ] Update json-server script if needed

### Stage 3: Remove Stripe, Use Payment Service

- [ ] Delete `src/lib/stripe.ts`
- [ ] Delete `src/app/api/webhooks/stripe/route.ts`
- [ ] Rewrite `checkout/route.ts` to call Payment Service
- [ ] Update `checkout/page.tsx` - show success inline, no redirect
- [ ] Remove Stripe packages from package.json
- [ ] Verify build passes

### Stage 4: Update Documentation

- [ ] Update video scripts (remove Auth0/Stripe mentions)
- [ ] Update blog posts
- [ ] Update scenario-mapping.md with Payment Service scenarios
- [ ] Update PROGRESS.md

### Stage 5: Final Verification

- [ ] Run full build
- [ ] Test all user flows manually
- [ ] Verify all four services work (User, Inventory, Shipping, Payment)
- [ ] Verify json-server logs all requests
- [ ] Create PR

---

## New Payment Service Design

### Endpoint

```
POST http://localhost:3001/payments
```

### Request

```json
{
  "userId": "current",
  "amount": 123.45,
  "currency": "usd",
  "items": [{ "name": "Product A", "quantity": 2, "price": 49.99 }],
  "shippingOption": "express"
}
```

### Response (Success)

```json
{
  "id": "pay_123456",
  "status": "succeeded",
  "amount": 123.45,
  "currency": "usd",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Response (Failure)

```json
{
  "id": "pay_123456",
  "status": "failed",
  "error": "card_declined",
  "message": "Your card was declined"
}
```

### Scenarios for Testing

| Scenario             | Payment Service Response                            |
| -------------------- | --------------------------------------------------- |
| `default`            | `{ status: "succeeded" }`                           |
| `paymentDeclined`    | `{ status: "failed", error: "card_declined" }`      |
| `paymentServiceDown` | 500 error                                           |
| `paymentTimeout`     | Delay + timeout                                     |
| `insufficientFunds`  | `{ status: "failed", error: "insufficient_funds" }` |

---

## Updated Testing Problem Table

| Scenario                | User    | Inventory   | Shipping   | Payment  | Without Scenarist |
| ----------------------- | ------- | ----------- | ---------- | -------- | ----------------- |
| Happy path              | Pro     | Available   | All        | Success  | Easy              |
| Free user               | Free    | Available   | Any        | Success  | Edit db.json      |
| Offer ended             | Any     | 0 spots     | N/A        | N/A      | Edit + restart    |
| No express shipping     | Any     | Available   | No express | Success  | Edit db.json      |
| Shipping down           | Any     | Available   | 500        | N/A      | Kill server?      |
| Payment declined        | Any     | Available   | Any        | Declined | **Impossible**    |
| Payment timeout         | Any     | Available   | Any        | Timeout  | **Impossible**    |
| Offer ends mid-checkout | Any     | Available→0 | Any        | N/A      | **Impossible**    |
| 50 parallel tests       | Various | Various     | Various    | Various  | **Impossible**    |

---

## Environment Variables to Remove

```
AUTH0_SECRET
AUTH0_BASE_URL
AUTH0_ISSUER_BASE_URL
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

## Notes

- The demo user is always "logged in" - no authentication flow needed
- User Service determines the tier (the mockable part)
- Payment happens entirely server-side (no browser redirect)
- All four services are mockable with Scenarist
- Zero caveats in the demo presentation
