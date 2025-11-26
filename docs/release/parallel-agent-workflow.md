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
git worktree add ../scenarist-workstream-a release-plan -b workstream-a
git worktree add ../scenarist-workstream-b release-plan -b workstream-b
git worktree add ../scenarist-workstream-c release-plan -b workstream-c
git worktree add ../scenarist-workstream-d release-plan -b workstream-d
git worktree add ../scenarist-workstream-e release-plan -b workstream-e
git worktree add ../scenarist-workstream-f release-plan -b workstream-f
```

### Worktree Assignment

| Worktree | Branch | Workstream | Issues |
|----------|--------|------------|--------|
| `scenarist-workstream-a` | `workstream-a` | Changesets Setup | #142, #143, #144 |
| `scenarist-workstream-b` | `workstream-b` | Package Metadata | #147, #148, #149 |
| `scenarist-workstream-c` | `workstream-c` | Documentation | #150, #151, #152, #153 |
| `scenarist-workstream-d` | `workstream-d` | GitHub Actions | #154, #155, #156 |
| `scenarist-workstream-e` | `workstream-e` | Repository Prep | #157, #158, #159 |
| `scenarist-workstream-f` | `workstream-f` | Move Core | #145, #146 |

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
| **A (Changesets)** | #142 → #143 → #144 | Sequential dependency chain |
| **B (Metadata)** | #147, #148, #149 (any order) | All marked `parallel` |
| **C (Docs)** | #150, #151, #152, #153 (any order) | All marked `parallel` |
| **D (Actions)** | #154 → #155 → #156 | D2 depends on D1; D3 can parallel D1/D2 |
| **E (Repo Prep)** | #157, #158 (parallel) → #159 | E3 depends on B* completing |
| **F (Move Core)** | #145 → #146 | F2 depends on F1 |

#### Cross-Workstream Dependencies

Some tickets depend on other workstreams completing:

| Ticket | Depends On | Action |
|--------|------------|--------|
| #154 (D1) | #143 (A2) | D agent must wait for A to merge A2 |
| #159 (E3) | All B* issues | E agent must wait for B to complete |
| #160 (I1) | All A*, B*, D*, E1, E2, F* | Integration phase - after all workstreams |
| #161 (I2) | #160 (I1) | Final step |

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
   - Pass type checking (`pnpm check-types`)
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
git push -u origin workstream-a

# Create PR
gh pr create \
  --title "A1: Install and initialize Changesets" \
  --body "Closes #142

## Summary
- Installed @changesets/cli and @changesets/changelog-github
- Initialized changesets with \`pnpm changeset init\`
- Verified .changeset/ directory created

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
                    #142 (A1)
                       │
                       ▼
                    #143 (A2)
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       #144 (A3)   #154 (D1)   #156 (D3)
                       │
                       ▼
                   #155 (D2)

#145 (F1) ──► #146 (F2)

#147 (B1) ─┐
#148 (B2) ─┼──► #159 (E3)
#149 (B3) ─┘

#157 (E1) ─┬──► #160 (I1) ──► #161 (I2)
#158 (E2) ─┘

#150, #151, #152, #153 (C1-C4): All independent
```

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
- [ ] Type checking passes (`pnpm check-types`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Acceptance criteria from ticket verified
- [ ] PR description includes plan and "Closes #XXX"
