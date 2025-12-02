/**
 * Pricing API Route (ADR-0019 State-Aware Mocking)
 *
 * Gets pricing information from external API.
 * MSW intercepts and selects mock via match.state based on feature flags.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

const PRICING_API_URL = "https://api.pricing.com";

type PricingResponse = {
  readonly tier: string;
  readonly price: number;
  readonly discount?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PricingResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${PRICING_API_URL}/pricing`, {
      headers: getScenaristHeaders(req),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get pricing",
    });
  }
}
