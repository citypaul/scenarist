import { describe, it, expect } from "vitest";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";

describe("InMemoryStateManager", () => {
  it("should store and retrieve state per test ID", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "userId", "user-123");

    const result = stateManager.get("test-1", "userId");
    expect(result).toBe("user-123");
  });

  it("should isolate state between different test IDs", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "count", 5);
    stateManager.set("test-2", "count", 10);

    expect(stateManager.get("test-1", "count")).toBe(5);
    expect(stateManager.get("test-2", "count")).toBe(10);
  });

  it("should return undefined for missing keys", () => {
    const stateManager = createInMemoryStateManager();

    const result = stateManager.get("test-1", "nonexistent");

    expect(result).toBeUndefined();
  });

  it("should return all state for a test ID", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "key1", "value1");
    stateManager.set("test-1", "key2", "value2");

    const allState = stateManager.getAll("test-1");

    expect(allState).toEqual({ key1: "value1", key2: "value2" });
  });

  it("should reset all state for a test ID", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "key1", "value1");
    stateManager.set("test-1", "key2", "value2");

    stateManager.reset("test-1");

    expect(stateManager.get("test-1", "key1")).toBeUndefined();
    expect(stateManager.get("test-1", "key2")).toBeUndefined();
  });

  it("should not affect other test IDs when resetting", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "key", "value1");
    stateManager.set("test-2", "key", "value2");

    stateManager.reset("test-1");

    expect(stateManager.get("test-1", "key")).toBeUndefined();
    expect(stateManager.get("test-2", "key")).toBe("value2");
  });

  it("should handle nested paths with dot notation", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "user.profile.name", "Alice");

    const result = stateManager.get("test-1", "user.profile.name");
    expect(result).toBe("Alice");
  });

  it("should handle array append syntax", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "items[]", "item1");
    stateManager.set("test-1", "items[]", "item2");
    stateManager.set("test-1", "items[]", "item3");

    const items = stateManager.get("test-1", "items");
    expect(items).toEqual(["item1", "item2", "item3"]);
  });

  it("should differentiate between array append and overwrite", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "count", 5);
    stateManager.set("test-1", "count", 10);

    expect(stateManager.get("test-1", "count")).toBe(10); // Overwrites

    stateManager.set("test-1", "items[]", "first");
    stateManager.set("test-1", "items[]", "second");

    expect(stateManager.get("test-1", "items")).toEqual(["first", "second"]); // Appends
  });

  it("should return undefined when trying to get nested path through non-object", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "value", "string");

    // Try to get nested path through a string value
    const result = stateManager.get("test-1", "value.nested.field");

    expect(result).toBeUndefined();
  });

  it("should return undefined when trying to get nested path through array", () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set("test-1", "items", ["a", "b", "c"]);

    // Try to get nested path through an array
    const result = stateManager.get("test-1", "items.nested.field");

    expect(result).toBeUndefined();
  });

  it("should overwrite non-array value with new array when using append syntax", () => {
    const stateManager = createInMemoryStateManager();

    // First set a non-array value
    stateManager.set("test-1", "items", "not-an-array");

    // Now use append syntax - should overwrite with new array
    stateManager.set("test-1", "items[]", "first");

    expect(stateManager.get("test-1", "items")).toEqual(["first"]);

    // Subsequent appends should work normally
    stateManager.set("test-1", "items[]", "second");
    expect(stateManager.get("test-1", "items")).toEqual(["first", "second"]);
  });

  it("should return empty object for getAll on non-existent test ID", () => {
    const stateManager = createInMemoryStateManager();

    const result = stateManager.getAll("non-existent-test");

    expect(result).toEqual({});
  });

  it("should overwrite array with object when setting nested path through it", () => {
    const stateManager = createInMemoryStateManager();

    // First set an array value
    stateManager.set("test-1", "data", ["a", "b", "c"]);

    // Now set a nested path - should overwrite array with object
    stateManager.set("test-1", "data.field", "value");

    const result = stateManager.get("test-1", "data.field");
    expect(result).toBe("value");
  });

  it("should overwrite null value with object when setting nested path through it", () => {
    const stateManager = createInMemoryStateManager();

    // First set a null value
    stateManager.set("test-1", "data", null);

    // Now set a nested path - should overwrite null with object
    stateManager.set("test-1", "data.field", "value");

    const result = stateManager.get("test-1", "data.field");
    expect(result).toBe("value");
  });

  it("should preserve existing nested objects when setting deeper paths", () => {
    const stateManager = createInMemoryStateManager();

    // Create a nested structure
    stateManager.set("test-1", "user.profile.name", "Alice");
    stateManager.set("test-1", "user.profile.age", 30);

    // Add another field to the existing nested object
    stateManager.set("test-1", "user.profile.email", "alice@example.com");

    // All fields should exist
    expect(stateManager.get("test-1", "user.profile.name")).toBe("Alice");
    expect(stateManager.get("test-1", "user.profile.age")).toBe(30);
    expect(stateManager.get("test-1", "user.profile.email")).toBe(
      "alice@example.com",
    );
  });

  /**
   * Security Tests - Prototype Pollution Prevention
   *
   * @see https://github.com/citypaul/scenarist/security/code-scanning/72
   * @see https://github.com/citypaul/scenarist/security/code-scanning/73
   *
   * These tests verify that the state manager is not vulnerable to prototype
   * pollution attacks where malicious keys like '__proto__', 'constructor',
   * or 'prototype' could modify Object.prototype and affect all objects.
   */
  describe("Security: Prototype Pollution Prevention", () => {
    it("should ignore __proto__ key when setting state", () => {
      const stateManager = createInMemoryStateManager();

      // Attempt prototype pollution via __proto__
      stateManager.set("test-1", "__proto__.polluted", "malicious");

      // Verify Object.prototype was not polluted
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();

      // Verify the key was silently ignored (no error thrown)
      expect(stateManager.get("test-1", "__proto__")).toBeUndefined();
    });

    it("should ignore constructor key when setting state", () => {
      const stateManager = createInMemoryStateManager();

      // Attempt prototype pollution via constructor
      stateManager.set("test-1", "constructor.prototype.polluted", "malicious");

      // Verify Object.prototype was not polluted
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();

      // Verify the key was silently ignored
      expect(stateManager.get("test-1", "constructor")).toBeUndefined();
    });

    it("should ignore prototype key when setting state", () => {
      const stateManager = createInMemoryStateManager();

      // Attempt prototype pollution via prototype
      stateManager.set("test-1", "prototype.polluted", "malicious");

      // Verify Object.prototype was not polluted
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();

      // Verify the key was silently ignored
      expect(stateManager.get("test-1", "prototype")).toBeUndefined();
    });

    it("should return undefined when getting __proto__ key", () => {
      const stateManager = createInMemoryStateManager();

      // Even if somehow set, getting __proto__ should return undefined
      const result = stateManager.get("test-1", "__proto__");

      expect(result).toBeUndefined();
    });

    it("should return undefined when getting constructor key", () => {
      const stateManager = createInMemoryStateManager();

      const result = stateManager.get("test-1", "constructor");

      expect(result).toBeUndefined();
    });

    it("should return undefined when getting prototype key", () => {
      const stateManager = createInMemoryStateManager();

      const result = stateManager.get("test-1", "prototype");

      expect(result).toBeUndefined();
    });

    it("should ignore dangerous keys in nested paths", () => {
      const stateManager = createInMemoryStateManager();

      // Attempt to set nested path with dangerous key in the middle
      stateManager.set("test-1", "safe.__proto__.nested", "malicious");
      stateManager.set("test-1", "safe.constructor.nested", "malicious");
      stateManager.set("test-1", "safe.prototype.nested", "malicious");

      // Verify Object.prototype was not polluted
      expect(({} as Record<string, unknown>).nested).toBeUndefined();

      // Verify the paths were not created
      expect(stateManager.get("test-1", "safe.__proto__")).toBeUndefined();
      expect(stateManager.get("test-1", "safe.constructor")).toBeUndefined();
      expect(stateManager.get("test-1", "safe.prototype")).toBeUndefined();
    });

    it("should not access inherited properties when getting", () => {
      const stateManager = createInMemoryStateManager();

      // Set up some state first
      stateManager.set("test-1", "key", "value");

      // hasOwnProperty exists on all objects via prototype chain
      const result = stateManager.get("test-1", "hasOwnProperty");

      expect(result).toBeUndefined();
    });
  });

  /**
   * Merge Tests (ADR-0019: State-Aware Mocking)
   *
   * The merge() method supports afterResponse.setState which
   * shallow-merges partial state into the current test state.
   */
  describe("merge", () => {
    it("should merge partial state into empty state", () => {
      const stateManager = createInMemoryStateManager();

      stateManager.merge("test-1", { checked: true });

      expect(stateManager.getAll("test-1")).toEqual({ checked: true });
    });

    it("should merge partial state into existing state", () => {
      const stateManager = createInMemoryStateManager();

      stateManager.set("test-1", "step", "initial");
      stateManager.merge("test-1", { checked: true });

      expect(stateManager.getAll("test-1")).toEqual({
        step: "initial",
        checked: true,
      });
    });

    it("should overwrite existing keys when merging", () => {
      const stateManager = createInMemoryStateManager();

      stateManager.set("test-1", "step", "initial");
      stateManager.merge("test-1", { step: "reviewed" });

      expect(stateManager.get("test-1", "step")).toBe("reviewed");
    });

    it("should preserve keys not in the partial state", () => {
      const stateManager = createInMemoryStateManager();

      stateManager.set("test-1", "a", 1);
      stateManager.set("test-1", "b", 2);
      stateManager.set("test-1", "c", 3);

      stateManager.merge("test-1", { b: 20 });

      expect(stateManager.getAll("test-1")).toEqual({ a: 1, b: 20, c: 3 });
    });

    it("should isolate merge between different test IDs", () => {
      const stateManager = createInMemoryStateManager();

      stateManager.set("test-1", "key", "value1");
      stateManager.set("test-2", "key", "value2");

      stateManager.merge("test-1", { newKey: "new1" });

      expect(stateManager.getAll("test-1")).toEqual({
        key: "value1",
        newKey: "new1",
      });
      expect(stateManager.getAll("test-2")).toEqual({ key: "value2" });
    });

    it("should handle merging multiple keys at once", () => {
      const stateManager = createInMemoryStateManager();

      stateManager.merge("test-1", {
        step: "reviewed",
        checked: true,
        count: 5,
      });

      expect(stateManager.getAll("test-1")).toEqual({
        step: "reviewed",
        checked: true,
        count: 5,
      });
    });

    it("should handle merging complex values", () => {
      const stateManager = createInMemoryStateManager();

      stateManager.merge("test-1", {
        user: { name: "Alice", age: 30 },
        items: ["a", "b", "c"],
      });

      expect(stateManager.get("test-1", "user")).toEqual({
        name: "Alice",
        age: 30,
      });
      expect(stateManager.get("test-1", "items")).toEqual(["a", "b", "c"]);
    });

    it("should ignore dangerous keys in merge", () => {
      const stateManager = createInMemoryStateManager();

      // Create object with dangerous keys as regular enumerable properties
      // (Object literal { __proto__: ... } has special semantics)
      const maliciousPartial: Record<string, unknown> = { safe: "value" };
      Object.defineProperty(maliciousPartial, "constructor", {
        value: { polluted: true },
        enumerable: true,
      });
      Object.defineProperty(maliciousPartial, "prototype", {
        value: { polluted: true },
        enumerable: true,
      });

      stateManager.merge("test-1", maliciousPartial);

      // Should not set dangerous keys
      expect(stateManager.get("test-1", "constructor")).toBeUndefined();
      expect(stateManager.get("test-1", "prototype")).toBeUndefined();
      // Should set safe key
      expect(stateManager.get("test-1", "safe")).toBe("value");
    });
  });
});
