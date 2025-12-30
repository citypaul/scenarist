# Wardley Map: Scenarist

A strategic analysis of Scenarist's position in the testing landscape.

## The Map

```
                                        EVOLUTION
                    Genesis        Custom Built       Product         Commodity
                       I                II              III              IV
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                                                                             │
V   │  ┌─────────────────────────────────────────────────────────────────────┐   │
I   │  │                        USER NEEDS                                    │   │
S   │  │  • Confidence code works in production                               │   │
I   │  │  • Fast test feedback                                                │   │
B   │  │  • Reliable tests (no flakes)                                        │   │
I   │  │  • Test edge cases (payment failures, outages)                       │   │
L   │  │  • Parallel test execution                                           │   │
I   │  └─────────────────────────────────────────────────────────────────────┘   │
T   │                              │                                              │
Y   │                              ▼                                              │
    │                                                                             │
    │     ┌──────────────────┐                                                    │
    │     │ SCENARIO-BASED   │◄─── Scenarist's innovation                         │
    │     │ TESTING          │     "Real code + controlled responses"             │
    │     │ (The Gap)        │                                                    │
    │     └────────┬─────────┘                                                    │
    │              │                                                              │
    │              ▼                                                              │
    │  ┌───────────────────┐   ┌───────────────────┐                              │
    │  │ Runtime Scenario  │   │ Test ID Isolation │◄─── Novel patterns           │
    │  │ Switching         │   │ (Parallel Tests)  │                              │
    │  └─────────┬─────────┘   └─────────┬─────────┘                              │
    │            │                       │                                        │
    │            └───────────┬───────────┘                                        │
    │                        ▼                                                    │
    │            ┌───────────────────────┐                                        │
    │            │ SCENARIST CORE        │                                        │
    │            │ • Declarative DSL     │◄─── Custom built                       │
    │            │ • Scenario Registry   │                                        │
    │            │ • State Management    │                                        │
    │            └───────────┬───────────┘                                        │
    │                        │                                                    │
    │       ┌────────────────┼────────────────┐                                   │
    │       ▼                ▼                ▼                                   │
    │  ┌─────────┐     ┌─────────┐     ┌─────────┐                                │
    │  │ Express │     │ Next.js │     │Playwright│◄─── Framework adapters        │
    │  │ Adapter │     │ Adapter │     │ Helpers  │     (Custom → Product)        │
    │  └────┬────┘     └────┬────┘     └────┬────┘                                │
    │       │               │               │                                     │
    │       └───────────────┼───────────────┘                                     │
    │                       ▼                                                     │
    │              ┌─────────────────┐                                            │
    │              │      MSW        │◄─── Key dependency (Product)               │
    │              │ (Mock Service   │                                            │
    │              │  Worker)        │                                            │
    │              └────────┬────────┘                                            │
    │                       │                                                     │
    │       ┌───────────────┼───────────────┐                                     │
    │       ▼               ▼               ▼                                     │
    │  ┌─────────┐    ┌──────────┐    ┌──────────┐                                │
    │  │  HTTP   │    │ Node.js  │    │TypeScript│◄─── Commodities                │
    │  │Protocol │    │ Runtime  │    │          │                                │
    │  └─────────┘    └──────────┘    └──────────┘                                │
    │                                                                             │
    └─────────────────────────────────────────────────────────────────────────────┘

    LEGEND:
    ┌───────┐
    │       │ = Component
    └───────┘
       │
       ▼    = Dependency (uses)

    ◄───    = Strategic annotation
```

## Evolution Placement Rationale

### Genesis (I) - Novel, Uncertain

| Component                  | Rationale                                            |
| -------------------------- | ---------------------------------------------------- |
| Scenario-based testing     | New category between unit and E2E tests              |
| Runtime scenario switching | Novel pattern - change backend state without restart |
| Test ID isolation          | Innovative approach to parallel test execution       |

### Custom Built (II) - Understood but Specialized

| Component                | Rationale                                   |
| ------------------------ | ------------------------------------------- |
| Scenarist Core           | Purpose-built for scenario management       |
| Declarative scenario DSL | Custom language for defining mock responses |
| Framework adapters       | Integration code for specific frameworks    |

### Product (III) - Standardized, Rentable

| Component       | Rationale                                         |
| --------------- | ------------------------------------------------- |
| MSW             | Mature product, active community, well-documented |
| Playwright      | Industry-standard testing framework               |
| Express/Next.js | Established web frameworks                        |

### Commodity (IV) - Utility

| Component     | Rationale                          |
| ------------- | ---------------------------------- |
| HTTP Protocol | Universal, standardized            |
| Node.js       | Ubiquitous runtime                 |
| TypeScript    | Near-commodity for web development |
| JSON          | Universal data format              |

---

## The Testing Gap

Scenarist addresses a specific gap in the testing landscape:

```
                    SPEED                              REALISM

    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │   UNIT TESTS          THE GAP           E2E TESTS          │
    │   ════════════        ═══════           ═════════          │
    │                                                             │
    │   ✓ Fast              ???????           ✓ Realistic        │
    │   ✓ Isolated                            ✓ Real browser     │
    │   ✓ Reliable                            ✓ Real server      │
    │                                                             │
    │   ✗ Not realistic                       ✗ Slow             │
    │   ✗ Mock everything                     ✗ Flaky            │
    │   ✗ Miss integrations                   ✗ Can't control    │
    │                                           external APIs    │
    │                                                             │
    │                    SCENARIST                                │
    │                    ═════════                                │
    │                                                             │
    │                    ✓ Real code executes                     │
    │                    ✓ Real browser                           │
    │                    ✓ Real server                            │
    │                    ✓ Controlled external APIs               │
    │                    ✓ Fast (mocked network)                  │
    │                    ✓ Reliable (deterministic)               │
    │                    ✓ Parallel execution                     │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

---

## Strategic Insights

### 1. Building on Giants

Scenarist creates **genesis-level value** by composing **commodity and product layers**:

```
Genesis Innovation    ←  Scenario abstraction, test isolation
        ↓
Custom Integration    ←  Adapters, DSL
        ↓
Product Foundation    ←  MSW, Playwright
        ↓
Commodity Base        ←  HTTP, Node.js, TypeScript
```

**Implication**: Focus innovation at the top. Don't reinvent the wheel below.

### 2. MSW is the Critical Dependency

MSW provides the HTTP interception capability that makes Scenarist possible:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Without MSW:  Browser ──► Server ──► External API         │
│                              (can't intercept)              │
│                                                             │
│   With MSW:     Browser ──► Server ──► MSW ──► Mock         │
│                              (Scenarist controls this)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Risk**: MSW changes could break Scenarist.
**Mitigation**: Pin versions, comprehensive integration tests, contribute upstream.

### 3. Framework Adapters are Necessary but Not Differentiating

```
Value Contribution:

    Scenario Model     ████████████████████████  High (core innovation)
    Test ID Isolation  ████████████████████      High (unique capability)
    Declarative DSL    ██████████████████        Medium-High (developer experience)
    Express Adapter    ████████                  Low (enables adoption)
    Next.js Adapter    ████████                  Low (enables adoption)
    Playwright Helper  ██████                    Low (convenience)
```

**Implication**: Adapters expand the addressable market but don't create lock-in.

### 4. The "Scenario" Abstraction is the Moat

The core innovation is the **scenario as a first-class concept**:

```typescript
// Traditional MSW - low-level, imperative
http.get('/api/user', () => {
  return HttpResponse.json({ tier: 'pro' })
})

// Scenarist - high-level, declarative
{
  id: 'premiumUser',
  mocks: [
    { url: '/api/user', response: { tier: 'pro' } },
    { url: '/api/payment', response: { status: 'success' } }
  ]
}
```

**Scenario benefits**:

- **Composable**: Combine multiple service states
- **Nameable**: `premiumUser` vs scattered mock definitions
- **Switchable**: Change at runtime without restart
- **Isolatable**: Different tests get different scenarios via test IDs

---

## Movement Predictions

### Components Moving Right (Toward Commodity)

| Component  | Current           | Predicted | Timeframe     |
| ---------- | ----------------- | --------- | ------------- |
| MSW        | Product           | Product+  | 1-2 years     |
| Playwright | Product           | Commodity | 2-3 years     |
| TypeScript | Product/Commodity | Commodity | Already there |

### Potential Disruptions

1. **Built-in framework mocking**: Next.js or others could build MSW-like capabilities in
2. **AI-generated tests**: Tools that auto-generate scenarios from API specs
3. **Cloud testing platforms**: Could commoditize scenario management

### Strategic Recommendations

1. **Double down on the scenario abstraction** - This is the moat
2. **Invest in developer experience** - Make scenarios easy to write and maintain
3. **Build community** - Scenario libraries that others can share
4. **Monitor MSW evolution** - Stay aligned with upstream changes
5. **Consider API spec integration** - Auto-generate scenarios from OpenAPI/GraphQL schemas

---

## Competitive Landscape

```
                        SCENARIO MANAGEMENT
                   Low ◄─────────────────► High

              ┌─────────────────────────────────────┐
    HIGH      │                                     │
              │   Testcontainers     ★ SCENARIST    │
    REALISM   │   (real services)    (scenario-     │
              │                       based)        │
              │                                     │
              ├─────────────────────────────────────┤
              │                                     │
    LOW       │   Jest mocks         MSW            │
              │   (function-level)   (HTTP-level)   │
              │                                     │
              └─────────────────────────────────────┘
```

| Tool             | Approach                 | Scenarist Advantage                           |
| ---------------- | ------------------------ | --------------------------------------------- |
| Jest mocks       | Function-level mocking   | Scenarist tests real HTTP calls               |
| MSW alone        | HTTP interception        | Scenarist adds scenario management            |
| Testcontainers   | Real services in Docker  | Scenarist is faster, more controllable        |
| WireMock         | HTTP stubbing (Java)     | Scenarist is TypeScript-native, better DX     |
| Nock             | HTTP interception (Node) | Scenarist adds scenarios + parallel isolation |
| Playwright mocks | Route-based mocking      | Scenarist works server-side, composes better  |

---

## Key Takeaways

1. **Scenarist fills a genuine gap** in the testing landscape between unit tests and E2E tests

2. **The scenario abstraction is the core innovation** - not the HTTP interception (MSW does that)

3. **Test ID isolation enables parallelism** - a key differentiator for large test suites

4. **Building on MSW is strategic** - leverage a mature product rather than build from scratch

5. **Framework adapters are table stakes** - necessary for adoption but not differentiating

6. **The market is developers frustrated with flaky E2E tests** - who want the realism without the pain
