# The Testing Problem

This table shows scenarios we need to test and how difficult they are without Scenarist.

**When to show:** Video 2, "The Testing Challenge" section (4:00-5:30)

**What to say:**

> "Here's what I need to test. Green means easy. Yellow means annoying. Red means hard or impossible. Look at how much red there is. And that 'sells out during checkout' scenario? Where stock runs out between page load and payment? Try doing that with real services."

## The Table

| Scenario                      | User Service | Inventory       | Shipping    | Payment   | Without Scenarist                |
| ----------------------------- | ------------ | --------------- | ----------- | --------- | -------------------------------- |
| Happy path                    | Pro member   | In stock        | All options | Success   | ✅ Just run the app              |
| Pro member discount           | Pro member   | In stock        | Any         | Success   | 🟡 Edit db.json for tier         |
| Free user sees full price     | Free user    | In stock        | Any         | Success   | 🟡 Edit db.json for tier         |
| Sold out                      | Any          | 0 units left    | N/A         | N/A       | 🔴 Edit db.json, restart server  |
| Low stock urgency             | Any          | 3 units left    | N/A         | N/A       | 🔴 Edit db.json manually         |
| Express shipping unavailable  | Any          | In stock        | No express  | N/A       | 🔴 Edit db.json manually         |
| Shipping service down         | Any          | In stock        | 500 error   | N/A       | 🔴 Kill server mid-test?         |
| Payment declined              | Any          | In stock        | Any         | Declined  | 🔴 How do you make it decline?   |
| Payment service down          | Any          | In stock        | Any         | 500 error | 🔴 Kill server mid-test?         |
| **Sells out during checkout** | Any          | In stock → Gone | Any         | N/A       | 🔴 **Impossible**                |
| 50 tests in parallel          | Various      | Various         | Various     | Various   | 🔴 **Impossible** - shared state |

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
│  🟡 Different membership tier           Edit db.json, restart               │
│  🟡 Payment declined                    Edit db.json for payment mock       │
│                                                                             │
│  🔴 Sold out                            Edit db.json? Restart?              │
│  🔴 Low stock (3 units)                 Edit db.json manually               │
│  🔴 SELLS OUT DURING CHECKOUT           Impossible with real services       │
│  🔴 Service returns 500                 Kill the server mid-test?           │
│  🔴 Payment service down                Can't control json-server           │
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

- All four services are server-side HTTP calls (json-server on port 3001)
- No test mode for any of them - what you see is what you get
- Coordinating multiple services is the real challenge
- Sequences ("sells out during checkout") are impossible with real services
- Parallel testing requires isolated state - shared services can't provide this
