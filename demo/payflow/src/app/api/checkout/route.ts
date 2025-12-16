import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";
import { auth0 } from "@/lib/auth0";
import { checkStockAvailable, getProductStock } from "@/lib/inventory";

// Cart item from the request
interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
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
    const { items } = body as {
      items: CartItem[];
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Verify stock availability for all items
    const stockChecks = await Promise.all(
      items.map(async (item) => {
        const hasStock = await checkStockAvailable(item.id, item.quantity);
        if (!hasStock) {
          const stock = await getProductStock(item.id);
          return {
            id: item.id,
            name: item.name,
            available: stock?.available ?? 0,
            requested: item.quantity,
          };
        }
        return null;
      }),
    );

    const outOfStockItems = stockChecks.filter(
      (check): check is NonNullable<typeof check> => check !== null,
    );

    if (outOfStockItems.length > 0) {
      return NextResponse.json(
        {
          error: "Some items are out of stock",
          outOfStockItems,
        },
        { status: 409 },
      );
    }

    // Get the user's session (optional - allow guest checkout)
    const session = await auth0.getSession();
    const userEmail = session?.user?.email;
    const userTier = (session?.user?.app_metadata?.tier as string) || "free";
    const tierDiscount = TIER_DISCOUNTS[userTier] || 0;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.basePrice * item.quantity,
      0,
    );
    const discountAmount = subtotal * (tierDiscount / 100);
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.1; // 10% tax

    // Calculate line items with discount applied
    const lineItems = items.map((item) => {
      const discountedPrice = item.basePrice * (1 - tierDiscount / 100);
      const unitAmount = Math.round(discountedPrice * 100); // Stripe uses cents

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: `PayFlow subscription plan`,
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // Prepare order items for metadata (simplified for storage)
    const orderItems = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.basePrice,
    }));

    // Create Stripe checkout session
    const stripe = getStripeServer();
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
      ...(userEmail && { customer_email: userEmail }),
      metadata: {
        userId: session?.user?.sub || "guest",
        userTier,
        items: JSON.stringify(orderItems),
        subtotal: subtotal.toFixed(2),
        discount: discountAmount.toFixed(2),
        tax: tax.toFixed(2),
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
