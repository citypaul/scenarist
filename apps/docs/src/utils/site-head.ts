export type HeadTag = {
  readonly tag: "meta" | "link";
  readonly attrs: Readonly<Record<string, string>>;
};

const SITE_URL = "https://scenarist.io";
const SOCIAL_IMAGE = `${SITE_URL}/og-image.png`;
const LOGO = `${SITE_URL}/icon-512.png`;

export const siteHeadTags: readonly HeadTag[] = [
  { tag: "meta", attrs: { property: "og:locale", content: "en_US" } },
  { tag: "meta", attrs: { property: "og:logo", content: LOGO } },
  {
    tag: "meta",
    attrs: { name: "twitter:card", content: "summary_large_image" },
  },
  { tag: "link", attrs: { rel: "icon", href: "/favicon.ico", sizes: "48x48" } },
  {
    tag: "link",
    attrs: {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
  },
  {
    tag: "link",
    attrs: {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
  },
  { tag: "link", attrs: { rel: "manifest", href: "/site.webmanifest" } },
];

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareSourceCode",
      name: "Scenarist",
      description:
        "Playwright tests that run your real backend while every external API plays the scenario you choose.",
      url: SITE_URL,
      image: SOCIAL_IMAGE,
      codeRepository: "https://github.com/citypaul/scenarist",
      programmingLanguage: ["TypeScript", "JavaScript"],
      runtimePlatform: "Node.js",
      license: "https://opensource.org/licenses/MIT",
      keywords: ["testing", "e2e", "playwright", "msw", "nodejs", "typescript"],
      author: {
        "@type": "Organization",
        name: "Scenarist Contributors",
        url: "https://github.com/citypaul/scenarist",
        logo: LOGO,
      },
    },
    {
      "@type": "WebSite",
      name: "Scenarist",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};
