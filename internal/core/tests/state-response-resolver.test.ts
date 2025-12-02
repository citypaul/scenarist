import { describe, it, expect } from "vitest";
import { createStateResponseResolver } from "../src/domain/state-response-resolver.js";
import type { StatefulMockResponse } from "../src/schemas/state-aware-mocking.js";

describe("StateResponseResolver", () => {
  /**
   * Core behavior: Resolve the correct response from a stateResponse
   * configuration based on current test state.
   */
  describe("response resolution", () => {
    it("should return default response when no conditions match", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { state: "initial" } },
        conditions: [
          {
            when: { checked: true },
            then: { status: 200, body: { state: "reviewed" } },
          },
        ],
      };
      const currentState = { checked: false };

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({ status: 200, body: { state: "initial" } });
    });

    it("should return matching condition response when state matches", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { state: "initial" } },
        conditions: [
          {
            when: { checked: true },
            then: { status: 200, body: { state: "reviewed" } },
          },
        ],
      };
      const currentState = { checked: true };

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({ status: 200, body: { state: "reviewed" } });
    });

    it("should return default response when conditions array is empty", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { state: "initial" } },
        conditions: [],
      };
      const currentState = { anything: true };

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({ status: 200, body: { state: "initial" } });
    });

    it("should return default response when state is empty", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { state: "initial" } },
        conditions: [
          {
            when: { checked: true },
            then: { status: 200, body: { state: "reviewed" } },
          },
        ],
      };
      const currentState = {};

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({ status: 200, body: { state: "initial" } });
    });
  });

  /**
   * Specificity-based selection: Most specific matching condition wins.
   */
  describe("specificity-based selection", () => {
    it("should select more specific condition over less specific", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { state: "initial" } },
        conditions: [
          {
            when: { checked: true },
            then: { status: 200, body: { state: "reviewed" } },
          },
          {
            when: { checked: true, approved: true },
            then: { status: 200, body: { state: "approved" } },
          },
        ],
      };
      const currentState = { checked: true, approved: true };

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({ status: 200, body: { state: "approved" } });
    });

    it("should return less specific match when more specific does not apply", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { state: "initial" } },
        conditions: [
          {
            when: { checked: true },
            then: { status: 200, body: { state: "reviewed" } },
          },
          {
            when: { checked: true, approved: true },
            then: { status: 200, body: { state: "approved" } },
          },
        ],
      };
      const currentState = { checked: true };

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({ status: 200, body: { state: "reviewed" } });
    });
  });

  /**
   * Response with all fields (status, body, headers, delay)
   */
  describe("full response support", () => {
    it("should preserve all response fields from matching condition", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { state: "initial" } },
        conditions: [
          {
            when: { error: true },
            then: {
              status: 500,
              body: { error: "server error" },
              headers: { "x-error-code": "ERR001" },
              delay: 100,
            },
          },
        ],
      };
      const currentState = { error: true };

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({
        status: 500,
        body: { error: "server error" },
        headers: { "x-error-code": "ERR001" },
        delay: 100,
      });
    });

    it("should preserve all response fields from default", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: {
          status: 200,
          body: { state: "initial" },
          headers: { "content-type": "application/json" },
          delay: 50,
        },
        conditions: [],
      };
      const currentState = {};

      const result = resolver.resolveResponse(stateResponse, currentState);

      expect(result).toEqual({
        status: 200,
        body: { state: "initial" },
        headers: { "content-type": "application/json" },
        delay: 50,
      });
    });
  });

  /**
   * Complex state values
   */
  describe("complex state matching", () => {
    it("should match based on string state values", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { step: "unknown" } },
        conditions: [
          {
            when: { step: "review" },
            then: { status: 200, body: { step: "review" } },
          },
          {
            when: { step: "complete" },
            then: { status: 200, body: { step: "complete" } },
          },
        ],
      };

      expect(
        resolver.resolveResponse(stateResponse, { step: "review" }),
      ).toEqual({ status: 200, body: { step: "review" } });

      expect(
        resolver.resolveResponse(stateResponse, { step: "complete" }),
      ).toEqual({ status: 200, body: { step: "complete" } });

      expect(
        resolver.resolveResponse(stateResponse, { step: "other" }),
      ).toEqual({ status: 200, body: { step: "unknown" } });
    });

    it("should match based on numeric state values", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 200, body: { message: "default" } },
        conditions: [
          {
            when: { count: 0 },
            then: { status: 200, body: { message: "empty" } },
          },
          {
            when: { count: 5 },
            then: { status: 200, body: { message: "five" } },
          },
        ],
      };

      expect(resolver.resolveResponse(stateResponse, { count: 0 })).toEqual({
        status: 200,
        body: { message: "empty" },
      });

      expect(resolver.resolveResponse(stateResponse, { count: 5 })).toEqual({
        status: 200,
        body: { message: "five" },
      });
    });

    it("should match based on object state values", () => {
      const resolver = createStateResponseResolver();
      const stateResponse: StatefulMockResponse = {
        default: { status: 401, body: { error: "unauthorized" } },
        conditions: [
          {
            when: { user: { role: "admin" } },
            then: { status: 200, body: { admin: true } },
          },
        ],
      };

      expect(
        resolver.resolveResponse(stateResponse, { user: { role: "admin" } }),
      ).toEqual({ status: 200, body: { admin: true } });

      expect(
        resolver.resolveResponse(stateResponse, { user: { role: "user" } }),
      ).toEqual({ status: 401, body: { error: "unauthorized" } });
    });
  });
});
