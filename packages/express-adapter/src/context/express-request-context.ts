import type { Request } from "express";
import {
  SCENARIST_TEST_ID_HEADER,
  type RequestContext,
  type ScenaristConfig,
} from "@scenarist/core";

export class ExpressRequestContext implements RequestContext {
  constructor(
    private readonly req: Request,
    private readonly config: ScenaristConfig,
  ) {}

  getTestId(): string {
    const header = this.req.headers[SCENARIST_TEST_ID_HEADER];

    if (typeof header === "string") {
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
