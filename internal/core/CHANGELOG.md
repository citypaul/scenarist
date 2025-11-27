# @scenarist/core

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
