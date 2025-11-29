import type { NextApiRequest, NextApiResponse } from "next";
import "../../lib/scenarist";

type StrategyConfig = {
  readonly url: string;
  readonly headers?: Record<string, string>;
};

const buildTestIdHeader = (req: NextApiRequest): Record<string, string> => ({
  "x-scenarist-test-id": (req.headers["x-scenarist-test-id"] as string) || "",
});

const buildStrategyConfig = (
  req: NextApiRequest,
): Record<string, StrategyConfig> => {
  const { campaign, apiKey, email, exact } = req.query;

  return {
    contains: {
      url: "http://localhost:3001/products",
      headers: { "x-campaign": (campaign as string) || "" },
    },
    startsWith: {
      url: "http://localhost:3001/api-keys",
      headers: { "x-api-key": (apiKey as string) || "" },
    },
    endsWith: {
      url: `http://localhost:3001/users?email=${email || ""}`,
    },
    equals: {
      url: "http://localhost:3001/status",
      headers: { "x-exact": (exact as string) || "" },
    },
  };
};

const fetchWithTestId = async (
  config: StrategyConfig,
  testIdHeader: Record<string, string>,
): Promise<unknown> => {
  const response = await fetch(config.url, {
    headers: { ...testIdHeader, ...config.headers },
  });
  return response.json();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { strategy } = req.query;
  const strategyConfig = buildStrategyConfig(req);
  const config = strategyConfig[strategy as string];

  if (!config) {
    return res.status(400).json({ error: "No strategy specified" });
  }

  try {
    const testIdHeader = buildTestIdHeader(req);
    const data = await fetchWithTestId(config, testIdHeader);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
