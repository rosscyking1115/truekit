import type { Subscription } from "@prisma/client";

/**
 * Tier resolution.
 *
 * Pure functions — safe to import from anywhere (server components, client
 * components, tests). They take a Subscription argument; they don't read it.
 *
 * Anything `active` or `trialing` is a paying member. Anything else (canceled,
 * past_due, incomplete, no row at all) is treated as Free.
 *
 * `cancel_at_period_end = true` users are still Pro until period end — only
 * fully canceled subscriptions drop to Free.
 */

export type Tier = "free" | "pro";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function tierFromSubscription(sub: Subscription | null | undefined): Tier {
  if (!sub) return "free";
  return ACTIVE_STATUSES.has(sub.status) ? "pro" : "free";
}

export function isProActive(sub: Subscription | null | undefined): boolean {
  return tierFromSubscription(sub) === "pro";
}
