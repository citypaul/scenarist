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

const getQueryString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
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

export const setupUrlMatchingRoutes = (router: Router): void => {
  // Test 1: Native RegExp - Numeric ID filtering
  // URL pattern: /users/123 should match regex /\/users\/\d+$/
  router.get(
    "/api/test-url-match/numeric-id/:userId",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.github.com/users/${req.params.userId}`,
        }),
        req,
        res,
      );
    },
  );

  // Test 2: Contains strategy - URLs containing '/api/'
  router.get(
    "/api/test-url-match/contains-api/:city",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.weather.com/v1/weather/${req.params.city}`,
        }),
        req,
        res,
      );
    },
  );

  // Test 3: StartsWith strategy - API versioning (v2)
  router.get(
    "/api/test-url-match/version/:version/:city",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.weather.com/${req.params.version}/weather/${req.params.city}`,
        }),
        req,
        res,
      );
    },
  );

  // Test 4: EndsWith strategy - File extension filtering (.json)
  router.get(
    "/api/test-url-match/file-extension/:filename",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.github.com/repos/owner/repo/contents/${req.params.filename}`,
        }),
        req,
        res,
      );
    },
  );

  // Test 5: Combined matching - URL pattern + header
  router.get(
    "/api/test-url-match/combined",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: "https://api.stripe.com/v1/charges",
          headers: buildHeaders({
            "x-api-version": getQueryString(req.query.apiVersion),
          }),
        }),
        req,
        res,
      );
    },
  );

  // Test 6: Exact URL match
  router.get(
    "/api/test-url-match/exact/:username",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.github.com/users/${req.params.username}`,
        }),
        req,
        res,
      );
    },
  );

  // Test 7: Simple path parameter :id
  router.get(
    "/api/test-url-match/path-param/:userId",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.github.com/users/${req.params.userId}`,
        }),
        req,
        res,
      );
    },
  );

  // Test 8: Multiple path parameters :userId/:postId
  router.get(
    "/api/test-url-match/multiple-params/:userId/:postId",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.blog.com/users/${req.params.userId}/posts/${req.params.postId}`,
        }),
        req,
        res,
      );
    },
  );

  // NOTE: Advanced path parameter features (optional, repeating, custom regex)
  // are not included in Express tests due to path-to-regexp v8 syntax differences
  // Core functionality (simple and multiple parameters) is tested above
};
