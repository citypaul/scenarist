import type { Request } from 'express';
import type { RequestContext, ScenaristConfig } from '@scenarist/core';

export class ExpressRequestContext implements RequestContext {
  constructor(
    private readonly req: Request,
    private readonly config: ScenaristConfig
  ) {}

  getTestId(): string {
    const headerName = this.config.headers.testId.toLowerCase();
    const header = this.req.headers[headerName];

    if (typeof header === 'string') {
      return header;
    }

    if (Array.isArray(header) && header.length > 0 && header[0]) {
      return header[0];
    }

    return this.config.defaultTestId;
  }

  getHeaders(): Record<string, string | string[] | undefined> {
    return this.req.headers;
  }

  getHostname(): string {
    return this.req.hostname;
  }
}
