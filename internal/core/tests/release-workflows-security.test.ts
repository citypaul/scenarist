import { describe, expect, it } from "vitest";
import preReleaseWorkflowContents from "../../../.github/workflows/pre-release.yml?raw";
import releaseWorkflowContents from "../../../.github/workflows/release.yml?raw";

type ReleaseWorkflow = {
  readonly path: string;
  readonly contents: string;
};

const releaseWorkflows: readonly ReleaseWorkflow[] = [
  {
    path: "../../../.github/workflows/release.yml",
    contents: releaseWorkflowContents,
  },
  {
    path: "../../../.github/workflows/pre-release.yml",
    contents: preReleaseWorkflowContents,
  },
] as const;

describe("release workflow supply-chain pinning", () => {
  it.each(releaseWorkflows)(
    "does not run npm package-manager downloads in $path",
    ({ contents }) => {
      expect(contents).not.toMatch(
        /^\s*npm\s+(install|i|install-test|update|ci)\b/m,
      );
    },
  );

  it.each(releaseWorkflows)(
    "installs npm from a sha512-verified tarball in $path",
    ({ contents }) => {
      expect(contents).toMatch(/NPM_VERSION: '\d+\.\d+\.\d+'/);
      expect(contents).toMatch(/NPM_SHA512: '[a-f0-9]{128}'/);
      expect(contents).toContain(
        'curl -fsSL "https://registry.npmjs.org/npm/-/npm-${NPM_VERSION}.tgz" -o npm.tgz',
      );
      expect(contents).toContain(
        'echo "${NPM_SHA512}  npm.tgz" | sha512sum -c -',
      );
      expect(contents).toContain("tar -xzf npm.tgz");
    },
  );
});
