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
 * MSW is auto-started in the Next.js process by lib/scenarist.ts; comparison
 * tests (SKIP_MSW=true) hit the real json-server instead.
 */

import { globSync } from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

const PAGES_DIR = path.join(import.meta.dirname, "../../pages");

const toRoutePath = (file: string) =>
  `/${file.replace(/\.tsx?$/, "")}`
    .replace(/\/index$/, "/")
    .replace(/\[\[?\.{0,3}[^\]]+\]\]?/g, "1");

const findRoutePaths = (pagesDir: string): ReadonlyArray<string> =>
  globSync("**/*.{ts,tsx}", {
    cwd: pagesDir,
    exclude: ["_app.tsx", "_document.tsx"],
  }).map(toRoutePath);

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;

  if (baseURL) {
    for (const routePath of findRoutePaths(PAGES_DIR)) {
      await fetch(new URL(routePath, baseURL)).catch(() => undefined);
    }
  }

  if (process.env.SKIP_MSW === "true") {
    console.log(
      "⏭️  Skipping MSW server (comparison tests use real json-server)",
    );
  }
}
