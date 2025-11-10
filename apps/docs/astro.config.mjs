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
            { label: "Installation", slug: "introduction/installation" },
            { label: "Overview", slug: "introduction/overview" },
          ],
        },
        {
          label: "Framework Guides",
          items: [
            { label: "Express", slug: "frameworks/express/getting-started" },
            { label: "Next.js", slug: "frameworks/nextjs/getting-started" },
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
          items: [{ label: "Coming Soon", slug: "reference/example" }],
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],

  adapter: cloudflare(),
});