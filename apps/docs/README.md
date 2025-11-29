# Scenarist Documentation Site

Official documentation site for Scenarist, built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

**Live Site:** https://scenarist.io

## Local Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start dev server
cd apps/docs
pnpm dev

# Visit http://localhost:4321
```

## Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment

**Automatic deployments via Cloudflare Pages:**

- **Production:** Every merge to `main` deploys to https://scenarist.io
- **Preview:** Every pull request gets a unique preview URL

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for complete setup instructions.

## Project Structure

```
apps/docs/
├── src/
│   ├── assets/         # Images, logos, illustrations
│   ├── content/
│   │   └── docs/       # Documentation pages (MDX)
│   └── styles/         # Custom CSS
├── public/             # Static assets (favicon, etc.)
├── astro.config.mjs    # Astro configuration
├── package.json        # Dependencies and scripts
├── wrangler.toml       # Cloudflare Pages config (optional)
└── CLOUDFLARE_SETUP.md # Deployment setup guide
```

## Documentation Content

All documentation is written in MDX (Markdown with JSX support) in `src/content/docs/`.

### Navigation Structure

Navigation is defined in `astro.config.mjs` under `sidebar`:

```javascript
sidebar: [
  {
    label: "Introduction",
    items: [
      { label: "Quick Start", slug: "getting-started/quick-start" },
      { label: "Why Scenarist?", slug: "introduction/why-scenarist" },
      // ...
    ],
  },
  // ...
];
```

### Adding New Pages

1. Create MDX file in `src/content/docs/`:

   ```bash
   # Example: Add new framework guide
   mkdir -p src/content/docs/frameworks/remix
   touch src/content/docs/frameworks/remix/getting-started.mdx
   ```

2. Add frontmatter to new page:

   ```mdx
   ---
   title: Remix - Getting Started
   description: Set up Scenarist with Remix
   ---

   # Content here...
   ```

3. Add to navigation in `astro.config.mjs`:
   ```javascript
   {
     label: 'Remix',
     slug: 'frameworks/remix/getting-started'
   }
   ```

## Content Guidelines

See [documentation writing principles](../../docs/plans/documentation-site.md#7-documentation-writing-principles-session-learnings) for:

- Accuracy over absolutism (no "CAN'T" statements)
- No marketing fluff (let code speak)
- Landing page vs. docs separation
- Framework-agnostic positioning
- Complete writing checklist

## Build Configuration

**Node.js version:** 20 (defined in `.nvmrc`)

**Key dependencies:**

- `astro` - Static site generator
- `@astrojs/starlight` - Documentation theme
- `rehype-mermaid` - Mermaid diagram support
- `sharp` - Image optimization

## Cloudflare Pages Configuration

**Recommended build settings (monorepo):**

- **Root directory:** `apps/docs`
- **Build command:** `npm run build`
- **Build output directory:** `dist` (relative to Root directory)
- **Node version:** `20` (environment variable: `NODE_VERSION=20`)
- **Build watch paths:** `apps/docs/**` (only build when docs change)

**How it works:**

- Cloudflare navigates to `apps/docs` (Root directory)
- Automatically runs `npm install`
- Runs `npm run build`
- Deploys contents of `dist/` to production

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for complete setup guide including:

- Step-by-step GitHub integration
- Custom domain configuration (scenarist.io)
- Alternative pnpm approaches for workspace dependencies
- Troubleshooting common issues

## Features

- ✅ **Automatic deployments** - Push to `main` = live deployment
- ✅ **Preview deployments** - Every PR gets preview URL
- ✅ **Full-text search** - Powered by Pagefind
- ✅ **Dark mode** - Built-in theme switching
- ✅ **Mobile responsive** - Works on all devices
- ✅ **Fast performance** - Static site generation
- ✅ **Mermaid diagrams** - Render diagrams from code
- ✅ **Syntax highlighting** - Shiki-powered code blocks
- ✅ **Custom domain** - https://scenarist.io
- ✅ **SSL/TLS** - Automatic certificate management

## Troubleshooting

### Build fails locally

```bash
# Clean and rebuild
rm -rf dist .astro
pnpm build
```

### Search not working

Pagefind runs during build. Rebuild to regenerate search index:

```bash
pnpm build
```

### Styling issues

Clear Astro cache:

```bash
rm -rf .astro
pnpm dev
```

### Deployment fails on Cloudflare Pages

1. Check build logs in Cloudflare Pages dashboard
2. Verify environment variables are set (see CLOUDFLARE_SETUP.md)
3. Test build locally: `pnpm build`
4. Check Node.js version matches (`.nvmrc` = `20`)

## Resources

- [Astro Documentation](https://docs.astro.build)
- [Starlight Documentation](https://starlight.astro.build)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Scenarist Repository](https://github.com/citypaul/scenarist)

## Maintenance

**Automatic:**

- Dependencies: Dependabot creates PRs
- SSL certificates: Cloudflare auto-renews
- Build cache: Managed by Cloudflare Pages

**Manual:**

- Review Dependabot PRs monthly
- Update Node.js version as needed
- Monitor build times and optimization opportunities

---

**Last Updated:** 2025-11-09
**Maintainer:** @citypaul
