import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { serverEnv } from "@/lib/env";
import {
  handleSubscriptionUpsert,
  handleSubscriptionDeleted,
  handleCheckoutCompleted,
} from "@/lib/stripe/webhooks";

/**
 * Stripe webhook entrypoint.
 *
 * Local dev: run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 * and copy the printed signing secret into STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });

  const env = serverEnv();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new NextResponse(`signature verification failed: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.trial_will_end":
        await handleSubscriptionUpsert(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        // Unhandled events are fine — Stripe sends a lot we don't care about.
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] handler failed", event.type, err);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
