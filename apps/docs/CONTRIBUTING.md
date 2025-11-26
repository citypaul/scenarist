# Contributing to Scenarist Documentation

This guide outlines standards and conventions for maintaining the Scenarist documentation.

## Navigation Hierarchy

The documentation follows a consistent three-level hierarchy:

### Level 1: Framework
Top-level categorization by framework (Express, Next.js, Remix, SvelteKit).

### Level 2: Router Type (Next.js only)
For Next.js, we split by router type since they have different architectures:
- **App Router** - Modern Next.js with Server Components
- **Pages Router** - Traditional Next.js with pages directory

### Level 3: Guide Type
Each framework/router combination has these guide types:
- **Overview** - Framework-specific challenges and how Scenarist solves them
- **Getting Started** - Step-by-step setup instructions
- **Example App** - Complete working example with installation and detailed code walkthroughs

### Navigation Structure Example

```
Next.js
├── Overview (general)              # /frameworks/nextjs
├── App Router
│   ├── Overview                   # /frameworks/nextjs-app-router
│   ├── Getting Started            # /frameworks/nextjs-app-router/getting-started
│   └── Example App                # /frameworks/nextjs-app-router/example-app
└── Pages Router
    ├── Overview                   # /frameworks/nextjs-pages-router
    ├── Getting Started            # /frameworks/nextjs-pages-router/getting-started
    └── Example App                # /frameworks/nextjs-pages-router/example-app
```

## Code Block Standards

### Language Identifiers

**Always specify language identifiers** for syntax highlighting:

```markdown
✅ CORRECT:
```bash
npm install @scenarist/express-adapter
\```

```typescript
export const scenarios = { ... };
\```

❌ WRONG:
\```
npm install @scenarist/express-adapter
\```

\```
export const scenarios = { ... };
\```
```

### Supported Language Identifiers

- `bash` - Shell commands
- `typescript` - TypeScript code
- `javascript` - JavaScript code
- `json` - JSON configuration
- `text` - Plain text (use `<FileTree>` component for file structures)
- `markdown` - Markdown examples

### File Structure Blocks

Use Starlight's `<FileTree>` component for file structures:

```markdown
import { FileTree } from '@astrojs/starlight/components';

<FileTree>

- apps/nextjs-app-router-example/
  - app/
    - api/
      - route.ts Scenarist endpoints
  - lib/
    - scenarist.ts Scenarist setup
    - scenarios.ts Scenario definitions
  - tests/
    - playwright/
      - example.spec.ts

</FileTree>
```

**Features:**
- Directories end with `/`
- Add comments after filenames to explain purpose
- Comments support **bold** and *italic* formatting
- Use `...` for omitted content
- Automatically renders as collapsible tree structure

## Example App Documentation Standards

All example app pages must include these sections in order:

### 1. Overview
- Brief description
- GitHub link to example source code

### 2. What It Demonstrates
List features demonstrated with clear categorization:
- Core Features (framework-specific capabilities)
- Dynamic Response Features (Scenarist features)

### 3. Installation

#### Prerequisites
**Required** - Must be consistent across all examples:
```markdown
### Prerequisites
- Node.js 20+
- pnpm 9+
```

#### Clone and Install
Standard monorepo installation instructions.

### 4. Running the Example

#### Development Mode
Commands to start the dev server.

#### Run Tests
Commands to run tests (all, specific, UI mode).

### 5. Key Files
Code examples showing:
- Scenarist setup
- Scenario definitions
- API route/component examples
- Test examples

### 6. Architecture
Explain:
- How it works (step-by-step flow)
- Test isolation mechanism
- File structure

### 7. Common Patterns
Reusable patterns for the framework.

### 8. Next Steps
Links to:
- Getting Started guide
- Core concept documentation

## Testing Approach Recommendations

### Framework-Specific Recommendations

**Next.js (App Router & Pages Router):**
- **Recommended:** Playwright with `@scenarist/playwright-helpers`
- **Why:** Tests Server Components, API routes, getServerSideProps with real HTTP requests and browser rendering

**Express:**
- **Recommended:** Supertest
- **Why:** Direct API testing without browser overhead
- **Optional:** Playwright for full page testing if serving HTML

**General Rule:**
- If framework has server-side rendering → Recommend Playwright
- If framework is API-only → Recommend supertest

## Code Example Standards

### Complete Examples
Code examples should be:
- **Complete** - Show all necessary imports and setup
- **Runnable** - Copy-paste ready when possible
- **Commented** - Explain non-obvious parts
- **Type-safe** - Use proper TypeScript types

### Example Structure

```markdown
**`path/to/file.ts`** - Brief description
```typescript
import { necessary } from 'imports';

export function example() {
  // Implementation
}
\```
```

## Consistency Checklist

Before committing documentation changes, verify:

- [ ] All code blocks have language identifiers
- [ ] Prerequisites section included (if example app page)
- [ ] Navigation follows framework → router → guide hierarchy
- [ ] Testing approach matches framework recommendation
- [ ] Code examples are complete and runnable
- [ ] Links use correct relative paths
- [ ] Frontmatter includes title and description

## Frontmatter Standards

Every documentation page must have:

```markdown
---
title: Page Title
description: Brief description (used in SEO and navigation)
---
```

**Title:** Use proper case, framework name if applicable
- ✅ "Next.js App Router - Getting Started"
- ❌ "next.js app router getting started"

**Description:** One sentence, no period, under 160 characters
- ✅ "Set up Scenarist with Next.js App Router in 5 minutes"
- ❌ "This guide will walk you through setting up Scenarist with Next.js App Router."

## File Naming Conventions

- **Directories:** `kebab-case` (e.g., `nextjs-app-router/`)
- **Files:** `kebab-case.md` (e.g., `getting-started.md`)
- **Slugs:** Match file names (e.g., `frameworks/nextjs-app-router/getting-started`)

## Link Standards

### Internal Links

Use **relative paths without `.md` extension**:

```markdown
✅ CORRECT:
[Getting Started](/frameworks/nextjs-app-router/getting-started)

❌ WRONG:
[Getting Started](/frameworks/nextjs-app-router/getting-started.md)
[Getting Started](./getting-started)
```

### External Links

Always open in new tab for external resources:

```markdown
✅ For external docs, GitHub:
[View on GitHub](https://github.com/...)

✅ For internal cross-references:
[Architecture](/concepts/architecture)
```

## Section Heading Standards

### Hierarchy
- `##` - Major sections
- `###` - Subsections
- `####` - Tertiary sections (use sparingly)

### Naming
- Use title case for major sections
- Use sentence case for subsections
- Keep concise (3-5 words maximum)

```markdown
✅ CORRECT:
## Key Files
### Scenarist Setup
### Scenario Definitions

❌ WRONG:
## KEY FILES
### Here is how you set up Scenarist for this framework
```

## Starlight Components

### Asides

Use Starlight aside components sparingly:

```markdown
:::note
Regular information that provides context.
:::

:::tip
Helpful suggestions or best practices.
:::

:::caution
Important warnings about potential issues.
:::
```

**Guidelines:**
- Use only when information truly stands out from regular flow
- Keep content concise (1-3 sentences)
- Don't overuse - too many asides reduce their impact

## Updating Navigation

When adding new pages, update `/apps/docs/astro.config.mjs`:

```javascript
sidebar: [
  {
    label: "Framework Guides",
    items: [
      {
        label: "Framework Name",
        items: [
          { label: "Overview", slug: "frameworks/framework-name" },
          { label: "Getting Started", slug: "frameworks/framework-name/getting-started" },
          { label: "Example App", slug: "frameworks/framework-name/example-app" },
        ],
      },
    ],
  },
]
```

## Questions?

If you're unsure about documentation standards, check existing framework documentation (Express, Next.js App Router, Next.js Pages Router) for reference examples.
