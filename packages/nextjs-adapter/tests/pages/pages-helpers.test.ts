/**
 * Tests for Pages Router helper functions.
 *
 * These helpers provide safe, convenient access to Scenarist headers and test IDs
 * without requiring manual undefined checks or exposing infrastructure constants.
 *
 * NOTE: This function works with Node.js IncomingMessage headers (string | string[] | undefined)
 * unlike the App Router which uses the Web standard Request object.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getScenaristHeaders } from "../../src/pages/helpers.js";
import type { IncomingMessage } from "http";

/**
 * Type for request objects that have headers.
 * Compatible with both NextApiRequest and GetServerSidePropsContext.req
 */
type RequestWithHeaders = {
  headers: IncomingMessage["headers"];
};

const createMockRequest = (
  headers: Record<string, string | string[] | undefined>,
): RequestWithHeaders => {
  return { headers };
};

describe("Pages Router Helpers", () => {
  beforeEach(() => {
    // Clear global scenarist instance before each test
    delete (global as { __scenarist_instance_pages?: unknown })
      .__scenarist_instance_pages;
  });

  afterEach(() => {
    // Clean up after each test
    delete (global as { __scenarist_instance_pages?: unknown })
      .__scenarist_instance_pages;
  });

  describe("getScenaristHeaders", () => {
    it("should return empty object when scenarist is undefined", () => {
      const request = createMockRequest({
        "x-scenarist-test-id": "test-123",
      });
      const result = getScenaristHeaders(request);

      expect(result).toEqual({});
    });

    it("should extract test ID from request when scenarist instance exists", () => {
      // Mock scenarist instance with config (what implementation actually uses)
      (
        global as { __scenarist_instance_pages?: unknown }
      ).__scenarist_instance_pages = {
        config: { defaultTestId: "custom-default" },
      };

      const request = createMockRequest({
        "x-scenarist-test-id": "test-456",
      });
      const result = getScenaristHeaders(request);

      expect(result).toEqual({ "x-scenarist-test-id": "test-456" });
    });

    it("should use configured default when header not present", () => {
      (
        global as { __scenarist_instance_pages?: unknown }
      ).__scenarist_instance_pages = {
        config: { defaultTestId: "custom-default" },
      };

      const request = createMockRequest({});
      const result = getScenaristHeaders(request);

      expect(result).toEqual({ "x-scenarist-test-id": "custom-default" });
    });

    it("should use fallback default when config has no defaultTestId", () => {
      (
        global as { __scenarist_instance_pages?: unknown }
      ).__scenarist_instance_pages = {
        config: {},
      };

      const request = createMockRequest({});
      const result = getScenaristHeaders(request);

      expect(result).toEqual({ "x-scenarist-test-id": "default-test" });
    });

    it("should handle array header values by taking the first element", () => {
      (
        global as { __scenarist_instance_pages?: unknown }
      ).__scenarist_instance_pages = {
        config: { defaultTestId: "custom-default" },
      };

      // Node.js IncomingMessage can have array values for repeated headers
      const request = createMockRequest({
        "x-scenarist-test-id": ["test-first", "test-second"],
      });
      const result = getScenaristHeaders(request);

      expect(result).toEqual({ "x-scenarist-test-id": "test-first" });
    });

    it("should work with custom test IDs from Playwright", () => {
      (
        global as { __scenarist_instance_pages?: unknown }
      ).__scenarist_instance_pages = {
        config: { defaultTestId: "default-test" },
      };

      const request = createMockRequest({
        "x-scenarist-test-id": "1763861814494-19tf2b0jwr7",
      });
      const result = getScenaristHeaders(request);

      expect(result).toEqual({
        "x-scenarist-test-id": "1763861814494-19tf2b0jwr7",
      });
    });
  });

  describe("Production safety", () => {
    it("should be safe to call in production when scenarist is undefined", () => {
      const request = createMockRequest({
        "x-scenarist-test-id": "test-123",
      });

      // Should not throw when scenarist is undefined
      expect(() => getScenaristHeaders(request)).not.toThrow();

      // Should return safe default (empty object)
      expect(getScenaristHeaders(request)).toEqual({});
    });
  });
});
