import "server-only";
import type Stripe from "stripe";
import { stripe } from "./client";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";

/**
 * Stripe server-side helpers.
 *
 * Customer model: 1 Supabase user = 1 Stripe customer. The mapping lives in
 * our `Subscription` row (`stripeCustomerId`). On first checkout, we create
 * the Stripe customer; subsequent checkouts (e.g. resubscribing after cancel)
 * reuse it via the subscription record.
 */

/**
 * Find or create a Stripe customer for a TrueKit user. Idempotent on userId.
 * Stores nothing in our DB — that happens via the webhook once a subscription
 * exists, since the `Subscription` model requires a non-null `currentPeriodEnd`.
 */
export async function getOrCreateStripeCustomer(args: {
  userId: string;
  email: string;
}): Promise<Stripe.Customer> {
  // Reuse if a Subscription already exists.
  const existing = await db.subscription.findUnique({
    where: { userId: args.userId },
    select: { stripeCustomerId: true },
  });
  if (existing?.stripeCustomerId) {
    const customer = await stripe().customers.retrieve(existing.stripeCustomerId);
    if (!customer.deleted) return customer;
  }

  // Otherwise look up by email (handles edge cases like Stripe-side dashboard creates).
  const search = await stripe().customers.list({ email: args.email, limit: 1 });
  if (search.data[0]) {
    // Tag the existing customer with our userId so future webhooks resolve correctly.
    return stripe().customers.update(search.data[0].id, {
      metadata: { userId: args.userId },
    });
  }

  return stripe().customers.create({
    email: args.email,
    metadata: { userId: args.userId },
  });
}

/**
 * Create a Subscription Mode Checkout Session for the Pro tier. The hosted
 * Stripe Checkout page handles card collection, taxes (if configured), and
 * returns the user to {successUrl} on payment, {cancelUrl} otherwise.
 *
 * `metadata.userId` is duplicated on both the session AND the subscription
 * so both `checkout.session.completed` and `customer.subscription.created`
 * webhook events have the user reference.
 */
export async function createCheckoutSession(args: {
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const env = serverEnv();
  const customer = await getOrCreateStripeCustomer({
    userId: args.userId,
    email: args.email,
  });

  return stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    client_reference_id: args.userId,
    metadata: { userId: args.userId },
    subscription_data: {
      metadata: { userId: args.userId },
    },
  });
}

/**
 * Open the Stripe-hosted Billing Portal so the user can update their payment
 * method, view invoices, or cancel. Stripe owns the entire UI; we just open it.
 */
export async function createBillingPortalSession(args: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  return stripe().billingPortal.sessions.create({
    customer: args.customerId,
    return_url: args.returnUrl,
  });
}
