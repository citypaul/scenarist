---
"@scenarist/nextjs-adapter": patch
---

Correct the Next.js README's tree-shaking troubleshooting. Dynamic imports do not bypass tree-shaking: they resolve through the same `production` export condition as static imports. Bundle inspection now searches for `__scenarist_shared_msw_server`, which survives minification, and skips the `.next/dev` directory that `next dev` writes.
