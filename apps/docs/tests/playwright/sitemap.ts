import { expect, type APIRequestContext } from "@playwright/test";

export const readSitemapPaths = async (
  request: APIRequestContext,
): Promise<ReadonlyArray<string>> => {
  const response = await request.get("/sitemap-0.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc ?? "").pathname,
  );
  expect(paths.length).toBeGreaterThan(0);
  return paths;
};
