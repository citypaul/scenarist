---
"@scenarist/core": minor
"@scenarist/express-adapter": minor
"@scenarist/nextjs-adapter": minor
---

## Logging Infrastructure

Add comprehensive logging infrastructure for debugging scenario matching, state management, and request handling.

### New Features

- **ConsoleLogger**: Human-readable or JSON output with colored test IDs, category icons, and level filtering
- **NoOpLogger**: Zero-overhead silent logger (default)
- **Logger Port**: Interface for custom logger implementations (Winston, Pino, etc.)

### Log Events

| Category | Events                                                                               |
| -------- | ------------------------------------------------------------------------------------ |
| scenario | `scenario_registered`, `scenario_switched`, `scenario_cleared`, `scenario_not_found` |
| matching | `mock_candidates_found`, `mock_match_evaluated`, `mock_selected`, `mock_no_match`    |

### Usage

```typescript
import {
  createScenarist,
  createConsoleLogger,
} from "@scenarist/express-adapter";

const scenarist = createScenarist({
  enabled: true,
  scenarios,
  logger: createConsoleLogger({
    level: "debug",
    categories: ["scenario", "matching"],
    format: "pretty", // or 'json'
  }),
});
```

### Environment Variable Pattern

```bash
# Enable logging via environment variable
SCENARIST_LOG=1 pnpm test
```

### Vitest Configuration

Add `disableConsoleIntercept: true` to `vitest.config.ts` to see logging output for passing tests.
