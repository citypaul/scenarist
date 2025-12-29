import { NextResponse } from "next/server";
import { getOrdersByUserId, getAllOrders } from "@/lib/orders";
import { getCurrentUser } from "@/lib/user-service";

export async function GET() {
  try {
    const user = await getCurrentUser();

    // For demo purposes, if the user is an admin (has enterprise tier),
    // they can see all orders. Otherwise, only their own orders.
    const orders =
      user.tier === "enterprise" ? getAllOrders() : getOrdersByUserId(user.id);

    return NextResponse.json({ orders });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error fetching orders:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
