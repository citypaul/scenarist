import { NextResponse } from "next/server";
import { getStripeServer, PRICE_IDS } from "@/lib/stripe";
import { auth0 } from "@/lib/auth0";

export async function POST(request: Request) {
  try {
    // Get the user's session
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, productId } = body;

    // Validate the price ID
    const validPriceIds = Object.values(PRICE_IDS);
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Get user tier from session for potential discounts
    const userTier = session.user.app_metadata?.tier || "free";

    // Create Stripe checkout session
    const stripe = getStripeServer();
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.sub,
        userTier,
        productId,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
