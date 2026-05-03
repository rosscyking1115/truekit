import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingActions } from "@/components/features/billing-actions";
import { CheckCircle2, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { tierFromSubscription } from "@/lib/subscription";
import { redirect } from "next/navigation";

/**
 * Billing page.
 *
 * Pro state — this is where subscription management lives. Big detail card
 * (status, renewal/cancel date, plan summary), Manage button to the Stripe
 * portal. No upgrade CTA. The page reflects "you're a member" first.
 *
 * Free state — minimal. A short "Free plan" line, a quiet pitch for Pro
 * with the benefits, and a small Subscribe button at the bottom. Soft, not
 * pushy: the brand promise is trust, not conversion-funnel pressure.
 */
const PRO_BENEFITS = [
  "Unlimited AI Gear Advisor sessions (Phase 2)",
  "Full side-by-side comparisons with verdicts",
  "Trip-based gear gap analysis",
  "Unlimited saved gear lists & wishlists",
  "Priority access to new gear coverage",
];

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sub = await db.subscription.findUnique({ where: { userId: user.id } });
  const tier = tierFromSubscription(sub);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tier === "pro"
            ? "Thanks for backing TrueKit — keeping the lights on without affiliate links."
            : "Manage your TrueKit plan."}
        </p>
      </div>

      {tier === "pro" ? <ProState sub={sub!} /> : <FreeState />}
    </div>
  );
}

function ProState({
  sub,
}: {
  sub: NonNullable<Awaited<ReturnType<typeof db.subscription.findUnique>>>;
}) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  });
  const renewalLabel = sub.cancelAtPeriodEnd ? "Cancels" : "Renews";
  const renewalDate = fmt.format(sub.currentPeriodEnd);

  return (
    <div className="space-y-4">
      <Card className="border-primary/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-4 text-primary" />
                TrueKit Pro
              </CardTitle>
              <CardDescription className="mt-1">
                £10 / month · You&apos;re a member
              </CardDescription>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </dt>
              <dd className="mt-0.5 font-medium capitalize">
                {sub.status}
                {sub.cancelAtPeriodEnd && " (cancellation pending)"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {renewalLabel}
              </dt>
              <dd className="mt-0.5 font-medium">{renewalDate}</dd>
            </div>
          </dl>

          {sub.cancelAtPeriodEnd && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Your subscription is set to cancel at the end of the current period. You&apos;ll
              keep Pro access until then. Open Manage subscription to change your mind.
            </div>
          )}

          <BillingActions tier="pro" hasCustomer />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Update payment method, view invoices, or cancel — everything is in the
        Stripe-hosted portal. We don&apos;t store your card details ourselves.
      </p>
    </div>
  );
}

function FreeState() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Free plan</CardTitle>
            <Badge variant="muted">Current plan</Badge>
          </div>
          <CardDescription>
            You haven&apos;t subscribed. Nothing to manage here yet.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="size-4 text-primary" />
            What you get with Pro
          </CardTitle>
          <CardDescription>£10 / month, cancel anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {PRO_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Members fund the project — no affiliate links anywhere.
            </p>
            <BillingActions tier="free" hasCustomer={false} compact />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
