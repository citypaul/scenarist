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

const SHARED_GUIDANCE_SOURCES = [
  "apps/docs/src/content/docs",
  "README.md",
  "CLAUDE.md",
  "docs/templates",
  "packages/playwright-helpers/README.md",
];

const DOC_OR_SOURCE = /\.(md|mdx|ts|tsx)$/;

const TEST_ONLY_NODE_ENV_GATE =
  /enabled:\s*\(?\s*process\.env\.NODE_ENV\s*===\s*["']test["']/g;

const FENCED_CODE_BLOCK = /```[^\n]*\n[\s\S]*?\n```/g;

const filesUnder = (path: string): ReadonlyArray<string> =>
  statSync(path).isDirectory()
    ? readdirSync(path, { recursive: true, encoding: "utf8" })
        .map((entry) => join(path, entry))
        .filter((file) => DOC_OR_SOURCE.test(file))
    : [path];

const lineOf = (text: string, index: number): number =>
  text.slice(0, index).split("\n").length;

const gateOffsets = (text: string): ReadonlyArray<number> =>
  [...text.matchAll(TEST_ONLY_NODE_ENV_GATE)].map((match) => match.index);

const nextJsOnlyOffenders = (file: string): ReadonlyArray<number> => {
  const text = readFileSync(file, "utf8");
  return gateOffsets(text).map((index) => lineOf(text, index));
};

const INLINE_CODE_SPAN = /`[^`\n]+`/g;

const marksGateAsExpress = (block: string, offset: number): boolean => {
  const lineEnd = block.indexOf("\n", offset);
  const gateLine = block.slice(offset, lineEnd === -1 ? undefined : lineEnd);
  return (
    block.includes("@scenarist/express-adapter") ||
    /\/\/\s*Express\b/.test(gateLine)
  );
};

const blankOut = (text: string, pattern: RegExp): string =>
  text.replace(pattern, (match) => " ".repeat(match.length));

const sharedGuidanceOffenderLines = (text: string): ReadonlyArray<number> => {
  const fenced = [...text.matchAll(FENCED_CODE_BLOCK)].flatMap(
    ({ 0: block, index }) =>
      gateOffsets(block)
        .filter((offset) => !marksGateAsExpress(block, offset))
        .map((offset) => lineOf(text, index + offset)),
  );
  const prose = blankOut(text, FENCED_CODE_BLOCK);
  const inline = [...prose.matchAll(INLINE_CODE_SPAN)].flatMap(
    ({ 0: span, index }) =>
      gateOffsets(span).map((offset) => lineOf(text, index + offset)),
  );
  return [...fenced, ...inline];
};

const sharedGuidanceOffenders = (file: string): ReadonlyArray<number> =>
  sharedGuidanceOffenderLines(readFileSync(file, "utf8"));

const findOffenders = (
  sources: ReadonlyArray<string>,
  offendingLines: (file: string) => ReadonlyArray<number>,
): ReadonlyArray<string> =>
  sources
    .map((source) => join(repoRoot, source))
    .flatMap(filesUnder)
    .flatMap((file) =>
      offendingLines(file).map((line) => `${relative(repoRoot, file)}:${line}`),
    );

test.describe("enabled guidance for Next.js", () => {
  test("detects the NODE_ENV === 'test' gate across formatting variants", () => {
    const variants = [
      'enabled: process.env.NODE_ENV === "test",',
      "enabled:\n    process.env.NODE_ENV === 'test',",
      'enabled: (process.env.NODE_ENV === "test"),',
    ];

    expect(variants.map((variant) => gateOffsets(variant).length)).toEqual([
      1, 1, 1,
    ]);
    expect(gateOffsets("enabled: true,")).toEqual([]);
  });

  test("only an Express import or a // Express comment on the gate exempts a shared snippet", () => {
    const fence = (body: string): string => "```ts\n" + body + "\n```";
    const gate =
      'createScenarist({\n  enabled: process.env.NODE_ENV === "test",\n});';

    expect(
      [
        fence(
          'import { createScenarist } from "@scenarist/nextjs-adapter/app";\n' +
            gate,
        ),
        fence("// Unlike Express, this runs in Next.js\n" + gate),
        fence("// Evaluate the expression at startup\n" + gate),
        'Use `enabled: process.env.NODE_ENV === "test"` in tests.',
      ].map((text) => sharedGuidanceOffenderLines(text).length),
    ).toEqual([1, 1, 1, 1]);

    expect(
      [
        fence(
          'import { createScenarist } from "@scenarist/express-adapter";\n' +
            gate,
        ),
        fence(
          gate.replace(
            '"test",',
            '"test", // Express; in Next.js use enabled: true',
          ),
        ),
      ].map((text) => sharedGuidanceOffenderLines(text).length),
    ).toEqual([0, 0]);
  });

  test("Next.js-only guidance never gates enabled on NODE_ENV === 'test', which Next.js never inlines", () => {
    expect(findOffenders(NEXTJS_ONLY_SOURCES, nextJsOnlyOffenders)).toEqual([]);
  });

  test("shared guidance only gates enabled on NODE_ENV === 'test' in snippets marked as Express", () => {
    expect(
      findOffenders(SHARED_GUIDANCE_SOURCES, sharedGuidanceOffenders),
    ).toEqual([]);
  });
});
