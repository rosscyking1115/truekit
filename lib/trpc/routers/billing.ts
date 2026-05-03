import { router, protectedProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import {
  createCheckoutSession,
  createBillingPortalSession,
} from "@/lib/stripe/server";
import { tierFromSubscription } from "@/lib/subscription";
import { publicEnv } from "@/lib/env";

/**
 * Billing operations. All protected — must be signed in to subscribe or manage.
 *
 * Flow:
 *   client calls startCheckout → redirect to returned URL → user pays on Stripe
 *   Stripe webhook upserts the Subscription row → status() reflects "pro"
 *   client calls openPortal → redirect to returned URL → user manages billing
 */
export const billingRouter = router({
  /** Snapshot of the user's billing state for the dashboard / billing page. */
  status: protectedProcedure.query(async ({ ctx }) => {
    const sub = await ctx.db.subscription.findUnique({
      where: { userId: ctx.user.id },
    });
    return {
      tier: tierFromSubscription(sub),
      status: sub?.status ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      hasCustomer: !!sub?.stripeCustomerId,
    };
  }),

  /** Create a Stripe Checkout Session for the Pro tier; client redirects to .url. */
  startCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Sign in with an email address to subscribe.",
      });
    }

    // Block double-subscribe. Without this check a user could click Subscribe
    // twice (race) or hit /billing while the webhook hasn't synced and end up
    // with two Stripe subscriptions billing them every month.
    const existing = await ctx.db.subscription.findUnique({
      where: { userId: ctx.user.id },
      select: { status: true, cancelAtPeriodEnd: true },
    });
    if (
      existing &&
      (existing.status === "active" || existing.status === "trialing") &&
      !existing.cancelAtPeriodEnd
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "You're already a Pro member. Use Manage subscription to update billing.",
      });
    }

    const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const session = await createCheckoutSession({
      userId: ctx.user.id,
      email: ctx.user.email,
      successUrl: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/billing/canceled`,
    });

    if (!session.url) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe didn't return a checkout URL.",
      });
    }
    return { url: session.url };
  }),

  /** Open the Stripe Billing Portal — only meaningful once the user has a customer record. */
  openPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const sub = await ctx.db.subscription.findUnique({
      where: { userId: ctx.user.id },
      select: { stripeCustomerId: true },
    });

    if (!sub?.stripeCustomerId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No Stripe customer yet. Subscribe first.",
      });
    }

    const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const portal = await createBillingPortalSession({
      customerId: sub.stripeCustomerId,
      returnUrl: `${base}/billing`,
    });
    return { url: portal.url };
  }),
});
