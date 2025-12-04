---
"@scenarist/core": patch
---

## State Logging for Debugging

Add state operation logging to help debug stateResponse and afterResponse.setState behavior.

### New Log Events

| Category | Event                     | Description                                        |
| -------- | ------------------------- | -------------------------------------------------- |
| state    | `state_set`               | Logged when `afterResponse.setState` is called     |
| state    | `state_response_resolved` | Logged when stateResponse conditions are evaluated |

### Log Data

**`state_set`:**

- `setState`: The state object being set

**`state_response_resolved`:**

- `result`: "default" or "condition"
- `currentState`: Current test state at evaluation time
- `conditionsCount`: Number of conditions in stateResponse
- `matchedWhen`: The matching condition's `when` clause (or null for default)
- `reason`: "no_state_manager" when stateManager not provided

### Usage

Enable the "state" category in your logger configuration:

```typescript
createConsoleLogger({
  level: "debug",
  categories: ["scenario", "matching", "state"],
});
```

Run tests with `SCENARIST_LOG=1` to see state operation logs.
