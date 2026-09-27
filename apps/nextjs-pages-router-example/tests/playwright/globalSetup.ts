/**
 * Playwright Global Setup
 *
 * Compiles every route before the first test runs.
 *
 * `next dev` compiles routes on demand. When parallel workers request routes
 * for the first time, compiles race with requests that read the manifests
 * being rewritten (500 "Unexpected end of JSON input" from loadManifest) and
 * push webpack HMR updates into open pages. Warming all routes up front means
 * no compiles happen while tests run.
 *
 * Routes are requested one at a time: the warm-up only needs each route to be
 * compiled, not to succeed, so status codes are ignored.
 *
 * MSW is auto-started in the Next.js process by lib/scenarist.ts. Comparison
 * tests (SKIP_MSW=true) run without Scenarist against the real json-server, so
 * the warm-up is skipped there: it would send every route's traffic to the
 * real backend, and that project only exercises a single route.
 */

import { globSync } from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

const PAGES_DIR = path.join(import.meta.dirname, "../../pages");

const toRoutePath = (file: string) =>
  `/${file.replace(/\.tsx?$/, "")}`
    .replace(/\/index$/, "/")
    .replace(/\[\[?\.{0,3}[^\]]+\]\]?/g, "1");

// Every file under pages/ is a route except Next's special files at the root
// (`_app`, `_document`, `_error`). Nested `api/__scenario__.ts` is a route.
const isSpecialPagesFile = (file: string) => /^_[^/]*$/.test(file);

const findRoutePaths = (pagesDir: string): ReadonlyArray<string> =>
  globSync("**/*.{ts,tsx}", { cwd: pagesDir })
    .filter((file) => !isSpecialPagesFile(file))
    .map(toRoutePath);

export default async function globalSetup(config: FullConfig): Promise<void> {
  if (process.env.SKIP_MSW === "true") {
    console.log(
      "⏭️  Skipping MSW server (comparison tests use real json-server)",
    );
    return;
  }

  const baseURL = config.projects[0]?.use.baseURL;

  if (!baseURL) {
    return;
  }

  for (const routePath of findRoutePaths(PAGES_DIR)) {
    await fetch(new URL(routePath, baseURL)).catch(() => undefined);
  }
}
