# Logging Infrastructure Implementation Plan

**Issue**: [#320 - World-class logging infrastructure](https://github.com/citypaul/scenarist/issues/320)
**Branch**: `feat/logging-infrastructure`
**Status**: In Progress
**Created**: 2024-12-03
**Last Updated**: 2024-12-03

---

## Working Agreement

### Incremental Development

We work in **small, frequent commits** with "known-good" states:

- Each commit should leave the codebase in a working state (tests pass, types check)
- Stop and show progress after each significant commit
- Ask questions for clarifications rather than making assumptions
- Follow TDD strictly: RED → GREEN → REFACTOR for each change

### Commit Checkpoints

After each commit, we pause to:

1. Verify tests pass
2. Verify types check
3. Review what was done
4. Discuss next steps
5. Update progress tracker

---

## Progress Tracker

### Phase 1: Logger Port & NoOpLogger

| Task                                       | Status | Notes                    |
| ------------------------------------------ | ------ | ------------------------ |
| Create Logger port interface (`logger.ts`) | Done   | Types + interface        |
| Create NoOpLogger implementation           | Done   | Singleton, zero overhead |
| Write NoOpLogger tests                     | Done   | 8 tests                  |
| Export from ports/index.ts                 | Done   | + adapters/index.ts      |

### Phase 2: ConsoleLogger

| Task                                | Status      | Notes                       |
| ----------------------------------- | ----------- | --------------------------- |
| Implement level filtering           | Not Started |                             |
| Implement category filtering        | Not Started |                             |
| Implement JSON format output        | Not Started |                             |
| Implement pretty format with colors | Not Started |                             |
| Implement persistent test ID colors | Not Started | Hash-based color assignment |
| Write ConsoleLogger tests           | Not Started |                             |

### Phase 3: TestLogger

| Task                     | Status      | Notes |
| ------------------------ | ----------- | ----- |
| Implement entry capture  | Not Started |       |
| Implement filter helpers | Not Started |       |
| Write TestLogger tests   | Not Started |       |

### Phase 4: Logger Factory & Config

| Task                             | Status      | Notes                 |
| -------------------------------- | ----------- | --------------------- |
| Add LoggingConfig type           | Not Started |                       |
| Add logger to BaseAdapterOptions | Not Started |                       |
| Implement createLoggerFromConfig | Not Started |                       |
| Implement env var override       | Not Started | `SCENARIST_LOG_LEVEL` |
| Write factory tests              | Not Started |                       |

### Phase 5: Core Integration

| Task                                  | Status      | Notes |
| ------------------------------------- | ----------- | ----- |
| Add logger to ResponseSelector        | Not Started |       |
| Add logging calls to ResponseSelector | Not Started |       |
| Add logger to ScenarioManager         | Not Started |       |
| Add logging calls to ScenarioManager  | Not Started |       |

### Phase 6: MSW Adapter Integration

| Task                                | Status      | Notes |
| ----------------------------------- | ----------- | ----- |
| Add logger to DynamicHandler        | Not Started |       |
| Add logging calls to DynamicHandler | Not Started |       |

### Phase 7: Framework Adapter Wiring

| Task                                        | Status      | Notes |
| ------------------------------------------- | ----------- | ----- |
| Wire logger in Express adapter              | Not Started |       |
| Wire logger in Next.js App Router adapter   | Not Started |       |
| Wire logger in Next.js Pages Router adapter | Not Started |       |

### Phase 8: Exports & Documentation

| Task                              | Status      | Notes |
| --------------------------------- | ----------- | ----- |
| Export logger types from core     | Not Started |       |
| Export logger factories from core | Not Started |       |
| Add usage examples to docs        | Not Started |       |

---

## Design Decision: Winston/Pino vs Custom Implementation

### Question

Should we use an established logging library (Winston, Pino, Bunyan) instead of building our own?

### Analysis

#### Arguments FOR using a library

| Benefit              | Details                                             |
| -------------------- | --------------------------------------------------- |
| **Battle-tested**    | Years of production use, edge cases handled         |
| **Rich features**    | Transports, formatters, log rotation, async logging |
| **Less maintenance** | Library maintainers handle bugs and updates         |
| **Performance**      | Pino especially is highly optimized                 |
| **Ecosystem**        | Integrations with monitoring tools, log aggregators |

#### Arguments AGAINST using a library

| Concern                    | Details                                              |
| -------------------------- | ---------------------------------------------------- |
| **Bundle size**            | Adds dependency weight to every user's project       |
| **Zero-overhead violated** | Library code imported even when logging disabled     |
| **Custom semantics**       | Our LogContext (testId, scenarioId) doesn't map 1:1  |
| **Tree-shaking conflict**  | Scenarist's core value is zero production footprint  |
| **Coupling**               | Baking in Winston couples us to their API evolution  |
| **Simple needs**           | We only need console + JSON, not transports/rotation |

#### Our Specific Requirements

1. **Zero overhead when disabled** - Critical for production tree-shaking
2. **Persistent test ID colors** - Custom logic Winston wouldn't provide
3. **Category filtering** - Domain-specific (matching, state, sequence, etc.)
4. **LogContext with testId** - Core to our test isolation model
5. **Integration with hexagonal architecture** - Port/adapter pattern

### Recommendation: Custom Implementation with Library Compatibility

**Build lightweight implementations ourselves, but ensure the Logger interface is compatible with library wrappers.**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Logger Port (Interface)                  │
│  - Defines contract for all logging                             │
│  - Category, LogContext, LogEntry types                         │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  NoOpLogger   │     │  ConsoleLogger  │     │  User's Custom  │
│  (built-in)   │     │   (built-in)    │     │  Winston/Pino   │
│               │     │                 │     │    Wrapper      │
│  Zero bytes   │     │  ~2KB gzipped   │     │                 │
│  in prod      │     │  Pretty + JSON  │     │  Full library   │
│               │     │  Colored IDs    │     │  features       │
└───────────────┘     └─────────────────┘     └─────────────────┘
```

**Why this approach:**

1. **Users who want simple logging** get it with zero extra dependencies
2. **Users who want Winston/Pino** can wrap it themselves (we document how)
3. **Zero production footprint** maintained (NoOpLogger)
4. **Hexagonal architecture** preserved (Logger is a port)
5. **No forced opinions** on logging infrastructure

### Example: Winston Wrapper (for documentation)

```typescript
import winston from "winston";
import type { Logger, LogCategory, LogContext } from "@scenarist/core";

const winstonLogger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export const createWinstonLogger = (): Logger => ({
  error: (cat, msg, ctx, data) =>
    winstonLogger.error(msg, { category: cat, ...ctx, ...data }),
  warn: (cat, msg, ctx, data) =>
    winstonLogger.warn(msg, { category: cat, ...ctx, ...data }),
  info: (cat, msg, ctx, data) =>
    winstonLogger.info(msg, { category: cat, ...ctx, ...data }),
  debug: (cat, msg, ctx, data) =>
    winstonLogger.debug(msg, { category: cat, ...ctx, ...data }),
  trace: (cat, msg, ctx, data) =>
    winstonLogger.silly(msg, { category: cat, ...ctx, ...data }),
  isEnabled: (level) => winstonLogger.isLevelEnabled(level),
});

// Usage:
const scenarist = createScenarist({
  enabled: true,
  scenarios,
  logger: createWinstonLogger(),
});
```

### Decision

**Custom implementation** with:

- NoOpLogger (zero overhead)
- ConsoleLogger (pretty + JSON, colored test IDs)
- TestLogger (test assertions)
- Documented Winston/Pino wrapper pattern for power users

---

## Architecture

### Hexagonal Architecture Fit

Logger is a **driven port** (secondary port) - domain logic calls out to it, implementations are injected.

```
User Config → Adapter (creates Logger) → Core (uses Logger port) → Implementation
```

### Why a Port?

- **Dependency Injection**: Domain depends on interface, not implementation
- **Testability**: Inject TestLogger to assert logging behavior
- **Flexibility**: Users provide custom loggers (Winston, Pino, etc.)
- **Zero Overhead**: NoOpLogger compiles to nothing

---

## Logger Port Interface

**File**: `internal/core/src/ports/driven/logger.ts`

```typescript
/**
 * Log levels ordered by verbosity (ascending).
 * Each level includes all less verbose levels.
 */
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug" | "trace";

/**
 * Log categories for filtering specific areas of concern.
 */
export type LogCategory =
  | "lifecycle" // Startup, shutdown, initialization
  | "scenario" // Scenario switching, registration
  | "matching" // Mock selection, URL/method matching, specificity
  | "sequence" // Sequence position, advancement, exhaustion
  | "state" // State capture, injection, mutation
  | "template" // Template replacement
  | "request"; // Request/response lifecycle

/**
 * Base context included in all log events.
 * Enables filtering and correlation by test ID.
 */
export type LogContext = {
  readonly testId?: string;
  readonly scenarioId?: string;
  readonly requestUrl?: string;
  readonly requestMethod?: string;
};

/**
 * Structured log entry for capture and serialization.
 */
export type LogEntry = {
  readonly level: Exclude<LogLevel, "silent">;
  readonly category: LogCategory;
  readonly message: string;
  readonly context: LogContext;
  readonly data?: Record<string, unknown>;
  readonly timestamp: number;
};

/**
 * Secondary port for structured logging.
 *
 * All methods return void - logging is fire-and-forget.
 * Implementations should never throw.
 */
export interface Logger {
  error(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  warn(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  info(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  debug(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  trace(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  /**
   * Check if a specific level would be logged.
   * Guards expensive operations before logging.
   */
  isEnabled(level: Exclude<LogLevel, "silent">): boolean;
}
```

---

## Logger Implementations

### NoOpLogger (Zero Overhead)

**File**: `internal/core/src/adapters/noop-logger.ts`

```typescript
export class NoOpLogger implements Logger {
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
  trace(): void {}
  isEnabled(): boolean {
    return false;
  }
}

export const noOpLogger: Logger = new NoOpLogger();
export const createNoOpLogger = (): Logger => noOpLogger;
```

### ConsoleLogger (Development)

**File**: `internal/core/src/adapters/console-logger.ts`

Features:

- Level filtering (only emit at/above configured level)
- Category filtering (optional subset of categories)
- Pretty format with ANSI colors
- JSON format for log aggregation
- **Persistent test ID colors** (hash-based assignment)

#### Test ID Color System

Each test ID gets a unique, persistent color from a predefined palette:

```typescript
const TEST_ID_COLORS = [
  "\x1b[36m", // Cyan
  "\x1b[33m", // Yellow
  "\x1b[35m", // Magenta
  "\x1b[32m", // Green
  "\x1b[34m", // Blue
  "\x1b[91m", // Bright Red
  "\x1b[92m", // Bright Green
  "\x1b[93m", // Bright Yellow
  "\x1b[94m", // Bright Blue
  "\x1b[95m", // Bright Magenta
  "\x1b[96m", // Bright Cyan
] as const;

// Hash function for consistent color assignment
private getTestIdColor(testId: string): string {
  let color = this.testIdColors.get(testId);
  if (!color) {
    const hash = this.hashString(testId);
    const colorIndex = Math.abs(hash) % TEST_ID_COLORS.length;
    color = TEST_ID_COLORS[colorIndex];
    this.testIdColors.set(testId, color);
  }
  return color;
}
```

#### Category Icons

```typescript
const CATEGORY_ICONS: Record<LogCategory, string> = {
  lifecycle: "🔄",
  scenario: "🎬",
  matching: "🎯",
  sequence: "📊",
  state: "💾",
  template: "📝",
  request: "🌐",
};
```

#### Pretty Format Example

```
12:34:56.789 [test-user-login] 🎯 matching  mock_selected        mockIndex=2 specificity=5
12:34:56.790 [test-checkout]   💾 state     state_captured       key=userId value="user-123"
12:34:56.791 [test-user-login] 🌐 request   response_sent        status=200
```

#### JSON Format Example

```json
{
  "timestamp": 1701234567890,
  "level": "info",
  "category": "matching",
  "message": "mock_selected",
  "testId": "test-user-login",
  "data": { "mockIndex": 2, "specificity": 5 }
}
```

### TestLogger (Test Assertions)

**File**: `internal/core/src/adapters/test-logger.ts`

Captures log entries for test assertions:

```typescript
export class TestLogger implements Logger {
  private readonly entries: LogEntry[] = [];

  // ... log methods capture to entries array

  getEntries(): ReadonlyArray<LogEntry>;
  getEntriesByLevel(level): ReadonlyArray<LogEntry>;
  getEntriesByCategory(category): ReadonlyArray<LogEntry>;
  getEntriesByTestId(testId): ReadonlyArray<LogEntry>;
  hasEntry(predicate): boolean;
  findEntry(predicate): LogEntry | undefined;
  clear(): void;
}
```

---

## Configuration

### LoggingConfig Type

```typescript
export type LoggingConfig = {
  readonly level?: LogLevel; // Default: 'info' if NODE_ENV=test, else 'silent'
  readonly categories?: ReadonlyArray<LogCategory>; // Default: all
  readonly format?: "pretty" | "json"; // Default: 'pretty'
  readonly colors?: boolean; // Default: true if TTY
  readonly includeTimestamp?: boolean; // Default: true
};
```

### Level Resolution Priority

1. `SCENARIST_LOG_LEVEL` environment variable (highest)
2. `options.logging.level` config
3. `'info'` if `NODE_ENV === 'test'`
4. `'silent'` (default)

---

## Log Events Catalog

### lifecycle

| Event               | Level | Data                |
| ------------------- | ----- | ------------------- |
| `scenarist_started` | info  | `{ scenarioCount }` |
| `scenarist_stopped` | info  | `{}`                |

### scenario

| Event                 | Level | Data                        |
| --------------------- | ----- | --------------------------- |
| `scenario_registered` | info  | `{ scenarioId, mockCount }` |
| `scenario_switched`   | info  | `{ previousScenarioId }`    |
| `scenario_cleared`    | debug | `{}`                        |
| `scenario_not_found`  | error | `{ requestedScenarioId }`   |

### matching

| Event                   | Level | Data                                  |
| ----------------------- | ----- | ------------------------------------- |
| `mock_candidates_found` | debug | `{ candidateCount, url, method }`     |
| `mock_match_evaluated`  | debug | `{ mockIndex, matched, specificity }` |
| `mock_selected`         | info  | `{ mockIndex, specificity }`          |
| `mock_no_match`         | warn  | `{ url, method, candidateCount }`     |

### sequence

| Event                   | Level | Data                                            |
| ----------------------- | ----- | ----------------------------------------------- |
| `sequence_position_get` | debug | `{ position, total, exhausted }`                |
| `sequence_advanced`     | debug | `{ previousPosition, newPosition, repeatMode }` |
| `sequence_exhausted`    | info  | `{ mockIndex, totalResponses }`                 |
| `sequence_reset`        | debug | `{}`                                            |

### state

| Event                       | Level | Data                             |
| --------------------------- | ----- | -------------------------------- |
| `state_captured`            | info  | `{ key, pathExpression, value }` |
| `state_injected`            | debug | `{ key, value }`                 |
| `state_mutated`             | info  | `{ keys }`                       |
| `state_reset`               | debug | `{}`                             |
| `state_condition_evaluated` | debug | `{ conditionIndex, matched }`    |

### template

| Event                    | Level | Data                   |
| ------------------------ | ----- | ---------------------- |
| `template_replaced`      | debug | `{ template, result }` |
| `template_missing_value` | warn  | `{ template, key }`    |

### request

| Event              | Level | Data              |
| ------------------ | ----- | ----------------- |
| `request_received` | info  | `{ url, method }` |
| `request_body`     | trace | `{ body }`        |
| `response_sent`    | info  | `{ status }`      |
| `response_body`    | trace | `{ body }`        |
| `passthrough`      | info  | `{ reason }`      |

---

## Integration Points

### ResponseSelector

Add `logger` parameter to factory, call at:

- Entry: `mock_candidates_found`
- Each mock: `mock_match_evaluated`
- Selection: `mock_selected` or `mock_no_match`
- Sequence events
- State events
- Template events

### ScenarioManager

Add `logger` parameter to factory, call at:

- `scenario_registered`
- `scenario_switched`
- `scenario_not_found`
- Reset events

### DynamicHandler

Add `logger` parameter, call at:

- `request_received`
- `request_body` (trace)
- `response_sent`
- `response_body` (trace)
- `passthrough`

---

## Files to Create

| File                                           | Purpose                       |
| ---------------------------------------------- | ----------------------------- |
| `internal/core/src/ports/driven/logger.ts`     | Logger port interface + types |
| `internal/core/src/adapters/noop-logger.ts`    | NoOpLogger                    |
| `internal/core/src/adapters/console-logger.ts` | ConsoleLogger                 |
| `internal/core/src/adapters/test-logger.ts`    | TestLogger                    |
| `internal/core/src/adapters/create-logger.ts`  | Factory from config           |
| `internal/core/tests/noop-logger.test.ts`      | Tests                         |
| `internal/core/tests/console-logger.test.ts`   | Tests                         |
| `internal/core/tests/test-logger.test.ts`      | Tests                         |
| `internal/core/tests/create-logger.test.ts`    | Tests                         |

## Files to Modify

| File                                                          | Changes                          |
| ------------------------------------------------------------- | -------------------------------- |
| `internal/core/src/ports/index.ts`                            | Export Logger types              |
| `internal/core/src/adapters/index.ts`                         | Export logger factories          |
| `internal/core/src/types/config.ts`                           | Add LoggingConfig                |
| `internal/core/src/contracts/framework-adapter.ts`            | Add logger to BaseAdapterOptions |
| `internal/core/src/domain/response-selector.ts`               | Add logger + logging calls       |
| `internal/core/src/domain/scenario-manager.ts`                | Add logger + logging calls       |
| `internal/core/src/index.ts`                                  | Export logger types/factories    |
| `internal/msw-adapter/src/handlers/dynamic-handler.ts`        | Add logger + logging calls       |
| `packages/express-adapter/src/setup/impl.ts`                  | Wire logger                      |
| `packages/nextjs-adapter/src/common/create-scenarist-base.ts` | Wire logger                      |

---

## User-Facing API

### Basic (Auto-enabled in tests)

```typescript
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios,
  // Logging auto-enabled at 'info' level when NODE_ENV=test
});
```

### Explicit Configuration

```typescript
const scenarist = createScenarist({
  enabled: true,
  scenarios,
  logging: {
    level: "debug",
    categories: ["matching", "state"],
    format: "pretty",
    colors: true,
  },
});
```

### Environment Override

```bash
SCENARIST_LOG_LEVEL=debug npm test
```

### Custom Logger

```typescript
const scenarist = createScenarist({
  enabled: true,
  scenarios,
  logger: createWinstonLogger(), // User's own wrapper
});
```

---

## Success Criteria

- [ ] Trace any request by test ID
- [ ] Identify exactly which mock matched and why
- [ ] View sequence positions at any point
- [ ] See state changes in real-time
- [ ] Diagnose issues in minutes, not hours
- [ ] Zero overhead when logging disabled

---

## Future Work: Error Handling (#321)

This logging infrastructure is designed as a **foundation for error handling** ([#321](https://github.com/citypaul/scenarist/issues/321)).

### Dependency Relationship

```
┌─────────────────────────────────────────────────────────────┐
│  PR 2: Error Handling (#321) - FUTURE                       │
│  - Error boundaries (try/catch wrappers)                    │
│  - Custom error types (ScenaristError, MockNotFoundError)   │
│  - Configurable behaviors (onNoMockFound, onSequenceExhausted)│
│  - Validation at registration                               │
│  - USES logger.error(), logger.warn() from this PR          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ depends on
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PR 1: Logging Infrastructure (#320) - THIS PR              │
│  - Logger port interface                                    │
│  - NoOpLogger, ConsoleLogger, TestLogger                    │
│  - Log events (mock_no_match, sequence_exhausted, etc.)     │
│  - Integration into core                                    │
└─────────────────────────────────────────────────────────────┘
```

### Log Events Designed for Error Handling

These log events will become triggers for configurable error behaviors in #321:

| Log Event (This PR)                | Future Error Behavior (#321)          |
| ---------------------------------- | ------------------------------------- |
| `mock_no_match` (warn)             | → `onNoMockFound` config option       |
| `sequence_exhausted` (info)        | → `onSequenceExhausted` config option |
| `state_condition_no_match` (debug) | → `onNoStateMatch` config option      |
| `scenario_not_found` (error)       | → `ScenarioNotFoundError` type        |
| `validation_failed` (error)        | → `ValidationError` at registration   |

### Why Separate PRs?

1. **Clean dependency** - Error handling imports logging, not vice versa
2. **Incremental value** - Ship logging now, get feedback
3. **Risk isolation** - Issues in one don't affect the other
4. **TDD-friendly** - Smaller scope = cleaner tests
5. **Reviewable PRs** - Each focused on one concern
