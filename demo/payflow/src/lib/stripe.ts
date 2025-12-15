import Stripe from "stripe";
import { loadStripe, type Stripe as StripeJS } from "@stripe/stripe-js";

// Server-side Stripe client (lazy initialization)
// Uses STRIPE_SECRET_KEY environment variable
let stripeClient: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeClient;
}

// Client-side Stripe promise (singleton)
let stripePromise: Promise<StripeJS | null> | null = null;

export function getStripe(): Promise<StripeJS | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

// Product IDs - these should match your Stripe Dashboard products
export const PRODUCT_IDS = {
  basic: "prod_basic", // Replace with actual Stripe product ID
  pro: "prod_pro", // Replace with actual Stripe product ID
  enterprise: "prod_enterprise", // Replace with actual Stripe product ID
} as const;

// Price IDs - these should match your Stripe Dashboard prices
export const PRICE_IDS = {
  basic: "price_basic", // Replace with actual Stripe price ID
  pro: "price_pro", // Replace with actual Stripe price ID
  enterprise: "price_enterprise", // Replace with actual Stripe price ID
} as const;
