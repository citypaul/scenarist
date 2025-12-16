# The Testing Problem

This table shows scenarios we need to test and how difficult they are without Scenarist.

**When to show:** Video 2, "The Testing Challenge" section (5:00-6:00)

**What to say:**

> "Here's what I need to test. Green means easy. Yellow means annoying. Red means hard or impossible. Look at how much red there is. And that 'sold out during checkout' scenario? Where the stock changes between page load and payment? Try doing that with real services."

## The Table

| Scenario                     | Auth0     | Inventory      | Stripe                 | Without Scenarist                |
| ---------------------------- | --------- | -------------- | ---------------------- | -------------------------------- |
| Happy path                   | Pro user  | In stock       | Success                | ✅ Just run the app              |
| Premium user discount        | Pro user  | In stock       | Success                | 🟡 Need Pro account in Auth0     |
| Free user sees full price    | Free user | In stock       | Success                | 🟡 Need separate Auth0 account   |
| Payment declined             | Any       | In stock       | Declined               | 🟡 Stripe test card works        |
| Out of stock                 | Any       | 0 left         | N/A                    | 🔴 Edit db.json, restart server  |
| Low stock urgency            | Any       | 3 left         | N/A                    | 🔴 Edit db.json manually         |
| **Sold out during checkout** | Any       | In stock → Out | N/A                    | 🔴 **Impossible**                |
| Inventory service down       | Any       | 500 error      | N/A                    | 🔴 Kill server mid-test?         |
| Auth0 returns error          | Error     | Any            | N/A                    | 🔴 How?                          |
| Webhook never arrives        | Any       | In stock       | Success but no webhook | 🔴 **Impossible**                |
| 50 tests in parallel         | Various   | Various        | Various                | 🔴 **Impossible** - shared state |

## Legend

- ✅ **Easy** - Works out of the box
- 🟡 **Annoying** - Possible but requires manual setup/switching
- 🔴 **Hard/Impossible** - Can't do it reliably, or can't do it at all

## Visual Version (for slides)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HOW HARD IS THIS TO TEST?                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Happy path                          Just run the app                    │
│                                                                             │
│  🟡 Different user tier                 Need multiple Auth0 accounts        │
│  🟡 Payment declined                    Stripe test card (4000...0002)      │
│                                                                             │
│  🔴 Out of stock                        Edit db.json? Restart?              │
│  🔴 Low stock (3 left)                  Edit db.json manually               │
│  🔴 SOLD OUT DURING CHECKOUT            Impossible with real services       │
│  🔴 Service returns 500                 Kill the server mid-test?           │
│  🔴 Webhook never arrives               Can't control Stripe                │
│  🔴 50 parallel tests                   They all share state                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  The more realistic your test, the harder it is to set up.                 │
│  The edge cases? Almost impossible.                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Points

- Stripe's test cards only solve ONE column
- Internal services (Inventory) have NO test mode
- Coordinating multiple services is the real challenge
- Sequences ("sold out during checkout") are impossible with real services
- Parallel testing requires isolated state - shared services can't provide this
