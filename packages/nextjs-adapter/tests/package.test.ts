import { describe, it, expect } from "vitest";
import type { NextApiRequest } from "next";
import { buildConfig } from "@scenarist/core";
import {
  SCENARIST_TEST_ID_HEADER,
  noOpLogger,
  createNoOpLogger,
  createConsoleLogger,
  AppRequestContext,
  PagesRequestContext,
  type ScenaristScenario,
  type ScenaristMock,
  type ScenaristResponse,
  type ScenaristSequence,
  type ScenaristMatch,
  type ScenaristCaptureConfig,
  type ScenaristScenarios,
  type ScenaristConfig,
  type ScenaristResult,
  type Logger,
  type LogLevel,
  type LogCategory,
  type LogContext,
  type ConsoleLoggerConfig,
  type LogFormat,
  type AppAdapterOptions,
  type AppScenarist,
  type PagesAdapterOptions,
  type PagesScenarist,
} from "../src/index.js";

const createTestSetup = () => {
  const mockScenario: ScenaristScenario = {
    id: "default",
    name: "Default Scenario",
    description: "Scenario for root export tests",
    mocks: [
      {
        method: "GET",
        url: "/api/test",
        match: {
          headers: { "x-custom": "true" },
        },
        response: {
          status: 200,
          body: { success: true },
        },
      },
    ],
  };

  const scenarios: ScenaristScenarios = {
    default: mockScenario,
  };

  const config: ScenaristConfig = buildConfig({
    enabled: true,
    scenarios,
  });

  return {
    mockScenario,
    scenarios,
    config,
  };
};

describe("Next.js Adapter Root Package", () => {
  it("should export SCENARIST_TEST_ID_HEADER constant", () => {
    expect(SCENARIST_TEST_ID_HEADER).toBe("x-scenarist-test-id");
  });

  it("should export logger utilities", () => {
    expect(noOpLogger).toBeDefined();
    expect(typeof noOpLogger.debug).toBe("function");
    expect(typeof noOpLogger.info).toBe("function");
    expect(typeof noOpLogger.warn).toBe("function");
    expect(typeof noOpLogger.error).toBe("function");

    const customNoOp = createNoOpLogger();
    expect(customNoOp).toBeDefined();
    expect(typeof customNoOp.info).toBe("function");

    const consoleLogger = createConsoleLogger({ level: "info" });
    expect(consoleLogger).toBeDefined();
    expect(typeof consoleLogger.info).toBe("function");
  });

  it("should support defining scenarios with root exported types", () => {
    const { mockScenario, scenarios } = createTestSetup();

    expect(mockScenario.id).toBe("default");
    expect(scenarios["default"]).toBeDefined();

    const mock: ScenaristMock = mockScenario.mocks[0] as ScenaristMock;
    expect(mock.method).toBe("GET");

    const match: ScenaristMatch | undefined = mock.match;
    expect(match?.headers).toEqual({ "x-custom": "true" });

    const response: ScenaristResponse | undefined = mock.response;
    expect(response?.status).toBe(200);

    const sequence: ScenaristSequence = {
      responses: [{ status: 200 }, { status: 500 }],
      repeat: "last",
    };
    expect(sequence.repeat).toBe("last");

    const captureConfig: ScenaristCaptureConfig = {
      "cartItems[]": "body.item",
    };
    expect(captureConfig["cartItems[]"]).toBe("body.item");

    const successResult: ScenaristResult<string, Error> = {
      success: true,
      data: "ok",
    };
    expect(successResult.success).toBe(true);
  });

  it("should export AppRequestContext and extract test ID", () => {
    const { config } = createTestSetup();
    const req = new Request("http://localhost:3000/api/test", {
      headers: { [SCENARIST_TEST_ID_HEADER]: "app-test-id" },
    });
    const context = new AppRequestContext(req, config);

    expect(context.getTestId()).toBe("app-test-id");
  });

  it("should export PagesRequestContext and extract test ID", () => {
    const { config } = createTestSetup();
    const req = {
      headers: {
        [SCENARIST_TEST_ID_HEADER]: "pages-test-id",
        host: "localhost:3000",
      },
    } as unknown as NextApiRequest;
    const context = new PagesRequestContext(req, config);

    expect(context.getTestId()).toBe("pages-test-id");
  });

  it("should support router options and scenarist type contracts", () => {
    type AssertAppTypes = {
      readonly options?: AppAdapterOptions;
      readonly scenarist?: AppScenarist;
      readonly logger?: Logger;
      readonly level?: LogLevel;
      readonly category?: LogCategory;
      readonly context?: LogContext;
      readonly config?: ConsoleLoggerConfig;
      readonly format?: LogFormat;
    };
    type AssertPagesTypes = {
      readonly options?: PagesAdapterOptions;
      readonly scenarist?: PagesScenarist;
    };

    const appContract: AssertAppTypes = {};
    const pagesContract: AssertPagesTypes = {};

    expect(appContract).toBeDefined();
    expect(pagesContract).toBeDefined();
  });
});
