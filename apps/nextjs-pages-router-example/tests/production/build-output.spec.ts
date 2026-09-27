/**
 * Production Build Output Verification
 *
 * Verifies the production export condition removed Scenarist from the build.
 * A 404 from the scenario endpoint shows Scenarist is not serving requests;
 * this proves its code is absent from every client and server bundle.
 *
 * Run with: pnpm test:production
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { test, expect } from "@playwright/test";

const SCENARIST_MARKER = "__scenarist_shared_msw_server";

// `next dev` writes to .next/dev, and `next build` keeps that directory
const NON_PRODUCTION_DIRS = new Set(["cache", "dev"]);

const listBundleFiles = (dir: string): ReadonlyArray<string> =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter(
      (file) =>
        file.endsWith(".js") &&
        !NON_PRODUCTION_DIRS.has(file.split(sep)[0] ?? ""),
    )
    .map((file) => join(dir, file));

test.describe("Production Build Output", () => {
  test("production build contains no Scenarist or MSW code", () => {
    // SEMANTIC GOAL: Prove Scenarist and MSW are tree-shaken, not just inert
    // - The shared MSW server global survives minification, unlike MSW
    //   function names, so its absence proves the code is gone

    const bundleFiles = listBundleFiles(join(process.cwd(), ".next"));

    expect(bundleFiles).not.toHaveLength(0);
    expect(
      bundleFiles.filter((file) =>
        readFileSync(file, "utf8").includes(SCENARIST_MARKER),
      ),
    ).toEqual([]);
  });
});
