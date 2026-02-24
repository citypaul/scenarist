---
"@scenarist/core": patch
---

refactor: decompose large functions and extract shared utilities in core

- Extract duplicated `isRecord` and `isDangerousKey` into shared `type-guards` module
- Decompose `selectResponse` (~266 lines) into focused helpers (~25-35 lines each)
- Extract error factory functions matching existing codebase patterns
- Extract `applyTemplatesToString` from `applyTemplates`
- Remove `console.error` that bypassed the Logger port in `matchesRegex`
