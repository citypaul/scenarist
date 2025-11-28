---
"@scenarist/express-adapter": patch
"@scenarist/nextjs-adapter": patch
"@scenarist/playwright-helpers": patch
---

fix(security): add prototype pollution guards and Object.hasOwn checks

- Add `isDangerousKey` guard to block `__proto__`, `constructor`, `prototype` keys
- Use `Object.hasOwn` before reading object properties to prevent inherited property access
- Replace direct property assignment with `Object.defineProperty` for safer writes
- Add fuzz tests verifying security properties hold for arbitrary inputs
