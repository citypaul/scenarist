---
"@scenarist/core": minor
"@scenarist/msw-adapter": minor
"@scenarist/express-adapter": minor
"@scenarist/nextjs-adapter": minor
---

`errorBehaviors` and `logger` now reach request handling. Previously the Express and Next.js adapters dropped them, so `onNoMockFound`, `onSequenceExhausted` and `onMissingTestId` had no effect and `warn` never logged.

- All three behaviors now default to `'ignore'`, which keeps today's runtime behavior: `strictMode` alone decides unmatched requests (pass through, or `501` when `strictMode: true`).
- `'throw'` responds `500` with a JSON body carrying the error `code` and `message`. `'warn'` logs through the configured `logger`, then defers to `strictMode`.
- When several Scenarist instances share the MSW server, a `'throw'` from one instance is used only if no other instance has a mock for the request.
- `onMissingTestId` applies only when no test ID resolves. Adapters still fall back to `defaultTestId`; set `defaultTestId: ''` to make a missing `x-scenarist-test-id` header an error.
