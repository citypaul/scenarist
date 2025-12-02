---
"@scenarist/core": patch
---

fix: give stateResponse mocks same fallback specificity as sequence mocks

Fixed a bug where `stateResponse` mocks received specificity 0 while `sequence` mocks received specificity 1, causing sequences in default scenarios to always override stateResponse mocks in active scenarios.

The fix ensures both `sequence` and `stateResponse` mocks have equal fallback specificity (1), allowing the "last fallback wins" tiebreaker to work correctly when overriding default scenario mocks.

Fixes #316
