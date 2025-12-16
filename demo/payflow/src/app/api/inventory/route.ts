import { NextResponse } from "next/server";
import { getAllProductStock } from "@/lib/inventory";

export async function GET() {
  try {
    const stock = await getAllProductStock();
    return NextResponse.json(stock);
  } catch (error) {
    console.error("Inventory service error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 503 },
    );
  }
}
