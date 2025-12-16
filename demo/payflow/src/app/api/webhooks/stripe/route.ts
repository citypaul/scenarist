import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";
import { createOrder, type Order, type OrderItem } from "@/lib/orders";
import Stripe from "stripe";

// Disable body parsing - we need the raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Checkout session expired: ${session.id}`);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment succeeded: ${paymentIntent.id}`);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed: ${paymentIntent.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing completed checkout:", {
    sessionId: session.id,
    customerEmail: session.customer_email,
    amountTotal: session.amount_total,
    metadata: session.metadata,
  });

  // Parse items from metadata
  let items: OrderItem[] = [];
  if (session.metadata?.items) {
    try {
      items = JSON.parse(session.metadata.items);
    } catch {
      console.error("Failed to parse items from metadata");
    }
  }

  // Calculate order totals from metadata or derive from amount
  const subtotal = session.metadata?.subtotal
    ? parseFloat(session.metadata.subtotal)
    : (session.amount_total || 0) / 100;
  const discount = session.metadata?.discount
    ? parseFloat(session.metadata.discount)
    : 0;
  const tax = session.metadata?.tax ? parseFloat(session.metadata.tax) : 0;

  const order: Order = {
    id: `order_${Date.now()}`,
    sessionId: session.id,
    customerEmail: session.customer_email,
    userId: session.metadata?.userId || "guest",
    userTier: session.metadata?.userTier || "free",
    items,
    subtotal,
    discount,
    tax,
    total: (session.amount_total || 0) / 100,
    currency: session.currency || "usd",
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  // Store the order
  createOrder(order);
  console.log("Order created and stored:", order);

  // TODO: In Stage 2, integrate with SendGrid for email notifications
}
