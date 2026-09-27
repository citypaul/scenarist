import { expect, test } from "@playwright/test";

/**
 * Internal Link Tests
 *
 * Every page is served at a trailing-slash URL. Cloudflare answers a
 * slashless URL with a 307 temporary redirect, which search engines treat
 * as a weak, conflicting canonical signal. Internal links must therefore
 * point straight at the trailing-slash URL.
 */

const readSitemapPaths = async (
  request: import("@playwright/test").APIRequestContext,
): Promise<ReadonlyArray<string>> => {
  const response = await request.get("/sitemap-0.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc ?? "").pathname,
  );
};

const isPageLink = (href: string): boolean =>
  href.startsWith("/") &&
  !href.startsWith("//") &&
  !/\.[a-z0-9]+$/i.test(href.split(/[?#]/)[0] ?? "");

const lacksTrailingSlash = (href: string): boolean =>
  !(href.split(/[?#]/)[0] ?? "").endsWith("/");

test.describe("Internal links", () => {
  test("every internal page link targets the trailing-slash URL", async ({
    page,
    request,
  }) => {
    const paths = await readSitemapPaths(request);
    expect(paths.length).toBeGreaterThan(0);

    const offenders = await paths.reduce<Promise<ReadonlyArray<string>>>(
      async (previous, path) => {
        const found = await previous;
        await page.goto(path);
        const hrefs = await page
          .locator("a[href]")
          .evaluateAll((anchors) =>
            anchors.map((anchor) => anchor.getAttribute("href") ?? ""),
          );
        return [
          ...found,
          ...hrefs
            .filter(isPageLink)
            .filter(lacksTrailingSlash)
            .map((href) => `${path} -> ${href}`),
        ];
      },
      Promise.resolve([]),
    );

    expect(offenders).toEqual([]);
  });
});
