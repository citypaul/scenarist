# Cloudflare Pages Setup Guide

This guide explains how to set up automatic deployments from GitHub to Cloudflare Pages for the Scenarist documentation site.

## Prerequisites

1. Cloudflare account with access to Pages
2. GitHub repository access (https://github.com/citypaul/scenarist)
3. Domain registered (scenarist.io)

## Step 1: Connect GitHub Repository to Cloudflare Pages

### Via Cloudflare Dashboard

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to **Workers & Pages**

2. **Create New Pages Project**
   - Click **Create application**
   - Select **Pages** tab
   - Click **Connect to Git**

3. **Authorize GitHub**
   - Select **GitHub** as provider
   - Click **Authorize Cloudflare Pages** (if not already authorized)
   - Grant access to the `citypaul/scenarist` repository
   - Or grant access to all repositories (recommended for organizations)

4. **Select Repository**
   - Find and select: `citypaul/scenarist`
   - Click **Begin setup**

## Step 2: Configure Build Settings

On the "Set up builds and deployments" page, configure:

### Basic Settings

- **Project name:** `scenarist-docs` (or `scenarist`)
- **Production branch:** `main`

### Build Configuration

**Framework preset:** `Astro`

**Build settings:**
- **Build command:** `cd apps/docs && npm run build`
  - Note: Uses `npm` because Cloudflare Pages doesn't natively support pnpm workspaces
  - Alternative: See "pnpm Support" section below
- **Build output directory:** `apps/docs/dist`
- **Root directory:** `/` (monorepo root)

### Environment Variables

**Node.js version:**
- Variable: `NODE_VERSION`
- Value: `20` (or `20.11.0` for specific version)

**Optional - Enable pnpm:**
- Variable: `ENABLE_PNPM`
- Value: `true`

If using pnpm:
- Variable: `PNPM_VERSION`
- Value: `9` (or specific version from package.json engines field)

### Advanced Settings

- **Build comments on pull requests:** ✅ Enabled (optional but recommended)
- **Branch deployments:** ✅ Enabled (preview deployments for all branches)

## Step 3: Save and Build

1. Click **Save and Deploy**
2. Cloudflare Pages will:
   - Clone your repository
   - Install dependencies
   - Run the build command
   - Deploy to `<project-name>.pages.dev`

3. **First deployment** takes 2-5 minutes
4. You'll get a URL like: `https://scenarist-docs.pages.dev`

## Step 4: Set Up Custom Domain (scenarist.io)

### Add Custom Domain

1. **In Cloudflare Pages project:**
   - Go to project settings
   - Click **Custom domains** tab
   - Click **Set up a custom domain**

2. **Enter domain:**
   - Domain: `scenarist.io`
   - Click **Continue**

3. **DNS Configuration:**
   - Cloudflare will automatically create DNS records if domain is on Cloudflare
   - **CNAME record:** `scenarist.io` → `scenarist-docs.pages.dev`
   - Or **A/AAAA records** if using apex domain

4. **SSL/TLS:**
   - Cloudflare automatically provisions SSL certificate
   - Wait 1-5 minutes for certificate activation
   - SSL mode: **Full (strict)** recommended

### Verify Custom Domain

1. Wait for DNS propagation (usually <5 minutes)
2. Visit `https://scenarist.io`
3. Should see documentation site

## Step 5: Configure Automatic Deployments

**Automatic deployments are now enabled!**

### How It Works

**On every push to `main` branch:**
1. GitHub webhook triggers Cloudflare Pages
2. Cloudflare Pages clones repository
3. Runs build command: `cd apps/docs && npm run build`
4. Deploys `apps/docs/dist` to production
5. Site updates at `https://scenarist.io`

**On pull request creation/update:**
1. Cloudflare Pages creates preview deployment
2. Preview URL: `https://<commit-hash>.scenarist-docs.pages.dev`
3. Comment added to PR with preview link
4. Preview updates on every push to PR branch

### Deployment Status

- View deployment logs in Cloudflare Pages dashboard
- GitHub commit status shows deployment status
- Failed builds prevent deployment (safe)

## pnpm Support (Monorepo Setup)

Cloudflare Pages has experimental pnpm support. Two approaches:

### Approach 1: Use npm (Simple)

**Build command:** `cd apps/docs && npm install && npm run build`

**Pros:**
- Works immediately
- No additional configuration

**Cons:**
- Doesn't respect workspace dependencies
- Slower (re-installs dependencies)

### Approach 2: Use pnpm (Recommended)

**Environment variables:**
```
ENABLE_PNPM=true
PNPM_VERSION=9
NODE_VERSION=20
```

**Build command:**
```bash
pnpm install --frozen-lockfile && pnpm --filter=@scenarist/docs build
```

**Pros:**
- Respects workspace dependencies
- Faster (uses pnpm-lock.yaml)
- Consistent with local development

**Cons:**
- Requires environment variable setup
- Experimental Cloudflare Pages feature

### Approach 3: Custom Build Script (Most Robust)

Create `apps/docs/build.sh`:

```bash
#!/bin/bash
set -e

# Navigate to monorepo root
cd ../..

# Install dependencies (pnpm or npm fallback)
if command -v pnpm &> /dev/null; then
  echo "Using pnpm..."
  pnpm install --frozen-lockfile
  pnpm --filter=@scenarist/docs build
else
  echo "pnpm not found, using npm..."
  cd apps/docs
  npm install
  npm run build
fi
```

**Build command:** `bash apps/docs/build.sh`

## Troubleshooting

### Build Fails: "pnpm not found"

**Solution:** Add environment variable:
```
ENABLE_PNPM=true
```

### Build Fails: "Cannot find module '@scenarist/...'"

**Cause:** Workspace dependencies not installed

**Solution:** Use pnpm build command:
```bash
pnpm install --frozen-lockfile && pnpm --filter=@scenarist/docs build
```

### Build Succeeds But 404 on Pages

**Cause:** Wrong build output directory

**Solution:** Verify `Build output directory` is set to:
```
apps/docs/dist
```

### Custom Domain Not Working

**Check DNS records:**
```bash
dig scenarist.io
# Should point to Cloudflare Pages
```

**Check SSL certificate:**
- Go to Cloudflare Pages → Custom domains
- Verify certificate status: "Active"

### Preview Deployments Not Working

**Solution:** Enable in project settings:
- **Settings** → **Builds & deployments**
- **Branch deployments:** Enable
- **Preview deployments:** Enable

## Deployment Configuration Summary

**Final Configuration:**

| Setting | Value |
|---------|-------|
| Project name | `scenarist-docs` |
| Production branch | `main` |
| Framework | Astro |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter=@scenarist/docs build` |
| Build output directory | `apps/docs/dist` |
| Root directory | `/` |
| Node version | `20` |
| pnpm enabled | `true` |
| pnpm version | `9` |
| Custom domain | `scenarist.io` |

**Automatic Deployments:**
- ✅ Push to `main` → Production deployment
- ✅ Pull requests → Preview deployments
- ✅ Build status in GitHub commits
- ✅ PR comments with preview URLs

## Next Steps

1. **Verify deployment:** Check `https://scenarist.io`
2. **Test preview deployments:** Create a test PR
3. **Set up analytics** (optional): Cloudflare Web Analytics
4. **Configure redirects** (if needed): `apps/docs/public/_redirects`
5. **Add build badge** (optional): Add deployment status to README

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages with pnpm](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/#use-pnpm)
- [Custom Domains Guide](https://developers.cloudflare.com/pages/platform/custom-domains/)

## Maintenance

**Automatic maintenance:**
- Dependencies: Dependabot PRs trigger preview deployments
- Domain renewal: Cloudflare handles SSL certificate renewal
- Build cache: Cloudflare Pages automatically caches dependencies

**Manual maintenance:**
- Review deployment logs monthly
- Monitor build times
- Update Node.js version as needed
- Review and merge Dependabot PRs

---

**Setup Date:** 2024-11-09
**Maintainer:** @citypaul
**Status:** ✅ Ready for setup
