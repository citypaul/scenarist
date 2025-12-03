import { describe, it, expect } from "vitest";
import { ScenaristError } from "../src/types/errors.js";

describe("ScenaristError", () => {
  describe("error code and context", () => {
    it("should include error code in ScenaristError", () => {
      const error = new ScenaristError("Test error", {
        code: "TEST_ERROR",
        context: {},
      });

      expect(error.code).toBe("TEST_ERROR");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("ScenaristError");
    });

    it("should include testId in error context when provided", () => {
      const error = new ScenaristError("Test error", {
        code: "TEST_ERROR",
        context: {
          testId: "test-abc-123",
        },
      });

      expect(error.context.testId).toBe("test-abc-123");
    });

    it("should include scenarioId in error context when provided", () => {
      const error = new ScenaristError("Test error", {
        code: "TEST_ERROR",
        context: {
          scenarioId: "premiumUser",
        },
      });

      expect(error.context.scenarioId).toBe("premiumUser");
    });

    it("should include request info in error context when provided", () => {
      const error = new ScenaristError("Test error", {
        code: "TEST_ERROR",
        context: {
          requestInfo: {
            method: "POST",
            url: "https://api.example.com/users",
            headers: { "content-type": "application/json" },
          },
        },
      });

      expect(error.context.requestInfo).toEqual({
        method: "POST",
        url: "https://api.example.com/users",
        headers: { "content-type": "application/json" },
      });
    });

    it("should include hint in error context when provided", () => {
      const error = new ScenaristError("Test error", {
        code: "TEST_ERROR",
        context: {
          hint: "Did you forget to call switchScenario()?",
        },
      });

      expect(error.context.hint).toBe(
        "Did you forget to call switchScenario()?",
      );
    });

    it("should preserve cause when provided", () => {
      const originalError = new Error("Original error");
      const error = new ScenaristError("Wrapped error", {
        code: "WRAPPED_ERROR",
        context: {},
        cause: originalError,
      });

      expect(error.cause).toBe(originalError);
    });
  });
});
