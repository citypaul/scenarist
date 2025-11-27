import type { Request, Response, Router } from 'express';

type FetchConfig = {
  readonly url: string;
  readonly headers?: HeadersInit;
};

const buildHeaders = (headerMap: Record<string, string | undefined>): HeadersInit => {
  return Object.entries(headerMap).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
};

const proxyFetch = async (config: FetchConfig): Promise<unknown> => {
  const response = await fetch(config.url, { headers: config.headers });
  return { status: response.status, data: await response.json() };
};

const handleProxyRequest = async (
  buildConfig: (req: Request) => FetchConfig,
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const config = buildConfig(req);
    const { status, data } = await proxyFetch(config) as { status: number; data: unknown };
    return res.status(status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Security: Encode path parameters to prevent path traversal
// @see https://github.com/citypaul/scenarist/security/code-scanning/77
export const setupStringMatchingRoutes = (router: Router): void => {
  router.get('/api/test-string-match/contains/:username', async (req: Request, res: Response) => {
    return handleProxyRequest(
      (req) => ({
        url: `https://api.github.com/users/${encodeURIComponent(req.params.username ?? '')}`,
        headers: buildHeaders({ 'x-campaign': req.query.campaign as string }),
      }),
      req,
      res
    );
  });

  // NOTE: This endpoint intentionally uses a query parameter for API key to demonstrate
  // Scenarist's header-based content matching capabilities. In production, use headers
  // for sensitive data. This is a test endpoint, not a security pattern.
  // @see https://github.com/citypaul/scenarist/security/code-scanning/74
  router.get('/api/test-string-match/starts-with', async (req: Request, res: Response) => {
    return handleProxyRequest(
      () => ({
        url: 'https://api.stripe.com/v1/api-keys',
        headers: buildHeaders({ 'x-api-key': req.query.apiKey as string }),
      }),
      req,
      res
    );
  });

  router.get('/api/test-string-match/ends-with/:username', async (req: Request, res: Response) => {
    const email = req.query.email as string | undefined;
    const queryString = email ? `?email=${encodeURIComponent(email)}` : '';

    return handleProxyRequest(
      (req) => ({
        url: `https://api.github.com/users/${encodeURIComponent(req.params.username ?? '')}/repos${queryString}`,
      }),
      req,
      res
    );
  });

  // NOTE: This endpoint intentionally uses a query parameter to demonstrate
  // Scenarist's exact match capabilities. This is a test endpoint only.
  router.get('/api/test-string-match/equals', async (req: Request, res: Response) => {
    return handleProxyRequest(
      () => ({
        url: 'https://api.status.com/status',
        headers: buildHeaders({ 'x-exact': req.query.exact as string }),
      }),
      req,
      res
    );
  });
};
