import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { expect, test } from "@playwright/test";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

const NEXTJS_ONLY_SOURCES = [
  "apps/docs/src/content/docs/frameworks/nextjs-app-router",
  "apps/docs/src/content/docs/frameworks/nextjs-pages-router",
  "apps/docs/src/content/docs/frameworks/nextjs-app-router.md",
  "apps/docs/src/content/docs/frameworks/nextjs-pages-router.md",
  "apps/docs/src/content/docs/frameworks/nextjs.md",
  "packages/nextjs-adapter/README.md",
  "packages/nextjs-adapter/src",
  "apps/nextjs-app-router-example/README.md",
  "apps/nextjs-app-router-example/lib",
  "apps/nextjs-pages-router-example/README.md",
  "apps/nextjs-pages-router-example/lib",
];

const DOC_OR_SOURCE = /\.(md|mdx|ts|tsx)$/;

const filesUnder = (path: string): ReadonlyArray<string> =>
  statSync(path).isDirectory()
    ? readdirSync(path, { recursive: true, encoding: "utf8" })
        .map((entry) => join(path, entry))
        .filter((file) => DOC_OR_SOURCE.test(file))
    : [path];

const TEST_ONLY_NODE_ENV_GATE =
  /enabled:\s*process\.env\.NODE_ENV\s*===\s*["']test["']/;

test("Next.js guidance never gates enabled on NODE_ENV === 'test', which Next.js never inlines", () => {
  const offenders = NEXTJS_ONLY_SOURCES.map((source) => join(repoRoot, source))
    .flatMap(filesUnder)
    .flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          TEST_ONLY_NODE_ENV_GATE.test(line)
            ? [`${relative(repoRoot, file)}:${index + 1}`]
            : [],
        ),
    );

  expect(offenders).toEqual([]);
});
