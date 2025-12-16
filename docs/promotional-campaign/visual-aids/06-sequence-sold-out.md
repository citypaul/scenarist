# Sequence: Offer Ends During Checkout

The killer demo - showing how the same endpoint returns different responses based on call order.

**When to show:** Video 8 (Response Sequences) - this is the "aha" moment

**What to say:**

> "This is the scenario that's impossible to test with real services. User loads the page, sees 5 promotional spots available. User adds to cart. User fills out payment. Meanwhile, someone else takes the last spots. User clicks Pay. What happens?"
>
> "With Scenarist, we define a sequence. First call: offer available. Second call: offer ended. Same endpoint. Different response. Based on call order."

## The Sequence

```mermaid
sequenceDiagram
    participant User
    participant App as PayFlow
    participant Scen as Scenarist
    participant Inv as json-server<br/>(Inventory)

    Note over Scen: Scenario: offerEndsDuringCheckout

    User->>App: View product page
    App->>Scen: GET /inventory/pro
    Note over Scen: Sequence call #1
    Scen-->>App: { available: 5, status: "limited_offer" }
    App-->>User: "5 left at this price" ✅

    User->>App: Add to cart
    User->>App: Go to checkout
    User->>App: Enter payment details

    Note over User,App: Meanwhile, someone else<br/>takes the last spots...

    User->>App: Click "Pay"
    App->>Scen: GET /inventory/pro
    Note over Scen: Sequence call #2
    Scen-->>App: { available: 0, status: "offer_ended" }
    App-->>User: "Sorry, offer ended" ❌

    Note over Inv: Never called!
```

## The Code

```typescript
// scenarios.ts
export const scenarios = {
  offerEndsDuringCheckout: {
    "GET /api/inventory/:id": sequence([
      { status: 200, body: { available: 5, status: "limited_offer" } }, // First call
      { status: 200, body: { available: 0, status: "offer_ended" } }, // Second call
    ]),
  },
};
```

```typescript
// test
test("handles offer ending during checkout", async ({
  page,
  switchScenario,
}) => {
  await switchScenario("offerEndsDuringCheckout");

  // First inventory call - shows offer available
  await page.goto("/products/pro");
  await expect(page.getByText("5 left at this price")).toBeVisible();

  // Add to cart, go to checkout
  await page.click("text=Add to Cart");
  await page.goto("/checkout");

  // Second inventory call - offer ended
  await page.click("text=Pay");
  await expect(page.getByText("Promotional Offers Ended")).toBeVisible();
});
```

## Why This Is Impossible Without Scenarist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              HOW WOULD YOU TEST THIS WITH REAL SERVICES?                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Option 1: Edit db.json mid-test                                           │
│  ─────────────────────────────────                                          │
│  • Open db.json                                                             │
│  • Wait for user to reach checkout                                         │
│  • Quickly change quantity to 0                                            │
│  • Hope timing works out                                                   │
│  • Result: Flaky, manual, unrepeatable                                     │
│                                                                             │
│  Option 2: Actual race condition                                            │
│  ────────────────────────────────                                           │
│  • Run two browser sessions                                                │
│  • Have one take all promotional spots                                     │
│  • Hope the other hits checkout at the right moment                        │
│  • Result: Impossible to reliably reproduce                                │
│                                                                             │
│  Option 3: Mock at the wrong layer                                         │
│  ──────────────────────────────────                                         │
│  • Mock the inventory function directly                                    │
│  • Result: Not testing real code paths                                     │
│                                                                             │
│  With Scenarist: Define sequence. Run test. Done.                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Points

- Sequences track call count per endpoint
- Each call advances to next response in sequence
- State resets between tests (isolated)
- This pattern also works for: polling, retries, state machines
