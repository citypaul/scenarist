# @scenarist/msw-adapter

## 0.3.1

### Patch Changes

- Updated dependencies [[`401d57d`](https://github.com/citypaul/scenarist/commit/401d57d58e740905b1ae8d2cdba3edf03268661d)]:
  - @scenarist/core@0.3.1

## 0.3.0

### Minor Changes

- [#324](https://github.com/citypaul/scenarist/pull/324) [`4aed6dc`](https://github.com/citypaul/scenarist/commit/4aed6dc29c6cf44b6c1d0b0c8824116c50bc265c) Thanks [@citypaul](https://github.com/citypaul)! - Add robust error handling with graceful degradation

  **New Features:**
  - `ScenaristError` base class with error codes, context, and actionable hints
  - `ErrorCodes` constants for programmatic error handling
  - `ErrorBehaviors` configuration (`throw` | `warn` | `ignore`) for:
    - `onNoMockFound` - when no mock matches a request
    - `onSequenceExhausted` - when sequence runs out of responses
    - `onMissingTestId` - when request lacks test ID header
  - MSW handler error boundary with logging and 500 responses
  - `LogCategories` and `LogEvents` typed constants for structured logging
  - Comprehensive scenario validation at registration time

  **Error Codes:**
  - `SCENARIO_NOT_FOUND` - scenario doesn't exist
  - `DUPLICATE_SCENARIO` - scenario ID already registered
  - `NO_MOCK_FOUND` - no mock matched request
  - `SEQUENCE_EXHAUSTED` - sequence has no more responses
  - `MISSING_TEST_ID` - request missing test ID header
  - `VALIDATION_ERROR` - invalid scenario definition

### Patch Changes

- Updated dependencies [[`948fd31`](https://github.com/citypaul/scenarist/commit/948fd3156ef53f4afe202d99ad60a16f86b5d2ac), [`4aed6dc`](https://github.com/citypaul/scenarist/commit/4aed6dc29c6cf44b6c1d0b0c8824116c50bc265c)]:
  - @scenarist/core@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`630c3ec`](https://github.com/citypaul/scenarist/commit/630c3ec4063ca3ccc846b5e1e89697988a050809)]:
  - @scenarist/core@0.2.1

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

## 0.1.16

### Patch Changes

- [#302](https://github.com/citypaul/scenarist/pull/302) [`55be2ec`](https://github.com/citypaul/scenarist/commit/55be2ec37db61eef11f57abda595ef8efef734b1) Thanks [@citypaul](https://github.com/citypaul)! - Sync all package versions and add internal packages to fixed version group

  This release ensures all Scenarist packages are versioned together:
  - Added `@scenarist/core` and `@scenarist/msw-adapter` to the fixed version group
  - All packages now release with synchronized version numbers
  - Prevents version drift between internal and published packages

- Updated dependencies [[`55be2ec`](https://github.com/citypaul/scenarist/commit/55be2ec37db61eef11f57abda595ef8efef734b1)]:
  - @scenarist/core@0.1.16

## 0.1.3

### Patch Changes

- Updated dependencies [[`ec071b0`](https://github.com/citypaul/scenarist/commit/ec071b079c3e1c28312ca6471fc57259b3db85d8)]:
  - @scenarist/core@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [[`8f8c85b`](https://github.com/citypaul/scenarist/commit/8f8c85bced0936ea6f6bbce26b52282bebdfe5ab)]:
  - @scenarist/core@0.1.2

## 0.1.1

### Patch Changes

- [#235](https://github.com/citypaul/scenarist/pull/235) [`1b6d45f`](https://github.com/citypaul/scenarist/commit/1b6d45f645ae0f4b054826b042eed3b4510915d6) Thanks [@citypaul](https://github.com/citypaul)! - Security dependency updates and CI workflow fix to prevent SBOM artifacts from being committed to release PRs

- Updated dependencies [[`1b6d45f`](https://github.com/citypaul/scenarist/commit/1b6d45f645ae0f4b054826b042eed3b4510915d6)]:
  - @scenarist/core@0.1.1

## 0.1.0

### Minor Changes

- [#187](https://github.com/citypaul/scenarist/pull/187) [`628061f`](https://github.com/citypaul/scenarist/commit/628061f9b0b00f37be03a8a91d4a906e33056776) Thanks [@citypaul](https://github.com/citypaul)! - Sync internal package versions and republish with OIDC

  Bumps internal packages to 0.1.0 to align with adapter package versions (0.1.x).
  Previous 0.0.2 publish failed due to OIDC not being configured on npm.

### Patch Changes

- Updated dependencies [[`628061f`](https://github.com/citypaul/scenarist/commit/628061f9b0b00f37be03a8a91d4a906e33056776)]:
  - @scenarist/core@0.1.0

## 0.0.2

### Patch Changes

- [#185](https://github.com/citypaul/scenarist/pull/185) [`e66d285`](https://github.com/citypaul/scenarist/commit/e66d285848ad9c3b58e72db0e653d6a41c37b9ba) Thanks [@citypaul](https://github.com/citypaul)! - Republish internal packages with actual code

  The 0.0.1 versions on npm are placeholder packages for OIDC trusted publishing setup.
  This release publishes the actual implementation code.

- Updated dependencies [[`e66d285`](https://github.com/citypaul/scenarist/commit/e66d285848ad9c3b58e72db0e653d6a41c37b9ba)]:
  - @scenarist/core@0.0.2

## 0.0.1

### Patch Changes

- [#182](https://github.com/citypaul/scenarist/pull/182) [`b31f998`](https://github.com/citypaul/scenarist/commit/b31f99820320d3d07e5503fc26c69897e98f6795) Thanks [@citypaul](https://github.com/citypaul)! - Make internal packages publishable to npm

  Previously, `@scenarist/core` and `@scenarist/msw-adapter` were marked as private, but they are dependencies of the public adapter packages. When users installed adapters from npm, these internal dependencies could not be resolved.

  This change makes both internal packages publishable so they will be available on npm as transitive dependencies.

- Updated dependencies [[`b31f998`](https://github.com/citypaul/scenarist/commit/b31f99820320d3d07e5503fc26c69897e98f6795)]:
  - @scenarist/core@0.0.1
