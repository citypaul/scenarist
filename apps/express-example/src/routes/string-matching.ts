import type { Request, Response, Router } from "express";

type FetchConfig = {
  readonly url: string;
  readonly headers?: HeadersInit;
};

const buildHeaders = (
  headerMap: Record<string, string | undefined>,
): HeadersInit => {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(headerMap)) {
    if (value) {
      headers[key] = value;
    }
  }
  return headers;
};

type ProxyResponse = {
  readonly status: number;
  readonly data: unknown;
};

const proxyFetch = async (config: FetchConfig): Promise<ProxyResponse> => {
  const response = await fetch(config.url, { headers: config.headers });
  return { status: response.status, data: await response.json() };
};

const handleProxyRequest = async (
  buildConfig: (req: Request) => FetchConfig,
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const config = buildConfig(req);
    const { status, data } = await proxyFetch(config);
    return res.status(status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const getQueryString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const getBodyString = (
  body: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
};

// Security: Encode path parameters to prevent path traversal
// @see https://github.com/citypaul/scenarist/security/code-scanning/77
export const setupStringMatchingRoutes = (router: Router): void => {
  router.get(
    "/api/test-string-match/contains/:username",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.github.com/users/${encodeURIComponent(req.params.username ?? "")}`,
          headers: buildHeaders({
            "x-campaign": getQueryString(req.query.campaign),
          }),
        }),
        req,
        res,
      );
    },
  );

  // Security fix: Use POST with request body for sensitive data (API key)
  // @see https://github.com/citypaul/scenarist/issues/386
  router.post(
    "/api/test-string-match/starts-with",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        () => ({
          url: "https://api.stripe.com/v1/api-keys",
          headers: buildHeaders({
            "x-api-key": getBodyString(req.body, "apiKey"),
          }),
        }),
        req,
        res,
      );
    },
  );

  router.get(
    "/api/test-string-match/ends-with/:username",
    async (req: Request, res: Response) => {
      const email = getQueryString(req.query.email);
      const queryString = email ? `?email=${encodeURIComponent(email)}` : "";

      return handleProxyRequest(
        (req) => ({
          url: `https://api.github.com/users/${encodeURIComponent(req.params.username ?? "")}/repos${queryString}`,
        }),
        req,
        res,
      );
    },
  );

  // NOTE: This endpoint intentionally uses a query parameter to demonstrate
  // Scenarist's exact match capabilities. This is a test endpoint only.
  router.get(
    "/api/test-string-match/equals",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        () => ({
          url: "https://api.status.com/status",
          headers: buildHeaders({ "x-exact": getQueryString(req.query.exact) }),
        }),
        req,
        res,
      );
    },
  );
};
