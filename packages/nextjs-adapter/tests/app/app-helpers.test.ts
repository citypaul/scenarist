/**
 * Tests for App Router helper functions.
 *
 * These helpers provide safe, convenient access to Scenarist headers and test IDs
 * without requiring manual undefined checks or exposing infrastructure constants.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getScenaristHeaders,
  getScenaristHeadersFromReadonlyHeaders,
  getScenaristTestId,
  getScenaristTestIdFromReadonlyHeaders,
} from "../../src/app/helpers.js";

/**
 * Mock ReadonlyHeaders interface (subset of Next.js headers())
 */
type MockReadonlyHeaders = {
  get(name: string): string | null;
};

const createMockReadonlyHeaders = (
  headers: Record<string, string>,
): MockReadonlyHeaders => {
  return {
    get(name: string): string | null {
      return headers[name] ?? null;
    },
  };
};

const createMockRequest = (headers: Record<string, string>): Request => {
  return new Request("http://localhost:3000", {
    headers: new Headers(headers),
  });
};

describe("App Router Helpers", () => {
  beforeEach(() => {
    // Clear global scenarist instance before each test
    delete (global as { __scenarist_instance?: unknown }).__scenarist_instance;
  });

  afterEach(() => {
    // Clean up after each test
    delete (global as { __scenarist_instance?: unknown }).__scenarist_instance;
  });

  describe("getScenaristHeaders", () => {
    it("should return empty object when scenarist is undefined", () => {
      const request = createMockRequest({ "x-scenarist-test-id": "test-123" });
      const result = getScenaristHeaders(request);

      expect(result).toEqual({});
    });

    it("should extract test ID from request when scenarist instance exists", () => {
      // Mock scenarist instance with config (what implementation actually uses)
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {
        config: { defaultTestId: "custom-default" },
      };

      const request = createMockRequest({ "x-scenarist-test-id": "test-456" });
      const result = getScenaristHeaders(request);

      expect(result).toEqual({ "x-scenarist-test-id": "test-456" });
    });

    it("should use configured default when header not present", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {
        config: { defaultTestId: "custom-default" },
      };

      const request = createMockRequest({});
      const result = getScenaristHeaders(request);

      expect(result).toEqual({ "x-scenarist-test-id": "custom-default" });
    });

    it("should use fallback default when config has no defaultTestId", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {
        config: {},
      };

      const request = createMockRequest({});
      const result = getScenaristHeaders(request);

      expect(result).toEqual({ "x-scenarist-test-id": "default-test" });
    });
  });

  describe("getScenaristHeadersFromReadonlyHeaders", () => {
    it("should return empty object when scenarist is undefined", () => {
      const headers = createMockReadonlyHeaders({
        "x-scenarist-test-id": "test-123",
      });
      const result = getScenaristHeadersFromReadonlyHeaders(headers);

      expect(result).toEqual({});
    });

    it("should extract test ID from headers when scenarist instance exists", () => {
      // Mock scenarist instance with config (what implementation actually uses)
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {
        config: { defaultTestId: "custom-default" },
      };

      const headers = createMockReadonlyHeaders({
        "x-scenarist-test-id": "test-789",
      });
      const result = getScenaristHeadersFromReadonlyHeaders(headers);

      expect(result).toEqual({ "x-scenarist-test-id": "test-789" });
    });

    it("should use configured default when header not present", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {
        config: { defaultTestId: "custom-default" },
      };

      const headers = createMockReadonlyHeaders({});
      const result = getScenaristHeadersFromReadonlyHeaders(headers);

      expect(result).toEqual({ "x-scenarist-test-id": "custom-default" });
    });

    it("should use fallback default when config has no defaultTestId", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {
        config: {},
      };

      const headers = createMockReadonlyHeaders({});
      const result = getScenaristHeadersFromReadonlyHeaders(headers);

      expect(result).toEqual({ "x-scenarist-test-id": "default-test" });
    });
  });

  describe("getScenaristTestId", () => {
    it("should return default test ID when scenarist is undefined", () => {
      const request = createMockRequest({ "x-scenarist-test-id": "test-123" });
      const result = getScenaristTestId(request);

      expect(result).toBe("default-test");
    });

    it("should extract test ID from request headers when scenarist is defined", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const request = createMockRequest({ "x-scenarist-test-id": "test-456" });
      const result = getScenaristTestId(request);

      expect(result).toBe("test-456");
    });

    it("should return default test ID when header not present", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const request = createMockRequest({});
      const result = getScenaristTestId(request);

      expect(result).toBe("default-test");
    });

    it("should work with custom test IDs from Playwright", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const request = createMockRequest({
        "x-scenarist-test-id": "1763861814494-19tf2b0jwr7",
      });
      const result = getScenaristTestId(request);

      expect(result).toBe("1763861814494-19tf2b0jwr7");
    });
  });

  describe("getScenaristTestIdFromReadonlyHeaders", () => {
    it("should return default test ID when scenarist is undefined", () => {
      const headers = createMockReadonlyHeaders({
        "x-scenarist-test-id": "test-123",
      });
      const result = getScenaristTestIdFromReadonlyHeaders(headers);

      expect(result).toBe("default-test");
    });

    it("should extract test ID from ReadonlyHeaders when scenarist is defined", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const headers = createMockReadonlyHeaders({
        "x-scenarist-test-id": "test-789",
      });
      const result = getScenaristTestIdFromReadonlyHeaders(headers);

      expect(result).toBe("test-789");
    });

    it("should return default test ID when header not present", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const headers = createMockReadonlyHeaders({});
      const result = getScenaristTestIdFromReadonlyHeaders(headers);

      expect(result).toBe("default-test");
    });

    it("should work with custom test IDs from Playwright", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const headers = createMockReadonlyHeaders({
        "x-scenarist-test-id": "1763861814494-19tf2b0jwr7",
      });
      const result = getScenaristTestIdFromReadonlyHeaders(headers);

      expect(result).toBe("1763861814494-19tf2b0jwr7");
    });

    it("should support repository pattern use case", () => {
      // Simulate Server Component usage with repository pattern
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const headers = createMockReadonlyHeaders({
        "x-scenarist-test-id": "repo-test-1",
      });
      const testId = getScenaristTestIdFromReadonlyHeaders(headers);

      // User would use this testId for repository isolation
      expect(testId).toBe("repo-test-1");
      expect(typeof testId).toBe("string");
    });

    it("should handle missing test ID header gracefully", () => {
      (global as { __scenarist_instance?: unknown }).__scenarist_instance = {};

      const headers = createMockReadonlyHeaders({
        "some-other-header": "value",
      });
      const result = getScenaristTestIdFromReadonlyHeaders(headers);

      expect(result).toBe("default-test");
    });
  });

  describe("Production safety", () => {
    it("all helpers should be safe to call in production (scenarist undefined)", () => {
      const request = createMockRequest({ "x-scenarist-test-id": "test-123" });
      const headers = createMockReadonlyHeaders({
        "x-scenarist-test-id": "test-123",
      });

      // Should not throw when scenarist is undefined
      expect(() => getScenaristHeaders(request)).not.toThrow();
      expect(() =>
        getScenaristHeadersFromReadonlyHeaders(headers),
      ).not.toThrow();
      expect(() => getScenaristTestId(request)).not.toThrow();
      expect(() =>
        getScenaristTestIdFromReadonlyHeaders(headers),
      ).not.toThrow();

      // Should return safe defaults
      expect(getScenaristHeaders(request)).toEqual({});
      expect(getScenaristHeadersFromReadonlyHeaders(headers)).toEqual({});
      expect(getScenaristTestId(request)).toBe("default-test");
      expect(getScenaristTestIdFromReadonlyHeaders(headers)).toBe(
        "default-test",
      );
    });
  });
});
