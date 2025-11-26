# Agent Prompt Template

Copy and customize the prompt below for each workstream agent.

---

## Workstream A (Changesets)

```
You are working on the Scenarist v1.0 release. You have been assigned to **Workstream A: Changesets Setup**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-a`
**Issues**: #142, #143, #144 (in that order)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Read the full release plan: `~/.claude/plans/melodic-wibbling-porcupine.md`

## Your Tickets (in order)

1. **#142 - A1: Install and initialize Changesets** (blocker)
   - Install @changesets/cli and @changesets/changelog-github
   - Run `pnpm changeset init`
   - Verify .changeset/ directory created

2. **#143 - A2: Configure Changesets for fixed versioning** (blocker)
   - Depends on #142
   - Configure .changeset/config.json per the plan
   - Fixed versioning for 3 public packages (NOT core - it's internal)
   - Ignore list for all internal/example packages

3. **#144 - A3: Create initial changeset for v1.0.0**
   - Depends on #143
   - Run `pnpm changeset` and select all 3 public packages
   - Choose "major" bump type

## Rules

1. **Work tickets in order** - #142 → #143 → #144
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `chore(changesets): <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets

## Cross-Workstream Note

Workstream D (GitHub Actions) depends on your #143 completing before they can start #154. Prioritize accordingly.

Start by reading the workflow document, then begin with ticket #142.
```

---

## Workstream B (Package Metadata)

```
You are working on the Scenarist v1.0 release. You have been assigned to **Workstream B: Package Metadata**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-b`
**Issues**: #147, #148, #149 (can be done in any order - all marked `parallel`)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Read the full release plan: `~/.claude/plans/melodic-wibbling-porcupine.md`

## Your Tickets (any order)

1. **#147 - B1: Add publishConfig to @scenarist/express-adapter** (parallel)
   - Add `publishConfig` with `access: public`
   - Add `engines` field with `node: >=18.0.0`
   - Verify version is `0.0.0`

2. **#148 - B2: Add publishConfig to @scenarist/nextjs-adapter** (parallel)
   - Add `publishConfig` with `access: public`
   - Add `engines` field with `node: >=18.0.0`
   - Verify version is `0.0.0`

3. **#149 - B3: Add publishConfig to @scenarist/playwright-helpers** (parallel)
   - Add `publishConfig` with `access: public`
   - Add `engines` field with `node: >=18.0.0`
   - Reset version from `0.1.0` to `0.0.0`

## Rules

1. **These tickets can be done in any order** - All marked `parallel`
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `chore(metadata): <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets

## Cross-Workstream Note

Workstream E's ticket #159 (dry-run publish) depends on all your tickets completing. Work efficiently.

Start by reading the workflow document, then begin with any ticket.
```

---

## Workstream C (Documentation)

```
You are working on the Scenarist v1.0 release. You have been assigned to **Workstream C: Documentation**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-c`
**Issues**: #150, #151, #152, #153 (can be done in any order - all marked `parallel`)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Read the full release plan: `~/.claude/plans/melodic-wibbling-porcupine.md`

## Your Tickets (any order)

1. **#150 - C1: Create CONTRIBUTING.md** (parallel)
   - Document development setup
   - Document TDD requirements
   - Document changeset workflow
   - Document PR guidelines

2. **#151 - C2: Update root README with installation instructions** (parallel, blocker)
   - Add npm/pnpm/yarn install commands
   - Add npm badges for all packages
   - Update documentation link to https://scenarist.io

3. **#152 - C3: Update @scenarist/core README** (parallel)
   - Note: Core is becoming internal - clarify this in README
   - Add badge and install instructions
   - Link to https://scenarist.io

4. **#153 - C4: Update adapter and helper READMEs** (parallel)
   - Update express-adapter README with badge + install (npm/pnpm/yarn)
   - Update nextjs-adapter README with badge + install (npm/pnpm/yarn)
   - Update playwright-helpers README with badge + install (npm/pnpm/yarn)

## Rules

1. **These tickets can be done in any order** - All marked `parallel`
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `docs: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets

## Important Context

- Documentation site is https://scenarist.io (NOT scenarist.dev)
- Core package is becoming internal - users import from adapters, not core
- Always show all 3 package managers: npm, pnpm, yarn
- Only 3 packages will be published: express-adapter, nextjs-adapter, playwright-helpers

Start by reading the workflow document, then begin with any ticket.
```

---

## Workstream D (GitHub Actions)

```
You are working on the Scenarist v1.0 release. You have been assigned to **Workstream D: GitHub Actions**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-d`
**Issues**: #154, #155, #156

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Read the full release plan: `~/.claude/plans/melodic-wibbling-porcupine.md`

## IMPORTANT: Cross-Workstream Dependency

**#154 (D1) depends on #143 (A2) from Workstream A completing first.**

Before starting #154, verify A2 is merged:
```bash
gh issue view 143 --json state
```

If not merged, wait or check back periodically.

## Your Tickets (in order)

1. **#154 - D1: Create release workflow** (blocker)
   - WAIT for #143 to merge first
   - Create `.github/workflows/release.yml`
   - Configure Changesets action
   - Set up npm publishing and GitHub Release creation

2. **#155 - D2: Create pre-release workflow** (blocker)
   - Depends on #154
   - Create `.github/workflows/pre-release.yml`
   - Support beta and RC branches
   - Publish with appropriate npm tags (@beta, @rc)

3. **#156 - D3: Add changeset check to CI**
   - Can be done in parallel with D1/D2 (only depends on #142)
   - Add job to `.github/workflows/ci.yml`
   - Warn (not fail) when PRs have no changeset

## Rules

1. **Work tickets in dependency order** - Wait for dependencies before starting
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `ci: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets

## Workflow YAML Reference

The full release plan contains the complete YAML for both workflows. Reference it when implementing.

Start by reading the workflow document, then check if #143 is merged before beginning.
```

---

## Workstream E (Repository Preparation)

```
You are working on the Scenarist v1.0 release. You have been assigned to **Workstream E: Repository Preparation**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-e`
**Issues**: #157, #158, #159

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Read the full release plan: `~/.claude/plans/melodic-wibbling-porcupine.md`

## Your Tickets

1. **#157 - E1: Configure NPM_TOKEN secret** (blocker, parallel)
   - Generate npm automation token at npmjs.com
   - Add NPM_TOKEN to GitHub repository secrets
   - NOTE: This requires manual action by the repo owner - document the steps clearly

2. **#158 - E2: Create initial git tag** (parallel)
   - `git tag v0.0.0`
   - `git push origin v0.0.0`
   - This establishes baseline for changelog generation

3. **#159 - E3: Test dry-run npm publish**
   - **WAIT for all B* issues (#147, #148, #149) to merge first**
   - Run dry-run publish for all 3 public packages
   - Verify no errors about missing fields

## Rules

1. **#157 and #158 can be done in parallel**
2. **#159 must wait for Workstream B to complete**
3. **Small incremental commits** - Each commit must pass tests/types/lint
4. **Create a plan before starting each ticket** - Document in your PR
5. **Commit message format**: `chore(release): <description>`
6. **Final commit for each ticket**: Include `closes #<issue-number>`

## Cross-Workstream Dependency Check

Before starting #159:
```bash
gh issue view 147 --json state
gh issue view 148 --json state
gh issue view 149 --json state
```

All must show `"state": "CLOSED"`.

Start by reading the workflow document, then begin with #157 or #158.
```

---

## Workstream F (Move Core to Internal)

```
You are working on the Scenarist v1.0 release. You have been assigned to **Workstream F: Move Core to Internal**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-f`
**Issues**: #145, #146 (in that order)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Read the full release plan: `~/.claude/plans/melodic-wibbling-porcupine.md`

## Context

Investigation revealed that example apps already import all types from adapters, not from @scenarist/core directly. The adapters re-export everything users need. Therefore, core should be an internal package (not published to npm).

## Your Tickets (in order)

1. **#145 - F1: Move @scenarist/core to internal** (blocker)
   - Move `packages/core` → `internal/core`
   - Update pnpm-workspace.yaml if needed
   - Update all import paths in adapters
   - Update turbo.json if any core-specific tasks
   - Mark package.json as `"private": true`
   - Run full test suite to verify no breakage

2. **#146 - F2: Update documentation to import from adapters** (blocker)
   - Depends on #145
   - Update `apps/docs/src/content/docs/` files
   - Change `from '@scenarist/core'` → `from '@scenarist/express-adapter'` (or nextjs-adapter)
   - Update root README.md if it mentions core imports
   - Verify all code examples still work

## Rules

1. **Work tickets in order** - #145 → #146
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `refactor(core): <description>` for F1, `docs: <description>` for F2
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets

## Critical: Test Everything

Moving core is high-risk. After each change:
```bash
pnpm install
pnpm build
pnpm test
pnpm check-types
```

All must pass before committing.

Start by reading the workflow document, then begin with ticket #145.
```

---

## Quick Copy Reference

| Workstream | Copy from section |
|------------|-------------------|
| A | "Workstream A (Changesets)" |
| B | "Workstream B (Package Metadata)" |
| C | "Workstream C (Documentation)" |
| D | "Workstream D (GitHub Actions)" |
| E | "Workstream E (Repository Preparation)" |
| F | "Workstream F (Move Core to Internal)" |
