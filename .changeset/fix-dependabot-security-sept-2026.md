---
"@scenarist/core": patch
"@scenarist/express-adapter": patch
"@scenarist/nextjs-adapter": patch
"@scenarist/playwright-helpers": patch
---

Raise the minimum `zod` version to 4.6.5 as part of remediating the September 2026 Dependabot and code-scanning findings. The published type declarations now reference `z.ZodInstanceOf`, which zod added in 4.6.0.
