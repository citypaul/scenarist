# Implementation History

This directory contains detailed learnings from each major implementation phase. These documents capture architectural insights, bugs discovered, and patterns that emerged during development.

## Chronological Index

### Phase 1: Dynamic Response System (Oct 2023)
**File:** [phase-1-dynamic-responses.md](phase-1-dynamic-responses.md)
**Topics:** Request content matching, specificity-based selection, ResponseSelector as port
**Key Decisions:** ADR-0002 (Dynamic Response System)
**Outcome:** 100% test coverage, specificity algorithm validated

### Phase 2: Response Sequences (Oct 2023)
**File:** [phase-2-sequences.md](phase-2-sequences.md)
**Topics:** Polling scenarios, repeat modes, sequence exhaustion, test ID isolation
**Key Bugs:** TDD violation (speculative code), TypeScript readonly arrays, sequence reset
**Outcome:** Idempotent sequences, 100% coverage restored

### Phase 3: Stateful Mocks (Nov 2023)
**File:** [phase-3-stateful-mocks.md](phase-3-stateful-mocks.md)
**Topics:** State capture/injection, array append syntax, nested paths
**Critical Bugs:** Playwright header propagation, template undefined handling
**Outcome:** RSC examples working, all 15/15 tests passing

### Phase 4: Composition Analysis (Oct 2023)
**File:** [phase-4-composition-analysis.md](phase-4-composition-analysis.md)
**Topics:** Why dedicated composition tests aren't needed
**Key Insight:** Orthogonal features + pipeline architecture = guaranteed composition
**Decision:** ADR-0004 (Why Composition Tests Unnecessary)

### URL Matching: Path Parameters (Nov 2023)
**File:** [url-matching-path-params.md](url-matching-path-params.md)
**Topics:** path-to-regexp compatibility, manual URL parsing, pattern conflicts
**Critical Bugs:** URL constructor corrupts path-to-regexp syntax, repeating parameters
**Outcome:** 17/17 integration tests, full MSW parity

### Automatic Default Fallback (Nov 2023)
**File:** [automatic-default-fallback.md](automatic-default-fallback.md)
**Topics:** Default + active scenario collection, last fallback wins
**Critical Gotcha:** Next.js module duplication requires singleton pattern
**Outcome:** DRY scenarios, automatic override pattern

### Specificity Bug Fix (Nov 2023)
**File:** [specificity-bug-fix.md](specificity-bug-fix.md)
**Topics:** Sequences vs match criteria conflicts
**Solution:** Separate priority ranges (100+ match, 1 sequence, 0 fallback)
**Outcome:** All tests passing, no conflicts

### PR Review Fixes (Nov 2023)
**File:** [pr-review-fixes.md](pr-review-fixes.md)
**Topics:** Singleton architecture, test coverage, simplify conditions
**Key Learning:** Never skip tests, even for "simple" code
**Outcome:** 5 singleton tests added, 100% coverage

### Pages Router Investigation (Nov 2023)
**File:** [pages-router-investigation.md](pages-router-investigation.md)
**Topics:** MSW with getServerSideProps, scenario store lookup bug
**Status:** Under investigation, root cause identified
**Files:** See also `docs/investigations/next-js-pages-router-*.md`

### Production Tree-Shaking (Jan 2025)
**File:** [production-tree-shaking.md](production-tree-shaking.md)
**Topics:** Dynamic imports vs conditional exports, code splitting, lsof verification
**Key Discovery:** Code splitting + dynamic imports = zero config tree-shaking
**Decision:** Conditional exports optional, not required

## How to Use These Documents

**When debugging similar issues:**
- Search for error messages or symptoms
- Check chronological index for related phases
- Review "Critical Bugs" sections for patterns

**When making architectural decisions:**
- Review relevant phase learnings
- Check ADRs linked in each phase
- Consider patterns that emerged

**When onboarding:**
- Read phases 1-4 to understand core system evolution
- Focus on "Key Insights" and "Lessons Learned" sections
- ADRs provide formal decision context

## Document Structure

Each phase document follows this structure:
1. **Context** - What was being implemented
2. **Key Decisions** - Major architectural choices
3. **Bugs Discovered** - Critical issues found and fixed
4. **Lessons Learned** - Patterns and anti-patterns identified
5. **Files Changed** - Affected packages and tests
6. **Outcome** - Test results and validation

## See Also

- [Architecture Deep-Dives](../architecture/) - Detailed architectural patterns
- [ADRs](../adrs/) - Formal architectural decisions
- [Investigations](../investigations/) - Deep bug analysis
- [Migrations](../migrations/) - API migration guides
