/**
 * Order Submit API Route (Conditional afterResponse Demo)
 *
 * Submits an order to the external API.
 * MSW intercepts and sets state via afterResponse.setState.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

const ORDERS_API_URL = "https://api.orders.com";

type OrderSubmitResponse = {
  readonly success: boolean;
  readonly message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderSubmitResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${ORDERS_API_URL}/order/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(req),
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to submit order",
    });
  }
}
