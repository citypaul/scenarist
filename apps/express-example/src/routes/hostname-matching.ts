import type { Request, Response, Router } from "express";

type FetchConfig = {
  readonly url: string;
  readonly headers?: HeadersInit;
};

const proxyFetch = async (config: FetchConfig): Promise<unknown> => {
  const response = await fetch(config.url, { headers: config.headers });
  return { status: response.status, data: await response.json() };
};

type ProxyResponse = {
  readonly status: number;
  readonly data: unknown;
};

const hasProperty = <K extends string>(
  obj: object,
  key: K,
): obj is object & Record<K, unknown> => {
  return key in obj;
};

const isProxyResponse = (value: unknown): value is ProxyResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    hasProperty(value, "status") &&
    typeof value.status === "number" &&
    hasProperty(value, "data")
  );
};

const handleProxyRequest = async (
  buildConfig: (req: Request) => FetchConfig,
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const config = buildConfig(req);
    const result = await proxyFetch(config);
    if (!isProxyResponse(result)) {
      return res.status(500).json({ error: "Invalid proxy response" });
    }
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const setupHostnameMatchingRoutes = (router: Router): void => {
  // Test 1: Pathname-only pattern - origin-agnostic
  // Pattern: '/api/origin-agnostic'
  // Should match ANY hostname
  router.get(
    "/api/test-hostname-match/pathname-only",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        () => ({
          url: "http://localhost:3000/api/origin-agnostic",
        }),
        req,
        res,
      );
    },
  );

  // Test 2: Full URL pattern with GitHub - hostname-specific
  // Pattern: 'https://api.github.com/api/github-only'
  // Should ONLY match api.github.com
  router.get(
    "/api/test-hostname-match/github-full",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        () => ({
          url: "https://api.github.com/api/github-only",
        }),
        req,
        res,
      );
    },
  );

  // Test 3: Full URL pattern with Stripe - hostname-specific
  // Pattern: 'https://api.stripe.com/api/stripe-only'
  // Should ONLY match api.stripe.com
  router.get(
    "/api/test-hostname-match/stripe-full",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        () => ({
          url: "https://api.stripe.com/api/stripe-only",
        }),
        req,
        res,
      );
    },
  );

  // Test 4: Native RegExp pattern - origin-agnostic
  // Pattern: /\/api\/regex-pattern$/
  // Should match the pathname at ANY hostname
  router.get(
    "/api/test-hostname-match/regexp",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        () => ({
          url: "http://localhost:3000/api/regex-pattern",
        }),
        req,
        res,
      );
    },
  );

  // Test 5: Pathname with path parameters - origin-agnostic + param extraction
  // Pattern: '/api/users/:userId/posts/:postId'
  // Should extract params AND match ANY hostname
  // Security: Encode path parameters to prevent path traversal
  // @see https://github.com/citypaul/scenarist/security/code-scanning/76
  router.get(
    "/api/test-hostname-match/pathname-params/:userId/:postId",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `http://localhost:3000/api/users/${encodeURIComponent(req.params.userId ?? "")}/posts/${encodeURIComponent(req.params.postId ?? "")}`,
        }),
        req,
        res,
      );
    },
  );

  // Test 6: Full URL with path parameters - hostname-specific + param extraction
  // Pattern: 'https://api.github.com/api/github-users/:userId'
  // Should extract params but ONLY match api.github.com
  // Security: Encode path parameters to prevent path traversal
  router.get(
    "/api/test-hostname-match/full-params/:userId",
    async (req: Request, res: Response) => {
      return handleProxyRequest(
        (req) => ({
          url: `https://api.github.com/api/github-users/${encodeURIComponent(req.params.userId ?? "")}`,
        }),
        req,
        res,
      );
    },
  );
};
