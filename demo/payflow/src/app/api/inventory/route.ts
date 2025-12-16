import { NextResponse } from "next/server";
import { getAllProductOffers } from "@/lib/inventory";

export async function GET() {
  try {
    const offers = await getAllProductOffers();
    return NextResponse.json(offers);
  } catch (error) {
    console.error("Inventory service error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotional offers" },
      { status: 503 },
    );
  }
}
