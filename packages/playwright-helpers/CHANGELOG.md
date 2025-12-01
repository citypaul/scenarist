# @scenarist/playwright-helpers

## 0.1.13

## 0.1.12

### Patch Changes

- [#292](https://github.com/citypaul/scenarist/pull/292) [`3f8345e`](https://github.com/citypaul/scenarist/commit/3f8345e773aec1d5632463e94482fcf5576ce2cd) Thanks [@citypaul](https://github.com/citypaul)! - ### Documentation
  - Document Next.js multi-process singleton fix with links to GitHub issues ([vercel/next.js#68572](https://github.com/vercel/next.js/discussions/68572), [mswjs/msw#1644](https://github.com/mswjs/msw/issues/1644))
  - Add prominent package-specific documentation links to each README
  - Improve Next.js adapter README with router-specific getting started links (App Router / Pages Router)

## 0.1.11

### Patch Changes

- [#290](https://github.com/citypaul/scenarist/pull/290) [`dd3b8db`](https://github.com/citypaul/scenarist/commit/dd3b8db64e5b55d2f84ccd918caa5dc4372f0d11) Thanks [@citypaul](https://github.com/citypaul)! - Add tool comparison link to documentation tables

  Adds link to new comparison documentation section in package README documentation tables.

## 0.1.10

### Patch Changes

- [#285](https://github.com/citypaul/scenarist/pull/285) [`e855d57`](https://github.com/citypaul/scenarist/commit/e855d57dcdc32e0f508d45321e8712180b3557e3) Thanks [@citypaul](https://github.com/citypaul)! - docs: clarify scenario-based testing terminology
  - Add clear definition of "scenario-based testing" to distinguish from true E2E tests
  - Update terminology from "E2E tests" to "scenario-based tests" where appropriate
  - Remove internal testing documentation from package READMEs (consumer-focused)
  - Add prominent documentation links to scenarist.io

## 0.1.9

### Patch Changes

- [#273](https://github.com/citypaul/scenarist/pull/273) [`46199a1`](https://github.com/citypaul/scenarist/commit/46199a176eb86eadddaffeccedd029068f30112b) Thanks [@citypaul](https://github.com/citypaul)! - Fix absolute URL endpoint support for cross-origin API servers

  When the API server runs on a different host/port than the frontend, users can now provide an absolute URL for the `scenaristEndpoint` option. The endpoint is detected as absolute (starts with `http://` or `https://`) and used directly without prepending `baseURL`.

  **Before (broken):**

  ```typescript
  // Would produce invalid URL: http://localhost:3000http://localhost:9090/__scenario__
  scenaristEndpoint: "http://localhost:9090/__scenario__";
  ```

  **After (works):**

  ```typescript
  // Correctly hits http://localhost:9090/__scenario__
  scenaristEndpoint: "http://localhost:9090/__scenario__";
  ```

## 0.1.8

### Patch Changes

- [#269](https://github.com/citypaul/scenarist/pull/269) [`1051912`](https://github.com/citypaul/scenarist/commit/1051912e1dcaf87cabcf873a671d9cb52b32000b) Thanks [@citypaul](https://github.com/citypaul)! - Fix "No exports main defined" error by adding missing `main` and `types` fields, and changing `import` to `default` condition in exports for better bundler compatibility.

## 0.1.7

### Patch Changes

- [#254](https://github.com/citypaul/scenarist/pull/254) [`a21aaed`](https://github.com/citypaul/scenarist/commit/a21aaed8ee4bc1daade6af53a513e90b24a3c676) Thanks [@citypaul](https://github.com/citypaul)! - fix(security): add prototype pollution guards and Object.hasOwn checks
  - Add `isDangerousKey` guard to block `__proto__`, `constructor`, `prototype` keys
  - Use `Object.hasOwn` before reading object properties to prevent inherited property access
  - Replace direct property assignment with `Object.defineProperty` for safer writes
  - Add fuzz tests verifying security properties hold for arbitrary inputs

## 0.1.6

### Patch Changes

- [#251](https://github.com/citypaul/scenarist/pull/251) [`5503ae5`](https://github.com/citypaul/scenarist/commit/5503ae51f4833616cc62db7d154368e3c2a0d696) Thanks [@citypaul](https://github.com/citypaul)! - docs: improve documentation and terminology consistency
  - Replace "E2E testing" terminology with "scenario-based testing" for clarity
  - Add documentation links to scenarist.io in all adapter READMEs
  - Highlight React Server Components testing capability in Next.js adapter
  - Add links to parallel testing, philosophy, and getting started guides

## 0.1.5

### Patch Changes

- Updated dependencies [[`8f8c85b`](https://github.com/citypaul/scenarist/commit/8f8c85bced0936ea6f6bbce26b52282bebdfe5ab)]:
  - @scenarist/core@0.1.2

## 0.1.4

### Patch Changes

- [#235](https://github.com/citypaul/scenarist/pull/235) [`1b6d45f`](https://github.com/citypaul/scenarist/commit/1b6d45f645ae0f4b054826b042eed3b4510915d6) Thanks [@citypaul](https://github.com/citypaul)! - Security dependency updates and CI workflow fix to prevent SBOM artifacts from being committed to release PRs

- Updated dependencies [[`1b6d45f`](https://github.com/citypaul/scenarist/commit/1b6d45f645ae0f4b054826b042eed3b4510915d6)]:
  - @scenarist/core@0.1.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`628061f`](https://github.com/citypaul/scenarist/commit/628061f9b0b00f37be03a8a91d4a906e33056776)]:
  - @scenarist/core@0.1.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`e66d285`](https://github.com/citypaul/scenarist/commit/e66d285848ad9c3b58e72db0e653d6a41c37b9ba)]:
  - @scenarist/core@0.0.2

## 0.1.1

### Patch Changes

- Updated dependencies [[`b31f998`](https://github.com/citypaul/scenarist/commit/b31f99820320d3d07e5503fc26c69897e98f6795)]:
  - @scenarist/core@0.0.1

## 0.1.0

### Minor Changes

- [#164](https://github.com/citypaul/scenarist/pull/164) [`42e5798`](https://github.com/citypaul/scenarist/commit/42e5798860906ad59ea22883728fe37db865b652) Thanks [@citypaul](https://github.com/citypaul)! - Initial beta release of Scenarist - a hexagonal architecture library for MSW-based mock scenarios in E2E testing.

  ### Features
  - **Runtime scenario switching** - Switch backend states without application restarts
  - **Test ID isolation** - Run concurrent tests with different backend states via test IDs
  - **Request content matching** - Match requests by body, headers, query params, and regex patterns
  - **Response sequences** - Support polling and state machine patterns with ordered responses
  - **Stateful mocks** - Capture and inject state between requests using templates
  - **Production tree-shaking** - Zero overhead in production bundles via conditional exports

  ### Packages
  - `@scenarist/express-adapter` - Express middleware integration
  - `@scenarist/nextjs-adapter` - Next.js App Router and Pages Router support
  - `@scenarist/playwright-helpers` - Playwright test utilities for scenario switching
