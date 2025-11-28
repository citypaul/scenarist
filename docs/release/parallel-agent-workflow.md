# Parallel Agent Workflow Guide

This document defines the rules and procedures for running multiple Claude agents in parallel using git worktrees to complete the Scenarist v1.0 release.

## Overview

Each workstream is assigned to a dedicated git worktree and Claude agent. Agents work independently on their assigned tickets, following strict rules for ticket ordering, incremental commits, and coordination.

## Worktree Setup

### Creating Worktrees

```bash
# From main repository
cd /Users/paulhammond/personal/scenarist

# Create worktrees for each workstream
git worktree add ../scenarist-ws1 main -b workstream-1
git worktree add ../scenarist-ws2 main -b workstream-2
git worktree add ../scenarist-ws3 main -b workstream-3
git worktree add ../scenarist-ws4 main -b workstream-4
git worktree add ../scenarist-ws5 main -b workstream-5
git worktree add ../scenarist-ws6 main -b workstream-6
git worktree add ../scenarist-ws7 main -b workstream-7
git worktree add ../scenarist-ws8 main -b workstream-8
```

### Worktree Assignment

| Worktree | Branch | Workstream | Issues |
|----------|--------|------------|--------|
| `scenarist-ws1` | `workstream-1` | Getting Started Section | #191, #192, #193, #194 |
| `scenarist-ws2` | `workstream-2` | Core Concepts Section | #195, #196, #197, #198, #199 |
| `scenarist-ws3` | `workstream-3` | RSC Guide | #200 |
| `scenarist-ws4` | `workstream-4` | Testing Patterns | #201, #202, #203 |
| `scenarist-ws5` | `workstream-5` | Reference Section | #204, #205 |
| `scenarist-ws6` | `workstream-6` | Sidebar & Link Fixes | #206, #207 |
| `scenarist-ws7` | `workstream-7` | App Router Examples (M2) | #208, #209, #210, #211 |
| `scenarist-ws8` | `workstream-8` | RSC Guide Updates (M2) | #212, #213, #214, #215 |

---

## Agent Rules

### Rule 1: One Agent Per Worktree

- Each agent operates exclusively within its assigned worktree
- Agents must NOT modify files outside their worktree
- Agents must NOT push to branches other than their assigned branch

### Rule 2: Ticket Pickup Order

Agents must pick up tickets in dependency order within their workstream.

#### Determining Ticket Order

1. **Read the ticket's "Depends On" section** - If present, those tickets must be completed first
2. **Within a workstream, follow numerical order** - A1 → A2 → A3, B1 → B2 → B3, etc.
3. **Tickets marked `parallel` can be done in any order** within their workstream
4. **Tickets marked `blocker` must be prioritized**

#### Workstream Ticket Order

| Workstream | Order | Rationale |
|------------|-------|-----------|
| **WS1 (Getting Started)** | #191, #192, #193, #194 (any order) | All independent |
| **WS2 (Core Concepts)** | #195, #196, #197, #198, #199 (any order) | All independent |
| **WS3 (RSC Guide)** | #200 | Single issue |
| **WS4 (Testing Patterns)** | #201, #202, #203 (any order) | All independent |
| **WS5 (Reference)** | #204, #205 (any order) | All independent |
| **WS6 (Sidebar/Links)** | #206, #207 (any order) | Must wait for WS1-WS5 |
| **WS7 (App Router Examples)** | #208, #209, #210, #211 (any order) | All independent, TDD required |
| **WS8 (RSC Guide Updates)** | Each depends on WS7 | See cross-workstream deps |

#### Cross-Workstream Dependencies

Some tickets depend on other workstreams completing:

| Ticket | Depends On | Action |
|--------|------------|--------|
| #206 (WS6) | All WS1-WS5 issues | WS6 agent must wait for docs restructure to complete |
| #207 (WS6) | All WS1-WS5 issues | WS6 agent must wait for docs restructure to complete |
| #212 (WS8) | #208 (WS7) | WS8 agent must wait for Server Actions example |
| #213 (WS8) | #209 (WS7) | WS8 agent must wait for Auth example |
| #214 (WS8) | #210 (WS7) | WS8 agent must wait for Streaming example |
| #215 (WS8) | #211 (WS7) | WS8 agent must wait for Error Boundary example |

**How to check if a dependency is met:**
```bash
# Check if a ticket's PR has been merged to main
gh pr list --state merged --search "closes #143"

# Or check if the branch contains the changes
git log main --oneline --grep="closes #143"
```

### Rule 3: Work in Small Increments

Each ticket should be completed through multiple small commits, not one large commit.

#### Commit Strategy

1. **Plan phase**: Read ticket, create mental model of work needed
2. **Incremental commits**: One logical change per commit
3. **Each commit must**:
   - Pass all tests (`pnpm test`)
   - Pass type checking (`pnpm typecheck`)
   - Pass linting (`pnpm lint`)
   - Be independently revertable

#### Commit Message Format

```
<type>(<scope>): <description>

closes #<issue-number> (only on final commit for ticket)
```

**Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

**Examples**:
```bash
# Incremental commits
git commit -m "chore(changesets): install @changesets/cli"
git commit -m "chore(changesets): install @changesets/changelog-github"
git commit -m "chore(changesets): initialize with pnpm changeset init"

# Final commit closes the issue
git commit -m "chore(changesets): add config.json for fixed versioning

closes #143"
```

### Rule 4: Create a Plan Before Starting Each Ticket

Before writing any code for a ticket, the agent must:

1. **Read the ticket fully** - Understand all tasks and acceptance criteria
2. **Identify files to modify** - List all files that will be created/changed
3. **Break into commits** - Plan the sequence of small commits
4. **Check dependencies** - Verify any dependent tickets are complete
5. **Document the plan** - Create a brief plan in the PR description

#### Plan Template

```markdown
## Plan for #<issue-number>

### Files to Modify
- [ ] `path/to/file1.ts`
- [ ] `path/to/file2.json`

### Commit Sequence
1. `chore(scope): first change`
2. `chore(scope): second change`
3. `chore(scope): final change - closes #<issue>`

### Dependencies Verified
- [x] #<dep-issue> merged to main

### Acceptance Criteria Check
- [ ] Criterion 1
- [ ] Criterion 2
```

### Rule 5: PR Creation and Merging

#### Creating PRs

After completing all commits for a ticket:

```bash
# Push branch
git push -u origin workstream-1

# Create PR
gh pr create \
  --title "docs: Rewrite installation.md with actual content" \
  --body "Closes #191

## Summary
- Fixed broken links to framework guides
- Added actual installation content with pnpm/npm/yarn commands
- Added framework-specific installation sections

## Pages Changed
- https://scenarist.io/introduction/installation (before restructure)
- https://scenarist.io/getting-started/installation (after restructure)

## Plan
[Include plan from Rule 4]
" \
  --base main
```

#### PR Requirements

- Title matches ticket title
- Body includes "Closes #XXX" to auto-close issue
- All CI checks pass
- Plan included in description
- **Page Links Required**: Include links to affected pages on https://scenarist.io so changes can be inspected

#### Merging Strategy

1. **Self-merge allowed** for non-blocking tickets within your workstream
2. **Request review** for `blocker` tickets
3. **Squash merge** preferred to keep history clean
4. **After merge**: Pull main into your worktree branch

```bash
# After your PR is merged
git checkout workstream-a
git fetch origin
git rebase origin/main
```

---

## Coordination Protocol

### Status Updates

Agents should update ticket status as they work:

```bash
# When starting a ticket
gh issue edit 142 --add-label "in-progress"

# When PR is ready
gh issue edit 142 --remove-label "in-progress" --add-label "review"

# Issue auto-closes when PR merges with "closes #142"
```

### Handling Cross-Workstream Dependencies

When your ticket depends on another workstream:

1. **Check dependency status**:
   ```bash
   gh issue view <dep-issue-number> --json state,labels
   ```

2. **If not complete**: Work on other tickets in your workstream, or wait

3. **If complete**:
   ```bash
   # Pull the changes into your branch
   git fetch origin
   git rebase origin/main
   ```

### Conflict Resolution

If you encounter merge conflicts:

1. **Never force push** to shared branches
2. **Rebase on main** regularly to minimize conflicts
3. **If conflict in shared file**: Coordinate with the other agent's workstream
4. **Document conflicts** in PR comments

---

## Quick Reference: Ticket Dependencies Graph

```
PHASE 1 - Documentation Restructure (can run in parallel):

WS1: #191, #192, #193, #194 ─┐
WS2: #195, #196, #197, #198, #199 ─┼─► WS6: #206, #207
WS3: #200 ─┤                           (Sidebar & Links)
WS4: #201, #202, #203 ─┤
WS5: #204, #205 ─┘


PHASE 2 - App Router Examples (Milestone 2):

WS7 (all can run in parallel):
#208 (Server Actions) ──► #212 (Docs: Server Actions)
#209 (Auth Flow) ──► #213 (Docs: Auth)
#210 (Streaming) ──► #214 (Docs: Streaming)      } WS8
#211 (Error Boundary) ──► #215 (Docs: Error)


Notes:
- WS1-WS5 can all run simultaneously
- WS6 must wait for WS1-WS5 to complete
- WS7 can run in parallel with WS1-WS5
- WS8 issues depend on their corresponding WS7 issue
```

---

## URL Mapping for Page Links

Documentation pages map from file paths to URLs as follows:

**Base URL:** `https://scenarist.io`

**Mapping Rule:**
```
apps/docs/src/content/docs/{path}.md  →  https://scenarist.io/{path}
apps/docs/src/content/docs/{path}.mdx →  https://scenarist.io/{path}
```

**Examples:**
| File Path | URL |
|-----------|-----|
| `introduction/installation.md` | https://scenarist.io/introduction/installation |
| `getting-started/philosophy.mdx` | https://scenarist.io/getting-started/philosophy |
| `concepts/how-it-works.md` | https://scenarist.io/concepts/how-it-works |
| `concepts/dynamic-responses/index.mdx` | https://scenarist.io/concepts/dynamic-responses |
| `frameworks/nextjs-app-router/rsc-guide.mdx` | https://scenarist.io/frameworks/nextjs-app-router/rsc-guide |
| `testing/playwright-integration.mdx` | https://scenarist.io/testing/playwright-integration |
| `reference/api.mdx` | https://scenarist.io/reference/api |

**For new pages:** Include the URL where the page WILL appear after merge.
**For moved pages:** Include BOTH the old URL (if still live) and new URL.

---

## Checklist: Before Starting Work

- [ ] Worktree created and on correct branch
- [ ] Latest main pulled into branch
- [ ] Ticket dependencies verified as complete
- [ ] Plan created for ticket
- [ ] `pnpm install` run in worktree
- [ ] All tests passing before starting

## Checklist: Before Creating PR

- [ ] All commits follow message format
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Acceptance criteria from ticket verified
- [ ] PR description includes plan and "Closes #XXX"
