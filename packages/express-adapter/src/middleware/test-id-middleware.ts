import { AsyncLocalStorage } from "async_hooks";
import type { RequestHandler } from "express";
import type { ScenaristConfig } from "@scenarist/core";
import { ExpressRequestContext } from "../context/express-request-context.js";

export const testIdStorage = new AsyncLocalStorage<string>();

export const createTestIdMiddleware = (
  config: ScenaristConfig,
): RequestHandler => {
  return (req, _res, next): void => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();

    testIdStorage.run(testId, () => {
      next();
    });
  };
};
