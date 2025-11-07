---
description: Scaffold a new port interface with proper hexagonal architecture structure
---

Create a new port interface following Scenarist's hexagonal architecture patterns.

**Ask the user:**
1. What is the port name? (e.g., "ScenarioRegistry", "RequestContext")
2. What is the port's purpose? (brief description)
3. Is this a primary or secondary port?
   - Primary: Driving ports (e.g., ScenarioManager - application uses these)
   - Secondary: Driven ports (e.g., ScenarioStore - application implements these)

## Port Template

```typescript
import type { /* relevant types */ } from '../types/index.js';

/**
 * [Primary/Secondary] port for [purpose].
 *
 * [Detailed explanation of what this port does]
 *
 * **Architectural Role:**
 * - [Explain the role in hexagonal architecture]
 * - [Dependencies or relationships to other ports]
 * - [When to use this port]
 *
 * **Implementation Pattern:**
 * Implementations should...
 *
 * **Examples:**
 * - [Implementation1]: [Description]
 * - [Implementation2]: [Description]
 * - [Implementation3]: [Description]
 *
 * @example
 * \`\`\`typescript
 * // Example usage
 * \`\`\`
 */
export interface [PortName] {
  /**
   * [Method description]
   *
   * @param [paramName] [param description]
   * @returns [return description]
   */
  [methodName]([params]): [ReturnType];
}
```

## Checklist

After creating the port:

1. **File location:** `packages/core/src/ports/[port-name].ts`
2. **Export:** Add to `packages/core/src/ports/index.ts`:
   ```typescript
   export type { [PortName] } from './[port-name].js';
   ```
3. **Documentation:**
   - Clear JSDoc comments
   - Explain architectural role
   - List example implementations
   - Show usage example
4. **Method documentation:**
   - Each method has JSDoc
   - Document parameters and return types
   - Explain side effects or business rules
5. **Use `interface`** (not `type`)
6. **Immutable parameters:** Use `readonly` where applicable
7. **Return types:** Use `ScenaristResult<T, E>` for operations that can fail

## Rules

- ✅ Use `interface` (NEVER `type` for ports)
- ✅ Import types from `../types/index.js`
- ✅ Add `.js` extension to imports (ESM requirement)
- ✅ Comprehensive JSDoc documentation
- ✅ List multiple possible implementations
- ✅ Clear architectural purpose

## After Creation

1. Update `CLAUDE.md` if this introduces a new pattern
2. Consider creating a simple in-memory implementation
3. Add to implementation plan if needed
4. Create ADR if this is a significant architectural decision
