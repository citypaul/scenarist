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

  describe("category filtering", () => {
    it("should log all categories when no categories are configured", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info" });

      logger.info("lifecycle", "lifecycle msg", createContext());
      logger.info("matching", "matching msg", createContext());
      logger.info("state", "state msg", createContext());

      expect(infoSpy).toHaveBeenCalledTimes(3);
      infoSpy.mockRestore();
    });

    it("should only log configured categories", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({
        level: "info",
        categories: ["matching", "state"],
      });

      logger.info("lifecycle", "lifecycle msg", createContext());
      logger.info("matching", "matching msg", createContext());
      logger.info("state", "state msg", createContext());
      logger.info("sequence", "sequence msg", createContext());

      expect(infoSpy).toHaveBeenCalledTimes(2);
      infoSpy.mockRestore();
    });

    it("should filter by both level and category", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({
        level: "info",
        categories: ["matching"],
      });

      logger.error("matching", "error matching msg", createContext());
      logger.info("matching", "info matching msg", createContext());
      logger.debug("matching", "debug matching msg", createContext());
      logger.info("lifecycle", "info lifecycle msg", createContext());

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
      infoSpy.mockRestore();
    });
  });

  describe("JSON format", () => {
    it("should output valid JSON when format is json", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "json" });

      logger.info("matching", "test message", createContext());

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const output = infoSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe("info");
      expect(parsed.category).toBe("matching");
      expect(parsed.message).toBe("test message");
      expect(parsed.testId).toBe("test-123");
      expect(typeof parsed.timestamp).toBe("number");

      infoSpy.mockRestore();
    });

    it("should include optional data in JSON output", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "json" });

      logger.info("matching", "test message", createContext(), {
        mockIndex: 2,
        specificity: 5,
      });

      const output = infoSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.data).toEqual({ mockIndex: 2, specificity: 5 });

      infoSpy.mockRestore();
    });

    it("should include full context in JSON output", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "json" });

      logger.info(
        "request",
        "request received",
        createContext({
          testId: "test-456",
          scenarioId: "scenario-1",
          requestUrl: "/api/users",
          requestMethod: "GET",
        }),
      );

      const output = infoSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.testId).toBe("test-456");
      expect(parsed.scenarioId).toBe("scenario-1");
      expect(parsed.requestUrl).toBe("/api/users");
      expect(parsed.requestMethod).toBe("GET");

      infoSpy.mockRestore();
    });
  });
});
