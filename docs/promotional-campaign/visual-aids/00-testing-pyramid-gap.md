# Testing Pyramid with Gap

Shows the traditional testing pyramid and where the gap exists that Scenarist fills.

**When to show:** Video 1, "What You Actually Need" section (3:15-4:00)

**What to say:**

> "The testing pyramid has a gap. Unit tests at the bottom - fast, isolated, but shallow. E2E tests at the top - realistic, but you can't control the external APIs. What you need is something in between."

## Diagram (Mermaid)

```mermaid
flowchart TB
    subgraph Pyramid["THE TESTING PYRAMID"]
        direction TB
        E2E["E2E Tests<br/>Real APIs"]
        INT["Integration Tests<br/>???"]
        UNIT["Unit Tests<br/>Mocked Everything"]
    end

    subgraph Problems["THE PROBLEMS"]
        direction TB
        P1["E2E: Can't control<br/>what APIs return"]
        P2["Integration: The Gap<br/>How do you test this?"]
        P3["Unit: Isolated but<br/>can't prove integration"]
    end

    E2E --- P1
    INT --- P2
    UNIT --- P3

    style E2E fill:#dbeafe,stroke:#3b82f6
    style INT fill:#fef3c7,stroke:#f59e0b
    style UNIT fill:#dcfce7,stroke:#22c55e
    style P2 fill:#fef3c7,stroke:#f59e0b,font-weight:bold
```

## ASCII Version (for slides)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE TESTING PYRAMID + THE GAP                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                  ▲                                           │
│                                 / \                                          │
│                                /   \                                         │
│                               /     \      E2E TESTS                         │
│                              / Real  \     • Real APIs (slow, expensive)     │
│                             /  APIs   \    • Can't control edge cases        │
│                            /───────────\   • Few scenarios possible          │
│                           /             \                                    │
│               ┌──────────/───────────────\──────────┐                       │
│               │    ░░░░░░░ THE GAP ░░░░░░░░░░░    │                       │
│               │                                    │                       │
│               │    Real browser + Real server +    │                       │
│               │    Controlled external APIs        │                       │
│               │                                    │                       │
│               │    SCENARIST FILLS THIS GAP       │                       │
│               │                                    │                       │
│               └────────────────────────────────────┘                       │
│                          /               \                                   │
│                         /                 \                                  │
│                        /   INTEGRATION     \                                 │
│                       /      TESTS          \                                │
│                      /───────────────────────\                               │
│                     /                         \                              │
│                    /        UNIT TESTS         \                             │
│                   /   • Mocked everything       \                            │
│                  /    • Fast but shallow         \                           │
│                 /     • Isolated from reality     \                          │
│                ─────────────────────────────────────                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Alternative: Side-by-Side Comparison

```mermaid
flowchart LR
    subgraph Before["WITHOUT SCENARIST"]
        direction TB
        B1["E2E Tests"]
        B2["??? Gap ???"]
        B3["Unit Tests"]
        B1 --> B2 --> B3
    end

    subgraph After["WITH SCENARIST"]
        direction TB
        A1["E2E Tests<br/>(Real APIs)"]
        A2["Scenario Tests<br/>(Controlled APIs)"]
        A3["Unit Tests<br/>(Mocked)"]
        A1 --> A2 --> A3
    end

    style B2 fill:#fee2e2,stroke:#ef4444
    style A2 fill:#dcfce7,stroke:#22c55e
```

## The Three Requirements

Show these as a checklist or bullet points:

```
What you need to fill the gap:

  ✓ Real browser (Playwright/Cypress)
    → Not jsdom - actual browser that users see

  ✓ Real server (your actual code)
    → Not mocked endpoints - your Next.js/Express app

  ✓ Controlled external APIs
    → You define what Auth0/Stripe/services return
    → Switch scenarios without restart
    → Isolated state per test
```

## Mermaid: What You Need

```mermaid
flowchart LR
    subgraph Solution["WHAT YOU NEED"]
        RB["Real Browser<br/>Playwright"]
        RS["Real Server<br/>Your App"]
        CA["Controlled APIs<br/>You decide responses"]
    end

    RB --> |"+"| RS --> |"+"| CA --> Result["Integration<br/>Tests That<br/>Actually Work"]

    style RB fill:#dbeafe,stroke:#3b82f6
    style RS fill:#dcfce7,stroke:#22c55e
    style CA fill:#fef3c7,stroke:#f59e0b
    style Result fill:#d1fae5,stroke:#10b981,font-weight:bold
```

## Key Points

- Traditional pyramid has a gap between unit tests and E2E
- Unit tests: fast but can't prove integration
- E2E tests: realistic but can't control external APIs
- The gap needs: real browser + real server + controlled APIs
- "SCENARIST FILLS THIS GAP" - the key positioning message
- Don't oversell in Video 1 - just establish the problem and requirements
