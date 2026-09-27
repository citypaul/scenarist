---
"@scenarist/core": minor
"@scenarist/msw-adapter": minor
"@scenarist/express-adapter": minor
"@scenarist/nextjs-adapter": minor
---

`errorBehaviors` and `logger` now reach request handling. Previously the Express and Next.js adapters dropped them, so `onNoMockFound`, `onSequenceExhausted` and `onMissingTestId` had no effect and `warn` never logged.

- All three behaviors now default to `'ignore'`, which keeps today's runtime behavior: `strictMode` alone decides unmatched requests (pass through, or `501` when `strictMode: true`).
- **The documented default changes from `'throw'` to `'ignore'`.** The `'throw'` default never took effect, and wiring it in as-is would have made every unmatched request return `500`, including in-process calls to your own app (for example with supertest). If you set only some behaviors, for example `errorBehaviors: { onNoMockFound: 'warn' }`, the ones you leave out are now `'ignore'`, not `'throw'`. Set them explicitly if you want `'throw'`.
- `'throw'` responds `500` with a JSON body carrying the error `code` and `message`. `'warn'` logs through the configured `logger`, then defers to `strictMode`.
- When several Scenarist instances share the MSW server, a `'throw'` from one instance is used only if no other instance has a mock for the request.
- `onMissingTestId` applies only when no test ID resolves. Adapters still fall back to `defaultTestId`; set `defaultTestId: ''` to make a missing `x-scenarist-test-id` header an error.
