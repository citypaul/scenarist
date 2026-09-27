import { describe, it, expect } from "vitest";
import {
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  type ScenaristScenarios,
} from "@scenarist/core";
import { createScenaristBase } from "../../src/common/create-scenarist-base.js";

const scenarios = {
  default: {
    id: "default",
    name: "Default Scenario",
    description: "Default test scenario",
    mocks: [],
  },
  premium: {
    id: "premium",
    name: "Premium Scenario",
    description: "Premium test scenario",
    mocks: [],
  },
} as const satisfies ScenaristScenarios;

describe("createScenaristBase", () => {
  it("registers scenarios and switches them with in-memory ports when none are injected", () => {
    const { manager } = createScenaristBase({ enabled: true, scenarios });

    const result = manager.switchScenario("base-test", "premium");

    expect(result.success).toBe(true);
    expect(manager.listScenarios().map((scenario) => scenario.id)).toEqual([
      "default",
      "premium",
    ]);
    expect(manager.getActiveScenario("base-test")?.scenarioId).toBe(
      "premium",
    );
  });

  it("uses the injected registry and store", () => {
    const registry = new InMemoryScenarioRegistry();
    const store = new InMemoryScenarioStore();
    const { manager } = createScenaristBase({
      enabled: true,
      scenarios,
      registry,
      store,
    });

    manager.switchScenario("injected-test", "premium");

    expect(registry.list().map((scenario) => scenario.id)).toEqual([
      "default",
      "premium",
    ]);
    expect(store.get("injected-test")?.scenarioId).toBe("premium");
  });
});
