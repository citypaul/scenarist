import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Social & SEO Meta Tests
 *
 * Mirrors what link-preview checkers (opengraph.to, OrcaScan) score:
 * - Description short enough not to be truncated in search/social previews
 * - Twitter card tags using name= (X ignores property=)
 * - A raster favicon Google can show, plus apple-touch-icon and manifest
 * - og:locale, og:logo and JSON-LD structured data
 * - Landing page HTML stays under 100 KB
 */

const pages = ["/", "/getting-started/quick-start/"] as const;

const fetchHtml = async (request: APIRequestContext, path: string) => {
  const response = await request.get(path);
  expect(response.ok()).toBe(true);
  return response.text();
};

const tagsAttrs = (html: string, tag: "meta" | "link") =>
  Array.from(html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g")), ([match]) =>
    Object.fromEntries(
      Array.from(match.matchAll(/([\w:-]+)="([^"]*)"/g), ([, key, value]) => [
        key,
        value,
      ]),
    ),
  );

const metaContent = (html: string, key: "name" | "property", value: string) =>
  tagsAttrs(html, "meta").find((meta) => meta[key] === value)?.content;

const links = (html: string) => tagsAttrs(html, "link");

test.describe("Social & SEO meta", () => {
  test("landing page description fits in search and social previews", async ({
    request,
  }) => {
    const html = await fetchHtml(request, "/");

    const description = metaContent(html, "name", "description") ?? "";
    expect(description.length).toBeGreaterThanOrEqual(110);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(metaContent(html, "property", "og:description")).toBe(description);
    expect(metaContent(html, "name", "twitter:description")).toBe(description);
  });

  test("landing page HTML is under 100 KB", async ({ request }) => {
    const html = await fetchHtml(request, "/");

    expect(Buffer.byteLength(html)).toBeLessThan(100 * 1024);
  });

  for (const path of pages) {
    test(`${path} declares Twitter card, locale, logo and structured data`, async ({
      request,
    }) => {
      const html = await fetchHtml(request, path);

      expect(metaContent(html, "name", "twitter:card")).toBe(
        "summary_large_image",
      );
      expect(metaContent(html, "name", "twitter:image")).toBe(
        "https://scenarist.io/og-image.png",
      );
      expect(metaContent(html, "property", "og:locale")).toBe("en_US");
      expect(metaContent(html, "property", "og:logo")).toBe(
        "https://scenarist.io/icon-512.png",
      );
      expect(html).toContain('<script type="application/ld+json">');
    });

    test(`${path} links raster favicons and a manifest that resolve`, async ({
      request,
    }) => {
      const html = await fetchHtml(request, path);

      const linked = links(html);
      const iconHrefs = linked
        .filter((link) => link.rel === "icon")
        .map((link) => link.href);
      const hrefs = [
        iconHrefs.find((href) => href.endsWith(".ico")),
        iconHrefs.find((href) => href.endsWith(".png")),
        linked.find((link) => link.rel === "apple-touch-icon")?.href,
        linked.find((link) => link.rel === "manifest")?.href,
      ];

      for (const href of hrefs) {
        expect(href).toBeDefined();
        const response = await request.get(href ?? "");
        expect(response.status(), href).toBe(200);
      }
    });
  }

  test("root /favicon.ico is served for crawlers that ignore link tags", async ({
    request,
  }) => {
    const response = await request.get("/favicon.ico");

    expect(response.status()).toBe(200);
  });

  test("web manifest lists separate any and maskable icons", async ({
    request,
  }) => {
    const response = await request.get("/site.webmanifest");
    expect(response.ok()).toBe(true);

    const manifest: unknown = await response.json();
    expect(manifest).toMatchObject({
      name: "Scenarist",
      icons: expect.arrayContaining([
        expect.objectContaining({
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        }),
        expect.objectContaining({
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        }),
        expect.objectContaining({
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        }),
        expect.objectContaining({
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        }),
      ]),
    });
  });
});
