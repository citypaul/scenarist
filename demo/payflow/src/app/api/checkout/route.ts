import { NextResponse } from "next/server";
import { processPayment, type PaymentRequest } from "@/lib/payment";
import { getCurrentUser } from "@/lib/user-service";
import { checkOfferAvailable, getProductOffer } from "@/lib/inventory";
import { getShippingOption } from "@/lib/shipping";
import { addOrder } from "@/lib/orders";

// Cart item from the request
interface CartItem {
  readonly id: string;
  readonly name: string;
  readonly basePrice: number;
  readonly quantity: number;
}

// Tier discount percentages
const TIER_DISCOUNTS: Record<string, number> = {
  free: 0,
  basic: 10,
  pro: 20,
  enterprise: 30,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingOptionId } = body as {
      items: readonly CartItem[];
      shippingOptionId: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    if (!shippingOptionId) {
      return NextResponse.json(
        { error: "Shipping option is required" },
        { status: 400 },
      );
    }

    // Fetch user from User Service (server-side call to backend)
    const user = await getCurrentUser().catch(() => ({
      id: "guest",
      email: "guest@payflow.com",
      name: "Guest",
      tier: "free" as const,
    }));

    // Fetch shipping option from Shipping Service (server-side call to backend)
    const shippingOption = await getShippingOption(shippingOptionId);
    if (!shippingOption) {
      return NextResponse.json(
        { error: "Selected shipping option is not available" },
        { status: 400 },
      );
    }

    // Verify promotional offer availability for all items
    const offerChecks = await Promise.all(
      items.map(async (item) => {
        const hasOffer = await checkOfferAvailable(item.id, item.quantity);
        if (!hasOffer) {
          const offer = await getProductOffer(item.id);
          return {
            id: item.id,
            name: item.name,
            available: offer?.available ?? 0,
            requested: item.quantity,
          };
        }
        return null;
      }),
    );

    const unavailableOffers = offerChecks.filter(
      (check): check is NonNullable<typeof check> => check !== null,
    );

    if (unavailableOffers.length > 0) {
      return NextResponse.json(
        {
          error: "Some promotional offers are no longer available",
          unavailableOffers,
        },
        { status: 409 },
      );
    }

    const tierDiscount = TIER_DISCOUNTS[user.tier] || 0;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.basePrice * item.quantity,
      0,
    );
    const discountAmount = subtotal * (tierDiscount / 100);
    const afterDiscount = subtotal - discountAmount;
    const shippingCost = shippingOption.price;
    const tax = afterDiscount * 0.1; // 10% tax
    const total = afterDiscount + shippingCost + tax;

    // Prepare order items
    const orderItems = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.basePrice * (1 - tierDiscount / 100),
    }));

    // Process payment via Payment Service (server-side call to backend)
    const paymentRequest: PaymentRequest = {
      userId: user.id,
      amount: total,
      currency: "usd",
      items: orderItems,
      shippingOption: shippingOption.name,
    };

    const paymentResult = await processPayment(paymentRequest);

    if (paymentResult.status === "failed") {
      return NextResponse.json(
        {
          error: "Payment failed",
          paymentError: paymentResult.error,
          message: paymentResult.message,
        },
        { status: 402 },
      );
    }

    // Create order record
    const order = addOrder({
      userId: user.id,
      userTier: user.tier,
      items: orderItems,
      subtotal,
      discount: discountAmount,
      shipping: shippingCost,
      tax,
      total,
      currency: "usd",
      status: "completed",
      paymentId: paymentResult.id,
      customerEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentId: paymentResult.id,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Checkout error:", error);
    }
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 },
    );
  }
}
