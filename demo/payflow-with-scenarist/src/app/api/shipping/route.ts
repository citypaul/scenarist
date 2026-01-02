import { NextRequest, NextResponse } from "next/server";
import { getShippingOptions } from "@/lib/shipping";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

export async function GET(request: NextRequest) {
  try {
    // Propagate Scenarist headers to backend calls for test isolation
    const scenaristHeaders = getScenaristHeaders(request);
    const options = await getShippingOptions(scenaristHeaders);
    return NextResponse.json(options);
  } catch (error) {
    // Only log full error details in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Shipping service error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch shipping options" },
      { status: 503 },
    );
  }
}
