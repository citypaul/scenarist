---
"@scenarist/playwright-helpers": patch
---

Fix "No exports main defined" error by adding missing `main` and `types` fields, and changing `import` to `default` condition in exports for better bundler compatibility.
