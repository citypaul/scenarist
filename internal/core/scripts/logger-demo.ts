/**
 * Demo script to showcase ConsoleLogger output formats.
 * Run with: npx tsx scripts/logger-demo.ts
 */
import { createConsoleLogger } from "../src/adapters/console-logger.js";
import type { LogContext } from "../src/ports/driven/logger.js";

const createContext = (
  testId: string,
  extra: Partial<LogContext> = {},
): LogContext => ({
  testId,
  ...extra,
});

console.log("\n=== PRETTY FORMAT (default) ===\n");

const prettyLogger = createConsoleLogger({ level: "trace", format: "pretty" });

// Simulate a typical request flow
prettyLogger.info(
  "lifecycle",
  "scenarist_started",
  createContext("test-user-login"),
  { scenarioCount: 3 },
);
prettyLogger.info(
  "scenario",
  "scenario_switched",
  createContext("test-user-login"),
  { scenarioId: "happy-path" },
);
prettyLogger.debug(
  "matching",
  "mock_candidates_found",
  createContext("test-user-login"),
  { candidateCount: 5, url: "/api/users", method: "GET" },
);
prettyLogger.debug(
  "matching",
  "mock_match_evaluated",
  createContext("test-user-login"),
  { mockIndex: 0, matched: false, specificity: 2 },
);
prettyLogger.debug(
  "matching",
  "mock_match_evaluated",
  createContext("test-user-login"),
  { mockIndex: 1, matched: true, specificity: 5 },
);
prettyLogger.info(
  "matching",
  "mock_selected",
  createContext("test-user-login"),
  { mockIndex: 1, specificity: 5 },
);
prettyLogger.debug(
  "sequence",
  "sequence_position_get",
  createContext("test-user-login"),
  { position: 0, total: 3, exhausted: false },
);
prettyLogger.info("state", "state_captured", createContext("test-user-login"), {
  key: "userId",
  pathExpression: "$.id",
  value: "user-123",
});
prettyLogger.debug(
  "template",
  "template_replaced",
  createContext("test-user-login"),
  { template: "{{userId}}", result: "user-123" },
);
prettyLogger.info(
  "request",
  "response_sent",
  createContext("test-user-login", {
    requestUrl: "/api/users",
    requestMethod: "GET",
  }),
  { status: 200 },
);

// Show concurrent test IDs with different colors
console.log("\n--- Concurrent Tests (different colors) ---\n");
prettyLogger.info(
  "matching",
  "mock_selected",
  createContext("test-checkout-flow"),
  { mockIndex: 2 },
);
prettyLogger.info(
  "matching",
  "mock_selected",
  createContext("test-payment-process"),
  { mockIndex: 0 },
);
prettyLogger.info(
  "matching",
  "mock_selected",
  createContext("test-user-login"),
  { mockIndex: 1 },
);
prettyLogger.info(
  "matching",
  "mock_selected",
  createContext("test-inventory-check"),
  { mockIndex: 3 },
);

// Show warning and error
console.log("\n--- Warnings and Errors ---\n");
prettyLogger.warn(
  "matching",
  "mock_no_match",
  createContext("test-user-login"),
  { url: "/api/unknown", method: "POST", candidateCount: 0 },
);
prettyLogger.error(
  "scenario",
  "scenario_not_found",
  createContext("test-user-login"),
  { requestedScenarioId: "invalid-scenario" },
);

console.log("\n=== JSON FORMAT ===\n");

const jsonLogger = createConsoleLogger({ level: "info", format: "json" });

jsonLogger.info(
  "lifecycle",
  "scenarist_started",
  createContext("test-user-login"),
  { scenarioCount: 3 },
);
jsonLogger.info(
  "matching",
  "mock_selected",
  createContext("test-user-login", {
    requestUrl: "/api/users",
    requestMethod: "GET",
  }),
  { mockIndex: 1, specificity: 5 },
);
jsonLogger.warn("matching", "mock_no_match", createContext("test-user-login"), {
  url: "/api/unknown",
  method: "POST",
});

console.log("\n=== LEVEL FILTERING (info level - no debug/trace) ===\n");

const infoLogger = createConsoleLogger({ level: "info", format: "pretty" });

infoLogger.trace("request", "request_body", createContext("test-user-login"), {
  body: '{"name": "test"}',
}); // Won't show
infoLogger.debug(
  "matching",
  "mock_match_evaluated",
  createContext("test-user-login"),
  { mockIndex: 0 },
); // Won't show
infoLogger.info("matching", "mock_selected", createContext("test-user-login"), {
  mockIndex: 1,
}); // Will show
infoLogger.warn("matching", "mock_no_match", createContext("test-user-login"), {
  url: "/api/unknown",
}); // Will show

console.log("\n=== CATEGORY FILTERING (only 'matching' category) ===\n");

const matchingOnlyLogger = createConsoleLogger({
  level: "debug",
  format: "pretty",
  categories: ["matching"],
});

matchingOnlyLogger.info(
  "lifecycle",
  "scenarist_started",
  createContext("test-user-login"),
); // Won't show
matchingOnlyLogger.debug(
  "matching",
  "mock_match_evaluated",
  createContext("test-user-login"),
  { mockIndex: 0 },
); // Will show
matchingOnlyLogger.info(
  "matching",
  "mock_selected",
  createContext("test-user-login"),
  { mockIndex: 1 },
); // Will show
matchingOnlyLogger.info(
  "state",
  "state_captured",
  createContext("test-user-login"),
  { key: "userId" },
); // Won't show

console.log("\n=== Demo Complete ===\n");
