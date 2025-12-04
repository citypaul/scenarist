import type { NextApiRequest } from "next";
import {
  SCENARIST_TEST_ID_HEADER,
  type RequestContext,
  type ScenaristConfig,
} from "@scenarist/core";

/**
 * RequestContext implementation for Next.js Pages Router.
 *
 * Adapts NextApiRequest to the RequestContext port interface,
 * enabling test ID extraction and mock control for Pages Router API routes.
 */
export class PagesRequestContext implements RequestContext {
  constructor(
    private readonly req: NextApiRequest,
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
    const host = this.req.headers.host;

    if (!host) {
      return "";
    }

    if (typeof host === "string") {
      return host;
    }

    // After string check, host must be string[] - use Array.isArray for type narrowing
    if (Array.isArray(host) && host.length > 0 && host[0]) {
      return host[0];
    }

    return "";
  }
}
