import { describe, it, expect } from "vitest";
import { createNoOpLogger, noOpLogger } from "../src/adapters/noop-logger.js";
import type { LogContext } from "../src/ports/driven/logger.js";

const createTestContext = (overrides?: Partial<LogContext>): LogContext => ({
  testId: "test-123",
  scenarioId: "default",
  requestUrl: "/api/test",
  requestMethod: "GET",
  ...overrides,
});

describe("NoOpLogger", () => {
  describe("isEnabled", () => {
    it("should return false for all log levels", () => {
      const logger = createNoOpLogger();

      expect(logger.isEnabled("error")).toBe(false);
      expect(logger.isEnabled("warn")).toBe(false);
      expect(logger.isEnabled("info")).toBe(false);
      expect(logger.isEnabled("debug")).toBe(false);
      expect(logger.isEnabled("trace")).toBe(false);
    });
  });

  describe("log methods", () => {
    it("should not throw when calling error", () => {
      const logger = createNoOpLogger();
      const context = createTestContext();

      expect(() => {
        logger.error("matching", "test error", context, { key: "value" });
      }).not.toThrow();
    });

    it("should not throw when calling warn", () => {
      const logger = createNoOpLogger();
      const context = createTestContext();

      expect(() => {
        logger.warn("state", "test warning", context);
      }).not.toThrow();
    });

    it("should not throw when calling info", () => {
      const logger = createNoOpLogger();
      const context = createTestContext();

      expect(() => {
        logger.info("scenario", "test info", context, { data: 123 });
      }).not.toThrow();
    });

    it("should not throw when calling debug", () => {
      const logger = createNoOpLogger();
      const context = createTestContext();

      expect(() => {
        logger.debug("sequence", "test debug", context);
      }).not.toThrow();
    });

    it("should not throw when calling trace", () => {
      const logger = createNoOpLogger();
      const context = createTestContext();

      expect(() => {
        logger.trace("request", "test trace", context, { body: "large data" });
      }).not.toThrow();
    });
  });

  describe("singleton", () => {
    it("should export a singleton noOpLogger instance", () => {
      expect(noOpLogger).toBeDefined();
      expect(noOpLogger.isEnabled("info")).toBe(false);
    });

    it("should return the same instance from createNoOpLogger", () => {
      const logger1 = createNoOpLogger();
      const logger2 = createNoOpLogger();

      expect(logger1).toBe(logger2);
      expect(logger1).toBe(noOpLogger);
    });
  });
});
