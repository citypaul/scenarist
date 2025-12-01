# @scenarist/core

## 0.1.3

### Patch Changes

- [#300](https://github.com/citypaul/scenarist/pull/300) [`ec071b0`](https://github.com/citypaul/scenarist/commit/ec071b079c3e1c28312ca6471fc57259b3db85d8) Thanks [@citypaul](https://github.com/citypaul)! - Fix dependency declarations to prevent version conflicts

  **@scenarist/playwright-helpers:**
  - Move `@playwright/test` from dependencies to peerDependencies
  - Prevents bundling Playwright, allowing consumers to use their own installation

  **@scenarist/core:**
  - Remove unused `msw` dependency (was never imported in source code)
  - Core is a pure hexagonal domain with no MSW dependency; MSW integration lives in msw-adapter

## 0.1.2

### Patch Changes

- [#240](https://github.com/citypaul/scenarist/pull/240) [`8f8c85b`](https://github.com/citypaul/scenarist/commit/8f8c85bced0936ea6f6bbce26b52282bebdfe5ab) Thanks [@citypaul](https://github.com/citypaul)! - Security fixes for prototype pollution and ReDoS vulnerabilities
  - **Prototype pollution prevention**: Guard against `__proto__`, `constructor`, and `prototype` keys in `InMemoryStateManager` state paths
  - **ReDoS prevention**: Limit regex capture groups to 256 characters in template replacement to prevent catastrophic backtracking

  These fixes address GitHub code scanning alerts #72, #73, and #92.

## 0.1.1

### Patch Changes

- [#235](https://github.com/citypaul/scenarist/pull/235) [`1b6d45f`](https://github.com/citypaul/scenarist/commit/1b6d45f645ae0f4b054826b042eed3b4510915d6) Thanks [@citypaul](https://github.com/citypaul)! - Security dependency updates and CI workflow fix to prevent SBOM artifacts from being committed to release PRs

## 0.1.0

### Minor Changes

- [#187](https://github.com/citypaul/scenarist/pull/187) [`628061f`](https://github.com/citypaul/scenarist/commit/628061f9b0b00f37be03a8a91d4a906e33056776) Thanks [@citypaul](https://github.com/citypaul)! - Sync internal package versions and republish with OIDC

  Bumps internal packages to 0.1.0 to align with adapter package versions (0.1.x).
  Previous 0.0.2 publish failed due to OIDC not being configured on npm.

## 0.0.2

### Patch Changes

- [#185](https://github.com/citypaul/scenarist/pull/185) [`e66d285`](https://github.com/citypaul/scenarist/commit/e66d285848ad9c3b58e72db0e653d6a41c37b9ba) Thanks [@citypaul](https://github.com/citypaul)! - Republish internal packages with actual code

  The 0.0.1 versions on npm are placeholder packages for OIDC trusted publishing setup.
  This release publishes the actual implementation code.

## 0.0.1

### Patch Changes

- [#182](https://github.com/citypaul/scenarist/pull/182) [`b31f998`](https://github.com/citypaul/scenarist/commit/b31f99820320d3d07e5503fc26c69897e98f6795) Thanks [@citypaul](https://github.com/citypaul)! - Make internal packages publishable to npm

  Previously, `@scenarist/core` and `@scenarist/msw-adapter` were marked as private, but they are dependencies of the public adapter packages. When users installed adapters from npm, these internal dependencies could not be resolved.

  This change makes both internal packages publishable so they will be available on npm as transitive dependencies.
