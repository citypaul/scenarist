# Scenarist Documentation Tone of Voice

## Primary Tone

**Empathetic, competent, honest**

### Characteristics

- **Empathetic** - "We know testing Next.js is painful"
- **Direct** - Get to the point quickly
- **Practical** - Show working code, not theory
- **Honest** - Acknowledge trade-offs, don't oversell
- **Encouraging** - Build confidence, celebrate progress

## Core Writing Principles

### 1. Accuracy Over Absolutism

**NEVER use "CAN'T" when "CAN, but painful" is accurate:**

❌ **BAD:** "Unit tests can't test server-side logic"
✅ **GOOD:** "Unit tests CAN test server-side logic, but require extensive mocking of framework internals"

❌ **BAD:** "E2E tests can't handle multiple scenarios"
✅ **GOOD:** "E2E tests work for 1-2 scenarios, but are too slow for comprehensive coverage"

**Why this matters:** Inaccurate absolutism undermines credibility. Developers know unit tests CAN test server logic—they just know it's painful.

### 2. No Marketing Fluff

**Remove percentage claims and hyperbole:**

❌ **BAD:** "77% boilerplate reduction"
❌ **BAD:** "10x faster tests"
❌ **BAD:** "Revolutionary testing approach"

✅ **GOOD:** Show before/after code examples without numbers
✅ **GOOD:** "Tests run in parallel" (factual benefit)
✅ **GOOD:** "Comprehensive scenario coverage" (describes capability)

**Let code speak for itself.** Developers can see the difference without marketing statistics.

### 3. Lead with Pain, Not Solutions

**Every page starts with the problem developers face:**

```markdown
## The Problem

Next.js Server Components are hard to unit test. The official docs state:
"We recommend using end-to-end testing" because Jest doesn't support async components.

This means testing all scenarios requires spawning separate Next.js instances,
making comprehensive testing impractically slow.

## How Scenarist Helps

[Solution explanation with code]
```

**Not:**

```markdown
## How It Works

Scenarist uses hexagonal architecture with ports and adapters...
```

**Developers adopt tools because their current solution is painful, not because architecture is clever.**

### 4. Framework-Agnostic Positioning

**Don't position as "Next.js-only":**

❌ **BAD:** "Test Next.js Server Components without Jest"
✅ **GOOD:** "Whether you're building with Express, Hono, Fastify, Next.js, or Remix..."

**Server Components is ONE use case, not THE use case.** Scenarist works with all Node.js frameworks.

### 5. Neutral Documentation Tone

**Avoid:**
- Superlatives ("best", "perfect", "revolutionary")
- Defensive language ("finally", "unlike other tools")
- Over-enthusiasm ("amazing", "incredible")

**Use:**
- Factual descriptions
- Balanced comparisons
- Honest trade-off discussions

**Example:**

❌ **Marketing tone:** "Scenarist is the perfect solution for Next.js testing!"
✅ **Documentation tone:** "Scenarist enables HTTP-level integration testing with runtime scenario switching."

## Content Hierarchy

### Landing Page = High-Level Bullet Points

**Keep it brief (1-2 lines per feature):**

```markdown
**Key features:**
- **Ephemeral endpoints:** Scenario switching only active when `enabled: true`
- **Test isolation:** Unique test IDs enable parallel execution
- **Type-safe helpers:** Playwright integration with autocomplete
```

### Documentation Pages = Detailed Explanations

**Provide technical depth:**

```markdown
## How It Works: Ephemeral Endpoints

Scenarist creates ephemeral endpoints that only exist when testing is enabled.

**What the `enabled` flag controls:**
- When `enabled: true`: Endpoints active, middleware registered
- When `enabled: false`: Endpoints return 404, zero overhead

[Full code examples]
[Technical details]
```

**Rule:** If explanation requires more than 3-4 lines, it belongs in docs, not landing page.

## Decision Framework

**When writing content, ask:**

1. **Is this essential for decision-making?**
   - YES → Landing page (bullet point) + Docs (detailed)
   - NO → Docs only

2. **Can this be explained in 1-2 lines?**
   - YES → Could be landing page
   - NO → Docs page only

3. **Does this explain HOW it works technically?**
   - YES → Docs page
   - NO → Could be landing page

4. **Would a developer skip this while evaluating?**
   - YES → Docs page
   - NO → Landing page

## Modern Framework Testing Challenges

When explaining framework-specific issues, **use direct quotes from official documentation:**

### Next.js Server Components

> "Since async Server Components are new to the React ecosystem, Next.js recommends using end-to-end testing."
> — [Next.js Official Docs](https://nextjs.org/docs/app/building-your-application/testing#async-server-components)

**Our explanation:** Unit testing Server Components requires mocking Next.js internals (fetch, cookies, headers), which creates distance from production execution.

### Remix Loaders and Actions

> "There aren't standard ways of testing components that have Remix code."
> — [Remix Documentation](https://remix.run/docs/en/main/discussion/testing)

**Our explanation:** Developers must test loaders and actions separately from components, then hope they integrate correctly.

### General Pattern

1. Quote official framework docs
2. Explain the real-world implication
3. Show how Scenarist addresses it
4. Provide working code example

## Page Template: Pain → Solution → How It Works

Every feature page follows this structure:

```markdown
# Feature Name

## The Problem [Framework] Developers Face

[Specific pain point with real quote/example]

**Without Scenarist:**
```typescript
// ❌ Before: The painful way
[Code showing current pain]
```

## How Scenarist Solves It

**With Scenarist:**
```typescript
// ✅ After: The Scenarist way
[Code showing solution]
```

**Benefits:**
- Parallel test execution
- No test pollution
- Runtime scenario switching

## How It Works

[Technical details, algorithm explanation]

**API Reference:** [Link to detailed API docs]

## See Also

- [Related Feature 1]
- [Related Concept 2]
```

## Code Example Standards

Every code example must be:

1. **Complete** - Copy-paste ready, no placeholders
2. **Tested** - Verified to work in real applications
3. **Minimal** - Only code relevant to concept
4. **Explained** - Key parts have inline comments
5. **Consistent** - Same style throughout docs

❌ **BAD:**
```typescript
const scenarios = {
  premium: {
    mocks: [...]  // Undefined, incomplete
  }
};
```

✅ **GOOD:**
```typescript
import type { ScenaristScenario } from '@scenarist/core';

export const premiumScenario: ScenaristScenario = {
  id: 'premium',
  name: 'Premium User',
  mocks: [{
    method: 'GET',
    url: 'https://api.auth.com/session',
    response: {
      status: 200,
      body: { tier: 'premium', userId: 'user-123' }
    }
  }]
};
```

## Writing Checklist

Before publishing any documentation page:

### Accuracy
- [ ] No "CAN'T" statements that should be "CAN, but painful"
- [ ] Claims about unit tests acknowledge they work but require extensive mocking
- [ ] Testing gap accurately described (mocking creates distance, not impossibility)

### No Marketing Fluff
- [ ] No percentage claims without context
- [ ] No "X times faster" without explanation
- [ ] Code comparisons speak for themselves

### Correct Content Level
- [ ] Landing page has only bullet points and high-level overview
- [ ] Technical details are in docs pages, not landing page
- [ ] Each piece of content is in appropriate location

### Framework-Agnostic
- [ ] Express, Hono, Fastify mentioned alongside Next.js
- [ ] Server Components presented as one use case among many
- [ ] Examples show multiple frameworks when relevant

### Code Examples
- [ ] All code examples are complete and copy-paste ready
- [ ] No placeholders or undefined variables
- [ ] Examples match real type signatures
- [ ] Comments explain non-obvious parts

### Realistic Testing Gap
- [ ] Acknowledges unit tests are valuable
- [ ] Explains mocking creates testing/reality gap
- [ ] Shows HTTP-level testing is closer to production
- [ ] Positions Scenarist as complementing, not replacing unit tests

## Anti-Patterns to Avoid

### ❌ Defensive Language
- "Finally, testing that works"
- "Unlike other tools"
- "The way testing should be"

### ❌ Over-Promising
- "Solves all testing problems"
- "Perfect testing solution"
- "Zero configuration"

### ❌ Technical Jargon Without Context
- "Uses ports and adapters" (before explaining why it matters)
- "Hexagonal architecture" (before showing the problem it solves)
- "Ephemeral endpoints" (before explaining what that means)

### ❌ Vague Benefits
- "Better testing experience"
- "Improved developer workflow"
- "Enhanced test quality"

### ✅ Instead: Specific, Measurable, Honest
- "Tests run in parallel without interference"
- "Switch scenarios at runtime without restarting the server"
- "Mock only external APIs, not framework internals"

## Tone Examples

### Documentation (✅ Good)

> "Modern web applications consist of frontend and backend code that communicate over HTTP. Testing these layers presents a challenge: unit tests test each side in isolation, while end-to-end tests test the full system including browser rendering.
>
> Between these extremes lies a testing gap: verifying that your backend HTTP layer behaves correctly under different scenarios, without the overhead of full end-to-end tests."

**Why this works:**
- Neutral, explanatory tone
- States facts without superlatives
- Acknowledges both approaches have value
- Identifies specific gap

### Marketing (❌ Avoid)

> "Testing Next.js, Remix, and TanStack Is Broken. Scenarist fixes it.
>
> ❌ Flaky tests from shared MSW handlers
> ❌ Sequential execution (tests can't run in parallel)
> ❌ Scattered mocks across 50 test files
>
> **Scenarist eliminates E2E testing's biggest pain points!**"

**Problems:**
- Absolute statement ("is broken")
- Emotional language ("biggest pain points")
- Defensive tone ("eliminates")
- Better for landing page, not documentation

## Summary

**Remember:**
- Empathetic, not defensive
- Honest, not hyperbolic
- Practical, not theoretical
- Framework-agnostic, not Next.js-only
- Factual, not marketing

**The goal:** Help developers solve real problems, not convince them our architecture is clever.
