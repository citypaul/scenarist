/**
 * Payment Submit API Route - Phase 8.5 Sequences Demo
 *
 * Proxies payment requests to json-server (localhost:3001)
 * where MSW intercepts them.
 *
 * Demonstrates repeat: 'none' - sequence allows 3 attempts,
 * then exhausts and falls through to rate limit error (429).
 */

import { NextResponse } from "next/server";

import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

type PaymentRequest = {
  readonly amount: number;
};

type PaymentResponse = {
  readonly id: string;
  readonly status: string;
};

type PaymentErrorResponse = {
  readonly error: {
    readonly message: string;
  };
};

export async function POST(request: Request) {
  try {
    const body: PaymentRequest = await request.json();

    // Proxy to json-server (MSW will intercept on server-side)
    const response = await fetch("http://localhost:3001/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(request), // ✅ Pass test ID to MSW
      },
      body: JSON.stringify(body),
    });

    // Return error responses with appropriate status codes
    if (!response.ok) {
      const errorData: PaymentErrorResponse = await response.json();
      return NextResponse.json(errorData, {
        status: response.status,
      });
    }

    const successData: PaymentResponse = await response.json();
    return NextResponse.json(successData);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to submit payment",
        },
      },
      { status: 500 },
    );
  }
}
