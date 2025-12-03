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

### Phase 1: Logger Port & NoOpLogger ✅

| Task                                       | Status | Notes                    |
| ------------------------------------------ | ------ | ------------------------ |
| Create Logger port interface (`logger.ts`) | Done   | Types + interface        |
| Create NoOpLogger implementation           | Done   | Singleton, zero overhead |
| Write NoOpLogger tests                     | Done   | 8 tests                  |
| Export from ports/index.ts                 | Done   | + adapters/index.ts      |

### Phase 2: ConsoleLogger ✅

| Task                                | Status | Notes                            |
| ----------------------------------- | ------ | -------------------------------- |
| Implement level filtering           | Done   | Level priority system            |
| Implement category filtering        | Done   | Optional category filter         |
| Implement JSON format output        | Done   | Structured JSON with timestamp   |
| Implement pretty format with colors | Done   | ANSI colors, icons, level labels |
| Implement persistent test ID colors | Done   | Hash-based, 11-color palette     |
| Write ConsoleLogger tests           | Done   | 23 tests, behavioral tests       |
| Export from adapters/index.ts       | Done   | + types (LogFormat, Config)      |
| Add logging documentation           | Done   | Reference doc + cross-references |

### Phase 3: Config Integration ✅

| Task                             | Status | Notes                           |
| -------------------------------- | ------ | ------------------------------- |
| Add logger to BaseAdapterOptions | Done   | Optional Logger property        |
| Export logger from adapters      | Done   | Re-exported from express/nextjs |

### Phase 4: Core Integration (Partial)

| Task                                  | Status      | Notes                        |
| ------------------------------------- | ----------- | ---------------------------- |
| Add logger to createScenarioManager   | Done        | Inject via options           |
| Add logging calls to ScenarioManager  | Done        | scenario_registered/switched |
| Add logger to createResponseSelector  | Not Started | Inject via options           |
| Add logging calls to ResponseSelector | Not Started | mock_selected, mock_no_match |

### Phase 5: MSW Adapter Integration

| Task                                | Status      | Notes                  |
| ----------------------------------- | ----------- | ---------------------- |
| Add logger to DynamicHandler        | Not Started | Inject via options     |
| Add logging calls to DynamicHandler | Not Started | request_received, etc. |

### Phase 6: Framework Adapter Wiring (Partial)

| Task                                        | Status      | Notes                |
| ------------------------------------------- | ----------- | -------------------- |
| Wire logger in Express adapter              | Done        | Pass through to core |
| Wire logger in Next.js App Router adapter   | Not Started | Pass through to core |
| Wire logger in Next.js Pages Router adapter | Not Started | Pass through to core |

### Phase 7: Example App Integration (Partial)

| Task                                       | Status      | Notes                        |
| ------------------------------------------ | ----------- | ---------------------------- |
| Add logging to express-example app         | Done        | Env var: SCENARIST_LOG=1     |
| Add logging to nextjs-app-router-example   | Not Started | Demo ConsoleLogger usage     |
| Add logging to nextjs-pages-router-example | Not Started | Demo ConsoleLogger usage     |
| Run tests with logging to verify output    | Done        | 314 tests pass, logs visible |

---

## Design Decision: Why No TestLogger

**Decision**: Skip TestLogger implementation.

**Rationale**: TestLogger's purpose is to assert that specific logs were written, but this violates testing principles:

1. **Tests should verify behavior, not implementation** - Logging is an internal implementation detail
2. **ConsoleLogger already serves debugging** - Enable it, look at output, understand problem
3. **YAGNI** - No real use case for programmatic log inspection in Scenarist's context

**The two loggers we have cover all real needs:**

- `NoOpLogger` - Silent (default, production-like tests)
- `ConsoleLogger` - Human debugging (when you need to see what's happening)

---

## Design Decision: Winston/Pino vs Custom Implementation

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

---

## Architecture

### Hexagonal Architecture Fit

Logger is a **driven port** (secondary port) - domain logic calls out to it, implementations are injected.

```
User Config → Adapter (creates Logger) → Core (uses Logger port) → Implementation
```

### Why a Port?

- **Dependency Injection**: Domain depends on interface, not implementation
- **Flexibility**: Users provide custom loggers (Winston, Pino, etc.)
- **Zero Overhead**: NoOpLogger compiles to nothing

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
| `scenario_registered` | debug | `{ scenarioId, mockCount }` |
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

| Event            | Level | Data                             |
| ---------------- | ----- | -------------------------------- |
| `state_captured` | info  | `{ key, pathExpression, value }` |
| `state_injected` | debug | `{ key, value }`                 |
| `state_reset`    | debug | `{}`                             |

### template

| Event                    | Level | Data                   |
| ------------------------ | ----- | ---------------------- |
| `template_replaced`      | debug | `{ template, result }` |
| `template_missing_value` | warn  | `{ template, key }`    |

### request

| Event              | Level | Data              |
| ------------------ | ----- | ----------------- |
| `request_received` | debug | `{ url, method }` |
| `request_body`     | trace | `{ body }`        |
| `response_sent`    | info  | `{ status }`      |
| `response_body`    | trace | `{ body }`        |
| `passthrough`      | debug | `{ reason }`      |

---

## Integration Points

### ScenarioManager

Add `logger` parameter to factory, call at:

- `scenario_registered`
- `scenario_switched`
- `scenario_not_found`
- Reset events

### ResponseSelector

Add `logger` parameter to factory, call at:

- Entry: `mock_candidates_found`
- Each mock: `mock_match_evaluated`
- Selection: `mock_selected` or `mock_no_match`
- Sequence events
- State events
- Template events

### DynamicHandler

Add `logger` parameter, call at:

- `request_received`
- `request_body` (trace)
- `response_sent`
- `response_body` (trace)
- `passthrough`

---

## Files to Modify

| File                                                          | Changes                          |
| ------------------------------------------------------------- | -------------------------------- |
| `internal/core/src/contracts/framework-adapter.ts`            | Add logger to BaseAdapterOptions |
| `internal/core/src/domain/scenario-manager.ts`                | Add logger + logging calls       |
| `internal/core/src/domain/response-selector.ts`               | Add logger + logging calls       |
| `internal/msw-adapter/src/handlers/dynamic-handler.ts`        | Add logger + logging calls       |
| `packages/express-adapter/src/index.ts`                       | Export logger types/factories    |
| `packages/express-adapter/src/setup/impl.ts`                  | Wire logger                      |
| `packages/nextjs-adapter/src/index.ts`                        | Export logger types/factories    |
| `packages/nextjs-adapter/src/common/create-scenarist-base.ts` | Wire logger                      |

---

## User-Facing API

### Silent by Default

```typescript
const scenarist = createScenarist({
  enabled: process.env.NODE_ENV === "test",
  scenarios,
  // logger defaults to noOpLogger (silent)
});
```

### Enable Console Logging

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
    categories: ["matching", "scenario"],
    format: "pretty",
  }),
});
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

### Log Events Designed for Error Handling

These log events will become triggers for configurable error behaviors in #321:

| Log Event (This PR)          | Future Error Behavior (#321)          |
| ---------------------------- | ------------------------------------- |
| `mock_no_match` (warn)       | → `onNoMockFound` config option       |
| `sequence_exhausted` (info)  | → `onSequenceExhausted` config option |
| `scenario_not_found` (error) | → `ScenarioNotFoundError` type        |
