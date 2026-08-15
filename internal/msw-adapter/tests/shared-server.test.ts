import { describe, expect, it } from "vitest";
import {
  createResponseSelector,
  type Logger,
  type ResponseSelector,
  type ScenaristMock,
} from "@scenarist/core";
import { createSharedMswServer } from "../src/index.js";
import {
  createMockLogger,
  mockDefinition,
  mockScenario,
} from "./factories.js";

type SharedServerOptions = {
  readonly strictMode?: boolean;
  readonly mocks?: ReadonlyArray<ScenaristMock>;
  readonly responseSelector?: ResponseSelector;
  readonly logger?: Logger;
};

const createServer = (
  options: SharedServerOptions = {},
): ReturnType<typeof createSharedMswServer> => {
  const scenario = mockScenario({
    id: "default",
    mocks: options.mocks ?? [],
  });

  return createSharedMswServer({
    getTestId: () => "shared-server-test",
    getActiveScenario: () => undefined,
    getScenarioDefinition: (scenarioId) =>
      scenarioId === "default" ? scenario : undefined,
    strictMode: options.strictMode ?? false,
    responseSelector: options.responseSelector ?? createResponseSelector(),
    logger: options.logger,
  });
};

const createOwner = (options: {
  readonly url: string;
  readonly source: string;
}): ReturnType<typeof createSharedMswServer> =>
  createServer({
    mocks: [
      mockDefinition({
        url: options.url,
        response: {
          status: 200,
          body: { source: options.source },
        },
      }),
    ],
  });

describe("createSharedMswServer", () => {
  it("starts and stops idempotently and restarts after the final close", async () => {
    const url = "https://shared-restart.example.test/files/:path+";
    const requestUrl = "https://shared-restart.example.test/files/a/b";
    const server = createOwner({ url, source: "restartable" });

    try {
      server.listen();
      server.listen();

      const initialResponse = await fetch(requestUrl);

      expect(await initialResponse.json()).toEqual({ source: "restartable" });

      server.close();
      server.close();

      await expect(fetch(requestUrl)).rejects.toThrow();

      server.listen();

      const restartedResponse = await fetch(requestUrl);

      expect(await restartedResponse.json()).toEqual({
        source: "restartable",
      });
    } finally {
      server.close();
    }
  });

  it("keeps another registration active and removes the stopped resolver", async () => {
    const firstUrl = "https://first-owner.example.test/data";
    const secondUrl = "https://second-owner.example.test/data";
    const first = createOwner({ url: firstUrl, source: "first" });
    const second = createOwner({ url: secondUrl, source: "second" });

    try {
      first.listen();
      second.listen();

      const firstResponse = await fetch(firstUrl);
      const secondResponse = await fetch(secondUrl);

      expect(await firstResponse.json()).toEqual({ source: "first" });
      expect(await secondResponse.json()).toEqual({ source: "second" });

      first.close();

      const remainingResponse = await fetch(secondUrl);

      expect(await remainingResponse.json()).toEqual({ source: "second" });
      await expect(fetch(firstUrl)).rejects.toThrow();
    } finally {
      second.close();
      first.close();
    }
  });

  it("lets an older owner handle before a newer strict non-owner", async () => {
    const url = "https://older-shared-owner.example.test/data";
    const owner = createOwner({ url, source: "older" });
    const strictNonOwner = createServer({
      strictMode: true,
      mocks: [mockDefinition({ method: "POST", url })],
    });

    try {
      owner.listen();
      strictNonOwner.listen();

      const response = await fetch(url);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ source: "older" });
    } finally {
      strictNonOwner.close();
      owner.close();
    }
  });

  it("short-circuits on a newer owner before an older strict non-owner", async () => {
    const url = "https://newer-shared-owner.example.test/data";
    const strictNonOwner = createServer({ strictMode: true });
    const owner = createOwner({ url, source: "newer" });

    try {
      strictNonOwner.listen();
      owner.listen();

      const response = await fetch(url);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ source: "newer" });
    } finally {
      owner.close();
      strictNonOwner.close();
    }
  });

  it("short-circuits on a handled non-error failure", async () => {
    const url = "https://handled-failure.example.test/data";
    const owner = createOwner({ url, source: "owner" });
    const logger = createMockLogger();
    const responseSelector: ResponseSelector = {
      selectResponse: () => {
        throw "shared resolver failure";
      },
    };
    const failing = createServer({ responseSelector, logger });

    try {
      owner.listen();
      failing.listen();

      const response = await fetch(url);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Internal mock server error",
        code: "HANDLER_ERROR",
      });
      expect(logger.error).toHaveBeenCalledWith(
        "request",
        "Handler error: shared resolver failure",
        expect.objectContaining({ requestUrl: url }),
        expect.objectContaining({ errorName: "Unknown", stack: undefined }),
      );
    } finally {
      failing.close();
      owner.close();
    }
  });

  it("applies a newer strict fallback after every registration misses", async () => {
    const nonStrict = createServer();
    const strict = createServer({ strictMode: true });

    try {
      nonStrict.listen();
      strict.listen();

      const response = await fetch(
        "https://newer-strict-miss.example.test/data",
      );

      expect(response.status).toBe(501);
    } finally {
      strict.close();
      nonStrict.close();
    }
  });

  it("applies an older strict fallback after every registration misses", async () => {
    const strict = createServer({ strictMode: true });
    const nonStrict = createServer();

    try {
      strict.listen();
      nonStrict.listen();

      const response = await fetch(
        "https://older-strict-miss.example.test/data",
      );

      expect(response.status).toBe(501);
    } finally {
      nonStrict.close();
      strict.close();
    }
  });

  it("bypasses after every non-strict registration misses", async () => {
    const first = createServer();
    const second = createServer();
    const url = "https://all-non-strict-miss.example.test/data";

    try {
      first.listen();
      second.listen();

      await expect(fetch(url)).rejects.toThrow();
    } finally {
      second.close();
      first.close();
    }
  });
});
