---
"@scenarist/msw-adapter": patch
---

fix(security): prevent internal error message exposure in responses

Internal error messages are no longer exposed in HTTP error responses as they may contain sensitive information like file paths, database credentials, or implementation details (CWE-209, CWE-497).

- ScenaristError messages (intentional, safe) are still included in responses
- Unexpected error details are logged server-side only
