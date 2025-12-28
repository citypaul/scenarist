import { NextResponse } from "next/server";
import { getShippingOptions } from "@/lib/shipping";

export async function GET() {
  try {
    const options = await getShippingOptions();
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
