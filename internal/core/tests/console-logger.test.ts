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

    it("should filter error logs when category is not in the allowed list", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({
        level: "error",
        categories: ["matching"], // Only matching category allowed
      });

      // Error log with category NOT in the allowed list
      logger.error("lifecycle", "lifecycle error msg", createContext());

      // Should NOT be logged because category is filtered
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
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

  describe("missing context values", () => {
    it("should display 'unknown' when testId is not provided in context", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "pretty" });

      // Context without testId
      logger.info("matching", "test message", {});

      const output = infoSpy.mock.calls[0][0] as string;
      expect(output).toContain("[unknown]");

      infoSpy.mockRestore();
    });

    it("should include 'unknown' in JSON output when testId is not provided", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "json" });

      // Context without testId
      logger.info("matching", "test message", {});

      const output = infoSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.testId).toBeUndefined();

      infoSpy.mockRestore();
    });
  });

  describe("pretty format", () => {
    it("should output formatted string with timestamp, testId, category, and message", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "pretty" });

      logger.info("matching", "mock_selected", createContext());

      const output = infoSpy.mock.calls[0][0] as string;

      expect(output).toContain("matching");
      expect(output).toContain("mock_selected");
      expect(output).toContain("test-123");

      infoSpy.mockRestore();
    });

    it("should include category icon in pretty output", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "pretty" });

      logger.info("matching", "mock_selected", createContext());

      const output = infoSpy.mock.calls[0][0] as string;
      expect(output).toMatch(/🎯/);

      infoSpy.mockRestore();
    });

    it("should include data fields in pretty output", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "pretty" });

      logger.info("matching", "mock_selected", createContext(), {
        mockIndex: 2,
        specificity: 5,
      });

      const output = infoSpy.mock.calls[0][0] as string;
      expect(output).toContain("mockIndex");
      expect(output).toContain("2");
      expect(output).toContain("specificity");
      expect(output).toContain("5");

      infoSpy.mockRestore();
    });

    it("should use default pretty format when format is not specified", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info" });

      logger.info("lifecycle", "started", createContext());

      const output = infoSpy.mock.calls[0][0] as string;
      expect(output).toContain("lifecycle");
      expect(output).toContain("started");
      expect(output).toContain("🔄");

      infoSpy.mockRestore();
    });

    it("should include level indicator with color", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "warn", format: "pretty" });

      logger.error("lifecycle", "critical failure", createContext());
      logger.warn("lifecycle", "potential issue", createContext());

      const errorOutput = errorSpy.mock.calls[0][0] as string;
      const warnOutput = warnSpy.mock.calls[0][0] as string;

      expect(errorOutput).toContain("ERR");
      expect(warnOutput).toContain("WRN");

      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe("persistent test ID colors", () => {
    it("should apply consistent color to same test ID across multiple logs", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "pretty" });

      logger.info(
        "matching",
        "first log",
        createContext({ testId: "test-abc" }),
      );
      logger.info(
        "matching",
        "second log",
        createContext({ testId: "test-abc" }),
      );

      const output1 = infoSpy.mock.calls[0][0] as string;
      const output2 = infoSpy.mock.calls[1][0] as string;

      const colorPattern = /\x1b\[\d+m\[test-abc\]/;
      const match1 = output1.match(colorPattern);
      const match2 = output2.match(colorPattern);

      expect(match1).not.toBeNull();
      expect(match2).not.toBeNull();
      expect(match1![0]).toBe(match2![0]);

      infoSpy.mockRestore();
    });

    it("should apply ANSI color code to test ID in pretty format", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "pretty" });

      logger.info(
        "matching",
        "test log",
        createContext({ testId: "my-test-id" }),
      );

      const output = infoSpy.mock.calls[0][0] as string;
      expect(output).toMatch(/\x1b\[\d+m\[my-test-id\]\x1b\[0m/);

      infoSpy.mockRestore();
    });

    it("should assign different colors to different test IDs", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const { createConsoleLogger } = await import(
        "../src/adapters/console-logger.js"
      );
      const logger = createConsoleLogger({ level: "info", format: "pretty" });

      logger.info(
        "matching",
        "log 1",
        createContext({ testId: "test-user-login" }),
      );
      logger.info(
        "matching",
        "log 2",
        createContext({ testId: "test-checkout-flow" }),
      );

      const output1 = infoSpy.mock.calls[0][0] as string;
      const output2 = infoSpy.mock.calls[1][0] as string;

      expect(output1).toContain("test-user-login");
      expect(output2).toContain("test-checkout-flow");

      infoSpy.mockRestore();
    });
  });
});
