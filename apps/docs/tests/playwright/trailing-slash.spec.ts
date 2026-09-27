import { expect, test } from "@playwright/test";
import { readSitemapPaths } from "./sitemap";

// Rules and rationale: apps/docs/CONTRIBUTING.md#search-indexing

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
      (path) => path !== "/" && !/\.[a-z0-9]+$/i.test(path),
    );

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
