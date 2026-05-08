import { describe, it, expect } from "vitest";
import {
  matchesRegex,
  matchesTrustedNativeRegex,
} from "../src/domain/regex-matching.js";

describe("matchesRegex", () => {
  it("should match when pattern matches value", () => {
    const result = matchesRegex("summer-premium-sale", {
      source: "premium|vip",
      flags: "i",
    });
    expect(result).toBe(true);
  });

  it("should not match when pattern does not match value", () => {
    const result = matchesRegex("summer-sale", {
      source: "premium|vip",
      flags: "i",
    });
    expect(result).toBe(false);
  });

  it("should handle case-insensitive flag", () => {
    expect(matchesRegex("PREMIUM", { source: "premium", flags: "i" })).toBe(
      true,
    );
    expect(matchesRegex("PREMIUM", { source: "premium", flags: "" })).toBe(
      false,
    );
  });

  it("should handle missing flags (undefined)", () => {
    const result = matchesRegex("premium", { source: "premium" });
    expect(result).toBe(true);
  });

  it("should reject unsafe ReDoS patterns", () => {
    const result = matchesRegex("aaaaab", { source: "(a+)+b", flags: "" });
    expect(result).toBe(false);
  });

  it("should match partial strings (not anchored by default)", () => {
    expect(
      matchesRegex("early-VIP-access", { source: "vip", flags: "i" }),
    ).toBe(true);
    expect(matchesRegex("partners-premium-tier", { source: "premium" })).toBe(
      true,
    );
  });

  it("should handle regex errors gracefully", () => {
    // Invalid regex (unclosed group) - should be caught by schema validation but handle gracefully
    const result = matchesRegex("test", { source: "(unclosed", flags: "" });
    expect(result).toBe(false);
  });

  it("should return false when the RegExp constructor rejects duplicate flags", () => {
    const result = matchesRegex("test", { source: "test", flags: "ii" });
    expect(result).toBe(false);
  });
});

describe("matchesTrustedNativeRegex", () => {
  const createKnownReDoSPatternSource = (): string =>
    "(a{quantifier}){quantifier}b".replaceAll("{quantifier}", "+");

  it("should match when native RegExp matches value", () => {
    const result = matchesTrustedNativeRegex("premium-user", /premium/);
    expect(result).toBe(true);
  });

  it("should not match when native RegExp does not match value", () => {
    const result = matchesTrustedNativeRegex("standard-user", /premium/);
    expect(result).toBe(false);
  });

  it("should respect flags", () => {
    expect(matchesTrustedNativeRegex("PREMIUM", /premium/i)).toBe(true);
    expect(matchesTrustedNativeRegex("PREMIUM", /premium/)).toBe(false);
  });

  it("should allow patterns rejected as serialized when trusted as native RegExp", () => {
    const unsafeSource = createKnownReDoSPatternSource();
    const serializedResult = matchesRegex("aaaaab", {
      source: unsafeSource,
      flags: "",
    });
    // eslint-disable-next-line security/detect-non-literal-regexp -- Builds a native RegExp to verify trusted-code bypass without a static unsafe literal.
    const trustedPattern = new RegExp(unsafeSource); // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const trustedResult = matchesTrustedNativeRegex("aaaaab", trustedPattern);

    expect(serializedResult).toBe(false);
    expect(trustedResult).toBe(true);
  });

  it("should not mutate stateful native RegExp inputs", () => {
    const pattern = /premium/g;
    const firstResult = matchesTrustedNativeRegex("premium premium", pattern);
    const secondResult = matchesTrustedNativeRegex("premium premium", pattern);

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(true);
    expect(pattern.lastIndex).toBe(0);
  });
});
