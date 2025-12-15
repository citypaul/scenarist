---
"@scenarist/msw-adapter": patch
---

fix(security): redact stack traces from error logs in production

Stack traces are now only included in error logs when `NODE_ENV !== 'production'`.
This prevents potential information exposure through log aggregation systems,
as stack traces can reveal internal file paths, dependency versions, and
implementation details that could aid attackers.

Closes #391
