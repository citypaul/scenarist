# @scenarist/express-adapter

## 0.3.1

### Patch Changes

- Updated dependencies [[`401d57d`](https://github.com/citypaul/scenarist/commit/401d57d58e740905b1ae8d2cdba3edf03268661d)]:
  - @scenarist/core@0.3.1
  - @scenarist/msw-adapter@0.3.1

## 0.3.0

### Minor Changes

- [#322](https://github.com/citypaul/scenarist/pull/322) [`948fd31`](https://github.com/citypaul/scenarist/commit/948fd3156ef53f4afe202d99ad60a16f86b5d2ac) Thanks [@citypaul](https://github.com/citypaul)! - ## Logging Infrastructure

  Add comprehensive logging infrastructure for debugging scenario matching, state management, and request handling.

  ### New Features
  - **ConsoleLogger**: Human-readable or JSON output with colored test IDs, category icons, and level filtering
  - **NoOpLogger**: Zero-overhead silent logger (default)
  - **Logger Port**: Interface for custom logger implementations (Winston, Pino, etc.)

  ### Log Events

  | Category | Events                                                                               |
  | -------- | ------------------------------------------------------------------------------------ |
  | scenario | `scenario_registered`, `scenario_switched`, `scenario_cleared`, `scenario_not_found` |
  | matching | `mock_candidates_found`, `mock_match_evaluated`, `mock_selected`, `mock_no_match`    |

  ### Usage

  ```typescript
  import {
    createScenarist,
    createConsoleLogger,
  } from "@scenarist/express-adapter";

  const scenarist = createScenarist({
    enabled: true,
    scenarios,
    logger: createConsoleLogger({
      level: "debug",
      categories: ["scenario", "matching"],
      format: "pretty", // or 'json'
    }),
  });
  ```

  ### Environment Variable Pattern

  ```bash
  # Enable logging via environment variable
  SCENARIST_LOG=1 pnpm test
  ```

  ### Vitest Configuration

  Add `disableConsoleIntercept: true` to `vitest.config.ts` to see logging output for passing tests.

### Patch Changes

- Updated dependencies [[`948fd31`](https://github.com/citypaul/scenarist/commit/948fd3156ef53f4afe202d99ad60a16f86b5d2ac), [`4aed6dc`](https://github.com/citypaul/scenarist/commit/4aed6dc29c6cf44b6c1d0b0c8824116c50bc265c)]:
  - @scenarist/core@0.3.0
  - @scenarist/msw-adapter@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`630c3ec`](https://github.com/citypaul/scenarist/commit/630c3ec4063ca3ccc846b5e1e89697988a050809)]:
  - @scenarist/core@0.2.1
  - @scenarist/msw-adapter@0.2.1

## 0.2.0

### Minor Changes

- [#310](https://github.com/citypaul/scenarist/pull/310) [`ec877f8`](https://github.com/citypaul/scenarist/commit/ec877f8dbe67f65ec5d3449f6dbca4b942685470) Thanks [@citypaul](https://github.com/citypaul)! - feat: State-aware mocking (ADR-0019) now complete across all adapters

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

### Patch Changes

- [#313](https://github.com/citypaul/scenarist/pull/313) [`b819820`](https://github.com/citypaul/scenarist/commit/b8198205caf10145c27e0b10c67b02715ba743c3) Thanks [@citypaul](https://github.com/citypaul)! - docs: Add state-aware mocking documentation
  - Add comprehensive documentation page for state-aware mocking (ADR-0019)
  - Document three capabilities: state-driven responses, state transitions, and state-driven matching
  - Update stateful-mocks page to differentiate from state-aware mocking
  - Update combining-features page with state-aware mocking examples
  - Update all package READMEs with state-aware mocking links

- Updated dependencies [[`ec877f8`](https://github.com/citypaul/scenarist/commit/ec877f8dbe67f65ec5d3449f6dbca4b942685470), [`b819820`](https://github.com/citypaul/scenarist/commit/b8198205caf10145c27e0b10c67b02715ba743c3)]:
  - @scenarist/core@0.2.0
  - @scenarist/msw-adapter@0.2.0

## 0.1.16

### Patch Changes

- [#302](https://github.com/citypaul/scenarist/pull/302) [`55be2ec`](https://github.com/citypaul/scenarist/commit/55be2ec37db61eef11f57abda595ef8efef734b1) Thanks [@citypaul](https://github.com/citypaul)! - Sync all package versions and add internal packages to fixed version group

  This release ensures all Scenarist packages are versioned together:
  - Added `@scenarist/core` and `@scenarist/msw-adapter` to the fixed version group
  - All packages now release with synchronized version numbers
  - Prevents version drift between internal and published packages

- Updated dependencies [[`55be2ec`](https://github.com/citypaul/scenarist/commit/55be2ec37db61eef11f57abda595ef8efef734b1)]:
  - @scenarist/core@0.1.16
  - @scenarist/msw-adapter@0.1.16

## 0.1.15

### Patch Changes

- Updated dependencies [[`ec071b0`](https://github.com/citypaul/scenarist/commit/ec071b079c3e1c28312ca6471fc57259b3db85d8)]:
  - @scenarist/core@0.1.3
  - @scenarist/msw-adapter@0.1.3

## 0.1.14

### Patch Changes

- [#298](https://github.com/citypaul/scenarist/pull/298) [`fef07e4`](https://github.com/citypaul/scenarist/commit/fef07e4111ab0114dc860ef7e95a902237a72459) Thanks [@citypaul](https://github.com/citypaul)! - Simplify `createScenarist()` to synchronous API, aligning with Next.js adapters

  **API Change:**

  ```typescript
  // Before (async)
  const scenarist = await createScenarist({ enabled: true, scenarios });

  // After (sync)
  const scenarist = createScenarist({ enabled, scenarios });
  ```

  Investigation proved dynamic imports don't enable tree-shaking (conditional exports do), so the async pattern was unnecessary. This change provides a consistent developer experience across all Scenarist adapters.

## 0.1.13

### Patch Changes

- [#296](https://github.com/citypaul/scenarist/pull/296) [`7f3b441`](https://github.com/citypaul/scenarist/commit/7f3b44154bcb2009a5216cd63135a2baaf26a85b) Thanks [@citypaul](https://github.com/citypaul)! - docs: fix Express createScenarist() documentation to show async/await pattern

  The `createScenarist()` function in the Express adapter returns a `Promise<ExpressScenarist<T> | undefined>`, but documentation examples incorrectly showed synchronous usage without `await`. This caused TypeScript errors when users followed the documentation.

  **Changes:**
  - Updated all Express documentation to use `await createScenarist(...)`
  - Added factory function pattern for test setup (avoiding `let` variables)
  - Fixed examples in README.md, getting-started.mdx, example-app.mdx, and related docs
  - Added explicit notes that createScenarist is async where relevant

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

## 0.1.8

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
  - @scenarist/msw-adapter@0.1.2

## 0.1.4

### Patch Changes

- [#235](https://github.com/citypaul/scenarist/pull/235) [`1b6d45f`](https://github.com/citypaul/scenarist/commit/1b6d45f645ae0f4b054826b042eed3b4510915d6) Thanks [@citypaul](https://github.com/citypaul)! - Security dependency updates and CI workflow fix to prevent SBOM artifacts from being committed to release PRs

- Updated dependencies [[`1b6d45f`](https://github.com/citypaul/scenarist/commit/1b6d45f645ae0f4b054826b042eed3b4510915d6)]:
  - @scenarist/core@0.1.1
  - @scenarist/msw-adapter@0.1.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`628061f`](https://github.com/citypaul/scenarist/commit/628061f9b0b00f37be03a8a91d4a906e33056776)]:
  - @scenarist/core@0.1.0
  - @scenarist/msw-adapter@0.1.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`e66d285`](https://github.com/citypaul/scenarist/commit/e66d285848ad9c3b58e72db0e653d6a41c37b9ba)]:
  - @scenarist/core@0.0.2
  - @scenarist/msw-adapter@0.0.2

## 0.1.1

### Patch Changes

- Updated dependencies [[`b31f998`](https://github.com/citypaul/scenarist/commit/b31f99820320d3d07e5503fc26c69897e98f6795)]:
  - @scenarist/core@0.0.1
  - @scenarist/msw-adapter@0.0.1

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
