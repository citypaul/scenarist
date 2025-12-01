import { describe, it, expect } from "vitest";
import {
  StateConditionSchema,
  StatefulMockResponseSchema,
  StateAfterResponseSchema,
} from "../../src/schemas/state-aware-mocking.js";
import { ScenaristMatchSchema } from "../../src/schemas/scenario-definition.js";

/**
 * State-Aware Mocking Schema Tests (ADR-0019)
 *
 * These tests document the schema validation rules for state-aware mocking.
 * Per testing guidelines, these are minimal documentation tests - behavior
 * is tested through domain logic tests.
 */

describe("StateConditionSchema", () => {
  it("should accept valid condition with when and then", () => {
    const validCondition = {
      when: { checked: true },
      then: { status: 200, body: { state: "quoteDecline" } },
    };

    const result = StateConditionSchema.safeParse(validCondition);

    expect(result.success).toBe(true);
  });

  it("should accept condition with multiple when keys", () => {
    const multiKeyCondition = {
      when: { step: "reviewed", urgent: true },
      then: { status: 200, body: { status: "urgent" } },
    };

    const result = StateConditionSchema.safeParse(multiKeyCondition);

    expect(result.success).toBe(true);
  });

  it("should reject condition missing when clause", () => {
    const missingWhen = {
      then: { status: 200, body: {} },
    };

    const result = StateConditionSchema.safeParse(missingWhen);

    expect(result.success).toBe(false);
  });

  it("should reject condition missing then clause", () => {
    const missingThen = {
      when: { checked: true },
    };

    const result = StateConditionSchema.safeParse(missingThen);

    expect(result.success).toBe(false);
  });

  it("should reject condition with empty when clause", () => {
    const emptyWhen = {
      when: {},
      then: { status: 200, body: {} },
    };

    const result = StateConditionSchema.safeParse(emptyWhen);

    expect(result.success).toBe(false);
  });
});

describe("StatefulMockResponseSchema", () => {
  it("should accept valid stateResponse with default and conditions", () => {
    const validStateResponse = {
      default: { status: 200, body: { state: "appStarted" } },
      conditions: [
        {
          when: { checked: true },
          then: { status: 200, body: { state: "quoteDecline" } },
        },
      ],
    };

    const result = StatefulMockResponseSchema.safeParse(validStateResponse);

    expect(result.success).toBe(true);
  });

  it("should accept stateResponse with empty conditions array", () => {
    const noConditions = {
      default: { status: 200, body: { state: "default" } },
      conditions: [],
    };

    const result = StatefulMockResponseSchema.safeParse(noConditions);

    expect(result.success).toBe(true);
  });

  it("should accept stateResponse with multiple conditions", () => {
    const multipleConditions = {
      default: { status: 200, body: { status: "pending" } },
      conditions: [
        {
          when: { step: "reviewed" },
          then: { status: 200, body: { status: "reviewed" } },
        },
        {
          when: { step: "approved" },
          then: { status: 200, body: { status: "complete" } },
        },
        {
          when: { step: "rejected" },
          then: { status: 200, body: { status: "declined" } },
        },
      ],
    };

    const result = StatefulMockResponseSchema.safeParse(multipleConditions);

    expect(result.success).toBe(true);
  });

  it("should reject stateResponse missing default", () => {
    const missingDefault = {
      conditions: [
        { when: { checked: true }, then: { status: 200, body: {} } },
      ],
    };

    const result = StatefulMockResponseSchema.safeParse(missingDefault);

    expect(result.success).toBe(false);
  });

  it("should reject stateResponse missing conditions", () => {
    const missingConditions = {
      default: { status: 200, body: {} },
    };

    const result = StatefulMockResponseSchema.safeParse(missingConditions);

    expect(result.success).toBe(false);
  });
});

describe("StateAfterResponseSchema", () => {
  it("should accept valid afterResponse with setState", () => {
    const validAfterResponse = {
      setState: { checked: true },
    };

    const result = StateAfterResponseSchema.safeParse(validAfterResponse);

    expect(result.success).toBe(true);
  });

  it("should accept setState with multiple keys", () => {
    const multipleKeys = {
      setState: { step: "reviewed", urgent: true, count: 5 },
    };

    const result = StateAfterResponseSchema.safeParse(multipleKeys);

    expect(result.success).toBe(true);
  });

  it("should accept setState with nested objects", () => {
    const nestedObject = {
      setState: { user: { profile: { verified: true } } },
    };

    const result = StateAfterResponseSchema.safeParse(nestedObject);

    expect(result.success).toBe(true);
  });

  it("should reject afterResponse missing setState", () => {
    const missingSetState = {};

    const result = StateAfterResponseSchema.safeParse(missingSetState);

    expect(result.success).toBe(false);
  });

  it("should reject afterResponse with empty setState", () => {
    const emptySetState = {
      setState: {},
    };

    const result = StateAfterResponseSchema.safeParse(emptySetState);

    expect(result.success).toBe(false);
  });
});

describe("ScenaristMatchSchema with state", () => {
  it("should accept match with state criteria", () => {
    const matchWithState = {
      state: { step: "initial" },
    };

    const result = ScenaristMatchSchema.safeParse(matchWithState);

    expect(result.success).toBe(true);
  });

  it("should accept match combining state with other criteria", () => {
    const combinedMatch = {
      state: { step: "pending_review" },
      body: { decision: "approve" },
      headers: { "x-user-role": "admin" },
    };

    const result = ScenaristMatchSchema.safeParse(combinedMatch);

    expect(result.success).toBe(true);
  });

  it("should accept match with state containing multiple keys", () => {
    const multiKeyState = {
      state: { step: "reviewed", urgent: true },
    };

    const result = ScenaristMatchSchema.safeParse(multiKeyState);

    expect(result.success).toBe(true);
  });
});
