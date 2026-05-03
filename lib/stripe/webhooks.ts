import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "./client";

/**
 * Sync handlers for Stripe → Supabase. The webhook route delegates to these by
 * event type. Keep them idempotent: Stripe retries until 2xx.
 */

/**
 * Stripe moved `current_period_end` from Subscription to SubscriptionItem in
 * the 2024-08+ API; the legacy field is still emitted on older API versions.
 * Read either, prefer the new location.
 */
function periodEnd(sub: Stripe.Subscription): Date {
  const item = sub.items.data[0] as (typeof sub.items.data)[number] & {
    current_period_end?: number;
  };
  const ts =
    item?.current_period_end ??
    (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  // Fall back to "now + 30 days" so we never write null — surfaced as a noisy log.
  if (!ts) {
    console.warn("[stripe] no current_period_end on subscription", sub.id);
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  return new Date(ts * 1000);
}

export async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  // Stripe puts the userId we set at checkout in metadata.
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.warn("[stripe] subscription missing userId metadata", sub.id);
    return;
  }

  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) return;

  const currentPeriodEnd = periodEnd(sub);

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  await db.subscription.updateMany({
    where: { userId, stripeSubscriptionId: sub.id },
    data: { status: "canceled", cancelAtPeriodEnd: true },
  });
}

/**
 * Fired when a Checkout Session for a subscription completes.
 *
 * `customer.subscription.created` will also fire (and we handle it in
 * handleSubscriptionUpsert), but checkout.session.completed is the canonical
 * "the user just paid" hook — it's what we'd use to send a welcome email or
 * nudge an analytics event. We also fetch the full subscription here so we
 * can upsert immediately rather than rely on event ordering.
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  if (!userId) {
    console.warn("[stripe] checkout.session.completed missing userId", session.id);
    return;
  }
  if (session.mode !== "subscription" || !session.subscription) return;

  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const sub = await stripe().subscriptions.retrieve(subId);

  // Defensive: ensure metadata.userId is set on the subscription so future
  // subscription.updated events resolve correctly.
  if (!sub.metadata?.userId) {
    await stripe().subscriptions.update(sub.id, {
      metadata: { ...sub.metadata, userId },
    });
    sub.metadata = { ...sub.metadata, userId };
  }

  await handleSubscriptionUpsert(sub);
}
