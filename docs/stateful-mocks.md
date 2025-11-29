# Stateful Mocks Guide

Stateful mocks allow you to capture data from requests and inject it into subsequent responses. This enables testing realistic workflows where the backend "remembers" previous requests.

## Why Stateful Mocks?

Many real-world scenarios require state that persists across multiple requests:

- **Shopping Carts** - Add items in multiple requests, then retrieve the full cart
- **Multi-Step Forms** - Capture user info across multiple form steps, inject into confirmation
- **User Sessions** - Login creates a session, subsequent requests use that session data
- **Incremental Updates** - PATCH requests that accumulate changes over time

Without stateful mocks, you'd need to:

- Hardcode response data that doesn't match what was sent
- Create separate scenarios for every possible state combination
- Lose the ability to test realistic user journeys

With stateful mocks, you can test these flows naturally.

---

## Quick Start: Shopping Cart

Let's build a simple shopping cart scenario that captures items and returns them.

### 1. Define the Scenario

```typescript
import { ScenaristScenario } from "@scenarist/core";

export const shoppingCartScenario: ScenaristScenario = {
  id: "shopping-cart",
  name: "Shopping Cart with State",
  description: "Add items to cart, then retrieve them",
  mocks: [
    // Add item endpoint - CAPTURES the item
    {
      method: "POST",
      url: "https://api.store.com/cart/items",
      captureState: {
        "items[]": "body.item", // Append to items array
      },
      response: {
        status: 200,
        body: { success: true, message: "Item added" },
      },
    },

    // Get cart endpoint - INJECTS the items
    {
      method: "GET",
      url: "https://api.store.com/cart",
      response: {
        status: 200,
        body: {
          items: "{{state.items}}", // Inject items array
          count: "{{state.items.length}}", // Inject array length
          total: 0,
        },
      },
    },
  ],
};
```

### 2. Use in Your Tests

```typescript
import { test, expect } from "@playwright/test";

test("add items to cart and retrieve them", async ({ page, request }) => {
  // Set the scenario
  await request.post("http://localhost:3000/__scenario__", {
    headers: { "x-scenarist-test-id": "cart-test-1" },
    data: { scenario: "shopping-cart" },
  });

  // Add first item
  await request.post("http://localhost:3000/api/cart/items", {
    headers: { "x-scenarist-test-id": "cart-test-1" },
    data: { item: "Apple" },
  });

  // Add second item
  await request.post("http://localhost:3000/api/cart/items", {
    headers: { "x-scenarist-test-id": "cart-test-1" },
    data: { item: "Banana" },
  });

  // Get cart - should contain both items
  const cart = await request.get("http://localhost:3000/api/cart", {
    headers: { "x-scenarist-test-id": "cart-test-1" },
  });

  const cartData = await cart.json();
  expect(cartData.items).toEqual(["Apple", "Banana"]);
  expect(cartData.count).toBe(2); // Number, not "2"!
});
```

### How It Works

1. **First POST** captures `{ item: 'Apple' }` → State becomes `{ items: ['Apple'] }`
2. **Second POST** captures `{ item: 'Banana' }` → State becomes `{ items: ['Apple', 'Banana'] }`
3. **GET** injects state into response → Returns actual array and count

**Key Feature:** The `items[]` syntax **appends** to the array instead of replacing it.

---

## State Capture Syntax

### Basic Capture

Capture a single value from the request:

```typescript
{
  method: 'POST',
  url: 'https://api.example.com/user',
  captureState: {
    userName: 'body.name',      // Captures request.body.name
    userEmail: 'body.email',    // Captures request.body.email
  },
  response: { status: 200, body: { success: true } },
}
```

**Request:** `POST { "name": "Alice", "email": "alice@example.com" }`
**State after:** `{ userName: "Alice", userEmail: "alice@example.com" }`

### Array Append Syntax

Use `[]` suffix to append to an array instead of replacing:

```typescript
{
  method: 'POST',
  url: 'https://api.example.com/cart/add',
  captureState: {
    'cartItems[]': 'body.item',  // Appends to array
  },
  response: { status: 200, body: { success: true } },
}
```

**First request:** `POST { "item": "Apple" }` → State: `{ cartItems: ['Apple'] }`
**Second request:** `POST { "item": "Banana" }` → State: `{ cartItems: ['Apple', 'Banana'] }`
**Third request:** `POST { "item": "Cherry" }` → State: `{ cartItems: ['Apple', 'Banana', 'Cherry'] }`

### Nested State Paths

Create nested objects using dot notation:

```typescript
{
  method: 'POST',
  url: 'https://api.example.com/profile/update',
  captureState: {
    'user.profile.name': 'body.name',
    'user.profile.bio': 'body.bio',
    'user.settings.theme': 'body.theme',
  },
  response: { status: 200, body: { success: true } },
}
```

**Request:** `POST { "name": "Alice", "bio": "Developer", "theme": "dark" }`
**State after:**

```json
{
  "user": {
    "profile": {
      "name": "Alice",
      "bio": "Developer"
    },
    "settings": {
      "theme": "dark"
    }
  }
}
```

### Capture from Headers or Query Params

Capture from any part of the request:

```typescript
{
  method: 'POST',
  url: 'https://api.example.com/session',
  captureState: {
    sessionToken: 'headers.authorization',  // From Authorization header
    userId: 'query.user_id',                // From ?user_id=123
    loginTime: 'body.timestamp',            // From request body
  },
  response: { status: 200, body: { success: true } },
}
```

---

## Template Injection

Templates allow you to inject captured state into response bodies.

### Pure Template Injection (Preserves Types)

When the **entire value** is a template, the raw value is injected:

```typescript
{
  method: 'GET',
  url: 'https://api.example.com/cart',
  response: {
    status: 200,
    body: {
      items: '{{state.cartItems}}',           // → ['Apple', 'Banana']  (array)
      count: '{{state.cartItems.length}}',    // → 2  (number)
      total: '{{state.totalPrice}}',          // → 15.99  (number)
      isActive: '{{state.isActive}}',         // → true  (boolean)
    },
  },
}
```

**Important:** Pure templates preserve JavaScript types:

- Arrays remain arrays (not stringified)
- Numbers remain numbers (not converted to strings)
- Booleans remain booleans
- Objects remain objects

### Mixed Template Injection (Converts to String)

When a template is **embedded in text**, it's converted to a string:

```typescript
{
  method: 'GET',
  url: 'https://api.example.com/greeting',
  response: {
    status: 200,
    body: {
      message: 'Hello {{state.userName}}, you have {{state.itemCount}} items',
      // → 'Hello Alice, you have 5 items'  (string)
    },
  },
}
```

### Array Length Templates

Access array properties using dot notation:

```typescript
{
  method: 'GET',
  url: 'https://api.example.com/summary',
  response: {
    status: 200,
    body: {
      itemCount: '{{state.items.length}}',    // → 3  (number)
      message: 'You have {{state.items.length}} items',  // → 'You have 3 items'  (string)
    },
  },
}
```

### Nested Path Templates

Access nested state using dot notation:

```typescript
{
  method: 'GET',
  url: 'https://api.example.com/profile',
  response: {
    status: 200,
    body: {
      name: '{{state.user.profile.name}}',
      email: '{{state.user.profile.email}}',
      city: '{{state.user.address.city}}',
    },
  },
}
```

### Missing Keys (Graceful Degradation)

If a state key doesn't exist, the template remains unchanged:

```typescript
{
  method: 'GET',
  url: 'https://api.example.com/user',
  response: {
    status: 200,
    body: {
      name: '{{state.userName}}',  // If userName not captured yet
      // → '{{state.userName}}'  (template stays as-is)
    },
  },
}
```

This is useful for optional fields or debugging.

---

## Multi-Step Forms

A common pattern is capturing data across multiple form steps and injecting it into a final confirmation.

```typescript
export const multiStepFormScenario: ScenaristScenario = {
  id: "multi-step-form",
  name: "Multi-Step Form",
  description: "Capture data across form steps",
  mocks: [
    // Step 1: Personal Info
    {
      method: "POST",
      url: "https://api.example.com/form/step1",
      captureState: {
        "form.name": "body.name",
        "form.email": "body.email",
        "form.phone": "body.phone",
      },
      response: {
        status: 200,
        body: {
          success: true,
          nextStep: "/form/step2",
        },
      },
    },

    // Step 2: Address
    {
      method: "POST",
      url: "https://api.example.com/form/step2",
      captureState: {
        "form.street": "body.street",
        "form.city": "body.city",
        "form.zipCode": "body.zipCode",
      },
      response: {
        status: 200,
        body: {
          success: true,
          message: "Thank you {{state.form.name}}!", // Inject from step 1
          nextStep: "/form/step3",
        },
      },
    },

    // Step 3: Payment
    {
      method: "POST",
      url: "https://api.example.com/form/step3",
      captureState: {
        "form.cardLast4": "body.cardNumber", // Just last 4 digits in real app
      },
      response: {
        status: 200,
        body: {
          success: true,
          nextStep: "/form/confirm",
        },
      },
    },

    // Final Confirmation - Inject ALL captured state
    {
      method: "GET",
      url: "https://api.example.com/form/confirm",
      response: {
        status: 200,
        body: {
          success: true,
          confirmation: {
            // Personal info from step 1
            name: "{{state.form.name}}",
            email: "{{state.form.email}}",
            phone: "{{state.form.phone}}",

            // Address from step 2
            street: "{{state.form.street}}",
            city: "{{state.form.city}}",
            zipCode: "{{state.form.zipCode}}",

            // Payment from step 3
            cardLast4: "{{state.form.cardLast4}}",

            // Static data
            confirmationId: "CONF-12345",
            timestamp: "2024-01-15T10:30:00Z",
          },
        },
      },
    },
  ],
};
```

### Using in Tests

```typescript
test("complete multi-step form", async ({ request }) => {
  const testId = "form-test-001";

  // Set scenario
  await request.post("http://localhost:3000/__scenario__", {
    headers: { "x-scenarist-test-id": testId },
    data: { scenario: "multi-step-form" },
  });

  // Step 1: Personal info
  await request.post("http://localhost:3000/api/form/step1", {
    headers: { "x-scenarist-test-id": testId },
    data: {
      name: "Alice Johnson",
      email: "alice@example.com",
      phone: "555-1234",
    },
  });

  // Step 2: Address
  const step2 = await request.post("http://localhost:3000/api/form/step2", {
    headers: { "x-scenarist-test-id": testId },
    data: {
      street: "123 Main St",
      city: "Portland",
      zipCode: "97201",
    },
  });

  const step2Data = await step2.json();
  expect(step2Data.message).toBe("Thank you Alice Johnson!");

  // Step 3: Payment
  await request.post("http://localhost:3000/api/form/step3", {
    headers: { "x-scenarist-test-id": testId },
    data: { cardNumber: "1234" },
  });

  // Get confirmation - all data injected
  const confirm = await request.get("http://localhost:3000/api/form/confirm", {
    headers: { "x-scenarist-test-id": testId },
  });

  const confirmData = await confirm.json();
  expect(confirmData.confirmation).toMatchObject({
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "555-1234",
    street: "123 Main St",
    city: "Portland",
    zipCode: "97201",
    cardLast4: "1234",
  });
});
```

---

## State Isolation and Reset

### Per-Test-ID Isolation

Each test ID has **completely independent state**:

```typescript
// Test A adds "Apple" to cart
await request.post("/api/cart/items", {
  headers: { "x-scenarist-test-id": "test-A" },
  data: { item: "Apple" },
});

// Test B adds "Banana" to cart
await request.post("/api/cart/items", {
  headers: { "x-scenarist-test-id": "test-B" },
  data: { item: "Banana" },
});

// Test A gets cart - only sees "Apple"
const cartA = await request.get("/api/cart", {
  headers: { "x-scenarist-test-id": "test-A" },
});
expect(cartA.items).toEqual(["Apple"]);

// Test B gets cart - only sees "Banana"
const cartB = await request.get("/api/cart", {
  headers: { "x-scenarist-test-id": "test-B" },
});
expect(cartB.items).toEqual(["Banana"]);
```

This allows **parallel test execution** without state interference.

### Automatic State Reset on Scenario Switch

When you switch scenarios, state is **automatically reset**:

```typescript
// Set shopping cart scenario, add items
await request.post("/__scenario__", {
  headers: { "x-scenarist-test-id": "test-1" },
  data: { scenario: "shopping-cart" },
});

await request.post("/api/cart/items", {
  headers: { "x-scenarist-test-id": "test-1" },
  data: { item: "Apple" },
});

// Switch to different scenario - state is reset
await request.post("/__scenario__", {
  headers: { "x-scenarist-test-id": "test-1" },
  data: { scenario: "user-profile" },
});

// Switch back to shopping cart - state is empty (fresh start)
await request.post("/__scenario__", {
  headers: { "x-scenarist-test-id": "test-1" },
  data: { scenario: "shopping-cart" },
});

const cart = await request.get("/api/cart", {
  headers: { "x-scenarist-test-id": "test-1" },
});
expect(cart.items).toBeUndefined(); // State was reset
```

**Important:** State is **only reset on successful scenario switch**. If the switch fails (scenario not found), state is preserved.

---

## Advanced Patterns

### User Session Flow

```typescript
export const userSessionScenario: ScenaristScenario = {
  id: "user-session",
  name: "User Session",
  description: "Login creates session, subsequent requests use it",
  mocks: [
    // Login - capture session token
    {
      method: "POST",
      url: "https://api.example.com/auth/login",
      captureState: {
        sessionToken: "body.email", // Use email as session identifier
        userId: "body.email",
      },
      response: {
        status: 200,
        body: {
          token: "mock-jwt-token",
          userId: "user-123",
        },
      },
    },

    // Get current user - inject session data
    {
      method: "GET",
      url: "https://api.example.com/user/me",
      response: {
        status: 200,
        body: {
          id: "user-123",
          email: "{{state.userId}}",
          name: "Test User",
          authenticated: true,
        },
      },
    },

    // Logout - could clear state (but state reset happens on scenario switch)
    {
      method: "POST",
      url: "https://api.example.com/auth/logout",
      response: {
        status: 200,
        body: { success: true },
      },
    },
  ],
};
```

### Incremental PATCH Updates

```typescript
export const profileUpdateScenario: ScenaristScenario = {
  id: "profile-updates",
  name: "Incremental Profile Updates",
  description: "PATCH requests accumulate changes",
  mocks: [
    // Update name
    {
      method: "PATCH",
      url: "https://api.example.com/user/profile",
      match: {
        body: { name: true }, // Only if request contains 'name'
      },
      captureState: {
        "profile.name": "body.name",
      },
      response: { status: 200, body: { success: true } },
    },

    // Update bio
    {
      method: "PATCH",
      url: "https://api.example.com/user/profile",
      match: {
        body: { bio: true }, // Only if request contains 'bio'
      },
      captureState: {
        "profile.bio": "body.bio",
      },
      response: { status: 200, body: { success: true } },
    },

    // Update avatar
    {
      method: "PATCH",
      url: "https://api.example.com/user/profile",
      match: {
        body: { avatar: true }, // Only if request contains 'avatar'
      },
      captureState: {
        "profile.avatar": "body.avatar",
      },
      response: { status: 200, body: { success: true } },
    },

    // Get profile - inject all updates
    {
      method: "GET",
      url: "https://api.example.com/user/profile",
      response: {
        status: 200,
        body: {
          name: "{{state.profile.name}}",
          bio: "{{state.profile.bio}}",
          avatar: "{{state.profile.avatar}}",
        },
      },
    },
  ],
};
```

### Polling Workflows with State

Combine sequences (Phase 2) with state (Phase 3):

```typescript
export const jobProcessingScenario: ScenaristScenario = {
  id: "job-processing",
  name: "Job Processing with State",
  description: "Start job, poll status, job remembers parameters",
  mocks: [
    // Start job - capture job parameters
    {
      method: "POST",
      url: "https://api.example.com/jobs",
      captureState: {
        "job.type": "body.type",
        "job.input": "body.input",
      },
      response: {
        status: 201,
        body: {
          jobId: "job-123",
          status: "pending",
        },
      },
    },

    // Poll job status - sequence + state injection
    {
      method: "GET",
      url: "https://api.example.com/jobs/:jobId",
      sequence: {
        responses: [
          {
            status: 200,
            body: {
              jobId: "job-123",
              status: "pending",
              type: "{{state.job.type}}", // Inject captured type
              progress: 0,
            },
          },
          {
            status: 200,
            body: {
              jobId: "job-123",
              status: "processing",
              type: "{{state.job.type}}",
              progress: 50,
            },
          },
          {
            status: 200,
            body: {
              jobId: "job-123",
              status: "complete",
              type: "{{state.job.type}}",
              input: "{{state.job.input}}", // Inject captured input
              result: "processed-output",
              progress: 100,
            },
          },
        ],
        repeat: "last",
      },
    },
  ],
};
```

---

## Common Pitfalls

### 1. Forgetting the Array Append Syntax

**Wrong:**

```typescript
captureState: {
  items: 'body.item',  // This REPLACES items on each request
}
```

**Right:**

```typescript
captureState: {
  'items[]': 'body.item',  // This APPENDS to items array
}
```

### 2. Expecting Type Conversion in Pure Templates

**Template:** `'{{state.count}}'`
**Value:** `5`
**Result:** `5` (number, not `"5"`)

If you need a string, use a mixed template:

```typescript
message: "Count: {{state.count}}"; // → "Count: 5" (string)
```

### 3. Not Accounting for State Reset

State is reset when switching scenarios. If you need to preserve data across scenario switches, use a different test ID.

### 4. Missing State Keys

**Pure templates** (entire value is a template like `"{{state.key}}"`) return `undefined` when the state key is missing. This provides type safety and prevents leaking template syntax to responses.

**Mixed templates** (template embedded in a string like `"User: {{state.name}}"`) keep the unreplaced template string. This is useful for debugging but can be confusing if you expect an error.

To check if state was captured:

```typescript
const response = await request.get("/api/data");
const data = await response.json();

// Pure template with missing state returns undefined
if (data.value === undefined) {
  console.log("State not captured yet");
}

// Mixed template with missing state keeps template string
if (typeof data.message === "string" && data.message.includes("{{")) {
  console.log("Some state keys not captured yet");
}
```

**See:** [ADR-0012](/docs/adrs/0012-template-missing-state-undefined.md) for the rationale behind pure template behavior.

---

## Testing Tips

### 1. Verify Pure Template Type Preservation

Always check that numbers stay numbers and arrays stay arrays:

```typescript
const cart = await request.get("/api/cart");
const cartData = await cart.json();

expect(cartData.count).toBe(3); // Number assertion
expect(typeof cartData.count).toBe("number"); // Type check
expect(Array.isArray(cartData.items)).toBe(true); // Array check
```

### 2. Test State Isolation

Verify concurrent tests don't interfere:

```typescript
test("concurrent tests have independent state", async ({ request }) => {
  // Start both tests in parallel
  await Promise.all([
    request.post("/api/cart/items", {
      headers: { "x-scenarist-test-id": "test-A" },
      data: { item: "Apple" },
    }),
    request.post("/api/cart/items", {
      headers: { "x-scenarist-test-id": "test-B" },
      data: { item: "Banana" },
    }),
  ]);

  // Each test sees only its own data
  const [cartA, cartB] = await Promise.all([
    request.get("/api/cart", { headers: { "x-scenarist-test-id": "test-A" } }),
    request.get("/api/cart", { headers: { "x-scenarist-test-id": "test-B" } }),
  ]);

  expect((await cartA.json()).items).toEqual(["Apple"]);
  expect((await cartB.json()).items).toEqual(["Banana"]);
});
```

### 3. Test State Reset Behavior

```typescript
test("state resets on scenario switch", async ({ request }) => {
  const testId = "reset-test";

  // Add data in scenario A
  await request.post("/__scenario__", {
    headers: { "x-scenarist-test-id": testId },
    data: { scenario: "shopping-cart" },
  });

  await request.post("/api/cart/items", {
    headers: { "x-scenarist-test-id": testId },
    data: { item: "Apple" },
  });

  // Switch to scenario B
  await request.post("/__scenario__", {
    headers: { "x-scenarist-test-id": testId },
    data: { scenario: "user-profile" },
  });

  // Switch back to scenario A - state should be empty
  await request.post("/__scenario__", {
    headers: { "x-scenarist-test-id": testId },
    data: { scenario: "shopping-cart" },
  });

  const cart = await request.get("/api/cart", {
    headers: { "x-scenarist-test-id": testId },
  });

  const cartData = await cart.json();
  expect(cartData.items).toBeUndefined(); // Fresh state
});
```

---

## Next Steps

- **Explore Examples**: Check out the example scenarios in `apps/express-example/src/scenarios.ts`
- **Try Bruno Tests**: Run the Bruno collection in `apps/express-example/bruno/Dynamic Responses/State/`
- **Read API Reference**: See the full API documentation for state features
- **Check Integration Tests**: See `apps/express-example/tests/stateful-scenarios.test.ts` for real-world test patterns

---

## Troubleshooting

### Templates Not Being Replaced

**Symptom:** Response contains `'{{state.userName}}'` instead of `'Alice'`

**Causes:**

1. State key was never captured (check your `captureState` configuration)
2. Wrong test ID (each test ID has independent state)
3. State was reset due to scenario switch

**Debug:**

```typescript
// Check if state was captured by looking for template strings
const response = await request.get("/api/user");
const data = await response.json();

if (typeof data.name === "string" && data.name.includes("{{")) {
  console.error("State not captured - template not replaced");
  console.error("Check captureState configuration");
}
```

### Array Not Appending

**Symptom:** Array only contains the last item added

**Cause:** Missing `[]` suffix in `captureState`

**Fix:**

```typescript
// Wrong
captureState: {
  items: 'body.item',  // Replaces
}

// Right
captureState: {
  'items[]': 'body.item',  // Appends
}
```

### Type Mismatch (Number as String)

**Symptom:** Got `"3"` instead of `3`

**This is actually correct!** Check if the template is pure:

```typescript
// Pure template → number
count: "{{state.items.length}}"; // → 3

// Mixed template → string
message: "You have {{state.items.length}} items"; // → 'You have 3 items'
```

If you need a number from a mixed template, you'll need to adjust your scenario to use a pure template instead.

---

## Summary

Stateful mocks enable realistic testing of:

- Shopping carts
- Multi-step forms
- User sessions
- Incremental updates
- Polling workflows

**Key concepts:**

- `captureState` extracts data from requests
- `{{state.key}}` templates inject data into responses
- `items[]` syntax appends to arrays
- Pure templates preserve types (arrays, numbers, booleans)
- State is isolated per test ID
- State resets on scenario switch

Start with simple capture/inject patterns and build up to complex multi-step workflows.
