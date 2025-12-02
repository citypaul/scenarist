/**
 * Loan Review API Route (ADR-0019 State-Aware Mocking)
 *
 * Completes loan review via external API.
 * MSW intercepts and advances workflow state via afterResponse.setState.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

const LOAN_API_URL = "https://api.loans.com";

type LoanReviewResponse = {
  readonly success: boolean;
  readonly message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoanReviewResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${LOAN_API_URL}/loan/review`, {
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete loan review",
    });
  }
}
