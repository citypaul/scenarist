import { NextRequest, NextResponse } from "next/server";
import { getAllProductOffers } from "@/lib/inventory";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

export async function GET(request: NextRequest) {
  try {
    // Propagate Scenarist headers to backend calls for test isolation
    const scenaristHeaders = getScenaristHeaders(request);
    const offers = await getAllProductOffers(scenaristHeaders);
    return NextResponse.json(offers);
  } catch (error) {
    // Only log full error details in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Inventory service error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch promotional offers" },
      { status: 503 },
    );
  }
}
