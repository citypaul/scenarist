---
"@scenarist/core": patch
---

Security fixes for prototype pollution and ReDoS vulnerabilities

- **Prototype pollution prevention**: Guard against `__proto__`, `constructor`, and `prototype` keys in `InMemoryStateManager` state paths
- **ReDoS prevention**: Limit regex capture groups to 256 characters in template replacement to prevent catastrophic backtracking

These fixes address GitHub code scanning alerts #72, #73, and #92.
