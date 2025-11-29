# Investigation Documents Index

This directory contains investigation documents for debugging and root cause analysis.

## Active Investigations

_(No active investigations)_

---

## Resolved Investigations

### Next.js Pages Router MSW Integration (2025-11-12)

**File:** [next-js-pages-router-msw-investigation.md](./next-js-pages-router-msw-investigation.md)

**Issue:** Playwright tests for getServerSideProps failed to use switched scenarios, always showing standard pricing instead of premium.

**Root Cause:** Next.js HMR (Hot Module Replacement) loaded `lib/scenarist.ts` multiple times, creating multiple instances of `InMemoryScenarioStore`. Scenarios stored in one instance couldn't be retrieved from other instances.

**Resolution:** Added singleton pattern to Pages Router adapter with global stores and instance caching.

**Status:** ✅ RESOLVED

**Key Learning:** Next.js adapters MUST use singleton patterns for stores and MSW servers to handle HMR module reloading.

---

### Parallel Execution Race Condition

**File:** [parallel-execution-race-condition.md](./parallel-execution-race-condition.md)

**Issue:** switchScenario calls racing when tests run in parallel.

**Resolution:** Fixed with 200ms delay and enhanced logging.

**Status:** ✅ RESOLVED

---

### Playwright Fetch Headers Flakiness

**File:** [playwright-fetch-headers-flakiness.md](./playwright-fetch-headers-flakiness.md)

**Issue:** Random failures when warmup tests collided with actual tests.

**Resolution:** Cold start handling with warmup pattern.

**Status:** ✅ RESOLVED

---

## Investigation Template

When creating new investigations, include:

1. **Status** - Current state (Active/Resolved/Blocked)
2. **Problem Statement** - What's broken?
3. **Evidence** - Logs, test output, error messages
4. **Root Cause** - What's causing it (if known)
5. **Hypotheses** - What might be causing it (if investigating)
6. **Next Steps** - What to do next
7. **Resolution** - How it was fixed (when resolved)

## Tips for Future Investigations

### Capturing Server Logs

For Next.js Pages Router:

```bash
pnpm dev > /tmp/nextjs-server.log 2>&1 &
pnpm exec playwright test <test-file>
cat /tmp/nextjs-server.log | grep -E '<pattern>'
pkill -f "pnpm dev"
```

### Common Debug Patterns

**Add logging to packages:**

```typescript
console.log("[Component] Description:", value);
console.log("[Component] Object:", JSON.stringify(obj, null, 2));
```

**Check test isolation:**

```bash
pnpm exec playwright test <test-file> --workers=1  # Serial execution
pnpm exec playwright test <test-file> --workers=4  # Parallel execution
```

**Compare manual vs automated:**

```bash
# Manual curl (usually works)
curl -H "x-scenarist-test-id: test-123" "http://localhost:3000/path"

# Automated test (might fail)
pnpm exec playwright test <test-file>
```

## Document Maintenance

- Keep STATUS up to date (Active/Resolved/Blocked)
- Move resolved investigations to "Resolved" section
- Archive old investigations after 6 months
- Update index when adding new investigations
