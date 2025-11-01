import type { NextApiRequest } from 'next';
import type { RequestContext, ScenaristConfig } from '@scenarist/core';

/**
 * RequestContext implementation for Next.js Pages Router.
 *
 * Adapts NextApiRequest to the RequestContext port interface,
 * enabling test ID extraction and mock control for Pages Router API routes.
 */
export class PagesRequestContext implements RequestContext {
  constructor(
    private readonly req: NextApiRequest,
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

  isMockEnabled(): boolean {
    const headerName = this.config.headers.mockEnabled.toLowerCase();
    const header = this.req.headers[headerName];

    const DEFAULT_MOCK_ENABLED = true;

    if (!header) {
      return DEFAULT_MOCK_ENABLED;
    }

    return header === 'true';
  }

  getHeaders(): Record<string, string | string[] | undefined> {
    return this.req.headers;
  }

  getHostname(): string {
    const host = this.req.headers.host;

    if (typeof host === 'string') {
      return host;
    }

    if (Array.isArray(host) && host.length > 0 && host[0]) {
      return host[0];
    }

    return '';
  }
}
