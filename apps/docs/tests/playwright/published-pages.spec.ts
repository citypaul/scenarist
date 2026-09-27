import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { readSitemapPaths } from "./sitemap";

// Rules and rationale: apps/docs/CONTRIBUTING.md#search-indexing

const readPublishedPages = (): ReadonlyArray<string> => {
  const parsed: unknown = JSON.parse(
    readFileSync(
      new URL("../../published-pages.json", import.meta.url),
      "utf8",
    ),
  );
  if (
    !Array.isArray(parsed) ||
    !parsed.every((entry) => typeof entry === "string")
  ) {
    throw new Error("published-pages.json must be an array of URL paths");
  }
  return parsed;
};

type Resolution = {
  readonly path: string;
  readonly status: number;
  readonly finalStatus: number;
};

const resolve = async (
  request: APIRequestContext,
  path: string,
): Promise<Resolution> => {
  const first = await request.get(path, { maxRedirects: 0 });
  const location = first.headers()["location"];
  const final =
    first.status() === 301 && location !== undefined
      ? await request.get(location, { maxRedirects: 0 })
      : first;
  return { path, status: first.status(), finalStatus: final.status() };
};

test.describe("Published pages", () => {
  test("every page in the sitemap is recorded as published", async ({
    request,
  }) => {
    const published = new Set(readPublishedPages());
    const unrecorded = (await readSitemapPaths(request)).filter(
      (path) => !published.has(path),
    );

    expect(
      unrecorded,
      "Add these new pages to apps/docs/published-pages.json",
    ).toEqual([]);
  });

  test("every published page still resolves or permanently redirects", async ({
    request,
  }) => {
    const resolutions = await Promise.all(
      readPublishedPages().map((path) => resolve(request, path)),
    );
    const broken = resolutions.filter(
      ({ status, finalStatus }) =>
        !(status === 200 || (status === 301 && finalStatus === 200)),
    );

    expect(
      broken,
      "Add a redirect to `redirects` in apps/docs/astro.config.mjs for each removed page",
    ).toEqual([]);
  });
});
