import { AsyncLocalStorage } from 'async_hooks';
import type { Request, Response, NextFunction } from 'express';
import type { ScenaristConfig } from '@scenarist/core';
import { ExpressRequestContext } from '../context/express-request-context.js';

export const testIdStorage = new AsyncLocalStorage<string>();

export const createTestIdMiddleware = (config: ScenaristConfig) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();

    testIdStorage.run(testId, () => {
      next();
    });
  };
};
