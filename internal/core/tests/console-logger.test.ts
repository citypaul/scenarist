import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LogCategory, LogContext } from "../src/ports/driven/logger.js";

describe("ConsoleLogger", () => {
  const createContext = (overrides: Partial<LogContext> = {}): LogContext => ({
    testId: "test-123",
    ...overrides,
  });

  describe("level filtering", () => {
    it("should log error when level is error", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "error" });

      logger.error("lifecycle", "test message", createContext());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should not log warn when level is error", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "error" });

      logger.warn("lifecycle", "test message", createContext());

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log warn when level is warn", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "warn" });

      logger.warn("lifecycle", "test message", createContext());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log error when level is warn (error is less verbose)", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "warn" });

      logger.error("lifecycle", "test message", createContext());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should not log info when level is warn", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "warn" });

      logger.info("lifecycle", "test message", createContext());

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log info, warn, error when level is info", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info" });

      logger.error("lifecycle", "error msg", createContext());
      logger.warn("lifecycle", "warn msg", createContext());
      logger.info("lifecycle", "info msg", createContext());
      logger.debug("lifecycle", "debug msg", createContext());
      logger.trace("lifecycle", "trace msg", createContext());

      expect(errorSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled(); // debug and trace filtered

      errorSpy.mockRestore();
      warnSpy.mockRestore();
      infoSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it("should log all levels when level is trace", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "trace" });

      logger.error("lifecycle", "error msg", createContext());
      logger.warn("lifecycle", "warn msg", createContext());
      logger.info("lifecycle", "info msg", createContext());
      logger.debug("lifecycle", "debug msg", createContext());
      logger.trace("lifecycle", "trace msg", createContext());

      expect(errorSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledTimes(2); // debug + trace both use console.debug

      errorSpy.mockRestore();
      warnSpy.mockRestore();
      infoSpy.mockRestore();
      debugSpy.mockRestore();
    });
  });

  describe("isEnabled", () => {
    it("should return true for levels at or below configured level", async () => {
      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info" });

      expect(logger.isEnabled("error")).toBe(true);
      expect(logger.isEnabled("warn")).toBe(true);
      expect(logger.isEnabled("info")).toBe(true);
      expect(logger.isEnabled("debug")).toBe(false);
      expect(logger.isEnabled("trace")).toBe(false);
    });

    it("should return true for all levels when level is trace", async () => {
      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "trace" });

      expect(logger.isEnabled("error")).toBe(true);
      expect(logger.isEnabled("warn")).toBe(true);
      expect(logger.isEnabled("info")).toBe(true);
      expect(logger.isEnabled("debug")).toBe(true);
      expect(logger.isEnabled("trace")).toBe(true);
    });
  });
});
