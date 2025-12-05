---
"@scenarist/msw-adapter": patch
---

fix: correct scenario switching priority when active scenario has fallback mock

When switching from the default scenario to a different scenario, mocks from the
active scenario now correctly take precedence over default scenario mocks.

Previously, if the default scenario had a sequence mock (specificity 1) and the
active scenario had a simple response mock (specificity 0), the default mock
would incorrectly win due to higher specificity. This violated user expectations
that switching to a scenario should use that scenario's mocks.

The fix changes mock selection priority:

1. If no active scenario is set → use default scenario mocks
2. If active scenario has a fallback mock (no match criteria) → use ONLY active mocks
3. If active scenario has only conditional mocks → include default as backup

A "fallback mock" is one without match criteria - it always matches if URL+method
match. When an active scenario explicitly covers an endpoint with a fallback mock,
default scenario mocks for that endpoint are now excluded.

Closes #335
