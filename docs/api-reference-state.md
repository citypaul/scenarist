# State API Reference

Quick reference for stateful mock features.

## ScenaristMock with State

```typescript
type ScenaristMock = {
  method: HttpMethod;
  url: string;

  // State capture (optional)
  captureState?: Record<string, string>;

  // Response (can use templates)
  response?: {
    status: number;
    body?: unknown; // Can contain templates
    headers?: Record<string, string>;
    delay?: number;
  };

  // Or sequence (can use templates in responses)
  sequence?: {
    responses: Array<{
      status: number;
      body?: unknown; // Can contain templates
      headers?: Record<string, string>;
      delay?: number;
    }>;
    repeat?: "last" | "cycle" | "none";
  };

  // Request matching (optional, combines with state)
  match?: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  };
};
```

---

## State Capture Syntax

### Basic Capture

```typescript
captureState: {
  stateKey: "sourcePath";
}
```

### Source Paths

| Path            | Captures From    | Example                                                   |
| --------------- | ---------------- | --------------------------------------------------------- |
| `body.field`    | Request body     | `body.name` → `request.body.name`                         |
| `headers.field` | Request headers  | `headers.authorization` → `request.headers.authorization` |
| `query.field`   | Query parameters | `query.user_id` → `?user_id=123`                          |

### State Key Modifiers

| Syntax            | Behavior             | Example                          |
| ----------------- | -------------------- | -------------------------------- |
| `key`             | Replace value        | `userName: 'body.name'`          |
| `key[]`           | Append to array      | `items[]: 'body.item'`           |
| `key.nested.path` | Create nested object | `user.profile.name: 'body.name'` |

### Examples

```typescript
// Simple capture
captureState: {
  userName: 'body.name',              // { userName: "Alice" }
}

// Array append
captureState: {
  'items[]': 'body.item',             // { items: ["Apple", "Banana"] }
}

// Nested paths
captureState: {
  'user.name': 'body.name',           // { user: { name: "Alice" } }
  'user.email': 'body.email',         // { user: { name: "Alice", email: "..." } }
}

// Multiple sources
captureState: {
  userName: 'body.name',              // From body
  sessionToken: 'headers.authorization', // From header
  userId: 'query.user_id',            // From query param
}
```

---

## Template Injection Syntax

### Template Format

```
{{state.path.to.value}}
```

### Pure Templates (Type Preserving)

When the entire value is a template, the raw JavaScript value is injected:

```typescript
response: {
  body: {
    items: '{{state.items}}',              // → ['Apple', 'Banana']  (array)
    count: '{{state.count}}',              // → 5  (number)
    isActive: '{{state.isActive}}',        // → true  (boolean)
    user: '{{state.user}}',                // → { name: "..." }  (object)
  }
}
```

**Types preserved:**

- Arrays stay arrays
- Numbers stay numbers
- Booleans stay booleans
- Objects stay objects
- `null` stays `null`

### Mixed Templates (String Conversion)

When a template is embedded in text, all values convert to strings:

```typescript
response: {
  body: {
    message: 'Hello {{state.userName}}',                    // → "Hello Alice"
    summary: 'You have {{state.items.length}} items',       // → "You have 5 items"
    list: 'Items: {{state.items}}',                         // → "Items: Apple,Banana"
  }
}
```

**Everything converts to string** via `String()`:

- Arrays → `"item1,item2,item3"`
- Numbers → `"123"`
- Booleans → `"true"` / `"false"`
- Objects → `"[object Object]"`

### Nested Path Access

```typescript
// State: { user: { profile: { name: "Alice" } } }

response: {
  body: {
    name: '{{state.user.profile.name}}',  // → "Alice"
  }
}
```

### Array Properties

```typescript
// State: { items: ["Apple", "Banana", "Cherry"] }

response: {
  body: {
    items: '{{state.items}}',             // → ["Apple", "Banana", "Cherry"]
    count: '{{state.items.length}}',      // → 3
  }
}
```

### Missing Keys

If a key doesn't exist in state, the template remains unchanged:

```typescript
// State: {} (empty)

response: {
  body: {
    name: '{{state.userName}}',  // → "{{state.userName}}"
  }
}
```

---

## State Isolation

### Per Test ID

Each test ID has completely independent state:

```typescript
// Test A
headers: { 'x-scenarist-test-id': 'test-a' }
// State for test-a: { items: ["Apple"] }

// Test B
headers: { 'x-scenarist-test-id': 'test-b' }
// State for test-b: { items: ["Banana"] }
```

### Automatic Reset on Scenario Switch

State is automatically cleared when switching scenarios (per test ID):

```typescript
// Set scenario A, add state
POST /__scenario__ { scenario: "cart" }
POST /cart/add { item: "Apple" }
// State: { items: ["Apple"] }

// Switch to scenario B - state cleared
POST /__scenario__ { scenario: "profile" }
// State: {} (empty)

// Switch back to scenario A - state still empty (fresh start)
POST /__scenario__ { scenario: "cart" }
// State: {} (empty)
```

**Exception:** State is NOT reset if scenario switch fails (scenario not found).

---

## Complete Examples

### Shopping Cart

```typescript
{
  id: 'cart',
  name: 'Shopping Cart',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.store.com/cart/items',
      captureState: {
        'items[]': 'body.item',
      },
      response: {
        status: 200,
        body: { success: true },
      },
    },
    {
      method: 'GET',
      url: 'https://api.store.com/cart',
      response: {
        status: 200,
        body: {
          items: '{{state.items}}',
          count: '{{state.items.length}}',
        },
      },
    },
  ],
}
```

### Multi-Step Form

```typescript
{
  id: 'form',
  name: 'Multi-Step Form',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.example.com/form/step1',
      captureState: {
        'form.name': 'body.name',
        'form.email': 'body.email',
      },
      response: { status: 200, body: { nextStep: '/step2' } },
    },
    {
      method: 'POST',
      url: 'https://api.example.com/form/step2',
      captureState: {
        'form.address': 'body.address',
      },
      response: {
        status: 200,
        body: {
          message: 'Thanks {{state.form.name}}!',
          nextStep: '/confirm',
        },
      },
    },
    {
      method: 'GET',
      url: 'https://api.example.com/form/confirm',
      response: {
        status: 200,
        body: {
          name: '{{state.form.name}}',
          email: '{{state.form.email}}',
          address: '{{state.form.address}}',
        },
      },
    },
  ],
}
```

### User Session

```typescript
{
  id: 'session',
  name: 'User Session',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.example.com/auth/login',
      captureState: {
        userId: 'body.email',
        sessionToken: 'headers.authorization',
      },
      response: {
        status: 200,
        body: { token: 'mock-token' },
      },
    },
    {
      method: 'GET',
      url: 'https://api.example.com/user/me',
      response: {
        status: 200,
        body: {
          email: '{{state.userId}}',
          authenticated: true,
        },
      },
    },
  ],
}
```

---

## State Manager Port (Advanced)

For custom state storage implementations:

```typescript
interface StateManager {
  /**
   * Get a single state value
   */
  get(testId: string, key: string): unknown;

  /**
   * Set a single state value
   */
  set(testId: string, key: string, value: unknown): void;

  /**
   * Get all state for a test ID
   */
  getAll(testId: string): Record<string, unknown>;

  /**
   * Reset all state for a test ID
   */
  reset(testId: string): void;
}
```

### Default Implementation

```typescript
import { createInMemoryStateManager } from "@scenarist/core";

const stateManager = createInMemoryStateManager();
```

### Custom Implementation Example

```typescript
import { StateManager } from "@scenarist/core";
import Redis from "ioredis";

class RedisStateManager implements StateManager {
  constructor(private redis: Redis) {}

  async get(testId: string, key: string): Promise<unknown> {
    const value = await this.redis.hget(`state:${testId}`, key);
    return value ? JSON.parse(value) : undefined;
  }

  async set(testId: string, key: string, value: unknown): Promise<void> {
    await this.redis.hset(`state:${testId}`, key, JSON.stringify(value));
  }

  async getAll(testId: string): Promise<Record<string, unknown>> {
    const data = await this.redis.hgetall(`state:${testId}`);
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = JSON.parse(value);
    }
    return result;
  }

  async reset(testId: string): Promise<void> {
    await this.redis.del(`state:${testId}`);
  }
}

// Usage
const stateManager = new RedisStateManager(redis);
const scenarist = createScenarist({
  enabled: true,
  defaultScenario,
  stateManager, // Inject custom implementation
});
```

---

## Type Definitions

```typescript
/**
 * State capture configuration
 */
type CaptureStateConfig = Record<string, string>;

/**
 * Examples:
 */
const examples: CaptureStateConfig = {
  // Simple capture
  userName: "body.name",

  // Array append
  "items[]": "body.item",

  // Nested paths
  "user.profile.name": "body.name",
  "user.profile.email": "body.email",

  // Different sources
  sessionToken: "headers.authorization",
  userId: "query.user_id",
  loginTime: "body.timestamp",
};
```

---

## Cheat Sheet

| Feature                  | Syntax                     | Result                                    |
| ------------------------ | -------------------------- | ----------------------------------------- |
| **Capture from body**    | `key: 'body.field'`        | Captures `request.body.field`             |
| **Capture from headers** | `key: 'headers.field'`     | Captures `request.headers.field`          |
| **Capture from query**   | `key: 'query.field'`       | Captures query parameter                  |
| **Array append**         | `'key[]': 'source'`        | Appends to array instead of replacing     |
| **Nested state**         | `'a.b.c': 'source'`        | Creates `{ a: { b: { c: value } } }`      |
| **Pure template**        | `'{{state.key}}'`          | Returns raw value (preserves type)        |
| **Mixed template**       | `'Text {{state.key}}'`     | Converts to string                        |
| **Array length**         | `'{{state.items.length}}'` | Returns number of items                   |
| **Nested access**        | `'{{state.user.name}}'`    | Accesses nested state                     |
| **Missing key**          | `'{{state.missing}}'`      | Returns `'{{state.missing}}'` (unchanged) |

---

## See Also

- [Stateful Mocks Guide](./stateful-mocks.md) - Comprehensive user guide
- [Core Functionality](./core-functionality.md) - Basic concepts
- [Response Sequences](./dynamic-responses.md#response-sequences) - Phase 2 sequences
- [Express Adapter README](../packages/express-adapter/README.md) - Express integration
