import { describe, it, expect } from "vitest";
import { ExpressRequestContext } from "../src/context/express-request-context.js";
import { mockConfig, mockRequest } from "./test-helpers.js";

describe("ExpressRequestContext", () => {
  describe("getTestId", () => {
    it("should read test ID from header when present", () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { "x-scenarist-test-id": "test-123" },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe("test-123");
    });

    it("should use default test ID when header is missing", () => {
      const config = mockConfig({ defaultTestId: "default-test" });
      const req = mockRequest({
        headers: {},
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe("default-test");
    });

    it("should handle array headers by using first value", () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { "x-scenarist-test-id": ["test-first", "test-second"] },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe("test-first");
    });

    it("should be case-insensitive for header names", () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { "X-Scenarist-Test-ID": "test-456" },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe("test-456");
    });
  });

  describe("getHeaders", () => {
    it("should return all request headers", () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: {
          "x-scenarist-test-id": "test-123",
          "content-type": "application/json",
        },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getHeaders()).toEqual({
        "x-scenarist-test-id": "test-123",
        "content-type": "application/json",
      });
    });
  });

  describe("getHostname", () => {
    it("should return request hostname", () => {
      const config = mockConfig();
      const req = mockRequest({
        hostname: "example.com",
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getHostname()).toBe("example.com");
    });
  });
});
