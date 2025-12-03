/**
 * Demo test to showcase ConsoleLogger output formats.
 * Run with: pnpm --filter=@scenarist/core test -- --run logger-demo
 */
import { describe, it } from "vitest";
import { createConsoleLogger } from "../src/adapters/console-logger.js";
import type { LogContext } from "../src/ports/driven/logger.js";

const createContext = (
  testId: string,
  extra: Partial<LogContext> = {},
): LogContext => ({
  testId,
  ...extra,
});

describe("Logger Demo (visual output)", () => {
  it("shows pretty format with all features", () => {
    console.log("\n\n=== PRETTY FORMAT (default) ===\n");

    const logger = createConsoleLogger({ level: "trace", format: "pretty" });

    // Simulate a typical request flow
    logger.info(
      "lifecycle",
      "scenarist_started",
      createContext("test-user-login"),
      { scenarioCount: 3 },
    );
    logger.info(
      "scenario",
      "scenario_switched",
      createContext("test-user-login"),
      { scenarioId: "happy-path" },
    );
    logger.debug(
      "matching",
      "mock_candidates_found",
      createContext("test-user-login"),
      { candidateCount: 5, url: "/api/users", method: "GET" },
    );
    logger.debug(
      "matching",
      "mock_match_evaluated",
      createContext("test-user-login"),
      { mockIndex: 0, matched: false, specificity: 2 },
    );
    logger.debug(
      "matching",
      "mock_match_evaluated",
      createContext("test-user-login"),
      { mockIndex: 1, matched: true, specificity: 5 },
    );
    logger.info("matching", "mock_selected", createContext("test-user-login"), {
      mockIndex: 1,
      specificity: 5,
    });
    logger.debug(
      "sequence",
      "sequence_position_get",
      createContext("test-user-login"),
      { position: 0, total: 3, exhausted: false },
    );
    logger.info("state", "state_captured", createContext("test-user-login"), {
      key: "userId",
      pathExpression: "$.id",
      value: "user-123",
    });
    logger.debug(
      "template",
      "template_replaced",
      createContext("test-user-login"),
      { template: "{{userId}}", result: "user-123" },
    );
    logger.info(
      "request",
      "response_sent",
      createContext("test-user-login", {
        requestUrl: "/api/users",
        requestMethod: "GET",
      }),
      { status: 200 },
    );
  });

  it("shows concurrent test IDs with different persistent colors", () => {
    console.log(
      "\n\n=== CONCURRENT TESTS (persistent colors per test ID) ===\n",
    );

    const logger = createConsoleLogger({ level: "info", format: "pretty" });

    // Each test ID gets a unique color that persists
    logger.info(
      "matching",
      "mock_selected",
      createContext("test-checkout-flow"),
      { mockIndex: 2 },
    );
    logger.info(
      "matching",
      "mock_selected",
      createContext("test-payment-process"),
      { mockIndex: 0 },
    );
    logger.info("matching", "mock_selected", createContext("test-user-login"), {
      mockIndex: 1,
    });
    logger.info(
      "matching",
      "mock_selected",
      createContext("test-inventory-check"),
      { mockIndex: 3 },
    );

    // Same test IDs maintain their colors
    logger.info(
      "state",
      "state_captured",
      createContext("test-checkout-flow"),
      { key: "cartId" },
    );
    logger.info("state", "state_captured", createContext("test-user-login"), {
      key: "userId",
    });
  });

  it("shows warnings and errors with distinct styling", () => {
    console.log("\n\n=== WARNINGS AND ERRORS ===\n");

    const logger = createConsoleLogger({ level: "warn", format: "pretty" });

    logger.warn("matching", "mock_no_match", createContext("test-user-login"), {
      url: "/api/unknown",
      method: "POST",
      candidateCount: 0,
    });
    logger.error(
      "scenario",
      "scenario_not_found",
      createContext("test-user-login"),
      { requestedScenarioId: "invalid-scenario" },
    );
  });

  it("shows JSON format for log aggregation", () => {
    console.log("\n\n=== JSON FORMAT (for log aggregation tools) ===\n");

    const logger = createConsoleLogger({ level: "info", format: "json" });

    logger.info(
      "lifecycle",
      "scenarist_started",
      createContext("test-user-login"),
      { scenarioCount: 3 },
    );
    logger.info(
      "matching",
      "mock_selected",
      createContext("test-user-login", {
        requestUrl: "/api/users",
        requestMethod: "GET",
      }),
      { mockIndex: 1, specificity: 5 },
    );
    logger.warn("matching", "mock_no_match", createContext("test-user-login"), {
      url: "/api/unknown",
      method: "POST",
    });
  });

  it("shows level filtering (info level hides debug/trace)", () => {
    console.log(
      "\n\n=== LEVEL FILTERING (info level - debug/trace hidden) ===\n",
    );

    const logger = createConsoleLogger({ level: "info", format: "pretty" });

    console.log(
      "Calling: trace, debug, info, warn (only info and warn should appear)",
    );
    logger.trace("request", "request_body", createContext("test-user-login"), {
      body: '{"name": "test"}',
    });
    logger.debug(
      "matching",
      "mock_match_evaluated",
      createContext("test-user-login"),
      { mockIndex: 0 },
    );
    logger.info("matching", "mock_selected", createContext("test-user-login"), {
      mockIndex: 1,
    });
    logger.warn("matching", "mock_no_match", createContext("test-user-login"), {
      url: "/api/unknown",
    });
  });

  it("shows category filtering (only matching category)", () => {
    console.log(
      "\n\n=== CATEGORY FILTERING (only 'matching' and 'state') ===\n",
    );

    const logger = createConsoleLogger({
      level: "debug",
      format: "pretty",
      categories: ["matching", "state"],
    });

    console.log(
      "Calling: lifecycle, matching, state, request (only matching and state should appear)",
    );
    logger.info(
      "lifecycle",
      "scenarist_started",
      createContext("test-user-login"),
    );
    logger.debug(
      "matching",
      "mock_match_evaluated",
      createContext("test-user-login"),
      { mockIndex: 0 },
    );
    logger.info("matching", "mock_selected", createContext("test-user-login"), {
      mockIndex: 1,
    });
    logger.info("state", "state_captured", createContext("test-user-login"), {
      key: "userId",
    });
    logger.info("request", "response_sent", createContext("test-user-login"), {
      status: 200,
    });
  });
});
