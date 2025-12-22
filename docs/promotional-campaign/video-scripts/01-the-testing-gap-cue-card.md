# Video 1: The Testing Gap - Cue Card

Condensed recording guide. See `01-the-testing-gap.md` for full script.

---

## Setup

- No terminals needed (conceptual video)
- Have diagrams ready: "The Real Testing Gap", "Testing Pyramid with Gap"
- Have code snippet slides ready (server test, frontend test, scenario tease)

---

## Flow (5 min)

### 0:00 - HOOK

> "Your server tests pass. Your frontend tests pass. CI is green. You ship. Users report a bug. What went wrong?"

**Key line:** "You tested both sides _separately_. You never proved they work _together_."

---

### 0:30 - THE SERVER TEST LIE

_Show server test code snippet_

> "We mock the session, test the endpoint. Passes. But what did we prove?"

**Key line:** "We proved our assumption. Not that a real user sees the discount."

---

### 1:15 - THE FRONTEND TEST LIE

_Show frontend test code snippet_

> "We render with mock data. Passes. But we hardcoded the discount."

**Key line:** "Testing our assumption, not reality."

---

### 2:00 - THE GAP

_Show "The Real Testing Gap" diagram_

> "One side: server tests. No browser. Other side: frontend tests. No server. In the middle? The gap."

**Key line:** "That's where the bugs hide."

---

### 2:30 - WHY IT'S HARD

_Show checkout flow_

> "Server-side state builds up. Login → session → cart → checkout. Each step depends on the last."

> "To test 'payment declined for premium user' you need: real browser, real server, Auth0 returning premium, Stripe returning declined."

**Key line:** "You can't just ask Stripe to decline the card for your test."

---

### 3:15 - WHAT YOU NEED

_Show "Testing Pyramid with Gap" diagram_

> "Real browser - not jsdom. Real server - your actual code. Controlled external APIs."

**Key line:** "Real browser. Real server. Controlled responses."

---

### 4:00 - THE SOLUTION (TEASE)

_Show scenario switching code_

> "What if you could define scenarios and switch instantly? No restarts. No config files. No test accounts."

---

### 4:30 - TEASE NEXT VIDEO

> "Next video: a real payment app with Auth0, Stripe, internal services. Real SDKs. Real HTTP calls. I'll show you why testing it is hard - before we fix it."

---

## Key Phrases Cheat Sheet

1. "Your server tests pass. Your frontend tests pass. But can you prove they work together?"
2. "You tested your assumptions, not reality"
3. "That's where the bugs hide"
4. "Real browser. Real server. Controlled responses."
5. "No server restarts. No editing config files."

---

## Timing Checkpoints

| Time | Section           | Visual          |
| ---- | ----------------- | --------------- |
| 0:00 | Hook              | Face to camera  |
| 0:30 | Server test lie   | Code slide      |
| 1:15 | Frontend test lie | Code slide      |
| 2:00 | The Gap           | Gap diagram     |
| 2:30 | Why it's hard     | Flow diagram    |
| 3:15 | What you need     | Pyramid diagram |
| 4:00 | Solution tease    | Code slide      |
| 4:30 | Tease next        | Face to camera  |
