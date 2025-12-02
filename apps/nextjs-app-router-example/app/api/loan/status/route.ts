/**
 * Loan Status API Route (ADR-0019 State-Aware Mocking)
 *
 * Returns loan application status from external API.
 * MSW intercepts and returns state-dependent responses via stateResponse.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const LOAN_API_URL = "https://api.loans.com";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${LOAN_API_URL}/loan/status`, {
      headers: {
        ...getScenaristHeaders(request),
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get loan status",
      },
      { status: 500 },
    );
  }
}
