import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { tierFromSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sub = await db.subscription.findUnique({ where: { userId: user.id } });
  const tier = tierFromSubscription(sub);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Your gear, your trips, your verdicts — all in one place.
        </p>
      </div>

      {tier === "free" && <UpgradeNudge />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gear Locker</CardTitle>
            <CardDescription>Track what you own and what you want.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once you add gear, your Advisor sessions stop suggesting things you already have.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advisor</CardTitle>
            <CardDescription>Coming soon — Phase 2.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tell the AI Advisor about a trip and get a precise gear list with reasoning.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compare</CardTitle>
            <CardDescription>Side-by-side specs, no affiliate spin.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pick two products, see specs and verdicts from people who actually use them.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Quiet upgrade card. Mid-page so it's noticeable but not in the user's face;
 * outline + soft language; clearly opt-in. Hidden entirely for Pro members.
 */
function UpgradeNudge() {
  return (
    <Link
      href="/billing"
      className="group block rounded-lg border border-dashed bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-center gap-3 text-sm">
        <Sparkles className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Want more?</p>
          <p className="text-xs text-muted-foreground">
            TrueKit Pro unlocks the Advisor, full comparisons, gap analysis. £10 / month.
          </p>
        </div>
        <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
          See what&apos;s included →
        </span>
      </div>
    </Link>
  );
}
