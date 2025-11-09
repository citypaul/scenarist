# Cloudflare Pages Setup Guide

This guide explains how to set up automatic deployments from GitHub to Cloudflare Pages for the Scenarist documentation site.

**Based on official Cloudflare Pages documentation (November 2025)**

## Prerequisites

1. Cloudflare account with access to Pages
2. GitHub repository access (https://github.com/citypaul/scenarist)
3. Domain registered (scenarist.io)
4. **Build System V2** enabled (required for monorepo support)

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

## Step 2: Configure Build Settings (CRITICAL FOR MONOREPOS)

On the "Set up builds and deployments" page, configure:

### Basic Settings

- **Project name:** `scenarist-docs` (or `scenarist`)
- **Production branch:** `main`

### Build Configuration (Monorepo-Specific)

**Framework preset:** `Astro`

**CRITICAL MONOREPO SETTINGS:**

- **Root directory (path):** `apps/docs`
  - ⚠️ **This is critical for monorepos** - tells Cloudflare where your app lives
  - All subsequent paths are relative to this directory

- **Build command:** `npm run build`
  - Simple command because Root Directory is set correctly
  - Cloudflare automatically runs `npm install` before this command
  - See "pnpm Support" section below for pnpm-specific configuration

- **Build output directory:** `dist`
  - ⚠️ **Relative to Root Directory** (`apps/docs/dist` becomes just `dist`)
  - Not `apps/docs/dist` - that would look for `apps/docs/apps/docs/dist`

### Environment Variables

**Node.js version (recommended):**
- Variable: `NODE_VERSION`
- Value: `20`

### Advanced Settings

- **Build comments on pull requests:** ✅ Enabled (recommended)
- **Branch deployments:** ✅ Enabled (preview deployments for all branches)

### Build Watch Paths (Optimize Monorepo Builds)

**IMPORTANT:** By default, changes to ANY file in the repository trigger builds. Configure watch paths to only build when docs change:

1. Go to **Settings** → **Builds & deployments**
2. Scroll to **Build watch paths**
3. Add: `apps/docs/**`
4. This prevents unnecessary builds when other packages (core, adapters) change

## Step 3: Save and Build

1. Click **Save and Deploy**
2. Cloudflare Pages will:
   - Clone your repository
   - Navigate to `apps/docs` (Root Directory)
   - Run `npm install` automatically
   - Run `npm run build`
   - Deploy contents of `dist` to `<project-name>.pages.dev`

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
3. Navigates to `apps/docs` (Root Directory)
4. Runs `npm install` automatically
5. Runs `npm run build`
6. Deploys `dist` contents to production
7. Site updates at `https://scenarist.io`

**On pull request creation/update:**
1. Cloudflare Pages creates preview deployment
2. Preview URL: `https://<commit-hash>.scenarist-docs.pages.dev`
3. Comment added to PR with preview link
4. Preview updates on every push to PR branch

### Deployment Status

- View deployment logs in Cloudflare Pages dashboard
- GitHub commit status shows deployment status
- Failed builds prevent deployment (safe)

## pnpm Support in Monorepos

Cloudflare Pages officially supports monorepos and package managers (npm, pnpm, yarn), but there's a caveat:

### The Challenge

**Cloudflare always runs `npm install` before your build command**, even if you're using pnpm. This can cause issues in pnpm workspaces.

### Solution 1: Use Root Directory + npm (Simplest - RECOMMENDED)

**Configuration:**
- Root Directory: `apps/docs`
- Build command: `npm run build`
- Build output: `dist`

**How it works:**
- Cloudflare navigates to `apps/docs`
- Runs `npm install` (installs dependencies from `apps/docs/package.json`)
- Runs `npm run build`
- Works because `apps/docs` has its own `package.json`

**Pros:**
- ✅ Simple, no workarounds needed
- ✅ Uses official Cloudflare approach
- ✅ Reliable and well-tested

**Cons:**
- ⚠️ Doesn't use workspace dependencies
- ⚠️ Slightly slower (re-installs instead of using workspace)
- ⚠️ Workspace deps must be published packages or copied

### Solution 2: Skip npm install with pnpm (Advanced)

**Environment variables:**
```
NPM_FLAGS=--version
NODE_VERSION=20
```

**Build command:**
```bash
npm install -g pnpm@9 && pnpm install --frozen-lockfile && pnpm --filter=@scenarist/docs build
```

**How it works:**
- `NPM_FLAGS=--version` makes `npm install` just print version (skips actual install)
- Build command installs pnpm globally
- Then runs pnpm install from monorepo root
- Filters to build only docs package

**Pros:**
- ✅ Uses workspace dependencies correctly
- ✅ Respects pnpm-lock.yaml
- ✅ Consistent with local development

**Cons:**
- ⚠️ More complex setup
- ⚠️ Requires environment variable workaround
- ⚠️ Root Directory must be `/` (monorepo root)
- ⚠️ Build output becomes `apps/docs/dist`

### Solution 3: packageManager field (Future-Proof)

Add to root `package.json`:

```json
{
  "packageManager": "pnpm@9.0.0"
}
```

**Status:** Cloudflare is working on respecting this field, but currently still runs `npm install` first.

### Recommended Approach for Scenarist

**Use Solution 1 (Root Directory + npm):**

```
Root Directory: apps/docs
Build command: npm run build
Build output: dist
```

**Why:**
- Simple and reliable
- Uses official Cloudflare approach
- `apps/docs` has minimal dependencies (just Astro + Starlight)
- No workspace dependencies needed for docs
- Avoids pnpm workarounds

## Troubleshooting

### Build Fails: "Cannot find module '@scenarist/...'"

**Cause:** Trying to use workspace dependencies with Solution 1

**Solution:** Either:
- Use Solution 2 (pnpm with workspace support)
- Or ensure `apps/docs/package.json` lists all dependencies directly (no workspace references)

### Build Fails: "npm ERR! enoent ENOENT"

**Cause:** Wrong Root Directory setting

**Solution:** Verify Root Directory is `apps/docs`, not `/`

### Build Succeeds But Wrong Files Deployed

**Cause:** Wrong Build output directory

**Solution:** When Root Directory is `apps/docs`, output should be `dist` (not `apps/docs/dist`)

### Builds Trigger for Unrelated Changes

**Cause:** No build watch paths configured

**Solution:**
1. Go to Settings → Builds & deployments → Build watch paths
2. Add: `apps/docs/**`
3. Saves build minutes and time

### Preview Deployments Not Working

**Solution:** Enable in project settings:
- **Settings** → **Builds & deployments**
- **Branch deployments:** Enable
- **Preview deployments:** Enable all branches or specific pattern

### Hydration Errors ("Hydration completed but contains mismatches")

**Cause:** Cloudflare's Auto Minify

**Solution:**
1. Go to Cloudflare dashboard → Speed → Optimization
2. Disable **Auto Minify** for HTML/CSS/JS
3. Redeploy

## Final Configuration Summary

**Recommended Configuration:**

| Setting | Value | Notes |
|---------|-------|-------|
| Project name | `scenarist-docs` | Or `scenarist` |
| Production branch | `main` | |
| Framework | Astro | Enables framework-specific optimizations |
| Root directory | `apps/docs` | **Critical for monorepos** |
| Build command | `npm run build` | Simple, uses Root Directory |
| Build output | `dist` | Relative to Root Directory |
| Node version | `20` | Environment variable |
| Build watch paths | `apps/docs/**` | Only build when docs change |
| Custom domain | `scenarist.io` | |

**Build Workflow:**
```bash
# Cloudflare Pages automatically does:
cd apps/docs/           # Navigate to Root Directory
npm install             # Install dependencies
npm run build          # Run build command
# Deploy contents of dist/ to scenarist.io
```

**Automatic Deployments:**
- ✅ Push to `main` → Production deployment
- ✅ Pull requests → Preview deployments
- ✅ Build status in GitHub commits
- ✅ PR comments with preview URLs
- ✅ Build watch paths prevent unnecessary builds

## Next Steps

1. **Complete setup** using Step 1-5 above
2. **Verify deployment:** Check `https://scenarist.io`
3. **Test preview deployments:** Create a test PR
4. **Configure build watch paths:** Optimize build triggers
5. **Set up analytics** (optional): Cloudflare Web Analytics
6. **Add build status badge** (optional): Show deployment status in README

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages Monorepo Guide](https://developers.cloudflare.com/pages/configuration/monorepos/)
- [Astro Cloudflare Deployment](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)

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
- Check build watch paths if unnecessary builds occur

---

**Setup Date:** 2025-11-09
**Last Updated:** 2025-11-09
**Maintainer:** @citypaul
**Status:** ✅ Ready for setup
**Based on:** Official Cloudflare Pages documentation (November 2025)
