/**
 * Features API Route (ADR-0019 State-Aware Mocking)
 *
 * Sets feature flags via external API.
 * MSW intercepts and captures feature state via captureState.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

const FEATURES_API_URL = "https://api.features.com";

type FeaturesResponse = {
  readonly success: boolean;
  readonly message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeaturesResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { flag, enabled } = req.body;

  if (!flag || enabled === undefined) {
    return res.status(400).json({ error: "flag and enabled are required" });
  }

  try {
    const response = await fetch(`${FEATURES_API_URL}/features`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(req),
      },
      body: JSON.stringify({ flag, enabled }),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to set feature flag",
    });
  }
}
