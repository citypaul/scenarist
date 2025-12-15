# Demo Applications

**This folder is intentionally separate from the main workspace.**

## Purpose

These applications demonstrate Scenarist to potential users. Unlike the `apps/` folder (which contains internal test/verification apps that use workspace dependencies), demo apps:

1. **Install Scenarist from npm** - exactly like external users would
2. **Validate published packages work correctly** - catches packaging/bundling issues
3. **Serve as educational examples** - used in videos, blog posts, and documentation
4. **Show real-world integration patterns** - demonstrate adding Scenarist to existing apps

## Why Separate from Workspace?

The `demo/` folder is excluded from `pnpm-workspace.yaml`. This means:

- `pnpm install` in demo apps pulls from npm, not workspace links
- We catch the same issues external users would encounter
- Published package exports, bundling, and tree-shaking are validated

## Folder Structure

```
demo/
├── README.md           # This file
└── payflow/            # Payment integration demo (promotional campaign)
```

## PayFlow Demo

The primary demo app for the Scenarist promotional campaign. A payment dashboard integrating Stripe, Auth0, and SendGrid - showcasing all Scenarist features.

See `docs/promotional-campaign/PLAN.md` for full details.

## Important Notes for Contributors

### Tests May Be Added Incrementally

Demo apps may start without comprehensive tests. This is intentional - part of the promotional value is demonstrating how to add Scenarist to an existing application. Tests are added as part of the demonstration process.

### Installing Dependencies

Since demo apps are outside the workspace:

```bash
cd demo/payflow
pnpm install  # Installs from npm, not workspace
```

### Testing with Unpublished Changes

To test Scenarist changes before publishing:

```bash
# Option 1: Pack and install tarball
cd packages/express-adapter
pnpm pack
cd ../../demo/payflow
pnpm add ../../packages/express-adapter/scenarist-express-adapter-1.0.0.tgz

# Option 2: Use npm link (temporary)
cd packages/express-adapter
pnpm link --global
cd ../../demo/payflow
pnpm link --global @scenarist/express-adapter
```

### Keeping in Sync

Demo apps should use published Scenarist versions. When Scenarist is updated:

1. Publish new Scenarist version to npm
2. Update demo app's `package.json` to use new version
3. Run `pnpm install` in demo app
4. Verify everything works
5. Commit both changes together

## Comparison: apps/ vs demo/

| Aspect       | `apps/`                         | `demo/`                           |
| ------------ | ------------------------------- | --------------------------------- |
| Purpose      | Internal testing & verification | External promotion & education    |
| Dependencies | Workspace links (`workspace:*`) | npm published packages            |
| Tests        | Comprehensive, required         | Added incrementally as demos      |
| Audience     | Scenarist developers            | Potential Scenarist users         |
| Validates    | Features work correctly         | Published packages work correctly |
