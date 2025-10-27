# ADR-0004: Why Dedicated Composition Tests Are Unnecessary

**Status**: Accepted
**Date**: 2025-10-27
**Authors**: Claude Code

## Context

After completing Phase 1 (Request Content Matching), Phase 2 (Response Sequences), and Phase 3 (Stateful Mocks), the natural question arose: Should Phase 4 add dedicated tests for feature composition?

Feature composition patterns include:
- Match + Sequence (match criteria gates sequence advancement)
- Match + State (match criteria gates state capture)
- Sequence + State (sequence responses can inject state)
- Match + Sequence + State (all three features together)

Conventional testing wisdom suggests testing all combinations to ensure they work together correctly.

## Problem

Should we create dedicated composition tests (`apps/express-example/tests/dynamic-composition.test.ts`) with explicit tests for:
1. Match + Sequence composition
2. Match + State composition
3. Sequence + State composition
4. Match + Sequence + State (all three)

Or is the existing test coverage (Phases 1-3 tested independently) sufficient?

## Decision

**Do NOT create dedicated composition tests.** The three-phase execution model guarantees correct composition by architectural design.

## Rationale

### The Three-Phase Execution Model

Every request goes through three mandatory sequential phases:

**Phase 1: Match (Which mock applies?)**
- Checks sequence exhaustion
- Evaluates match criteria (body, headers, query)
- Calculates specificity
- Selects best match
- **Gates everything** - if match fails, mock is skipped

**Phase 2: Select (Which response to return?)**
- Selects response from sequence (if present)
- Advances sequence position
- Handles repeat modes (last/cycle/none)
- Or returns single response
- **Independent** - knows nothing about match criteria or state

**Phase 3: Transform (Modify response based on state)**
- Captures state from request (if configured)
- Injects templates into response (if present)
- Applies delays and headers
- **Independent** - knows nothing about matching or sequences

### Why Composition "Just Works"

The phases are **orthogonal** (independent and non-interfering):

1. **Single Responsibility** - Each phase has one job
2. **Independent Testing** - Each phase tested to 100% coverage independently
3. **Data Pipeline** - Phases communicate through data, not shared logic
4. **No New Failure Modes** - Combining phases doesn't create new edge cases

**This is like Unix pipes:**
- If `cat` works, `grep` works, and `sort` works independently
- Then `cat | grep | sort` works by design of the pipe mechanism
- You don't need to test every combination of commands

### Analysis of Each Composition

**Match + Sequence:**
- Match phase gates whether sequence advances (Phase 1 → Phase 2)
- Already tested in PR #28: "non-matching requests don't advance sequences"
- This IS the edge case - the only meaningful interaction

**Match + State:**
- Match phase gates whether state captures (Phase 1 → Phase 3)
- Guaranteed by sequential execution
- If match fails → mock skipped → Phase 3 never runs → no capture
- No new failure mode beyond what's tested

**Sequence + State:**
- Sequence selects response (Phase 2)
- State injects templates (Phase 3)
- No interaction - different phases, no shared logic
- No new failure mode

**Match + Sequence + State:**
- Match gates everything (Phase 1)
- Sequence selects (Phase 2)
- State injects (Phase 3)
- All interactions already covered above

### What IS Tested

**Phase 1 tests (100% coverage):**
- Match criteria evaluation (body, headers, query)
- Specificity-based selection
- Fallback behavior
- **PR #28: Non-matching requests don't advance sequences** ← The edge case

**Phase 2 tests (100% coverage):**
- Sequence advancement
- All repeat modes (last/cycle/none)
- Exhaustion and fallback
- Test ID isolation

**Phase 3 tests (100% coverage):**
- State capture (path extraction, arrays)
- Template injection (nested paths, array length)
- State reset on scenario switch
- Test ID isolation

**Integration tests (existing):**
- Real-world scenarios naturally exercise composition
- Shopping cart: state capture + injection
- Polling: sequences with repeat modes
- Forms: state across multiple steps

## Consequences

### Positive

✅ **Reduced test count** - No redundant composition tests (estimated 20-30 tests avoided)

✅ **Lower maintenance** - Fewer tests to update when implementation changes

✅ **Clearer intent** - Tests focus on behavior, not all possible combinations

✅ **Faster test execution** - Fewer tests to run

✅ **Architecture validation** - Orthogonal design proven effective

✅ **Documentation value** - This ADR explains WHY tests aren't needed

### Negative

❌ **Potential blind spots** - Edge cases at composition boundaries could exist

*Mitigation:* PR #28 tested the only meaningful edge case (match gates sequence). If composition bugs are found in real usage, add targeted tests for those specific cases.

❌ **Developer confusion** - Future developers might wonder why no composition tests

*Mitigation:* This ADR documents the decision. CLAUDE.md includes detailed analysis.

❌ **Breaks convention** - Most projects test all feature combinations

*Mitigation:* Convention exists because most projects don't have orthogonal phase architecture. Our architecture is different - orthogonality guarantees composition.

## Implementation

1. Mark Phase 4 as "✅ Covered by Architecture + PR #28" in documentation
2. Update core-functionality.md with three-phase model explanation
3. Update CLAUDE.md with composition analysis
4. Create this ADR to document the decision
5. If composition bugs ARE found:
   - Add targeted test for the specific edge case
   - Update this ADR with learnings
   - Re-evaluate if architecture assumptions were wrong

## When to Revisit This Decision

This decision should be reconsidered if:

1. **Composition bugs found in production/testing** - If bugs emerge specifically from feature interactions that weren't caught by phase-level tests, this indicates the orthogonality assumption may be incorrect.

2. **Phases become coupled** - If changes to one phase start requiring changes to other phases, this would indicate architectural regression. Coupling between phases would break the orthogonality guarantee.

3. **New features create interactions beyond three-phase model** - If future features introduce interactions that don't fit the Match → Select → Transform pipeline, dedicated composition tests may become necessary.

4. **Performance issues from composition** - If the combination of features creates performance problems not evident when testing phases independently.

**Signs the decision is still valid:**
- Bug reports remain phase-specific (matching bugs, sequence bugs, state bugs)
- Phases remain independently modifiable
- New features fit naturally into the three-phase model
- Test coverage remains 100% at phase level

## Related Documents

- [CLAUDE.md § Phase 4: Why Dedicated Composition Tests Aren't Needed](../../CLAUDE.md#phase-4-why-dedicated-composition-tests-arent-needed)
- [core-functionality.md § Three-Phase Execution Model](../core-functionality.md#three-phase-execution-model)
- [ADR-0002: Dynamic Response System](./0002-dynamic-response-system.md)
- [PR #28: Test match+sequence composition edge case](https://github.com/citypaul/scenarist/pull/28)

## References

- Unix Philosophy: "Do one thing well" + pipes for composition
- Separation of Concerns: Independent modules compose naturally
- Single Responsibility Principle: Each phase has one job
- Orthogonal Design: Independent axes of variation
