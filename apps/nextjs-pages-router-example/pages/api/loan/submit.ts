/**
 * Loan Submit API Route (ADR-0019 State-Aware Mocking)
 *
 * Submits loan application to external API.
 * MSW intercepts and advances workflow state via afterResponse.setState.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

const LOAN_API_URL = "https://api.loans.com";

type LoanSubmitResponse = {
  readonly success: boolean;
  readonly message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoanSubmitResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  try {
    const response = await fetch(`${LOAN_API_URL}/loan/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(req),
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit loan application",
    });
  }
}
