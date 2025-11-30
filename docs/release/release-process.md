# Scenarist Release Process

This document describes the release workflow for Scenarist packages.

## Release Types

| Type       | Version Example | npm Tag   | Branch         | Use Case                                 |
| ---------- | --------------- | --------- | -------------- | ---------------------------------------- |
| **Beta**   | `1.0.0-beta.0`  | `@beta`   | `release/beta` | Early testing, breaking changes expected |
| **RC**     | `1.0.0-rc.0`    | `@rc`     | `release/rc`   | Feature complete, final testing          |
| **Stable** | `1.0.0`         | `@latest` | `main`         | Production ready                         |

## Installation by Release Type

```bash
# Install latest stable
npm install @scenarist/express-adapter

# Install beta
npm install @scenarist/express-adapter@beta

# Install release candidate
npm install @scenarist/express-adapter@rc

# Install specific version
npm install @scenarist/express-adapter@1.0.0-beta.0
```

---

## Beta Release Process

### 1. Create Release Branch (First Time)

```bash
git checkout main
git pull origin main
git checkout -b release/beta
```

### 2. Enter Pre-Release Mode

```bash
pnpm changeset pre enter beta
git add .changeset/pre.json
git commit -m "chore: enter beta pre-release mode"
```

### 3. Create Changeset (If Needed)

```bash
pnpm changeset
# Select packages, choose version bump type
# Write changelog entry
git add .changeset/
git commit -m "chore: add changeset for beta"
```

### 4. Push to Trigger Release

```bash
git push origin release/beta
```

The workflow will:

1. Version packages (e.g., `1.0.0-beta.0`)
2. Publish to npm with `@beta` tag
3. Create git tag

### 5. Subsequent Beta Releases

```bash
# Make changes on release/beta branch
# Add changeset
pnpm changeset
git add .
git commit -m "feat: new feature for beta"
git push origin release/beta
```

Each push versions to next beta (e.g., `1.0.0-beta.1`, `1.0.0-beta.2`).

---

## RC Release Process

### 1. Exit Beta, Enter RC

```bash
git checkout release/beta
pnpm changeset pre exit
pnpm changeset pre enter rc
git add .changeset/pre.json
git commit -m "chore: move from beta to rc"
```

### 2. Create RC Branch

```bash
git checkout -b release/rc
git push origin release/rc
```

### 3. Push to Trigger Release

The workflow publishes with `@rc` tag (e.g., `1.0.0-rc.0`).

---

## Stable Release Process

### 1. Exit Pre-Release Mode

```bash
git checkout release/rc  # or release/beta
pnpm changeset pre exit
git add .changeset/pre.json
git commit -m "chore: exit pre-release mode"
```

### 2. Merge to Main

```bash
git checkout main
git merge release/rc
git push origin main
```

### 3. Automatic Release

The release workflow on `main`:

1. Runs after CI passes
2. Detects pending changesets
3. Versions packages (e.g., `1.0.0`)
4. Updates CHANGELOGs
5. Commits directly to main
6. Publishes to npm with `@latest` tag
7. Creates GitHub Release with git tag

---

## Quick Reference

### Start Beta Cycle

```bash
git checkout -b release/beta
pnpm changeset pre enter beta
pnpm changeset  # create initial changeset
git add . && git commit -m "chore: start beta releases"
git push -u origin release/beta
```

### Promote Beta → RC

```bash
git checkout release/beta
pnpm changeset pre exit
pnpm changeset pre enter rc
git checkout -b release/rc
git add . && git commit -m "chore: promote to RC"
git push -u origin release/rc
```

### Promote RC → Stable

```bash
git checkout release/rc
pnpm changeset pre exit
git add . && git commit -m "chore: prepare stable release"
git checkout main
git merge release/rc
git push origin main
# Release happens automatically after CI passes
```

---

## Hotfix Process

For urgent fixes to stable:

```bash
git checkout main
# Make fix
pnpm changeset  # select 'patch'
git add . && git commit -m "fix: urgent fix"
git push origin main
# Release happens automatically after CI passes
```

---

## Troubleshooting

### "No changesets found"

You need at least one changeset file:

```bash
pnpm changeset
```

### Pre-release version not incrementing

Ensure you're in pre-release mode:

```bash
cat .changeset/pre.json
# Should show: { "mode": "pre", "tag": "beta" }
```

### Wrong npm tag

Check the branch name matches:

- `release/beta` → `@beta`
- `release/rc` → `@rc`
- `main` → `@latest`

### OIDC authentication failed

Ensure the workflow has:

```yaml
permissions:
  id-token: write
```

And trusted publishing is configured on npmjs.com.

---

## GitHub Configuration

### Required Secrets

The release workflow requires a `RELEASE_PAT` secret (Personal Access Token) to push version commits directly to main.

#### Creating a Fine-Grained PAT (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure:
   - **Token name:** `scenarist-release`
   - **Expiration:** 90 days (set a reminder to rotate)
   - **Repository access:** Only select repositories → `citypaul/scenarist`
   - **Permissions:**
     | Permission | Access |
     |------------|--------|
     | Contents | Read and write |
     | Metadata | Read-only (auto-selected) |

4. Generate and copy the token
5. Add to repository: Settings → Secrets and variables → Actions → New repository secret
   - Name: `RELEASE_PAT`
   - Value: (paste token)

#### Why Not GITHUB_TOKEN?

The default `GITHUB_TOKEN` cannot push commits that trigger workflows (to prevent infinite loops). Since the release workflow pushes version commits to main, it needs a PAT to ensure subsequent CI runs are triggered.

#### Token Rotation

Fine-grained PATs have a maximum expiration of 1 year. Set a calendar reminder to rotate the token before expiration. When rotating:

1. Create new token with same permissions
2. Update the `RELEASE_PAT` secret
3. Delete the old token
