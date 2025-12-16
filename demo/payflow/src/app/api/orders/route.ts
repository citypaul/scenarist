import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getOrdersByUserId, getAllOrders } from "@/lib/orders";

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;

    // For demo purposes, if the user is an admin (has enterprise tier),
    // they can see all orders. Otherwise, only their own orders.
    const userTier = (session.user.app_metadata?.tier as string) || "free";
    const orders =
      userTier === "enterprise" ? getAllOrders() : getOrdersByUserId(userId);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
