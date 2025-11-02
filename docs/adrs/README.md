# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting significant architectural choices in Scenarist.

## What are ADRs?

ADRs capture the **context**, **decision**, **alternatives considered**, and **consequences** of important technical decisions. They provide future developers with the "why" behind architectural choices.

## Active ADRs

### Core Architecture

- **[ADR-0001: Serializable Scenario Definitions](0001-serializable-scenario-definitions.md)** (2025-10-20)
  - **Decision**: Separate serializable definitions from runtime MSW handlers
  - **Why**: Enable Redis, file-based, and remote scenario storage
  - **Impact**: Hexagonal architecture promise fulfilled, multiple storage implementations possible

- **[ADR-0002: Dynamic Response System](0002-dynamic-response-system.md)** (2025-10-23, updated 2025-10-27)
  - **Decision**: Three-phase dynamic response system (match → select → transform)
  - **Why**: Support request matching, sequences, and stateful mocks
  - **Impact**: Enables realistic testing scenarios (polling, state capture, content-based responses)

### Testing Strategy

- **[ADR-0003: Testing Strategy](0003-testing-strategy.md)** (2025-11-02)
  - **Decision**: Four-layer testing strategy (adapters default to mocks)
  - **Why**: Fast, focused tests for translation logic
  - **Impact**: Clear testing boundaries, 100% coverage requirement

- **[ADR-0004: Why Composition Tests Are Unnecessary](0004-why-composition-tests-unnecessary.md)** (2025-10-27)
  - **Decision**: No dedicated composition tests needed
  - **Why**: Three-phase architecture guarantees composition
  - **Impact**: Reduced test maintenance burden without sacrificing coverage

- **[ADR-0006: Thin Adapters Real Integration Tests](0006-thin-adapters-real-integration-tests.md)** (2025-11-02)
  - **Decision**: Exception for thin adapters to use real framework dependencies
  - **Why**: When adapter has single responsibility and is direct API wrapper
  - **Impact**: Rare exception (≤10% of adapters), requires 5 strict criteria

### State Management

- **[ADR-0005: State & Sequence Reset on Scenario Switch](0005-state-sequence-reset-on-scenario-switch.md)** (2025-10-27)
  - **Decision**: Reset sequences and state when switching scenarios
  - **Why**: Idempotent tests, predictable scenario behavior
  - **Impact**: Tests can run multiple times with same results

### Framework Integration

- **[ADR-0007: Framework-Specific Header Helpers](0007-framework-specific-header-helpers.md)** (2025-11-02)
  - **Decision**: Framework-specific helpers in each adapter package
  - **Why**: Next.js requires special header forwarding, Express doesn't
  - **Impact**: Clear separation, no framework coupling in core

### Type-Safe API (v2.0 Migration)

- **[ADR-0008: Type-Safe Scenario IDs via TypeScript Generics](0008-type-safe-scenario-ids.md)** ✨ NEW (2025-11-02)
  - **Decision**: Use `as const satisfies ScenariosObject` pattern with generics
  - **Why**: Enable autocomplete, compile-time errors, and refactoring safety
  - **Impact**: Breaking API change with major DX improvements (autocomplete everywhere)

- **[ADR-0009: Upfront Scenario Registration](0009-upfront-scenario-registration.md)** ✨ NEW (2025-11-02)
  - **Decision**: Remove `registerScenario()`, require all scenarios in object at initialization
  - **Why**: Enable TypeScript type inference for scenario IDs
  - **Impact**: Breaking change, simpler API, single source of truth

### Future Considerations

- **[ADR-0010: Convention Over Configuration - 'default' Key](0010-default-key-convention.md)** ✨ NEW (2025-11-02) - **Status: Proposed**
  - **Decision**: Make `defaultScenarioId` type-safe (`keyof T`), defer 'default' key enforcement to v3.0
  - **Why**: Solve typo problem now, gather feedback before forcing convention
  - **Impact**: Immediate type safety, future API simplification possible

- **[ADR-0011: Domain Constants Location](0011-domain-constants-location.md)** ✨ NEW (2025-11-02) - **Status: Proposed**
  - **Decision**: Move `DEFAULT_MOCK_ENABLED` to core as `CONFIG_DEFAULTS.MOCK_ENABLED`
  - **Why**: Domain knowledge belongs in core, not duplicated across adapters
  - **Impact**: DRY principle satisfied, consistency guaranteed across adapters

## ADR Status Legend

- **Accepted**: Decision implemented and in production
- **Proposed**: Decision documented, implementation pending
- **Deprecated**: Decision superseded by newer ADR
- **Superseded**: Replaced by specific ADR (referenced in document)

## ADR Timeline

### 2025-10 (Initial Architecture)
- **Oct 20**: ADR-0001 (Serializable Scenarios) - Foundation for hexagonal architecture
- **Oct 23**: ADR-0002 (Dynamic Responses) - Core feature implementation
- **Oct 27**: ADR-0004 (Composition Tests) - Testing strategy refinement
- **Oct 27**: ADR-0005 (State Reset) - Idempotency fix

### 2025-11 (Type-Safe API & Refinements)
- **Nov 02**: ADR-0003 (Testing Strategy) - Comprehensive testing approach
- **Nov 02**: ADR-0006 (Thin Adapters) - Testing exception criteria
- **Nov 02**: ADR-0007 (Header Helpers) - Framework-specific patterns
- **Nov 02**: ADR-0008 (Type-Safe IDs) - Major API improvement
- **Nov 02**: ADR-0009 (Upfront Registration) - Simplified initialization
- **Nov 02**: ADR-0010 (Default Key) - Future convention consideration
- **Nov 02**: ADR-0011 (Domain Constants) - DRY refactoring

## Key Decisions by Category

### Hexagonal Architecture
- [ADR-0001](0001-serializable-scenario-definitions.md): Serializable definitions enable multiple storage implementations
- [ADR-0011](0011-domain-constants-location.md): Domain constants belong in core, not adapters

### Type Safety
- [ADR-0008](0008-type-safe-scenario-ids.md): TypeScript generics provide compile-time scenario ID validation
- [ADR-0009](0009-upfront-scenario-registration.md): Upfront registration enables type inference
- [ADR-0010](0010-default-key-convention.md): Type-safe `defaultScenarioId` prevents typos

### Testing
- [ADR-0003](0003-testing-strategy.md): Four-layer strategy with clear boundaries
- [ADR-0004](0004-why-composition-tests-unnecessary.md): Architecture guarantees composition
- [ADR-0006](0006-thin-adapters-real-integration-tests.md): Exception for thin adapters

### User Experience
- [ADR-0002](0002-dynamic-response-system.md): Three-phase system enables realistic scenarios
- [ADR-0005](0005-state-sequence-reset-on-scenario-switch.md): Idempotent tests through reset
- [ADR-0007](0007-framework-specific-header-helpers.md): Framework-specific helpers in adapters
- [ADR-0008](0008-type-safe-scenario-ids.md): Autocomplete and compile-time errors

## Related Documentation

- [Core Functionality](../core-functionality.md) - Framework-agnostic concepts
- [Implementation Plans](../plans/) - Phase-by-phase implementation documentation
- [CLAUDE.md](../../CLAUDE.md) - Project guidance and learnings

## Creating New ADRs

When making a significant architectural decision:

1. **Copy template** (use existing ADR as template)
2. **Number sequentially** (next available number)
3. **Include all sections**:
   - Status (Proposed/Accepted/Deprecated/Superseded)
   - Date
   - Context (what problem are we solving?)
   - Decision (what did we decide?)
   - Alternatives Considered (what else did we evaluate?)
   - Consequences (positive, negative, neutral)
   - Implementation Notes
   - Related Decisions
4. **Link from README** (add to this index)
5. **Update related ADRs** (add cross-references if needed)

## ADR Format

See any existing ADR for format. Key principles:

- **Context before decision** - Explain the problem first
- **Alternatives matter** - Show what was considered and why rejected
- **Honest consequences** - Document negatives, not just positives
- **Implementation notes** - Make decisions actionable
- **Link related decisions** - Build decision graph

## Questions?

For questions about architectural decisions:
- Check existing ADRs first
- Review related documentation
- Consult CLAUDE.md for project guidance
- Consider creating new ADR if decision is significant
