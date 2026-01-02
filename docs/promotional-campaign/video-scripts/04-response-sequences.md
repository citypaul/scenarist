# Video 4: Response Sequences - The Impossible Test

**Duration:** 4-5 minutes
**Type:** Live coding demo
**Demo App:** `demo/payflow-with-scenarist`
**Git Tag:** `video-04-sequences`

## Key Message

Response sequences let you test scenarios that are impossible with real services - like an item selling out between browsing and checkout.

---

## Script

### Opening Hook (0:00 - 0:30)

> "Here's a scenario every e-commerce developer knows: User loads the page. 15 items in stock. User adds to cart. User fills out payment details. Meanwhile, someone else buys the last one. User clicks Pay... and what happens?"
>
> "This is impossible to test reliably. You can't coordinate timing between two browser sessions. You can't manually edit the database mid-test. But with Scenarist's response sequences, you can test this in seconds."

### The Problem (0:30 - 1:00)

> "Traditional mocks return the same response every time. If you mock the inventory endpoint to return 15 units, it returns 15 units on every call."
>
> [Show slide: "Same endpoint. Same response. Every time."]
>
> "But real systems aren't static. Stock levels change. Payment statuses evolve. Sessions expire. How do you test that?"

### Introducing Sequences (1:00 - 1:30)

> "Scenarist sequences let you define multiple responses for the same endpoint. First call returns response A. Second call returns response B. And so on."
>
> [Show slide: Sequence diagram from visual aid]
>
> "The sequence tracks how many times an endpoint has been called and returns the appropriate response."

### Live Demo (1:30 - 3:30)

> "Let me show you. Here's our sellsOutDuringCheckout scenario."

[Show `src/scenarios.ts` - the sequence definition]

```typescript
{
  method: "GET",
  url: "http://localhost:3001/inventory",
  sequence: {
    responses: [
      // First call (products page): in stock
      { status: 200, body: [{ quantity: 15, ... }] },
      // Second call (checkout): sold out
      { status: 200, body: [{ quantity: 0, ... }] },
    ],
    repeat: "last",
  },
}
```

> "First call returns 15 units. Second call returns 0 units. Let's run the test."

[Run: `pnpm exec playwright test --grep sellsOutDuringCheckout`]

> "Watch what happens:"
>
> 1. "User visits the products page - first inventory call - 15 units in stock"
> 2. "User adds to cart"
> 3. "User goes to checkout - second inventory call - 0 units"
> 4. "Checkout fails with 'promotional offers are no longer available'"

[Show test passing]

> "The test passes. We've verified our app handles this edge case correctly. And look at the json-server terminal..."

[Point to json-server terminal]

> "Zero requests. The real backend was never called. Scenarist intercepted every request and served the sequence responses."

### Why This Matters (3:30 - 4:00)

> "Think about how you'd test this without Scenarist."

[Show slide: "Why This Is Impossible Without Scenarist"]

> "Option 1: Edit the database mid-test. Hope your timing is right. Completely unreproducible."
>
> "Option 2: Run two browser sessions. Have one buy all the stock. Hope the other hits checkout at exactly the right moment. Flaky doesn't begin to describe it."
>
> "Option 3: Mock at the wrong layer. You're not testing real code paths anymore."
>
> "With Scenarist: Define sequence. Run test. Done. Deterministic. Reproducible. Every time."

### Closing (4:00 - 4:30)

> "Sequences aren't just for inventory. They work for anything that changes over time:"
>
> - "Payment status polling: pending, processing, complete"
> - "Retry logic: fail, fail, succeed"
> - "Session expiry: valid, expired"
>
> "Same pattern. Endless possibilities."
>
> "In the next video, we'll look at how Scenarist keeps tests isolated when running in parallel."

---

## Key Points to Emphasize

1. **The "impossible" test** - This scenario cannot be reliably tested with real services
2. **Sequences track call count** - Each call advances to the next response
3. **Deterministic** - Same result every time, unlike timing-based approaches
4. **Zero backend requests** - MSW intercepts everything
5. **Real code paths** - Unlike function-level mocks, your actual HTTP code runs

## Terminal Setup

- Terminal 1: `pnpm dev` (Next.js on :3000)
- Terminal 2: `pnpm inventory` (json-server on :3001 - to show zero requests)
- VS Code with `src/scenarios.ts` and `tests/scenarios.spec.ts` open

## Potential Questions

**Q: What does `repeat: "last"` mean?**
A: After the sequence is exhausted, keep returning the last response. Other options: `cycle` (loop back to start) or `none` (throw error).

**Q: Does the sequence reset between tests?**
A: Yes! Each test gets its own isolated state. That's test ID isolation at work.

**Q: Can I have sequences on multiple endpoints?**
A: Absolutely. Each endpoint tracks its own call count independently.
