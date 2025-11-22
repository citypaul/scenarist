// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import rehypeMermaid from "rehype-mermaid";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: 'static',

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
      description: "Fix E2E testing for Next.js, Remix, and TanStack",
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
  ],

  adapter: cloudflare(),
});