import { describe, it, expect, vi } from "vitest";
import type { ScenaristScenario, ScenaristScenarios } from "@scenarist/core";

// Test scenarios
const mockDefaultScenario: ScenaristScenario = {
  id: "default",
  name: "Default Scenario",
  description: "Default test scenario",
  mocks: [],
};

const testScenarios = {
  default: mockDefaultScenario,
  "test-scenario": {
    id: "test-scenario",
    name: "Test Scenario",
    description: "Test",
    mocks: [],
  },
} as const satisfies ScenaristScenarios;

const setNodeEnv = (value: string | undefined): void => {
  if (value === undefined) {
    delete process.env.NODE_ENV;
    return;
  }
  process.env.NODE_ENV = value;
};

const createScenaristUnderNodeEnv = async (nodeEnv: string | undefined) => {
  const originalNodeEnv = process.env.NODE_ENV;
  setNodeEnv(nodeEnv);
  try {
    vi.resetModules();
    const { createScenarist } = await import("../src/setup/setup-scenarist.js");
    return createScenarist({ enabled: true, scenarios: testScenarios });
  } finally {
    setNodeEnv(originalNodeEnv);
  }
};

describe("setup-scenarist.ts - Production Tree-Shaking", () => {
  describe("Non-production mode (development/test)", () => {
    it("should return ExpressScenarist instance when NODE_ENV is development", async () => {
      const result = await createScenaristUnderNodeEnv("development");

      expect(result).toBeDefined();
      expect(result).toHaveProperty("config");
      expect(result).toHaveProperty("middleware");
      expect(result).toHaveProperty("switchScenario");
      expect(result).toHaveProperty("start");
      expect(result).toHaveProperty("stop");
    });

    it("should return instance when NODE_ENV is test", async () => {
      const result = await createScenaristUnderNodeEnv("test");

      expect(result).toBeDefined();
    });

    it("should return instance when NODE_ENV is undefined", async () => {
      const result = await createScenaristUnderNodeEnv(undefined);

      expect(result).toBeDefined();
    });

    it("should maintain type safety with generic parameter", async () => {
      const result = await createScenaristUnderNodeEnv("development");

      // TypeScript will error if result doesn't have correct type
      if (result) {
        // Should be ExpressScenarist<typeof testScenarios>
        const scenarioIds: ("default" | "test-scenario")[] = [
          "default",
          "test-scenario",
        ];
        scenarioIds.forEach((id) => {
          // This verifies type-safe scenario IDs work
          result.switchScenario("test-123", id);
        });
      }

      expect(result).toBeDefined();
    });

    it("should have working config with correct default values", async () => {
      const result = await createScenaristUnderNodeEnv("development");

      expect(result).toBeDefined();
      if (result) {
        expect(result.config.endpoints.setScenario).toBe("/__scenario__");
        expect(result.config.endpoints.getScenario).toBe("/__scenario__");
        expect(result.config.strictMode).toBe(false);
      }
    });
  });

  describe("Production mode (unbundled, no production export condition)", () => {
    it("should return undefined when NODE_ENV is production even if enabled", async () => {
      const result = await createScenaristUnderNodeEnv("production");

      expect(result).toBeUndefined();
    });
  });

  describe("Type checking", () => {
    it("should have correct return type ExpressScenarist | undefined", async () => {
      const result = await createScenaristUnderNodeEnv("development");

      // Must handle both undefined and defined cases
      if (result === undefined) {
        expect(result).toBeUndefined();
      } else {
        expect(result).toHaveProperty("config");
      }
    });
  });
});

/**
 * Tests for the production.ts entry point directly.
 *
 * This tests the behavior of the production conditional export entry point.
 * When bundlers use the `production` export condition, they resolve to
 * production.ts instead of the default entry point.
 *
 * Business behavior: "Production builds return undefined without loading
 * any dependencies, guaranteeing zero bundle impact."
 */
describe("production.ts - Production Entry Point", () => {
  it("should return undefined from createScenarist regardless of options", async () => {
    // Import production.ts directly (simulates production export condition)
    const { createScenarist } = await import("../src/setup/production.js");

    const result = createScenarist({
      enabled: true,
      scenarios: testScenarios,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined from createConsoleLogger regardless of config", async () => {
    // Business behavior: In production, createConsoleLogger returns undefined
    // so logging code is tree-shaken from the bundle
    const { createConsoleLogger } = await import("../src/setup/production.js");

    const result = createConsoleLogger({
      level: "debug",
      format: "pretty",
    });

    expect(result).toBeUndefined();
  });
});
