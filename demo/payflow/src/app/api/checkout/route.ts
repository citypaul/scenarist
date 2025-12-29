import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";
import { checkOfferAvailable, getProductOffer } from "@/lib/inventory";
import { getCurrentUser } from "@/lib/user-service";
import { getShippingOption } from "@/lib/shipping";

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
    const { items, shippingOptionId } = body as {
      items: CartItem[];
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

    // Fetch user tier from User Service (server-side call to backend)
    const userTier = await getCurrentUser()
      .then((userData) => userData.tier)
      .catch(() => "free" as const);

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

    // Get user email from User Service
    const user = await getCurrentUser().catch(() => null);
    const userEmail = user?.email;
    const tierDiscount = TIER_DISCOUNTS[userTier] || 0;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.basePrice * item.quantity,
      0,
    );
    const discountAmount = subtotal * (tierDiscount / 100);
    const afterDiscount = subtotal - discountAmount;
    const shippingCost = shippingOption.price;
    const tax = afterDiscount * 0.1; // 10% tax

    // Calculate line items with discount applied
    const productLineItems = items.map((item) => {
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

    // Add shipping as a line item
    const shippingLineItem = {
      price_data: {
        currency: "usd",
        product_data: {
          name: shippingOption.name,
          description: shippingOption.estimatedDays,
        },
        unit_amount: Math.round(shippingCost * 100), // Stripe uses cents
      },
      quantity: 1,
    };

    const lineItems = [...productLineItems, shippingLineItem];

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
        userId: user?.id || "guest",
        userTier,
        items: JSON.stringify(orderItems),
        subtotal: subtotal.toFixed(2),
        discount: discountAmount.toFixed(2),
        shipping: shippingCost.toFixed(2),
        shippingOption: shippingOption.name,
        tax: tax.toFixed(2),
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    // Only log full error details in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Checkout error:", error);
    }
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
