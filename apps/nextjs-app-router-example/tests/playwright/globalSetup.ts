/**
 * Playwright Global Setup
 *
 * Compiles every route before the first test runs.
 *
 * `next dev` compiles routes on demand. When parallel workers request routes
 * for the first time, each compile pushes a webpack HMR update into every open
 * page, which reloads or remounts pages in the middle of unrelated tests
 * (checkout result wiped, cart count reset, sequence clicks lost). Warming all
 * routes up front means no compiles happen while tests run.
 *
 * Routes are requested one at a time: the warm-up only needs each route to be
 * compiled, not to succeed, so status codes are ignored.
 */

import { globSync } from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

const APP_DIR = path.join(import.meta.dirname, "../../app");

const toRoutePath = (file: string) =>
  `/${path.dirname(file)}`
    .replace(/\/\.$/, "/")
    .replace(/%5F/g, "_")
    .replace(/\[\[?\.{0,3}[^\]]+\]\]?/g, "1");

const findRoutePaths = (appDir: string): ReadonlyArray<string> =>
  globSync(["**/page.tsx", "**/route.ts"], { cwd: appDir }).map(toRoutePath);

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;

  if (!baseURL) {
    return;
  }

  for (const routePath of findRoutePaths(APP_DIR)) {
    await fetch(new URL(routePath, baseURL)).catch(() => undefined);
  }
}
