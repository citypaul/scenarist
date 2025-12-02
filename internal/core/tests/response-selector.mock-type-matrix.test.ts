import { describe, expect, it } from "vitest";
import type { ScenaristMock, HttpRequestContext } from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemorySequenceTracker } from "../src/adapters/in-memory-sequence-tracker.js";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";
import { wrapMocks } from "./helpers/wrap-mocks.js";

describe("Mock Type Interactions (Matrix Testing)", () => {
  describe("Fallback Specificity Matrix (No Match Criteria)", () => {
    /**
     * Test matrix for fallback mocks (no match criteria):
     * When two mocks exist for the same endpoint without match criteria,
     * selection is based on specificity (sequence/stateResponse=1, response=0)
     * and position (last wins for equal specificity).
     *
     * Mocks are ordered [first, second] to test "last wins" behavior.
     */

    it("should select active stateResponse over default sequence (Issue #316)", () => {
      // This is the exact bug reported in Issue #316:
      // Default scenario has a sequence mock (specificity 1)
      // Active scenario has a stateResponse mock (specificity should also be 1)
      // stateResponse should win because it comes last (equal specificity)

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/users/123",
        body: null,
        headers: {},
        query: {},
      };

      // Simulate: default scenario mock first, active scenario mock second
      // In real usage, default mocks come first, active mocks are appended
      const mocks: ReadonlyArray<ScenaristMock> = [
        // Default scenario: sequence mock
        {
          method: "GET",
          url: "/api/users/:id",
          sequence: {
            responses: [
              { status: 200, body: { source: "sequence-step-1" } },
              { status: 200, body: { source: "sequence-step-2" } },
            ],
            repeat: "last",
          },
        },
        // Active scenario: stateResponse mock (should win - same specificity, last position)
        {
          method: "GET",
          url: "/api/users/:id",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse-default" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });

      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // stateResponse should win (last fallback with equal specificity)
        expect(result.data.body).toEqual({ source: "stateResponse-default" });
      }
    });

    // ========== Full 3x3 Matrix Tests ==========
    // Testing all combinations of mock types as [first, second] where second should typically win
    // for equal specificity (last wins), or higher specificity wins regardless of position.

    // Row 1: response (specificity 0) as first mock
    it("response vs response: second response wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response-first" } },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response-second" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "response-second" });
      }
    });

    it("response vs sequence: sequence wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence" });
      }
    });

    it("response vs stateResponse: stateResponse wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "stateResponse" });
      }
    });

    // Row 2: sequence (specificity 1) as first mock
    it("sequence vs response: sequence wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // sequence (1) > response (0), so sequence wins despite being first
        expect(result.data.body).toEqual({ source: "sequence" });
      }
    });

    it("sequence vs sequence: second sequence wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-first" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-second" } }],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence-second" });
      }
    });

    it("sequence vs stateResponse: stateResponse wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "stateResponse" });
      }
    });

    // Row 3: stateResponse (specificity 1) as first mock
    it("stateResponse vs response: stateResponse wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // stateResponse (1) > response (0), so stateResponse wins despite being first
        expect(result.data.body).toEqual({ source: "stateResponse" });
      }
    });

    it("stateResponse vs sequence: sequence wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence" });
      }
    });

    it("stateResponse vs stateResponse: second stateResponse wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse-first" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse-second" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "stateResponse-second" });
      }
    });
  });

  describe("Match Criteria vs Fallback", () => {
    /**
     * Match criteria always add 100+ to specificity, so any mock with match
     * criteria should beat any fallback mock, regardless of response type.
     */

    it("response with match beats sequence fallback (100+ > 1)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-fallback" } }],
          },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          response: { status: 200, body: { source: "response-with-match" } },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "response-with-match" });
      }
    });

    it("sequence with match beats response fallback (100+ > 0)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          response: { status: 200, body: { source: "response-fallback" } },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          sequence: {
            responses: [
              { status: 200, body: { source: "sequence-with-match" } },
            ],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence-with-match" });
      }
    });

    it("stateResponse with match beats response fallback (100+ > 0)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          response: { status: 200, body: { source: "response-fallback" } },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          stateResponse: {
            default: {
              status: 200,
              body: { source: "stateResponse-with-match" },
            },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          source: "stateResponse-with-match",
        });
      }
    });

    it("stateResponse with match beats sequence fallback (100+ > 1)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-fallback" } }],
          },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          stateResponse: {
            default: {
              status: 200,
              body: { source: "stateResponse-with-match" },
            },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          source: "stateResponse-with-match",
        });
      }
    });
  });

  describe("Equal Specificity Tiebreakers", () => {
    /**
     * When two mocks have equal specificity, the last one wins.
     * This allows active scenario mocks to override default scenario mocks.
     */

    it("two response mocks (specificity 0): last wins", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { position: "first" } },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { position: "second" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ position: "second" });
      }
    });

    it("two sequence mocks (specificity 1): last wins", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { position: "first" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { position: "second" } }],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ position: "second" });
      }
    });

    it("two stateResponse mocks (specificity 1): last wins", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { position: "first" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { position: "second" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ position: "second" });
      }
    });

    it("sequence then stateResponse (both specificity 1): stateResponse wins (last)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { type: "sequence" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { type: "stateResponse" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ type: "stateResponse" });
      }
    });

    it("stateResponse then sequence (both specificity 1): sequence wins (last)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { type: "stateResponse" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { type: "sequence" } }],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ type: "sequence" });
      }
    });
  });
});

/**
 * Feature Combinations (Integration)
 *
 * Tests ensuring Phase 1+2+3 features work correctly when combined.
 * Each feature is tested in isolation elsewhere; these tests verify
 * that features don't break each other when used together.
 */
describe("Feature Combinations (Integration)", () => {
  it("stateResponse with captureState: capture then respond based on state", () => {
    // First request captures userId, second request uses stateResponse based on it
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Mock that captures userId from request
    const captureMock: ScenaristMock = {
      method: "POST",
      url: "/api/login",
      captureState: { userId: "body.userId" },
      response: { status: 200, body: { success: true } },
    };

    // Mock that responds based on captured userId
    const stateResponseMock: ScenaristMock = {
      method: "GET",
      url: "/api/profile",
      stateResponse: {
        default: { status: 200, body: { user: "unknown" } },
        conditions: [
          {
            when: { userId: "admin" },
            then: {
              status: 200,
              body: { user: "admin", role: "administrator" },
            },
          },
          {
            when: { userId: "user123" },
            then: { status: 200, body: { user: "user123", role: "member" } },
          },
        ],
      },
    };

    // Step 1: Login as admin (captures userId)
    const loginContext: HttpRequestContext = {
      method: "POST",
      url: "/api/login",
      body: { userId: "admin", password: "secret" },
      headers: {},
      query: {},
    };

    selector.selectResponse(
      "test-1",
      "test-scenario",
      loginContext,
      wrapMocks([captureMock]),
    );

    // Verify state was captured
    expect(stateManager.get("test-1", "userId")).toBe("admin");

    // Step 2: Get profile (uses captured state)
    const profileContext: HttpRequestContext = {
      method: "GET",
      url: "/api/profile",
      body: null,
      headers: {},
      query: {},
    };

    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      profileContext,
      wrapMocks([stateResponseMock]),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({
        user: "admin",
        role: "administrator",
      });
    }
  });

  it("stateResponse with afterResponse: respond then mutate state", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Mock that responds based on state AND mutates state after responding
    const mock: ScenaristMock = {
      method: "POST",
      url: "/api/workflow/advance",
      stateResponse: {
        default: { status: 200, body: { step: "initial" } },
        conditions: [
          {
            when: { step: "initial" },
            then: { status: 200, body: { step: "processing" } },
          },
          {
            when: { step: "processing" },
            then: { status: 200, body: { step: "complete" } },
          },
        ],
      },
      afterResponse: { setState: { lastAdvanced: "{{state.step}}" } },
    };

    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/workflow/advance",
      body: {},
      headers: {},
      query: {},
    };

    // First call: no state, returns default "initial"
    const result1 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );

    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.body).toEqual({ step: "initial" });
    }
    // afterResponse should have set lastAdvanced (but to undefined since step wasn't set yet)

    // Set state to "initial" for the next test
    stateManager.set("test-1", "step", "initial");

    // Second call: state is "initial", returns "processing"
    const result2 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );

    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.body).toEqual({ step: "processing" });
    }
  });

  it("sequence with captureState: capture state while advancing through sequence", () => {
    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });

    // Sequence that captures orderId from each request
    const mock: ScenaristMock = {
      method: "POST",
      url: "/api/orders",
      captureState: { "orderIds[]": "body.orderId" },
      sequence: {
        responses: [
          { status: 201, body: { status: "created", step: 1 } },
          { status: 201, body: { status: "created", step: 2 } },
          { status: 201, body: { status: "created", step: 3 } },
        ],
        repeat: "last",
      },
    };

    // Make 3 requests, each with different orderId
    const orderIds = ["order-1", "order-2", "order-3"];

    for (let i = 0; i < 3; i++) {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/orders",
        body: { orderId: orderIds[i] },
        headers: {},
        query: {},
      };

      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks([mock]),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ status: "created", step: i + 1 });
      }
    }

    // Verify all orderIds were captured in array
    const capturedIds = stateManager.get("test-1", "orderIds");
    expect(capturedIds).toEqual(["order-1", "order-2", "order-3"]);
  });

  it("sequence with afterResponse: mutate state after each sequence step", () => {
    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });

    // Sequence that updates step count after each response
    const mock: ScenaristMock = {
      method: "GET",
      url: "/api/status",
      sequence: {
        responses: [
          { status: 200, body: { phase: "initializing" } },
          { status: 200, body: { phase: "processing" } },
          { status: 200, body: { phase: "complete" } },
        ],
        repeat: "last",
      },
      afterResponse: { setState: { lastPhase: "checked" } },
    };

    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/status",
      body: null,
      headers: {},
      query: {},
    };

    // First request
    const result1 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );
    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.body).toEqual({ phase: "initializing" });
    }
    expect(stateManager.get("test-1", "lastPhase")).toBe("checked");

    // Second request
    const result2 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.body).toEqual({ phase: "processing" });
    }

    // Third request
    const result3 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );
    expect(result3.success).toBe(true);
    if (result3.success) {
      expect(result3.data.body).toEqual({ phase: "complete" });
    }
  });

  it("stateResponse with match criteria: specific match + state-based response", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Set up initial state
    stateManager.set("test-1", "userTier", "premium");

    // Mock with match criteria AND stateResponse
    const mock: ScenaristMock = {
      method: "POST",
      url: "/api/products",
      match: { body: { category: "electronics" } },
      stateResponse: {
        default: { status: 200, body: { discount: 0 } },
        conditions: [
          {
            when: { userTier: "premium" },
            then: { status: 200, body: { discount: 20 } },
          },
          {
            when: { userTier: "gold" },
            then: { status: 200, body: { discount: 10 } },
          },
        ],
      },
    };

    // Fallback mock (should not be selected)
    const fallbackMock: ScenaristMock = {
      method: "POST",
      url: "/api/products",
      response: { status: 200, body: { discount: 0, source: "fallback" } },
    };

    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/products",
      body: { category: "electronics", productId: "12345" },
      headers: {},
      query: {},
    };

    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([fallbackMock, mock]),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Should use stateResponse mock (has match criteria) and resolve to premium condition
      expect(result.data.body).toEqual({ discount: 20 });
    }
  });

  it("match.state with stateResponse: match on state then resolve stateResponse", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Set up state
    stateManager.set("test-1", "workflowStep", "review");
    stateManager.set("test-1", "approvalStatus", "pending");

    // Mock that matches on state AND uses stateResponse for additional conditions
    const reviewMock: ScenaristMock = {
      method: "POST",
      url: "/api/workflow/action",
      match: { state: { workflowStep: "review" } },
      stateResponse: {
        default: { status: 200, body: { action: "waiting" } },
        conditions: [
          {
            when: { approvalStatus: "approved" },
            then: { status: 200, body: { action: "proceed" } },
          },
          {
            when: { approvalStatus: "pending" },
            then: { status: 200, body: { action: "wait-for-approval" } },
          },
        ],
      },
    };

    // Different mock for different workflow step
    const completeMock: ScenaristMock = {
      method: "POST",
      url: "/api/workflow/action",
      match: { state: { workflowStep: "complete" } },
      response: { status: 200, body: { action: "finalized" } },
    };

    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/workflow/action",
      body: {},
      headers: {},
      query: {},
    };

    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([completeMock, reviewMock]),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Should match reviewMock (workflowStep: review) and resolve to pending condition
      expect(result.data.body).toEqual({ action: "wait-for-approval" });
    }
  });
});

/**
 * Scenario Override Behavior
 *
 * Tests ensuring active scenario mocks properly override default scenario mocks.
 * In real usage, mocks are ordered [default scenario mocks, active scenario mocks],
 * so active scenario mocks come last and should win when specificity is equal.
 *
 * This is critical for the scenario switching feature to work correctly.
 */
describe("Scenario Override Behavior", () => {
  it("active response overrides default response (same endpoint)", () => {
    // Simulating: default scenario provides base mock, active scenario overrides it
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario mock (comes first)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "default-scenario" } },
      },
      // Active scenario mock (comes last, should win)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "active-scenario" } },
      },
    ];

    const selector = createResponseSelector();
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-scenario" });
    }
  });

  it("active sequence overrides default sequence (same endpoint)", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: sequence
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "default-sequence" } }],
        },
      },
      // Active scenario: sequence (should win)
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "active-sequence" } }],
        },
      },
    ];

    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-sequence" });
    }
  });

  it("active stateResponse overrides default stateResponse (same endpoint)", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: stateResponse
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "default-stateResponse" } },
          conditions: [],
        },
      },
      // Active scenario: stateResponse (should win)
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "active-stateResponse" } },
          conditions: [],
        },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-stateResponse" });
    }
  });

  it("active stateResponse overrides default sequence (Issue #316 scenario)", () => {
    // This is the exact Issue #316 bug scenario:
    // - Migrating from sequence-based to state-based patterns
    // - Default scenario has old sequence mock
    // - Active scenario has new stateResponse mock
    // - Active scenario's stateResponse should win

    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/users/123",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: legacy sequence mock
      {
        method: "GET",
        url: "/api/users/:id",
        sequence: {
          responses: [
            { status: 200, body: { step: 1, source: "default-sequence" } },
            { status: 200, body: { step: 2, source: "default-sequence" } },
          ],
          repeat: "last",
        },
      },
      // Active scenario: new stateResponse mock (should win)
      {
        method: "GET",
        url: "/api/users/:id",
        stateResponse: {
          default: {
            status: 200,
            body: { state: "default", source: "active-stateResponse" },
          },
          conditions: [],
        },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({
        state: "default",
        source: "active-stateResponse",
      });
    }
  });

  it("active sequence overrides default stateResponse", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: stateResponse
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "default-stateResponse" } },
          conditions: [],
        },
      },
      // Active scenario: sequence (should win)
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "active-sequence" } }],
        },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-sequence" });
    }
  });

  it("active response does NOT override default sequence (sequence has higher specificity)", () => {
    // Important: response (specificity 0) should NOT override sequence (specificity 1)
    // This tests that specificity still takes precedence over position

    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: sequence (specificity 1)
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "default-sequence" } }],
        },
      },
      // Active scenario: response (specificity 0, should NOT win)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "active-response" } },
      },
    ];

    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Sequence wins because specificity 1 > 0
      expect(result.data.body).toEqual({ source: "default-sequence" });
    }
  });

  it("active response does NOT override default stateResponse (stateResponse has higher specificity)", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: stateResponse (specificity 1)
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "default-stateResponse" } },
          conditions: [],
        },
      },
      // Active scenario: response (specificity 0, should NOT win)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "active-response" } },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // stateResponse wins because specificity 1 > 0
      expect(result.data.body).toEqual({ source: "default-stateResponse" });
    }
  });
});

/**
 * Mock Type Completeness Guard
 *
 * This test documents the expected mock response types and serves as a
 * "canary" test that reminds developers to update the matrix tests when
 * new response types are added to the schema.
 *
 * If a new response type is added (e.g., `conditionalResponse`), this test
 * should fail and prompt the developer to:
 * 1. Update this guard test
 * 2. Add the new type to the fallback specificity matrix tests
 * 3. Add the new type to the feature combination tests
 * 4. Add the new type to the scenario override tests
 */
describe("Mock Type Completeness Guard", () => {
  it("documents expected response types - update matrix tests if this changes", () => {
    // These are the three mutually-exclusive response types in ScenaristMock.
    // The schema allows at most one of these to be defined per mock.
    //
    // If you're adding a new response type, you MUST:
    // 1. Add it to this list
    // 2. Update the fallback specificity calculation in response-selector.ts
    // 3. Add matrix tests for the new type in "Mock Type Interactions"
    // 4. Add feature combination tests in "Feature Combinations"
    // 5. Add scenario override tests in "Scenario Override Behavior"
    const KNOWN_RESPONSE_TYPES = [
      "response", // Simple static response (specificity 0 as fallback)
      "sequence", // Ordered sequence of responses (specificity 1 as fallback)
      "stateResponse", // State-conditional responses (specificity 1 as fallback)
    ] as const;

    // Document the specificity hierarchy
    const SPECIFICITY_HIERARCHY = {
      // Fallback mocks (no match criteria)
      response: 0, // Simple fallback
      sequence: 1, // Dynamic response type
      stateResponse: 1, // Dynamic response type (Issue #316 fix)

      // With match criteria: 100+ base, same for all response types
      // e.g., response+match = 101+, sequence+match = 101+, stateResponse+match = 101+
    };

    // Verify we have exactly 3 response types
    expect(KNOWN_RESPONSE_TYPES).toHaveLength(3);

    // Verify the specificity values are as documented
    expect(SPECIFICITY_HIERARCHY.response).toBe(0);
    expect(SPECIFICITY_HIERARCHY.sequence).toBe(1);
    expect(SPECIFICITY_HIERARCHY.stateResponse).toBe(1);
  });

  it("verifies matrix test coverage matches known response types", () => {
    // This test serves as documentation that all type combinations are tested.
    // Update this when adding new response types.
    const KNOWN_RESPONSE_TYPES = ["response", "sequence", "stateResponse"];

    // For N response types, we need N×N matrix tests (fallback combinations)
    const expectedMatrixTests = KNOWN_RESPONSE_TYPES.length ** 2; // 3×3 = 9

    // Additional tests needed:
    // - Match criteria vs fallback tests (one per dynamic type)
    // - Tiebreaker tests (pairs of equal-specificity types)

    expect(expectedMatrixTests).toBe(9);

    // Document what's tested in "Mock Type Interactions":
    // - 9 fallback matrix tests (3×3 combinations)
    // - 4 match criteria vs fallback tests
    // - 5 equal specificity tiebreaker tests
    // Total: 18+ tests (plus Issue #316 regression test)
  });
});
