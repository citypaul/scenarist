# User Feedback and Future Architectural Considerations

This document captures important user feedback that may influence future architectural decisions and feature development.

## November 2025: Lee Cheneler Feedback

### Context

Experienced developer (Lee Cheneler) reviewed Scenarist and provided critical feedback about positioning, value proposition clarity, and architectural limitations.

### Key Feedback Points

#### 1. Value Proposition Confusion

**Issue:** Landing page hero "Browser Testing That Actually Runs Your Backend" doesn't differentiate from existing tools.

**Lee's reaction:**

> "This isn't new or novel in the space because every playwright suite I've ever written runs against a real running backend"

**Root cause:** The headline focuses on the solution (running backend) instead of the problem (HTTP boundary testing gap with mocking pain vs E2E slowness).

**Action taken:** Landing page updated to lead with the problem statement from why-scenarist page.

#### 2. "What's Hard" Isn't Clear

**Issue:** Claim that "Server Components, Remix loaders, middleware chains" are "hard to test" confused experienced developers.

**Lee's reaction:**

> "Not sure what makes them hard sorry??"
> "Unit tests can do this"

**Root cause:** The pain of mocking framework internals (Request objects, cookies(), headers(), middleware chains) isn't shown concretely with code examples.

**Action taken:** Added explicit code examples showing the mocking pain in landing page and why-scenarist documentation.

#### 3. Server-Side State Limitation

**Issue:** Scenarist currently uses server-side state (in-memory map) to track which test ID → scenario mapping, which limits deployment options.

**Lee's feedback:**

> "100% only works with single instance deployments so we couldn't run it in our CI unfortunately"
>
> "A far better approach in my opinion would be to wrap up the test session context in a cookie _SCENARIST_CONTEXT_ and have that be seamlessly passed up and down instead, zero state on server, no issues running this against deployed apps then"

**Technical Details:**

- Current: Test ID → Scenario mapping stored in-memory on server
- Proposed: Test ID → Scenario mapping stored in cookie, making server stateless
- Benefit: Would work with load-balanced deployments, deployed environments
- Trade-off: Adds complexity, not the primary use case

**Paul's position:**

> "The way it works on the server, every test instance has a unique id and it all works pretty smoothly. I figured most CI servers wouldn't be testing against load balanced instances"
>
> "It's definitely usable and works really well... it's meant to be used earlier in the pipeline though"

**Analysis:**

- Scenarist is primarily designed for "shift-left" testing (local dev, single-instance CI)
- Most teams using Scenarist for this use case don't need load-balanced support
- Cookie-based approach would enable broader use cases but isn't the core value prop
- Lee's team represents edge case: can't run apps in CI, need deployed environment testing

#### 4. Positioning: When to Use Scenarist

**Issue:** Unclear whether Scenarist replaces unit tests, E2E tests, or something else.

**Lee's context:**

> "We could run it further left but its heavy lifting we do seamlessly in our unit tests anyway"
>
> "We don't have an earlier in our pipeline really, our pipelines are so fast"

**Analysis:**
Teams with excellent unit test practices (clean architecture, well-isolated code) may not need Scenarist. The value is strongest for:

- Testing code that's hard to isolate (Server Components, middleware chains, session logic)
- Multi-step journeys where session state matters
- Teams wanting E2E-like confidence without E2E slowness

**Action taken:** Added explicit "When to Use / When Not to Use" section to documentation.

### Future Architectural Considerations

#### Option 1: Cookie-Based Stateless Mode

**Proposed Implementation:**

```typescript
// Cookie format
_SCENARIST_CONTEXT_ = {
  testId: "uuid-123",
  scenarioId: "premiumUser",
  timestamp: 1234567890,
};

// Server reads from cookie instead of in-memory map
const context = parseCookie(request.headers.cookie);
const scenario = getScenario(context.scenarioId);
```

**Pros:**

- Server becomes stateless
- Works with load-balanced deployments
- Can test against deployed environments
- Standard web technology (cookies)
- Doesn't break existing use cases

**Cons:**

- Adds complexity to cookie management
- Cookie size limits (4KB) could be issue with large scenarios
- Not primary use case we're targeting
- Security considerations (cookie encryption?)
- Client-side JavaScript required for cookie manipulation?

**Recommendation:**

- Document this as potential v2 feature if demand materializes
- For now, focus on "shift-left" positioning (local + single-instance CI)
- Add clear documentation about single-instance limitation
- Revisit if multiple users request deployed environment testing

#### Option 2: Hybrid Approach

Offer both modes:

```typescript
createScenarist({
  enabled: true,
  scenarios,
  stateMode: "in-memory" | "cookie", // Choose mode
});
```

**Pros:**

- Flexibility for different use cases
- Backward compatible
- Users can opt-in to cookie mode

**Cons:**

- Doubles testing surface
- Maintenance burden (two modes to support)
- May confuse users about which mode to use

### Documentation Improvements Made

1. **Landing page hero** - Changed from solution-focused to problem-focused
2. **Added "What's Actually Hard" section** - Concrete mocking examples
3. **Added "When to Use" section** - Explicit guidance on appropriate use cases
4. **Added "Limitations" section** - Honest about single-instance requirement
5. **Updated why-scenarist** - Emphasized mocking pain with code examples

### Tracking Future Feature Requests

**Cookie-based stateless mode:**

- Status: Consideration phase
- Demand: 1 user (Lee Cheneler)
- Priority: Low (not primary use case)
- Decision: Document limitation, revisit if pattern emerges

**Load-balanced deployment support:**

- Status: Related to cookie mode
- Demand: Unknown (need more user feedback)
- Priority: Low
- Decision: Current architecture sufficient for primary use case

### Key Takeaways for Future Development

1. **Lead with problems, not solutions** - Users understand pain better than benefits
2. **Show concrete examples** - Abstract claims ("hard to test") need code examples
3. **Be honest about limitations** - Single-instance requirement is fine if documented
4. **Positioning matters** - "Further left" (dev/local CI) vs "deployed environment testing" are different markets
5. **Edge cases aren't urgent** - One user's use case doesn't require immediate architecture change

### Related Discussions

- GitHub Issue: TBD (if cookie mode gains traction)
- ADR: TBD (if architectural change considered)
- User interviews: Consider reaching out to understand if stateless mode is common need

---

**Last Updated:** November 2025
**Next Review:** When additional feedback about deployment limitations emerges
