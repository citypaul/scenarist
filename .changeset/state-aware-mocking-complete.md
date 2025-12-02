---
"@scenarist/core": minor
"@scenarist/msw-adapter": minor
"@scenarist/express-adapter": minor
"@scenarist/nextjs-adapter": minor
"@scenarist/playwright-helpers": minor
---

feat: State-aware mocking (ADR-0019) now complete across all adapters

Adds three new state-aware mocking capabilities that enable state machine patterns where mock behavior changes based on accumulated state from previous requests:

- **stateResponse**: Return different responses based on current test state
- **afterResponse.setState**: Mutate state after returning a response
- **match.state + captureState**: Select mocks based on captured state

Example usage:

```typescript
const loanWorkflow: ScenaristScenario = {
  id: "loanApplication",
  mocks: [
    {
      method: "GET",
      url: "https://api.example.com/loan/status",
      stateResponse: {
        default: { status: 200, body: { status: "pending" } },
        conditions: [
          {
            when: { step: "submitted" },
            then: { status: 200, body: { status: "reviewing" } },
          },
          {
            when: { step: "reviewed" },
            then: { status: 200, body: { status: "approved" } },
          },
        ],
      },
    },
    {
      method: "POST",
      url: "https://api.example.com/loan/submit",
      response: { status: 200, body: { success: true } },
      afterResponse: { setState: { step: "submitted" } },
    },
  ],
};
```

State is automatically isolated per test ID and reset when switching scenarios.
