# Implementation Plans

This directory contains **working implementation plans** for features and initiatives in Scenarist. These are living documents that track progress, tasks, and implementation details.

## ADRs vs Plans: What's the Difference?

### Architecture Decision Records (ADRs)

**Location:** `docs/adrs/`
**Purpose:** Document architectural decisions
**Length:** 200-400 lines (concise)
**Status:** Fixed once written (historical record)
**Audience:** Future developers wondering "why did we decide this?"

**ADR Structure:**
```markdown
# ADR-NNNN: Title

**Status**: Proposed | Accepted | Superseded
**Date**: YYYY-MM-DD

## Context
What is the issue we're facing? What forces are at play?

## Decision
What have we decided to do?

## Alternatives Considered
What other options did we evaluate?
- Alternative 1: Description + why rejected
- Alternative 2: Description + why rejected

## Consequences
### Positive
What benefits does this decision bring?

### Negative
What drawbacks or costs does this decision have?

### Risks & Mitigation
What could go wrong and how do we address it?
```

**What belongs in an ADR:**
- ✅ The architectural decision being made
- ✅ Context explaining why the decision is needed
- ✅ Alternatives that were considered and rejected
- ✅ Consequences (positive, negative, risks)
- ✅ Key design principles or constraints
- ❌ Detailed implementation steps
- ❌ Task tracking or progress updates
- ❌ Code examples longer than ~20 lines
- ❌ Exhaustive API specifications

**Example ADR topics:**
- "Why we use ports and adapters architecture"
- "Why scenarios must be serializable"
- "Why we chose four-layer testing strategy"
- "Why state resets on scenario switch"

### Implementation Plans

**Location:** `docs/plans/`
**Purpose:** Track feature implementation progress
**Length:** As long as needed (500-2000+ lines)
**Status:** Living document (updated as work progresses)
**Audience:** Developers actively working on the feature

**Plan Structure:**
```markdown
# Feature Name Implementation Plan

**Related ADR:** [ADR-NNNN](../adrs/NNNN-title.md)
**Status**: Not Started | In Progress | Complete
**Tracking Issue:** #123

## Overview
Brief description of what we're building.

## Requirements
- REQ-1: Description
- REQ-2: Description

## Implementation Phases
### Phase 1: Name
**Status**: ✅ Complete | 🚧 In Progress | ⏸️ Blocked | ⏳ Not Started

**Tasks:**
- [x] Completed task
- [ ] Pending task

**Files to modify:**
- `path/to/file.ts` - what changes

**TDD workflow:**
1. RED: Test description
2. GREEN: Minimal implementation
3. REFACTOR: Improvements

### Phase 2: Name
...

## Progress Tracking
- Phase 1: ✅ Complete
- Phase 2: 🚧 In Progress (3/7 tasks)
- Phase 3: ⏳ Not Started

## Notes & Learnings
Things discovered during implementation.
```

**What belongs in a plan:**
- ✅ Detailed implementation steps
- ✅ Task lists and progress tracking
- ✅ File-by-file modification plans
- ✅ TDD workflow examples
- ✅ Code snippets and examples
- ✅ Phased rollout strategy
- ✅ Testing approach details
- ✅ Notes and learnings during implementation

**Example plan topics:**
- "Dynamic Response System Implementation"
- "Redis Adapter Implementation"
- "Visual Debugger Implementation"
- "v2.0 Migration Plan"

## When to Create Each

### Create an ADR when:
- Making an architectural decision that affects the system design
- Choosing between multiple viable approaches
- Establishing a pattern or principle for the codebase
- Answering "why did we do it this way?" for future developers

### Create a Plan when:
- Starting work on a new feature
- Breaking down a large initiative into phases
- Tracking progress across multiple PRs
- Documenting implementation details and tasks

## Example: Dynamic Response System

**Bad approach (mixing):**
- Single 1300-line ADR-0002 containing both decisions AND implementation plan

**Good approach (separated):**

**ADR-0002: Dynamic Response System** (300 lines)
- Decision: Support request matching, sequences, and state
- Alternative: Function-based responses (rejected - not serializable)
- Alternative: State machine definitions (rejected - too complex)
- Consequence: More complex core logic, but maintains serializability

**Plan: Dynamic Response System** (1000 lines)
- Phase 1: Request matching (detailed tasks)
- Phase 2: Response sequences (detailed tasks)
- Phase 3: Stateful mocks (detailed tasks)
- Phase 4: Composition (detailed tasks)
- Phase 5: Debugging API (detailed tasks)
- Progress tracking, code examples, TDD workflows

## Linking ADRs and Plans

Plans should reference their related ADR:

```markdown
# Dynamic Response System Implementation Plan

**Related ADR:** [ADR-0002: Dynamic Response System](../adrs/0002-dynamic-response-system.md)
```

ADRs may reference plans for implementation details:

```markdown
# ADR-0002: Dynamic Response System

## Implementation

See [Dynamic Response System Implementation Plan](../plans/dynamic-response-system.md)
for detailed implementation phases and progress tracking.
```

## Current Plans

| Plan | Status | Related ADR |
|------|--------|-------------|
| (none yet) | - | - |

## Creating a New Plan

1. Copy the template structure above
2. Create `docs/plans/feature-name.md`
3. Link to related ADR if one exists
4. Add to the table above
5. Keep updated as work progresses

## Archiving Completed Plans

When a plan is fully complete:
1. Update status to "✅ Complete"
2. Add completion date
3. Move to `docs/plans/archive/` (optional)
4. Keep in main directory for reference (recommended)

Completed plans serve as valuable historical context for how features were built.
