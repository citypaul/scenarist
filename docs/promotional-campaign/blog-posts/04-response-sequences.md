# Response Sequences: Testing the Impossible

_Companion post for Video 4: Response Sequences_

---

Here's a scenario every e-commerce developer knows:

1. User loads the product page. 15 items in stock.
2. User adds item to cart.
3. User fills out payment details.
4. Meanwhile, someone else buys the last one.
5. User clicks "Pay"...

What happens? Does your app handle this gracefully? More importantly, **how do you test this?**

## The Testing Problem

Traditional mocking returns the same response every time:

```typescript
// This mock ALWAYS returns 15 units
server.use(
  http.get("/api/inventory", () => {
    return HttpResponse.json([{ quantity: 15 }]);
  }),
);
```

But real systems aren't static. Stock levels change. Payment statuses evolve. Sessions expire. API responses depend on _when_ you call them, not just _what_ you call.

### Your Options Without Scenarist

**Option 1: Edit the database mid-test**

- Open `db.json`
- Wait for the user to reach checkout
- Quickly change quantity to 0
- Hope your timing is right

Result: Flaky, manual, unreproducible.

**Option 2: Run two browser sessions**

- Start test user A browsing products
- Start test user B to buy all stock
- Hope user A hits checkout at exactly the right moment

Result: Impossible to reliably reproduce.

**Option 3: Mock at the function layer**

- Mock the inventory function to return different values
- But now you're not testing real HTTP calls

Result: Not testing actual code paths.

## Introducing Response Sequences

Scenarist's response sequences solve this elegantly:

```typescript
const sellsOutDuringCheckout: ScenaristScenario = {
  id: "sellsOutDuringCheckout",
  name: "Sells Out During Checkout",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      sequence: {
        responses: [
          // First call (products page): in stock
          {
            status: 200,
            body: [{ id: "1", quantity: 15, reserved: 0 }],
          },
          // Second call (checkout): sold out
          {
            status: 200,
            body: [{ id: "1", quantity: 0, reserved: 0 }],
          },
        ],
        repeat: "last",
      },
    },
  ],
};
```

The sequence tracks how many times an endpoint has been called:

- **First call**: Returns 15 units in stock
- **Second call**: Returns 0 units (sold out)
- **Subsequent calls**: Keeps returning 0 (`repeat: "last"`)

## The Test

```typescript
test("sellsOutDuringCheckout: Item sells out between browsing and checkout", async ({
  page,
  switchScenario,
}) => {
  await switchScenario(page, "sellsOutDuringCheckout");

  // First inventory call - items are in stock
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Add to Cart" })).toHaveCount(
    3,
  );

  // Add item to cart
  await page.getByRole("button", { name: "Add to Cart" }).first().click();

  // Go to checkout - second inventory call returns 0 units
  await page.goto("/checkout");
  await page.getByRole("button", { name: /Pay/ }).click();

  // Should show error
  await expect(
    page.getByText("promotional offers are no longer available"),
  ).toBeVisible();
});
```

**The result:**

- Deterministic - same result every time
- Fast - no timing coordination needed
- Real code paths - actual HTTP calls are made (and intercepted)
- Zero requests to the real backend

## Beyond Inventory: Where Sequences Shine

Sequences aren't just for stock levels. They're perfect for any scenario where responses change over time:

### Payment Status Polling

```typescript
sequence: {
  responses: [
    { status: 200, body: { status: "pending" } },
    { status: 200, body: { status: "processing" } },
    { status: 200, body: { status: "complete" } },
  ],
  repeat: "last",
}
```

### Retry Logic (Fail Then Succeed)

```typescript
sequence: {
  responses: [
    { status: 500, body: { error: "Service unavailable" } },
    { status: 500, body: { error: "Service unavailable" } },
    { status: 200, body: { success: true } },
  ],
  repeat: "last",
}
```

### Session Expiry

```typescript
sequence: {
  responses: [
    { status: 200, body: { user: "demo", valid: true } },
    { status: 401, body: { error: "Session expired" } },
  ],
  repeat: "last",
}
```

## Repeat Modes

Scenarist supports three repeat modes:

| Mode    | Behavior                                 |
| ------- | ---------------------------------------- |
| `last`  | Keep returning the last response forever |
| `cycle` | Loop back to the first response          |
| `none`  | Throw an error if sequence is exhausted  |

## Test Isolation

A crucial detail: **sequences reset between tests**. Each test gets its own isolated state thanks to Scenarist's test ID system. This means:

- Test A running `sellsOutDuringCheckout` won't affect Test B
- Tests can run in parallel without sequence interference
- No shared state pollution

## Try It Yourself

```bash
git clone https://github.com/citypaul/scenarist
cd scenarist/demo/payflow-with-scenarist
pnpm install
pnpm exec playwright test --grep sellsOutDuringCheckout
```

Watch the test verify a scenario that would be impossible to test reliably with real services.

---

## Key Takeaways

1. **Real APIs return different responses over time** - Traditional mocks can't simulate this
2. **Sequences track call count per endpoint** - First call returns A, second returns B
3. **Deterministic and reproducible** - No timing coordination needed
4. **Tests remain isolated** - Sequence state resets between tests
5. **Same pattern, endless uses** - Polling, retries, expiry, state machines

---

_Next in the series: Test Isolation - Running 50 Tests in Parallel_
