import { describe, it, expect } from "vitest";
import { createInMemorySequenceTracker } from "../src/adapters/in-memory-sequence-tracker.js";

describe("InMemorySequenceTracker", () => {
  describe("reset()", () => {
    it("should reset all sequence positions for a test ID", () => {
      const tracker = createInMemorySequenceTracker();

      // Advance sequences for test-1
      tracker.advance("test-1", "scenario-a", 0, 3, "last");
      tracker.advance("test-1", "scenario-a", 1, 3, "last");
      tracker.advance("test-1", "scenario-b", 0, 3, "last");

      // Verify sequences are advanced
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(1);
      expect(tracker.getPosition("test-1", "scenario-a", 1).position).toBe(1);
      expect(tracker.getPosition("test-1", "scenario-b", 0).position).toBe(1);

      // Reset test-1
      tracker.reset("test-1");

      // All sequences for test-1 should be back to initial state
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(0);
      expect(tracker.getPosition("test-1", "scenario-a", 1).position).toBe(0);
      expect(tracker.getPosition("test-1", "scenario-b", 0).position).toBe(0);
      expect(tracker.getPosition("test-1", "scenario-a", 0).exhausted).toBe(
        false,
      );
    });

    it("should NOT reset sequences for other test IDs", () => {
      const tracker = createInMemorySequenceTracker();

      // Advance sequences for both test IDs
      tracker.advance("test-1", "scenario-a", 0, 3, "last");
      tracker.advance("test-2", "scenario-a", 0, 3, "last");

      // Verify both are advanced
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(1);
      expect(tracker.getPosition("test-2", "scenario-a", 0).position).toBe(1);

      // Reset only test-1
      tracker.reset("test-1");

      // test-1 should be reset, test-2 should NOT be affected
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(0);
      expect(tracker.getPosition("test-2", "scenario-a", 0).position).toBe(1);
    });

    it("should reset exhausted sequences", () => {
      const tracker = createInMemorySequenceTracker();

      // Exhaust a sequence (repeat: 'none')
      tracker.advance("test-1", "scenario-a", 0, 3, "none"); // pos 1
      tracker.advance("test-1", "scenario-a", 0, 3, "none"); // pos 2
      tracker.advance("test-1", "scenario-a", 0, 3, "none"); // exhausted

      const beforeReset = tracker.getPosition("test-1", "scenario-a", 0);
      expect(beforeReset.exhausted).toBe(true);
      expect(beforeReset.position).toBe(3);

      // Reset
      tracker.reset("test-1");

      // Should be back to initial state (not exhausted)
      const afterReset = tracker.getPosition("test-1", "scenario-a", 0);
      expect(afterReset.position).toBe(0);
      expect(afterReset.exhausted).toBe(false);
    });

    it("should handle reset when no sequences exist for test ID", () => {
      const tracker = createInMemorySequenceTracker();

      // Reset a test ID that has never been used
      expect(() => tracker.reset("test-never-used")).not.toThrow();

      // Should still return initial state when accessed
      const position = tracker.getPosition("test-never-used", "scenario-a", 0);
      expect(position.position).toBe(0);
      expect(position.exhausted).toBe(false);
    });

    it("should allow sequences to be re-advanced after reset", () => {
      const tracker = createInMemorySequenceTracker();

      // Advance, reset, advance again
      tracker.advance("test-1", "scenario-a", 0, 3, "last");
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(1);

      tracker.reset("test-1");
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(0);

      tracker.advance("test-1", "scenario-a", 0, 3, "last");
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(1);
    });

    it("should reset multiple scenarios for the same test ID", () => {
      const tracker = createInMemorySequenceTracker();

      // Advance multiple scenarios
      tracker.advance("test-1", "scenario-a", 0, 3, "last");
      tracker.advance("test-1", "scenario-b", 0, 3, "last");
      tracker.advance("test-1", "scenario-c", 0, 3, "last");

      tracker.reset("test-1");

      // All scenarios should be reset
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(0);
      expect(tracker.getPosition("test-1", "scenario-b", 0).position).toBe(0);
      expect(tracker.getPosition("test-1", "scenario-c", 0).position).toBe(0);
    });

    it("should reset multiple mocks within the same scenario", () => {
      const tracker = createInMemorySequenceTracker();

      // Advance multiple mocks in same scenario
      tracker.advance("test-1", "scenario-a", 0, 3, "last");
      tracker.advance("test-1", "scenario-a", 1, 3, "last");
      tracker.advance("test-1", "scenario-a", 2, 3, "last");

      tracker.reset("test-1");

      // All mocks should be reset
      expect(tracker.getPosition("test-1", "scenario-a", 0).position).toBe(0);
      expect(tracker.getPosition("test-1", "scenario-a", 1).position).toBe(0);
      expect(tracker.getPosition("test-1", "scenario-a", 2).position).toBe(0);
    });
  });
});
