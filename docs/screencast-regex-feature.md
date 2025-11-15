# Screencast: Building Regex Match Support with Claude Code

## Introduction to Scenarist (60-90 seconds)

**What to say:**

> "Modern frameworks like Next.js, Remix, and TanStack Router have fundamentally changed how we build web applications. The lines between frontend and backend are blurred—Server Components run on the server, loaders execute server-side, server functions are called from client code. Your 'frontend' is making direct HTTP calls to external APIs.
>
> This creates a testing problem. You can't test 'frontend' and 'backend' separately anymore. Unit tests require mocking framework internals—you're not testing real code. E2E tests work but they're too slow—testing 100 different API scenarios would take hours.
>
> There's no middle ground. Until Scenarist.
>
> Scenarist lets you test your real server-side code—Next.js Server Components, Remix loaders, your business logic—with mocked external APIs. Your code executes normally. Only the external calls (Stripe, Auth0, SendGrid) are intercepted.
>
> You switch scenarios at runtime: 'premium user', 'payment declined', 'auth failure', 'rate limited'. Each test gets a different set of API behaviors. Multiple tests run in parallel, all hitting the same server, completely isolated.
>
> It's HTTP-level integration testing for the full-stack framework era. Real server code, fake external APIs, unlimited scenarios.
>
> Today I'm using Claude Code to add regex pattern matching to Scenarist. You'll see the full TDD workflow—test-first, small commits, 100% coverage. Let's build it."

**Visual (while talking):**
- Show the diagram from why-scenarist.md (the one we just improved)
- Briefly show a scenario definition in code
- Show `switchScenario('premiumUser')` in a test

---

## Screencast Structure

### Act 1: Problem Statement (2-3 minutes)

**Show the limitation:**
```typescript
// Current: Must match EXACTLY
{
  match: {
    headers: {
      referer: 'http://localhost:3000/apply-sign',
    },
  },
}

// ❌ Can't do: Match pattern
{
  match: {
    headers: {
      referer: { contains: '/apply-sign' },  // Not supported yet!
    },
  },
}
```

**Narration:**
> "Right now, Scenarist only supports exact string matching. If I want to match any referer containing '/apply-sign', I'd need separate mocks for every possible URL. That's verbose and brittle.
>
> We need pattern matching—substring, prefix, suffix, and regex. That's what we're building today."

**Show GitHub issue #86** - briefly scroll through the API design section.

---

### Act 2: TDD Workflow with Claude Code (20-25 minutes)

This is where you show the actual development flow. The structure follows the implementation plan phases:

#### Part 1: Schema Definition (5-7 minutes)

**RED Phase:**
1. Open Claude Code chat
2. Say: *"Let's start with Phase 1. Write failing tests for the SerializedRegexSchema validation."*
3. Claude writes tests in `packages/core/tests/schemas/match-value.test.ts`
4. Run tests → FAIL (file doesn't exist yet)
5. Show the RED state clearly

**GREEN Phase:**
6. Say: *"Now implement the schemas to make these tests pass."*
7. Claude creates/modifies:
   - `packages/core/src/types/scenario.types.ts`
   - `packages/core/src/schemas/scenario.schemas.ts`
8. Run tests → PASS
9. Show 100% coverage for schemas

**Key moments to highlight:**
- Claude follows the plan document
- TDD cycle: RED → GREEN → commit
- Type inference working immediately (show IDE autocomplete)
- Zod validation catching unsafe regex patterns

#### Part 2: Matching Logic (7-8 minutes)

**RED Phase:**
1. Say: *"Phase 2: Write tests for the matchesValue function."*
2. Claude writes comprehensive tests in `packages/core/tests/domain/matching.test.ts`
3. Run tests → FAIL (function doesn't exist)

**GREEN Phase:**
4. Say: *"Implement the matching logic."*
5. Claude creates `packages/core/src/domain/matching.ts`
6. Run tests → PASS
7. Show coverage: 100%

**Key moments:**
- Test each strategy (contains, startsWith, endsWith, regex)
- Test edge cases (null, undefined, type coercion)
- ReDoS timeout protection
- All driven by tests first

#### Part 3: Integration (5-7 minutes)

**RED Phase:**
1. Say: *"Now integrate with ResponseSelector. Write integration tests first."*
2. Claude adds tests to `packages/core/tests/response-selector.test.ts`
3. Run tests → FAIL (ResponseSelector doesn't use new matching yet)

**GREEN Phase:**
4. Say: *"Update ResponseSelector to use the new matching logic."*
5. Claude modifies `packages/core/src/domain/response-selector.ts`
6. Run tests → PASS
7. Verify backward compatibility (all existing tests still pass)

**REFACTOR Phase:**
8. Say: *"Any refactoring opportunities?"*
9. Claude assesses code quality
10. Commit working state

**Key moments:**
- Specificity calculation unchanged
- Backward compatibility proven by green tests
- Integration tests verify the whole flow

#### Part 4: Real-World Example (3-5 minutes)

1. Say: *"Let's add a real example to the Express example app."*
2. Claude adds scenario with regex matching to `apps/express-example/src/scenarios.ts`
3. Write E2E test using the new scenario
4. Run test → PASS
5. Show it working in action (curl request or Bruno)

**Example scenario:**
```typescript
export const mobileUserScenario: ScenaristScenario = {
  id: 'mobile-user',
  name: 'Mobile User Detection',
  mocks: [
    {
      method: 'GET',
      url: 'http://localhost:3001/api/device-info',
      match: {
        headers: {
          'user-agent': {
            regex: {
              source: 'Mobile|Android|iPhone',
              flags: 'i',
            },
          },
        },
      },
      response: {
        status: 200,
        body: {
          deviceType: 'mobile',
          optimizedLayout: true,
        },
      },
    },
  ],
};
```

---

### Act 3: Documentation & Wrap-Up (2-3 minutes)

1. Say: *"Now we document this feature."*
2. Claude generates API documentation
3. Show the final PR ready to merge
4. Review test coverage: 100% maintained across all packages

**Narration:**
> "We just added a significant feature to Scenarist—five new matching strategies, ReDoS protection, full type safety—and we did it entirely test-first.
>
> Every line of code was driven by a failing test. We used Claude Code as a pair programmer, following the TDD discipline strictly.
>
> The result: 100% test coverage, full backward compatibility, and a feature that makes Scenarist more powerful for real-world scenarios."

---

## Tips for Recording

### Pacing
- **Act 1:** Quick and punchy (show the problem, show the plan)
- **Act 2:** Slow down for TDD cycle demonstration (this is the meat)
- **Act 3:** Quick wrap-up (victory lap)

### What to Show On Screen
- Split screen: Claude Code chat on left, code editor on right
- Terminal at bottom (for test runs)
- Switch to full-screen for key moments:
  - Showing test failures (RED)
  - Showing test passes (GREEN)
  - Showing coverage reports

### Key Narration Points
- **Emphasize TDD discipline:** "Notice we write the test FIRST, see it fail, THEN implement."
- **Highlight Claude following the plan:** "Claude is referencing the implementation plan document to know what to build."
- **Show the feedback loop:** "Tests tell us what to build next. No guessing, no speculation."
- **Celebrate small wins:** "Green! Let's commit this and move to the next phase."

### Common Pitfalls to Avoid
- ❌ Don't skip showing the RED state (critical to TDD proof)
- ❌ Don't edit code manually without showing Claude first (breaks the narrative)
- ❌ Don't rush through test output (pause to let viewers see PASS/FAIL)
- ❌ Don't forget to show git commits (proof of incremental progress)

---

## Pre-Recording Checklist

- [ ] Branch created (`regex-match-support`)
- [ ] Main is up to date
- [ ] All tests passing before you start
- [ ] Implementation plan document open in editor
- [ ] GitHub issue #86 open in browser
- [ ] Terminal configured for clear output
- [ ] Claude Code ready with fresh conversation
- [ ] Screen recording software tested
- [ ] Microphone tested
- [ ] Editor font size readable for video (14-16pt minimum)

---

## Post-Recording Checklist

- [ ] Feature complete (all phases done)
- [ ] All tests passing (show final test run)
- [ ] 100% coverage maintained
- [ ] Documentation added
- [ ] Example app updated
- [ ] Git history shows TDD progression
- [ ] PR ready to create

---

## Bonus: Advanced Sections (Optional)

If you want to go deeper, you could add:

### Security Deep-Dive (2-3 minutes)
- Show ReDoS vulnerable pattern
- Show Zod rejecting it
- Explain why this matters

### Performance Benchmarking (2-3 minutes)
- Write benchmark test
- Show regex matching is < 1ms
- Prove no degradation vs exact matching

### Migration Example (2-3 minutes)
- Show old MSW code with `includes()`
- Convert to Scenarist with `contains`
- Show side-by-side comparison

---

## Estimated Total Runtime

- **Core version:** 25-30 minutes
- **With bonus sections:** 35-40 minutes
- **Condensed version:** 15-20 minutes (skip some RED-GREEN cycles, show highlights)

---

**End of Screencast Structure**
