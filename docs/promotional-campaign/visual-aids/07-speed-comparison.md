# Speed Comparison

Visual showing the performance difference between real services and Scenarist.

**When to show:** Video 3 (introducing Scenarist) - after showing interception

**What to say:**

> "Real API calls have latency. Auth0, 150 milliseconds. Inventory service, 50 milliseconds. Stripe, 300 milliseconds. That's half a second per test just waiting for networks. Multiply by 100 tests, that's almost a minute of waiting. With Scenarist? Under a millisecond per call. 100 tests in half a second. That's a 100x speedup."

## Per-Request Latency

```
Real Services                          Scenarist
─────────────────────────────────────────────────────────────────
Auth0 API          ~150ms              Auth0 mock         <1ms
Inventory API       ~50ms              Inventory mock     <1ms
Stripe API         ~300ms              Stripe mock        <1ms
─────────────────────────────────────────────────────────────────
Total per test     ~500ms              Total per test     <3ms
```

## Test Suite Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         100 TESTS COMPARISON                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WITHOUT SCENARIST (real services, sequential):                            │
│  ══════════════════════════════════════════════                            │
│                                                                             │
│  100 tests × 500ms network latency = 50 seconds                            │
│  + Test logic                       = 10 seconds                           │
│  + Sequential (can't parallelize)   = no speedup                           │
│  ────────────────────────────────────────────────                          │
│  TOTAL: ~60 seconds                                                        │
│                                                                             │
│                                                                             │
│  WITH SCENARIST (mocked, parallel):                                        │
│  ═══════════════════════════════════                                        │
│                                                                             │
│  100 tests × <3ms mock latency      = 0.3 seconds                          │
│  + Test logic                       = 10 seconds                           │
│  ÷ 10 parallel workers              = ~1 second                            │
│  ────────────────────────────────────────────────                          │
│  TOTAL: ~1 second                                                          │
│                                                                             │
│                                                                             │
│                        60x FASTER                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Visual Bar Chart (for slides)

```
Network Latency per Test:

Real Services  ████████████████████████████████████████████████░░  500ms
Scenarist      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  <3ms

100 Test Suite:

Real Services  ████████████████████████████████████████████████░░  60s
Scenarist      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1s
```

## CI/CD Impact

```
Daily CI runs: 50
Time saved per run: 59 seconds
Daily time saved: 49 minutes
Monthly time saved: 24 hours
Yearly time saved: 12 days

Plus: No flaky tests from network issues
Plus: No rate limiting from APIs
Plus: No credentials to manage
```

## Key Points

- Network latency dominates test time
- Scenarist eliminates network entirely
- Parallel execution multiplies the savings
- CI costs go down, developer happiness goes up
