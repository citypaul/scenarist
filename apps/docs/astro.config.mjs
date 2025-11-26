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
          label: "Introduction",
          items: [
            { label: "Quick Start", slug: "introduction/quick-start" },
            { label: "Why Scenarist?", slug: "introduction/why-scenarist" },
            { label: "How it works", slug: "introduction/overview" },
            { label: "Dynamic Capabilities", slug: "introduction/capabilities" },
            { label: "Installation", slug: "introduction/installation" },
            { label: "Production Safety", slug: "introduction/production-safety" },
            { label: "Testing with Playwright", slug: "introduction/testing-with-playwright" },
            { label: "Scenario Format", slug: "introduction/scenario-format" },
            { label: "Declarative Design", slug: "introduction/declarative-design" },
            { label: "Default Mocks & Overrides", slug: "introduction/default-mocks" },
            { label: "Ephemeral Endpoints", slug: "introduction/ephemeral-endpoints" },
            { label: "Endpoint APIs", slug: "introduction/endpoint-apis" },
          ],
        },
        {
          label: "Framework Guides",
          items: [
            {
              label: "Express",
              items: [
                { label: "Overview", slug: "frameworks/express" },
                { label: "Getting Started", slug: "frameworks/express/getting-started" },
                { label: "Example App", slug: "frameworks/express/example-app" },
              ],
            },
            {
              label: "Next.js",
              items: [
                { label: "Overview", slug: "frameworks/nextjs" },
                {
                  label: "App Router",
                  items: [
                    { label: "Overview", slug: "frameworks/nextjs-app-router" },
                    { label: "Getting Started", slug: "frameworks/nextjs-app-router/getting-started" },
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
            { label: "Remix", slug: "frameworks/remix" },
            { label: "SvelteKit", slug: "frameworks/sveltekit" },
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
          label: "Concepts",
          collapsed: true,
          items: [
            { label: "Architecture", slug: "concepts/architecture" },
            { label: "Coming Soon", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          collapsed: true,
          items: [{ label: "Verification Guide", slug: "reference/verification" }],
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
    sitemap(),
  ],

  adapter: cloudflare(),
});