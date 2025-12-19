import { NextResponse } from "next/server";
import { getAllProductOffers } from "@/lib/inventory";

export async function GET() {
  try {
    const offers = await getAllProductOffers();
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
