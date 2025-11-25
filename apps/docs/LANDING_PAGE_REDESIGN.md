# Landing Page Redesign Plan

> **Branch:** `feat/docs-landing-page-redesign`
> **Status:** Complete ✅

## Overview

Redesign the Scenarist docs site with:
1. New marketing-focused landing page (replacing content-heavy index.mdx)
2. Full visual redesign of docs section (custom colors, fonts, glass effects)
3. Tailwind CSS v4 integration
4. Dark/light mode support throughout

---

## Progress Tracker

### Phase 1: Infrastructure Setup
- [x] Install Tailwind CSS v4 dependencies (`tailwindcss@4.1.17`, `@tailwindcss/vite`)
- [x] Create CSS file with Tailwind v4 imports and theme
- [x] Update `astro.config.mjs` with Vite plugin
- [x] Add design tokens for dark/light mode
- [x] Verify `pnpm dev` runs without errors

### Phase 2: Landing Page Shell
- [x] Create `src/layouts/LandingLayout.astro`
- [x] Create `src/components/landing/GridBackground.astro`
- [x] Create `src/components/landing/Nav.astro`
- [x] Create `src/components/landing/Hero.astro`
- [x] Create `src/pages/index.astro`
- [x] **Checkpoint:** Landing page renders at localhost (HTTP 200, 168ms)

### Phase 3: Landing Page Content
- [x] Complete Hero.astro (all features)
- [x] Create `src/components/landing/CodeExample.astro`
- [x] Create `src/components/landing/ValueProps.astro`
- [x] Create `src/components/landing/Features.astro`
- [x] Create `src/components/landing/Footer.astro`
- [x] **Checkpoint:** Full landing page matches prototype

### Phase 4: Theme Toggle
- [x] Add dark/light mode toggle to Nav
- [x] Configure Tailwind v4 class-based dark mode (`@custom-variant`)
- [x] Add light mode styles to all landing page components
- [x] Implement localStorage persistence for theme preference
- [x] Test theme switching on landing page
- [x] **Checkpoint:** Theme toggle works ✅

### Phase 5: Docs Section Styling
- [x] Apply design tokens to Starlight (header, sidebar)
- [x] Style code blocks
- [x] Style links and typography
- [x] Test docs pages in both themes
- [x] **Checkpoint:** Docs section matches new design ✅

### Phase 6: Cleanup
- [x] Delete old `src/content/docs/index.mdx`
- [x] Responsive testing (mobile/tablet)
- [x] Final polish
- [x] **Checkpoint:** Landing page redesign complete ✅

---

## Tailwind v4 Setup (CSS-First Configuration)

Tailwind v4 uses CSS-based configuration instead of JavaScript config files.

### File: `src/styles/global.css`

```css
@import "tailwindcss";

/* Custom theme using @theme directive */
@theme {
  /* Colors - Dark Mode Base */
  --color-dark-bg: #030304;
  --color-dark-surface: #0A0A0C;
  --color-dark-surface-highlight: #161618;
  --color-dark-border: #27272A;

  /* Colors - Light Mode */
  --color-light-bg: #ffffff;
  --color-light-surface: #ffffff;
  --color-light-surface-highlight: #f3f4f6;
  --color-light-border: #e4e4e7;

  /* Brand Colors */
  --color-primary: #8B5CF6;
  --color-primary-dark: #7C3AED;
  --color-primary-glow: rgba(139, 92, 246, 0.15);
  --color-secondary: #10B981;
  --color-secondary-dark: #059669;
  --color-secondary-glow: rgba(16, 185, 129, 0.15);

  /* Fonts */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### File: `astro.config.mjs` Update

```javascript
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  // ... rest of config
});
```

---

## File Structure

```
src/
├── pages/
│   └── index.astro              # Custom landing page (bypasses Starlight)
├── layouts/
│   └── LandingLayout.astro      # Landing page shell
├── styles/
│   ├── global.css               # Tailwind v4 imports + theme (landing)
│   └── custom.css               # Starlight overrides (docs)
└── components/
    └── landing/
        ├── Nav.astro            # Glass nav (logo, links, CTA)
        ├── Hero.astro           # Version badge, headline, CTAs
        ├── CodeExample.astro    # Split-view scenario + test code
        ├── ValueProps.astro     # "Only mock what you don't control"
        ├── Features.astro       # 4-card feature grid
        ├── Footer.astro         # CTA + links
        └── GridBackground.astro # Grid pattern with radial mask
```

---

## Content (From Dark Mode Prototype)

### Nav
- Logo: Purple dot + "Scenarist"
- Links: Docs, GitHub
- CTA: "Get Started" (white button)

### Hero
- Badge: `v1.0.0 Now Available` (pill with pulse animation)
- Headline: **"Test Reality. Control the Rest."** (gradient on second line)
- Tagline: "Stop writing brittle mocks. Run real Server Components, middleware, and validation logic. Scenarist mocks *only* the external edge."
- CTAs:
  - Install command: `$ npm install scenarist` (with copy icon)
  - "Star on GitHub" button (with GitHub icon)

### Code Example (Split View)

**Left Panel - "1. Define Scenario":**
```typescript
const successScenario = {
  id: 'payment_success',
  mocks: [{
    url: 'https://api.stripe.com/*',
    method: 'POST',
    response: {
      status: 200,        // highlighted purple
      body: { paid: true } // highlighted purple
    }
  }]
};
```

**Right Panel - "2. Run Test":**
```typescript
test('checkout flow', async ({ page }) => {
  await switchScenario(page, 'payment_success'); // highlighted green

  // Hits real Next.js backend
  await page.goto('/checkout');
  await page.click('#pay-button');

  // Real DB, Real Middleware, Mocked Stripe
  await expect(page).toHaveURL('/success');
});
```

### Value Props Section
- Headline: **"Only mock what you don't control"**
- Subhead: "Scenarist acts as a precision scalpel. It slices off external dependencies while leaving your application logic perfectly intact."

**Card 1 (2/3 width, emerald accent):**
- Label: "Your Application"
- Title: "Executes For Real"
- Tags: Server Components, Middleware, Zod Validation, Session Cookies

**Card 2 (1/3 width, purple accent):**
- Label: "The Edge"
- Title: "Mocked by Scenarist"
- Items: Stripe API, Auth0, SendGrid (dashed borders)

### Features Grid

| Feature | Size | Icon | Description |
|---------|------|------|-------------|
| Instant Runtime Switching | 2/3 | Lightning bolt | Switch scenarios via HTTP headers. Unlike E2E tests that require spawning new server instances for every state, Scenarist keeps one server running and modifies behavior per-request. |
| Type-Safe | 1/3 | Checkmark | Built for Playwright. TypeScript autocomplete for your scenario IDs. Never debug a typo again. |
| Zero Boilerplate | 1/3 | Database | No mocking `next/headers`. No mocking `req.session`. Use the framework as intended. |
| Framework Agnostic | 2/3 | Flask | Adapters for Express and Next.js (App & Pages Router) available now. Fastify, Remix, and Hono coming soon. |

### Footer
- Headline: **"Ready to stabilize your backend tests?"**
- CTAs: "Read the Docs" (white) + "GitHub" (outline)
- Copyright: "© 2025 Scenarist. Released under MIT License."

---

## Design Tokens

### Dark Mode
```
Background:        #030304
Surface:           #0A0A0C
Surface Highlight: #161618
Border:            rgba(255, 255, 255, 0.06)
Primary:           #8B5CF6 (violet)
Secondary:         #10B981 (emerald)
```

### Light Mode
```
Background:        #ffffff
Surface:           #f8fafc
Surface Highlight: #f1f5f9
Border:            rgba(0, 0, 0, 0.08)
Primary:           #7C3AED (darker violet)
Secondary:         #059669 (darker emerald)
```

### Code Syntax
```
Keyword:           #C792EA (purple)
String:            #10B981 (green)
Function:          #60A5FA (blue)
Comment:           #6B7280 (gray)
```

---

## Notes & Decisions

- **Tailwind v4:** Using CSS-first configuration via `@tailwindcss/vite` plugin
- **Landing page:** Custom `src/pages/index.astro` bypasses Starlight entirely
- **Dark mode default:** Landing page defaults to dark, uses `class` strategy
- **Docs theming:** Uses Starlight's `[data-theme]` attribute for consistency
