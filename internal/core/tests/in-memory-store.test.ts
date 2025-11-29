import { describe, it, expect } from "vitest";
import { InMemoryScenarioStore } from "../src/adapters/in-memory-store.js";
import type { ActiveScenario } from "../src/types/index.js";

const createTestActiveScenario = (scenarioId: string): ActiveScenario => ({
  scenarioId,
});

describe("InMemoryScenarioStore", () => {
  describe("set", () => {
    it("should store an active scenario for a test ID", () => {
      const store = new InMemoryScenarioStore();
      const scenario = createTestActiveScenario("test-scenario");

      store.set("test-123", scenario);

      expect(store.has("test-123")).toBe(true);
      expect(store.get("test-123")).toEqual(scenario);
    });

    it("should overwrite existing scenario for same test ID", () => {
      const store = new InMemoryScenarioStore();
      const scenario1 = createTestActiveScenario("scenario-1");
      const scenario2 = createTestActiveScenario("scenario-2");

      store.set("test-123", scenario1);
      store.set("test-123", scenario2);

      const retrieved = store.get("test-123");
      expect(retrieved?.scenarioId).toBe("scenario-2");
    });
  });

  describe("get", () => {
    it("should retrieve stored scenario by test ID", () => {
      const store = new InMemoryScenarioStore();
      const scenario = createTestActiveScenario("test-scenario");
      store.set("test-123", scenario);

      const retrieved = store.get("test-123");

      expect(retrieved).toEqual(scenario);
    });

    it("should return undefined for non-existent test ID", () => {
      const store = new InMemoryScenarioStore();

      const retrieved = store.get("non-existent");

      expect(retrieved).toBeUndefined();
    });
  });

  describe("has", () => {
    it("should return true for stored test ID", () => {
      const store = new InMemoryScenarioStore();
      const scenario = createTestActiveScenario("test");
      store.set("test-123", scenario);

      expect(store.has("test-123")).toBe(true);
    });

    it("should return false for non-existent test ID", () => {
      const store = new InMemoryScenarioStore();

      expect(store.has("non-existent")).toBe(false);
    });
  });

  describe("delete", () => {
    it("should remove scenario for test ID", () => {
      const store = new InMemoryScenarioStore();
      const scenario = createTestActiveScenario("test");
      store.set("test-123", scenario);

      store.delete("test-123");

      expect(store.has("test-123")).toBe(false);
      expect(store.get("test-123")).toBeUndefined();
    });

    it("should not throw when deleting non-existent test ID", () => {
      const store = new InMemoryScenarioStore();

      expect(() => store.delete("non-existent")).not.toThrow();
    });

    it("should not affect other test IDs", () => {
      const store = new InMemoryScenarioStore();
      const scenario1 = createTestActiveScenario("scenario-1");
      const scenario2 = createTestActiveScenario("scenario-2");

      store.set("test-A", scenario1);
      store.set("test-B", scenario2);

      store.delete("test-A");

      expect(store.has("test-A")).toBe(false);
      expect(store.has("test-B")).toBe(true);
    });
  });

  describe("clear", () => {
    it("should remove all scenarios", () => {
      const store = new InMemoryScenarioStore();
      const scenario1 = createTestActiveScenario("scenario-1");
      const scenario2 = createTestActiveScenario("scenario-2");

      store.set("test-A", scenario1);
      store.set("test-B", scenario2);

      store.clear();

      expect(store.has("test-A")).toBe(false);
      expect(store.has("test-B")).toBe(false);
    });

    it("should not throw when clearing empty store", () => {
      const store = new InMemoryScenarioStore();

      expect(() => store.clear()).not.toThrow();
    });
  });

  describe("test isolation", () => {
    it("should isolate scenarios by test ID", () => {
      const store = new InMemoryScenarioStore();
      const scenarioA = createTestActiveScenario("scenario-A");
      const scenarioB = createTestActiveScenario("scenario-B");

      store.set("test-A", scenarioA);
      store.set("test-B", scenarioB);

      expect(store.get("test-A")).toEqual(scenarioA);
      expect(store.get("test-B")).toEqual(scenarioB);
    });
  });
});
