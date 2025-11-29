/**
 * Health Check API Route
 *
 * Simple health check endpoint that returns 200 OK.
 * Used by production tests to verify app is running.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
