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

const readDoc = (path: string): string =>
  readFileSync(
    new URL(`../../src/content/docs/${path}`, import.meta.url),
    "utf8",
  );

const guide = readDoc("concepts/production-safety.mdx");
const expressGuide = readDoc("frameworks/express/getting-started.mdx");

const CLEAN_BUNDLE = 'import e from"express";const a=e();a.listen(3e3);';
const MINIFIED_BUNDLE_WITH_SCENARIST =
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

const npmScriptCheck = (name: string) => (): string => {
  const match = guide.match(new RegExp(`"${name}": ("(?:[^"\\\\]|\\\\.)*")`));
  expect(match, `guide defines a ${name} script`).not.toBeNull();
  const script: unknown = JSON.parse(match?.[1] ?? '""');
  if (typeof script !== "string") {
    throw new Error(`${name} must be a string`);
  }
  return script.replace(
    /^(NODE_ENV=production )?npm run build(:production)? && /,
    "",
  );
};

const expressBundleCheck = (): string =>
  withoutBuildStep(codeBlockAfter(guide, "**Verify bundled Express app:**"));

const entryPointCheck = (): string =>
  codeBlockAfter(guide, "Verify Node resolves the production entry point");

const INSTALLED_EXPRESS_ADAPTER: BundleFiles = {
  "node_modules/@scenarist/express-adapter/package.json": JSON.stringify({
    name: "@scenarist/express-adapter",
    type: "module",
    exports: {
      ".": {
        production: "./dist/setup/production.js",
        default: "./dist/index.js",
      },
    },
  }),
  "node_modules/@scenarist/express-adapter/dist/setup/production.js":
    "export const createScenarist = () => undefined;",
  "node_modules/@scenarist/express-adapter/dist/index.js":
    "export const createScenarist = () => ({});",
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
        runIn(
          nextBundle(MINIFIED_BUNDLE_WITH_SCENARIST),
          POSIX_SH,
          nextJsCheck(),
        ),
      ).not.toBe(0);
    });

    test("fails when there is no build output", () => {
      expect(runIn({}, POSIX_SH, nextJsCheck())).not.toBe(0);
    });
  });

  test.describe("Unbundled Express entry-point check", () => {
    test("passes when Node resolves the production entry point", () => {
      expect(
        runIn(INSTALLED_EXPRESS_ADAPTER, POSIX_SH, entryPointCheck()),
      ).toBe(0);
    });

    test("fails when Node starts without the production condition", () => {
      const withoutCondition = entryPointCheck().replaceAll(
        "--conditions=production",
        "",
      );
      expect(withoutCondition).not.toBe(entryPointCheck());
      expect(
        runIn(INSTALLED_EXPRESS_ADAPTER, POSIX_SH, withoutCondition),
      ).not.toBe(0);
    });

    test("fails when the adapter is not installed", () => {
      expect(runIn({}, POSIX_SH, entryPointCheck())).not.toBe(0);
    });
  });

  [
    { name: "Quick Verification", shell: POSIX_SH, script: quickCheck },
    {
      name: "Express guide bundled check",
      shell: POSIX_SH,
      script: expressGuideCheck,
    },
    {
      name: "Express bundled check",
      shell: POSIX_SH,
      script: expressBundleCheck,
    },
    { name: "CI step", shell: GITHUB_ACTIONS_BASH, script: ciCheck },
    {
      name: "npm verify:production script",
      shell: POSIX_SH,
      script: npmScriptCheck("verify:production"),
    },
    {
      name: "npm verify:treeshaking script",
      shell: POSIX_SH,
      script: npmScriptCheck("verify:treeshaking"),
    },
  ].forEach(({ name, shell, script }) => {
    test.describe(name, () => {
      test("passes when the bundle contains no Scenarist code", () => {
        expect(runIn({ "dist/server.js": CLEAN_BUNDLE }, shell, script())).toBe(
          0,
        );
      });

      test("fails when the bundle contains Scenarist code", () => {
        expect(
          runIn(
            { "dist/server.js": MINIFIED_BUNDLE_WITH_SCENARIST },
            shell,
            script(),
          ),
        ).not.toBe(0);
      });

      test("fails when there is no build output", () => {
        expect(runIn({}, shell, script())).not.toBe(0);
      });
    });
  });
});
