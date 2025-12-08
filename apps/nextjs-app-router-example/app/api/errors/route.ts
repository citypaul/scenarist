/**
 * Errors Demo API Route Handler
 *
 * Fetches from external API to demonstrate error boundary behavior.
 * When apiError scenario is active, returns 500 to trigger error.tsx.
 *
 * @see https://github.com/citypaul/scenarist/issues/211
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

export type ErrorsResponse = {
  readonly data: string;
  readonly message: string;
};

export async function GET(request: NextRequest) {
  const response = await fetch("http://localhost:3001/errors", {
    headers: {
      ...getScenaristHeaders(request),
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: response.status },
    );
  }

  const data: ErrorsResponse = await response.json();

  return NextResponse.json(data);
}
