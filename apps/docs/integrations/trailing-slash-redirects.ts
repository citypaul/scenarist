import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

/**
 * Cloudflare answers a slashless page URL with a 307 temporary redirect,
 * which search engines may index as a page separate from the trailing-slash
 * URL named by its canonical tag. An exact-path `_redirects` rule per page
 * takes precedence and makes that redirect permanent. Rules written earlier
 * by the Cloudflare adapter for `redirects` in astro.config.mjs are kept.
 */

const readExistingRules = (file: string): Promise<ReadonlyArray<string>> =>
  readFile(file, "utf8").then(
    (content) => content.split("\n").filter((line) => line.trim() !== ""),
    () => [],
  );

const findPagePaths = async (
  clientDir: string,
): Promise<ReadonlyArray<string>> => {
  const entries = await readdir(clientDir, { recursive: true });
  return entries
    .filter((entry) => entry.endsWith("/index.html"))
    .map((entry) => `/${entry.slice(0, -"index.html".length)}`)
    .sort();
};

const toRedirectRule = (path: string): string =>
  `${path.slice(0, -1)} ${path} 301`;

export const trailingSlashRedirects = (): AstroIntegration => ({
  name: "trailing-slash-redirects",
  hooks: {
    "astro:build:done": async ({ dir, logger }) => {
      const clientDir = fileURLToPath(dir);
      const redirectsFile = `${clientDir}/_redirects`;
      const existing = await readExistingRules(redirectsFile);
      const paths = await findPagePaths(clientDir);
      const rules = [...existing, ...paths.map(toRedirectRule)];
      await writeFile(redirectsFile, `${rules.join("\n")}\n`);
      logger.info(
        `Added ${paths.length} trailing-slash redirects to ${existing.length} existing rules`,
      );
    },
  },
});
