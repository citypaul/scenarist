/**
 * Loan Submit API Route (ADR-0019 State-Aware Mocking)
 *
 * Submits loan application to external API.
 * MSW intercepts and advances workflow state via afterResponse.setState.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const LOAN_API_URL = "https://api.loans.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "Invalid request", message: "Valid amount is required" },
        { status: 400 },
      );
    }

    const response = await fetch(`${LOAN_API_URL}/loan/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(request),
      },
      body: JSON.stringify({ amount: body.amount }),
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
          error instanceof Error
            ? error.message
            : "Failed to submit loan application",
      },
      { status: 500 },
    );
  }
}
