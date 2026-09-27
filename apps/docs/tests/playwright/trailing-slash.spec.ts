import { expect, test } from "@playwright/test";

/**
 * Trailing Slash Tests
 *
 * Every page is served at a trailing-slash URL, which its canonical tag
 * names. By default Cloudflare answers a slashless URL with a 307 temporary
 * redirect, which search engines treat as a weak signal and may index the
 * slashless URL as a separate page. Internal links must point straight at
 * the trailing-slash URL, and slashless URLs must redirect permanently.
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

test.describe("Slashless URLs", () => {
  test("every page's slashless URL permanently redirects to it", async ({
    request,
  }) => {
    const paths = (await readSitemapPaths(request)).filter(
      (path) => path !== "/",
    );
    expect(paths.length).toBeGreaterThan(0);

    const responses = await Promise.all(
      paths.map(async (path) => {
        const response = await request.get(path.slice(0, -1), {
          maxRedirects: 0,
        });
        return {
          path,
          status: response.status(),
          location: response.headers()["location"],
        };
      }),
    );

    expect(responses).toEqual(
      paths.map((path) => ({ path, status: 301, location: path })),
    );
  });
});
