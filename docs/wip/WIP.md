# WIP: Regex Support Implementation (Issue #86)

**Started**: 2025-11-16
**Status**: Phase 2.5.1 - IN PROGRESS
**Current Step**: 3 of 5 (Phase 2 complete, Phase 2.5 planning complete)

## Goal

Implement regex support for match criteria in Scenarist, enabling pattern matching for headers, body fields, and query parameters with ReDoS protection and timeout guards.

## Overall Plan

1. ~~Phase 1: Schema Definition with ReDoS Protection~~ ✅
2. ~~Phase 2: String Matching Functions~~ ✅
3. **Phase 2.5: URL Matching - 🔜 NEXT (Planning Complete)**
4. Phase 3: Regex Matching with Timeout Protection
5. Phase 4: Integration and Documentation

## Current Focus

**Phase 2.5: URL Matching** - 🔜 NEXT

**Status**: PLANNING COMPLETE - All design decisions finalized, ready for implementation

**Tests Passing**: ✅ 265/265 core tests (Phase 2 complete)

**Last PR**: Phase 2 merged - String matching strategies for headers/query/body

**Current Task**: Phase 2.5.1 - Schema & Type Updates (add url field to match criteria)

**Key Decisions Finalized:**
1. Match against resolved URL (actual request like `/users/123`, not pattern like `/users/:id`)
2. Support native RegExp (ADR-0016) - Better DX, MSW compatible
3. url field required when match.url present (use `url: '*'` for global matching)
4. Query string reconstructed for matching (pathname + '?' + querystring)
5. URL encoding support (try decoded first, fallback to encoded)
6. Hash fragments stripped before matching
7. Specificity scoring: URL match adds +1 (consistent with other criteria)

**Phases Completed:**

**Phase 1 (Schema Definition):**
- SerializedRegexSchema with ReDoS protection
- StringMatchSchema with all 5 strategies
- MatchCriteriaSchema (body, headers, query)
- Runtime validation at trust boundary
- 6 validation behavior tests

**Phase 2 (String Matching Functions):**
- String matching helpers (equals, contains, startsWith, endsWith)
- Integration into matchesCriteria() for headers, query, body
- 53 unit tests + 12 integration tests
- 265/265 tests passing, 100% coverage maintained

**Phase 2.5 Planning (URL Matching Design):**
- All 7 design decisions finalized
- ADR-0016 created (native RegExp support)
- ADR-0013 updated (cross-reference)
- 5-phase implementation plan created
- Test strategy defined (104-117 tests)
- Effort estimate: 3.5-4 days

## Agent Checkpoints

- [x] tdd-guardian: Verified TDD compliance for Phase 1 ✅
- [x] ts-enforcer: Validated types (strict mode passing) ✅
- [ ] refactor-scan: Assess refactoring opportunities before Phase 2
- [ ] learn: Document ReDoS patterns and validation approaches
- [ ] docs-guardian: Update permanent docs when complete

## Next Steps

**Phase 2.5.1: Schema & Type Updates (0.5 days, 12-15 tests)**
1. Add native RegExp support to url field in ScenaristMockSchema
2. Add url field to MatchCriteriaSchema (MatchValueSchema)
3. Write schema validation tests (native RegExp, serialized, errors)
4. Update type system (url: RegExp | string | MatchValueObject)

**Phase 2.5.2: URL Matching Logic (1.5 days, 45-50 tests)**
1. Implement `matchesUrl(actualUrl: string, matchValue: MatchValue): boolean`
2. Query string reconstruction (pathname + '?' + querystring)
3. URL encoding support (decoded first, fallback to encoded)
4. Hash stripping (remove before matching)
5. Unit tests for all strategies + edge cases

**Phase 2.5.3: Integration Tests (1 day, 20-25 tests)**
1. Test all routing patterns (exact, path params, glob, wildcard)
2. Test resolved URL matching (actual request, not pattern)
3. Test specificity scoring (url match adds +1)
4. Test url field requirement enforcement

**Phase 2.5.4: Example Apps & E2E (0.5 days, 27 tests)**
1. Express: URL filtering scenarios (9 tests)
2. Next.js App Router: URL filtering scenarios (9 tests)
3. Next.js Pages Router: URL filtering scenarios (9 tests)

**Phase 2.5.5: Documentation (0.5 days)**
1. Update core-functionality.md with URL matching examples
2. Update adapter READMEs
3. Add migration guide for url field requirement
4. Document resolved URL behavior

## Blockers

None - All design decisions finalized, ready to begin Phase 2.5.1 implementation

## PR Review Feedback

**From PR #96 Review:**
- ❌ No timeout implementation found in `matchesRegex()`
- **Required:** Add timeout protection to prevent slow regex patterns from blocking tests
- **Approach:** Implement timeout mechanism (default 100ms) with warning on timeout
- **Note:** While ReDoS protection at trust boundary catches most issues, runtime timeout provides defense-in-depth
- **Status:** DEFERRED - will add after string matching helpers implemented

## Technical Notes

**ReDoS Protection Strategy:**
- Using `redos-detector` package for pattern validation
- Validates at schema level via `.refine()`
- Prevents catastrophic backtracking patterns
- Safe patterns: `/^[a-z]+$/`, `/foo|bar/`
- Unsafe patterns: `/(a+)+$/`, `/(.*)*$/`

**Trust Boundary Validation:**
- Schema validation happens in ScenarioManager.registerScenario()
- Trust boundary: external scenario definitions → internal registry
- Zod schemas validate ALL incoming scenario definitions
- Runtime errors provide detailed validation messages

**Key Design Decision:**
- Minimized schema tests (3 tests for documentation only)
- Comprehensive behavior tests in scenario-manager.test.ts (6 tests)
- Tests verify business behavior (reject unsafe patterns) not schema structure

**Zod API Gotcha:**
- `safeParse().error.errors` doesn't exist
- Correct API: `safeParse().error.issues`
- Each issue has: code, path, message

## Session Log

### Session 1: Phase 1 - Schema Definition (2025-11-15)
**Duration**: ~3 hours
**Completed**:
- SerializedRegexSchema with ReDoS protection
- StringMatchSchema with all 5 strategies
- MatchCriteriaSchema (body, headers, query)
- Runtime validation at trust boundary
- 6 validation behavior tests

**Key Learnings**:
- ReDoS protection via `redos-detector` package
- Zod API: `error.issues` not `error.errors`
- Schema tests should be minimal (documentation only)
- Behavior tests belong at trust boundary

### Session 2: Phase 2 - String Matching Functions (2025-11-16)
**Duration**: ~4 hours
**Completed**:
- String matching helpers (equals, contains, startsWith, endsWith)
- Integration into matchesCriteria()
- 53 unit tests + 12 integration tests
- All 265 tests passing, 100% coverage

**Key Learnings**:
- Case sensitivity matters for headers
- URL encoding requires special handling
- Native RegExp vs serialized form trade-offs
- Specificity scoring must be consistent

### Session 3: Phase 2.5 Planning - URL Matching Design (2025-11-16)
**Duration**: ~2 hours
**Completed**:
- ✅ Finalized all 7 design decisions
- ✅ Created ADR-0016 (native RegExp support)
- ✅ Updated ADR-0013 (cross-reference)
- ✅ Documented element of least surprise principle
- ✅ Created 5-phase implementation plan
- ✅ Updated WIP.md with Phase 2.5 status

**Design Decisions Finalized**:
1. URL format in context (pathname only)
2. Path parameters (match against resolved URL)
3. Hash fragments (stripped before matching)
4. URL encoding (support both decoded/encoded)
5. Specificity scoring (URL adds +1)
6. url field requirement (always required when match.url present)
7. Native RegExp support (both forms supported)

**Key Insights**:
- Resolved URL (not pattern) is element of least surprise
- Enables powerful filtering use cases (numeric IDs, extensions, versions)
- Consistent with MSW's `req.url.pathname` behavior
- Native RegExp simplifies implementation (no conversion needed)

**Ready for Implementation**:
- Phase 2.5.1: Schema & Type Updates (0.5 days)
- All design questions answered
- Test strategy defined (104-117 tests)
- Effort estimate: 3.5-4 days total

**Next Session**:
- Begin Phase 2.5.1: Add url field to MatchCriteriaSchema
- Add native RegExp support to ScenaristMockSchema
- Write schema validation tests (12-15 tests)
- Update type system
