# Parallel Test Isolation

Shows how multiple tests run simultaneously with different scenarios, all isolated.

**When to show:** Video 3 (intro) and Video 10 (deep dive on parallel testing)

**What to say:**

> "Here's three tests running at the same time. Test A is testing a premium user. Test B is testing a free user. Test C is testing an out-of-stock scenario. Same server. Same endpoint. Different responses. Each test has its own isolated state."

## The Problem Without Scenarist

```mermaid
flowchart TB
    subgraph Tests["Tests (running in parallel)"]
        T1["Test A: Premium User"]
        T2["Test B: Free User"]
        T3["Test C: Out of Stock"]
    end

    subgraph Server["Shared Server"]
        S1["One json-server<br/>One state<br/>One db.json"]
    end

    T1 --> S1
    T2 --> S1
    T3 --> S1

    Note["💥 CONFLICT<br/>All tests hit same state<br/>Tests pollute each other<br/>Random failures"]

    style Note fill:#ef4444,color:#fff
```

## With Scenarist

```mermaid
flowchart TB
    subgraph Tests["Tests (running in parallel)"]
        T1["Test A<br/>x-scenarist-test-id: A"]
        T2["Test B<br/>x-scenarist-test-id: B"]
        T3["Test C<br/>x-scenarist-test-id: C"]
    end

    subgraph Server["One Server - Multiple Isolated States"]
        Router["Scenarist Router"]

        subgraph States["Isolated State per Test ID"]
            S1["State A<br/>scenario: premium<br/>tier: pro"]
            S2["State B<br/>scenario: free<br/>tier: free"]
            S3["State C<br/>scenario: outOfStock<br/>qty: 0"]
        end
    end

    T1 -->|"test-id: A"| Router
    T2 -->|"test-id: B"| Router
    T3 -->|"test-id: C"| Router

    Router --> S1
    Router --> S2
    Router --> S3

    style S1 fill:#3b82f6,color:#fff
    style S2 fill:#10b981,color:#fff
    style S3 fill:#f59e0b,color:#fff
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEST ID ISOLATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Every request includes a header:                                          │
│                                                                             │
│    x-scenarist-test-id: <unique-id>                                        │
│                                                                             │
│  Scenarist uses this to:                                                   │
│  1. Look up which scenario this test is using                              │
│  2. Maintain isolated state for this test                                  │
│  3. Return responses specific to this test                                 │
│                                                                             │
│  Result:                                                                    │
│  • 100 tests can run in parallel                                           │
│  • Each has its own scenario                                               │
│  • Each has its own state                                                  │
│  • Zero conflicts                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Numbers

```
Without Scenarist (sequential to avoid conflicts):
─────────────────────────────────────────────────
  50 tests × 2 seconds each = 100 seconds

With Scenarist (fully parallel):
─────────────────────────────────────────────────
  50 tests ÷ 10 workers = 5 batches × 0.5s = 2.5 seconds

  40x faster CI.
```

## Key Points

- Header-based routing: each request tagged with test ID
- One server instance serves all tests
- State is isolated per test ID
- No shared state = no conflicts = no flakiness
