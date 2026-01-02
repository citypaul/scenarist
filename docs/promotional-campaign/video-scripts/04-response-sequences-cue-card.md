# Video 4: Response Sequences - Cue Card

**Duration:** 4-5 min | **Tag:** `video-04-sequences` | **App:** `demo/payflow-with-scenarist`

---

## Setup Before Recording

```bash
git checkout video-04-sequences
cd demo/payflow-with-scenarist
```

**Terminal 1:** `pnpm dev`
**Terminal 2:** `pnpm inventory`
**VS Code:** Open `src/scenarios.ts` and `tests/scenarios.spec.ts`

---

## Flow

### 1. HOOK (30s)

> "User loads page. 15 in stock. Adds to cart. Fills payment. Someone else buys last one. User clicks Pay... what happens?"
>
> "Impossible to test. Can't coordinate timing. Can't edit DB mid-test. With Scenarist sequences - test it in seconds."

### 2. THE PROBLEM (30s)

> "Traditional mocks: same response every time. Real systems aren't static. Stock changes. Payment statuses evolve. How do you test that?"

### 3. SHOW SEQUENCE CODE (30s)

Open `src/scenarios.ts`, scroll to `sellsOutDuringCheckout`:

```typescript
sequence: {
  responses: [
    { status: 200, body: [{ quantity: 15 }] },  // First call
    { status: 200, body: [{ quantity: 0 }] },   // Second call
  ],
  repeat: "last",
}
```

> "First call: 15 units. Second call: 0 units."

### 4. RUN THE TEST (90s)

```bash
pnpm exec playwright test --grep sellsOutDuringCheckout
```

Walk through as it runs:

1. "Products page - first call - 15 in stock"
2. "Add to cart"
3. "Checkout - second call - 0 units"
4. "Error: promotional offers no longer available"

**Point to json-server terminal:**

> "Zero requests. Backend never called."

### 5. WHY IMPOSSIBLE (30s)

> "Without Scenarist:"
>
> - "Edit DB mid-test? Unreproducible."
> - "Two browser sessions? Flaky."
> - "Mock at wrong layer? Not testing real code."
>
> "With Scenarist: Define sequence. Run test. Done."

### 6. CLOSE (30s)

> "Sequences work for anything that changes:"
>
> - "Payment polling: pending → processing → complete"
> - "Retries: fail → fail → succeed"
> - "Sessions: valid → expired"
>
> "Next video: test isolation when running in parallel."

---

## Key Phrases

- "Impossible to test reliably"
- "First call returns X, second call returns Y"
- "Deterministic. Reproducible. Every time."
- "Zero requests to the real backend"

## If Something Goes Wrong

- Test fails unexpectedly: Check scenario is registered, check test ID header
- json-server shows requests: MSW not intercepting, restart Next.js dev server
