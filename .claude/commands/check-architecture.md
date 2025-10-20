---
description: Verify hexagonal architecture rules are maintained
---

Check the following hexagonal architecture rules in the codebase:

## Core Package Purity

1. **Verify zero framework dependencies in core:**
   - Check `packages/core/package.json` dependencies
   - Ensure no Express, Fastify, Next.js, or other framework imports
   - Only MSW types are allowed for type definitions

2. **Check port/type separation:**
   - All files in `packages/core/src/ports/` use `interface`
   - All files in `packages/core/src/types/` use `type` with `readonly`
   - No mixing of `interface` for data or `type` for ports

3. **Verify adapter isolation:**
   - Each adapter is in its own package
   - No adapter depends on another adapter
   - All adapters explicitly implement port interfaces using `implements`

## Specific Checks

Run these checks:

```bash
# Check for framework imports in core
grep -r "from 'express'" packages/core/src/ || echo "✅ No Express imports in core"
grep -r "from 'fastify'" packages/core/src/ || echo "✅ No Fastify imports in core"
grep -r "from 'next'" packages/core/src/ || echo "✅ No Next.js imports in core"

# Verify ports use interface
grep -L "export interface" packages/core/src/ports/*.ts && echo "❌ Some ports not using interface" || echo "✅ All ports use interface"

# Verify types use readonly
grep -L "readonly" packages/core/src/types/*.ts && echo "⚠️  Some types may not use readonly"
```

Report any violations found with specific file paths and recommendations.
