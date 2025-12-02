/**
 * Loan Review API Route (ADR-0019 State-Aware Mocking)
 *
 * Completes loan review via external API.
 * MSW intercepts and advances workflow state via afterResponse.setState.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const LOAN_API_URL = "https://api.loans.com";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${LOAN_API_URL}/loan/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
          error instanceof Error
            ? error.message
            : "Failed to complete loan review",
      },
      { status: 500 },
    );
  }
}
