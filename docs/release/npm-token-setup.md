# npm Trusted Publishing Setup Guide

This guide documents configuring **npm Trusted Publishing** for secure, secretless npm publishing via GitHub Actions using OIDC (OpenID Connect).

## Why Trusted Publishing?

Trusted publishing is the **recommended approach** for npm publishing from CI/CD:

| Feature               | Traditional Token      | Trusted Publishing          |
| --------------------- | ---------------------- | --------------------------- |
| Secrets to manage     | Yes (NPM_TOKEN)        | **None**                    |
| Token expiration      | Manual rotation needed | **Automatic** (per-publish) |
| Security              | Long-lived credential  | **OIDC short-lived tokens** |
| Provenance            | Optional               | **Built-in attestation**    |
| Supply chain security | Basic                  | **Enhanced**                |

## Prerequisites

- npm account that owns the `@scenarist` organization
- Admin access to the GitHub repository
- Packages must be published at least once before enabling (or use npm's "link" feature for new packages)

## Step 1: Link GitHub Repository to npm Packages

For **each package** (`@scenarist/express-adapter`, `@scenarist/nextjs-adapter`, `@scenarist/playwright-helpers`):

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Navigate to the package settings (or organization settings for new packages)
3. Go to **Settings** → **Trusted Publishers** (or **Publishing access**)
4. Click **Link a repository**
5. Configure:
   - **Repository owner**: `citypaul`
   - **Repository name**: `scenarist`
   - **Workflow filename**: `release.yml`
   - **Environment** (optional): `release` (if using GitHub environments)
6. Save the configuration

Repeat for each package, or configure at the organization level if supported.

## Step 2: Configure GitHub Actions Workflow

The release workflow is configured in `.github/workflows/release.yml` with these settings:

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write
  id-token: write # Required for OIDC token exchange

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: pnpm
          registry-url: "https://registry.npmjs.org"

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
          title: "chore: release packages"
          commit: "chore: release packages"
          createGithubReleases: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_CONFIG_PROVENANCE: true # Enable provenance attestation
```

### Key Configuration Points

1. **`id-token: write`** - Allows GitHub Actions to request OIDC tokens
2. **`NPM_CONFIG_PROVENANCE: true`** - Enables npm provenance attestation
3. **No `NPM_TOKEN`** - Authentication handled via OIDC

## Step 3: First-Time Package Publishing

For **new packages** that haven't been published yet, you need to establish the package on npm before trusted publishing can be configured.

### Option A: Use `setup-npm-trusted-publish` Tool (Recommended)

This tool creates a placeholder package and configures trusted publishing in one step:

```bash
# Authenticate first
npm login

# For each package (run from anywhere)
npx --yes setup-npm-trusted-publish @scenarist/express-adapter
npx --yes setup-npm-trusted-publish @scenarist/nextjs-adapter
npx --yes setup-npm-trusted-publish @scenarist/playwright-helpers
```

This will:

1. Create the package name on npm registry
2. Configure trusted publishing for the GitHub repository
3. Allow subsequent publishes via GitHub Actions OIDC

### Option B: Manual First Publish

Publish the actual v0.0.1 manually, then configure trusted publishing:

```bash
# Authenticate locally
npm login

# Build packages first
pnpm build

# Publish each package once (from repo root)
cd packages/express-adapter && npm publish --access public
cd ../nextjs-adapter && npm publish --access public
cd ../playwright-helpers && npm publish --access public
```

Then go to npmjs.com → each package → Settings → Trusted Publishers to link the repository.

### Important Notes

- **npm CLI v11.5.1+** is required for OIDC trusted publishing
- Each package can only have **one trusted publisher** configured at a time
- Trusted publishing currently supports only **cloud-hosted runners** (not self-hosted)

## Step 4: Verify Configuration

After setup, verify trusted publishing works:

1. **Check npm package settings**: Each package should show the linked GitHub repository
2. **Test with a beta release**: Create a release branch and verify publishing succeeds
3. **Check provenance**: Published packages should show provenance badge on npmjs.com

## How It Works

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ GitHub Actions  │──────│  npm Registry   │──────│  Package Page   │
│                 │ OIDC │                 │      │                 │
│ 1. Request      │ ───► │ 2. Verify       │      │ 4. Provenance   │
│    OIDC token   │      │    identity     │      │    badge shown  │
│                 │      │                 │      │                 │
│ 3. Publish with │ ───► │    Trust        │      │                 │
│    short-lived  │      │    established  │      │                 │
│    credential   │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Security Benefits

- **No stored secrets**: No NPM_TOKEN to leak or rotate
- **Identity verification**: npm verifies the GitHub repository identity
- **Provenance attestation**: Users can verify packages came from this repo
- **Short-lived credentials**: Tokens expire immediately after use
- **Audit trail**: Clear link between GitHub commit and npm publish

## Troubleshooting

### "403 Forbidden" error

- Trusted publisher not configured for this package
- Workflow filename doesn't match configured value
- Repository owner/name doesn't match

### "OIDC token exchange failed"

- `id-token: write` permission not set in workflow
- GitHub Actions OIDC provider not available

### Provenance not showing

- `NPM_CONFIG_PROVENANCE: true` not set
- Package was published without provenance initially

## Migration from NPM_TOKEN

If you previously used `NPM_TOKEN`:

1. Configure trusted publishing (Steps 1-2 above)
2. Remove `NPM_TOKEN` from workflow env vars
3. Add `NPM_CONFIG_PROVENANCE: true`
4. Remove `NPM_TOKEN` from GitHub repository secrets (after verification)

## Related Documentation

- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

## Related Issues

- #157: Configure npm publishing (this document)
- #154: Release workflow (implemented in `.github/workflows/release.yml`)
- #155: Pre-release workflow (implemented in `.github/workflows/pre-release.yml`)
