---
"@scenarist/express-adapter": patch
---

docs: fix Express createScenarist() documentation to show async/await pattern

The `createScenarist()` function in the Express adapter returns a `Promise<ExpressScenarist<T> | undefined>`, but documentation examples incorrectly showed synchronous usage without `await`. This caused TypeScript errors when users followed the documentation.

**Changes:**

- Updated all Express documentation to use `await createScenarist(...)`
- Added factory function pattern for test setup (avoiding `let` variables)
- Fixed examples in README.md, getting-started.mdx, example-app.mdx, and related docs
- Added explicit notes that createScenarist is async where relevant
