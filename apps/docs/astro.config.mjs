// @ts-check
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import rehypeMermaid from "rehype-mermaid";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://scenarist.io",
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ["mermaid"],
    },
    rehypePlugins: [rehypeMermaid],
  },

  integrations: [
    starlight({
      title: "Scenarist",
      description: "Playwright tests that hit your real server. Server Components, routes, and middleware execute for real. Mock only external APIs—switchable per test.",
      head: [
        // Open Graph
        {
          tag: "meta",
          attrs: { property: "og:site_name", content: "Scenarist" },
        },
        {
          tag: "meta",
          attrs: { property: "og:type", content: "website" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image", content: "https://scenarist.io/social-preview.png" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:width", content: "1238" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:height", content: "612" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:alt", content: "Scenarist - The Scenario-based Testing Framework for the Web" },
        },
        // Twitter Card
        {
          tag: "meta",
          attrs: { name: "twitter:card", content: "summary_large_image" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:image", content: "https://scenarist.io/social-preview.png" },
        },
        // Additional SEO
        {
          tag: "meta",
          attrs: { name: "author", content: "Scenarist Contributors" },
        },
        {
          tag: "meta",
          attrs: { name: "theme-color", content: "#6366f1" },
        },
        {
          tag: "meta",
          attrs: {
            name: "keywords",
            content: "testing, e2e testing, integration testing, playwright, msw, mock service worker, nodejs, typescript, express, nextjs, react server components",
          },
        },
        // JSON-LD Structured Data
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            "name": "Scenarist",
            "description": "Playwright tests that hit your real server. Server Components, routes, and middleware execute for real. Mock only external APIs—switchable per test.",
            "url": "https://scenarist.io",
            "codeRepository": "https://github.com/citypaul/scenarist",
            "programmingLanguage": ["TypeScript", "JavaScript"],
            "runtimePlatform": "Node.js",
            "license": "https://opensource.org/licenses/MIT",
            "keywords": ["testing", "e2e", "playwright", "msw", "nodejs", "typescript"],
            "author": {
              "@type": "Organization",
              "name": "Scenarist Contributors",
              "url": "https://github.com/citypaul/scenarist"
            }
          }),
        },
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Scenarist Documentation",
            "url": "https://scenarist.io",
            "description": "Documentation for Scenarist - Playwright tests that hit your real server. Mock only external APIs—switchable per test.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://scenarist.io/?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          }),
        },
        // Plausible Analytics (proxied through Cloudflare)
        {
          tag: "script",
          attrs: {
            defer: true,
            "data-domain": "scenarist.io",
            "data-api": "/api/event",
            src: "/js/script.js",
          },
        },
        // Accessibility: Make tables keyboard accessible when scrollable (WCAG scrollable-region-focusable)
        // Tables can become scrollable at different viewport sizes, so we add tabindex to all
        // and use CSS :focus-visible to only show focus ring when appropriate
        {
          tag: "script",
          content: `document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.sl-markdown-content table').forEach(function(t){t.setAttribute('tabindex','0');t.setAttribute('role','group');t.setAttribute('aria-label','Data table')})});`,
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/citypaul/scenarist",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Quick Start", slug: "getting-started/quick-start" },
            { label: "Installation", slug: "getting-started/installation" },
            { label: "Why Scenarist?", slug: "getting-started/why-scenarist" },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            { label: "Philosophy", slug: "concepts/philosophy" },
            { label: "How It Works", slug: "concepts/how-it-works" },
            { label: "Scenario Format", slug: "concepts/scenario-format" },
            { label: "Default Mocks", slug: "concepts/default-mocks" },
            { label: "Dynamic Responses", slug: "concepts/dynamic-responses" },
            { label: "Production Safety", slug: "concepts/production-safety" },
          ],
        },
        {
          label: "Comparison",
          items: [
            { label: "Overview", slug: "comparison" },
            { label: "Scenarist + MSW", slug: "comparison/with-msw" },
            { label: "vs WireMock", slug: "comparison/vs-wiremock" },
            { label: "vs Nock", slug: "comparison/vs-nock" },
            { label: "vs Testcontainers", slug: "comparison/vs-testcontainers" },
            { label: "vs Playwright Mocks", slug: "comparison/vs-playwright-mocks" },
          ],
        },
        {
          label: "Framework Guides",
          items: [
            {
              label: "Express",
              collapsed: true,
              items: [
                { label: "Overview", slug: "frameworks/express" },
                { label: "Getting Started", slug: "frameworks/express/getting-started" },
                { label: "Example App", slug: "frameworks/express/example-app" },
              ],
            },
            {
              label: "Next.js",
              collapsed: true,
              items: [
                { label: "Overview", slug: "frameworks/nextjs" },
                {
                  label: "App Router",
                  items: [
                    { label: "Overview", slug: "frameworks/nextjs-app-router" },
                    { label: "Getting Started", slug: "frameworks/nextjs-app-router/getting-started" },
                    { label: "Testing RSC", slug: "frameworks/nextjs-app-router/rsc-guide" },
                    { label: "Example App", slug: "frameworks/nextjs-app-router/example-app" },
                  ],
                },
                {
                  label: "Pages Router",
                  items: [
                    { label: "Overview", slug: "frameworks/nextjs-pages-router" },
                    { label: "Getting Started", slug: "frameworks/nextjs-pages-router/getting-started" },
                    { label: "Example App", slug: "frameworks/nextjs-pages-router/example-app" },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Testing Patterns",
          items: [
            { label: "Playwright Integration", slug: "testing/playwright-integration" },
            { label: "Parallel Testing", slug: "testing/parallel-testing" },
            { label: "Best Practices", slug: "testing/best-practices" },
          ],
        },
        {
          label: "Guides",
          items: [
            {
              label: "Testing Database Apps",
              items: [
                { label: "Overview", slug: "guides/testing-database-apps" },
                { label: "Parallelism Options", slug: "guides/testing-database-apps/parallelism-options" },
                { label: "Repository Pattern", slug: "guides/testing-database-apps/repository-pattern" },
                { label: "Testcontainers Hybrid", slug: "guides/testing-database-apps/testcontainers-hybrid" },
              ],
            },
          ],
        },
        {
          label: "Reference",
          collapsed: true,
          items: [
            { label: "API Endpoints", slug: "reference/api-endpoints" },
            { label: "Ephemeral Endpoints", slug: "reference/ephemeral-endpoints" },
            { label: "Verification", slug: "reference/verification" },
            { label: "Architecture", slug: "concepts/architecture" },
          ],
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
    sitemap(),
  ],

  adapter: cloudflare(),
});