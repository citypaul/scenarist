/**
 * Loan Status API Route (ADR-0019 State-Aware Mocking)
 *
 * Returns loan application status from external API.
 * MSW intercepts and returns state-dependent responses via stateResponse.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

const LOAN_API_URL = "https://api.loans.com";

type LoanStatusResponse = {
  readonly status: string;
  readonly message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoanStatusResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${LOAN_API_URL}/loan/status`, {
      headers: getScenaristHeaders(req),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get loan status",
    });
  }
}
