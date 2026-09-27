import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, test } from "@playwright/test";

// The production-safety guide tells readers to run these shell checks to prove
// Scenarist is absent from their production output. Each check must succeed
// only when the output exists and contains no Scenarist/MSW code.

const readDoc = (path: string): string =>
  readFileSync(
    new URL(`../../src/content/docs/${path}`, import.meta.url),
    "utf8",
  );

const guide = readDoc("concepts/production-safety.mdx");
const expressGuide = readDoc("frameworks/express/getting-started.mdx");

const CLEAN_BUNDLE = 'import e from"express";const a=e();a.listen(3e3);';
// esbuild --minify output without the production condition keeps this global
const CONTAMINATED_BUNDLE =
  'globalThis.__scenarist_shared_msw_server??=a();import e from"express";';

type BundleFiles = Readonly<Record<string, string>>;

const createProject = (files: BundleFiles): string => {
  const root = mkdtempSync(join(tmpdir(), "scenarist-verify-"));
  Object.entries(files).forEach(([path, contents]) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  });
  return root;
};

const runIn = (
  files: BundleFiles,
  shell: ReadonlyArray<string>,
  script: string,
): number | null => {
  const root = createProject(files);
  try {
    return spawnSync(shell[0], [...shell.slice(1), script], {
      cwd: root,
      stdio: "ignore",
    }).status;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const codeBlockAfter = (doc: string, marker: string): string => {
  const start = doc.indexOf(marker);
  expect(start, `doc contains "${marker}"`).toBeGreaterThanOrEqual(0);
  const fence = "```bash\n";
  const open = doc.indexOf(fence, start) + fence.length;
  const close = doc.indexOf("\n```", open);
  return doc.slice(open, close);
};

const withoutBuildStep = (script: string): string =>
  script
    .split("\n")
    .filter((line) => !/npm run build/.test(line))
    .join("\n");

const nextJsCheck = (): string =>
  withoutBuildStep(codeBlockAfter(guide, "**Next.js (Detailed):**"));

const quickCheck = (): string =>
  withoutBuildStep(
    codeBlockAfter(guide, "#### Quick Verification (30 seconds)"),
  );

const codeBlockContaining = (doc: string, marker: string): string => {
  const at = doc.indexOf(marker);
  expect(at, `doc contains "${marker}"`).toBeGreaterThanOrEqual(0);
  const fence = "```bash\n";
  const open = doc.lastIndexOf(fence, at) + fence.length;
  const close = doc.indexOf("\n```", at);
  return doc.slice(open, close);
};

const expressGuideCheck = (): string =>
  withoutBuildStep(
    codeBlockContaining(expressGuide, "# Verify MSW code eliminated"),
  );

const ciCheck = (): string => {
  const step = guide.indexOf("name: Verify no MSW runtime code in bundle");
  expect(
    step,
    "guide contains the CI verification step",
  ).toBeGreaterThanOrEqual(0);
  const [, runLine, ...rest] = guide.slice(step).split("\n");
  expect(runLine.trim()).toBe("run: |");
  const indent = rest[0].length - rest[0].trimStart().length;
  const end = rest.findIndex(
    (line) =>
      line.trim() !== "" && line.length - line.trimStart().length < indent,
  );
  return rest
    .slice(0, end)
    .map((line) => line.slice(indent))
    .join("\n");
};

const npmCheck = (): string => {
  const match = guide.match(/"verify:production": ("(?:[^"\\]|\\.)*")/);
  expect(match, "guide defines a verify:production script").not.toBeNull();
  const script: unknown = JSON.parse(match?.[1] ?? '""');
  if (typeof script !== "string") {
    throw new Error("verify:production must be a string");
  }
  return script.replace(/^NODE_ENV=production npm run build && /, "");
};

const GITHUB_ACTIONS_BASH = [
  "bash",
  "--noprofile",
  "--norc",
  "-eo",
  "pipefail",
  "-c",
];
const POSIX_SH = ["sh", "-c"];

test.describe("production-safety verification snippets", () => {
  test.describe("Next.js bundle check", () => {
    const nextBundle = (server: string): BundleFiles => ({
      ".next/static/chunks/main.js": CLEAN_BUNDLE,
      ".next/server/app/page.js": server,
    });

    test("passes when the bundles contain no Scenarist code", () => {
      expect(runIn(nextBundle(CLEAN_BUNDLE), POSIX_SH, nextJsCheck())).toBe(0);
    });

    test("fails when a bundle contains Scenarist code", () => {
      expect(
        runIn(nextBundle(CONTAMINATED_BUNDLE), POSIX_SH, nextJsCheck()),
      ).not.toBe(0);
    });

    test("fails when there is no build output", () => {
      expect(runIn({}, POSIX_SH, nextJsCheck())).not.toBe(0);
    });
  });

  [
    { name: "Quick Verification", shell: POSIX_SH, script: quickCheck },
    {
      name: "Express guide bundled check",
      shell: POSIX_SH,
      script: expressGuideCheck,
    },
    { name: "CI step", shell: GITHUB_ACTIONS_BASH, script: ciCheck },
    { name: "npm verify:production script", shell: POSIX_SH, script: npmCheck },
  ].forEach(({ name, shell, script }) => {
    test.describe(name, () => {
      test("passes when the bundle contains no Scenarist code", () => {
        expect(runIn({ "dist/server.js": CLEAN_BUNDLE }, shell, script())).toBe(
          0,
        );
      });

      test("fails when the bundle contains Scenarist code", () => {
        expect(
          runIn({ "dist/server.js": CONTAMINATED_BUNDLE }, shell, script()),
        ).not.toBe(0);
      });

      test("fails when there is no build output", () => {
        expect(runIn({}, shell, script())).not.toBe(0);
      });
    });
  });
});
