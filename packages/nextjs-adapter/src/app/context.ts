import {
  SCENARIST_TEST_ID_HEADER,
  type RequestContext,
  type ScenaristConfig,
} from "@scenarist/core";

/**
 * RequestContext implementation for Next.js App Router.
 *
 * Adapts Web standard Request to the RequestContext port interface,
 * enabling test ID extraction and mock control for App Router API routes.
 *
 * Unlike Pages Router, App Router uses the Web standard Request/Response API
 * with Headers object instead of Node.js-style headers.
 */
export class AppRequestContext implements RequestContext {
  constructor(
    private readonly req: Request,
    private readonly config: ScenaristConfig,
  ) {}

  getTestId(): string {
    const header = this.req.headers.get(SCENARIST_TEST_ID_HEADER);

    if (header) {
      return header;
    }

    return this.config.defaultTestId;
  }

  getHeaders(): Record<string, string | string[] | undefined> {
    const headers: Record<string, string> = {};

    this.req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return headers;
  }

  getHostname(): string {
    try {
      const url = new URL(this.req.url);
      return url.host;
    } catch {
      // Return empty string for malformed URLs (e.g., relative URLs without base)
      // This is expected behavior - hostname extraction is best-effort
      return "";
    }
  }
}
