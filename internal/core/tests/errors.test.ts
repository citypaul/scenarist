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
  });
});
