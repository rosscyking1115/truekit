import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

/**
 * Landing page after a successful Stripe Checkout.
 *
 * Stripe redirects here with `?session_id={CHECKOUT_SESSION_ID}`. We don't
 * actually need to read it: the webhook will have synced the Subscription
 * row by the time the user hits this page (or shortly after). The /billing
 * page itself reads the source-of-truth status.
 */
export default function BillingSuccessPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <CheckCircle2 className="size-12 text-primary" />
      <h1 className="text-2xl font-semibold tracking-tight">You&apos;re a TrueKit member.</h1>
      <p className="text-sm text-muted-foreground">
        Thanks for backing the project. Honest gear intelligence, no affiliate spin —
        you&apos;re what makes that possible.
      </p>
      <p className="text-xs text-muted-foreground">
        It can take a few seconds for the new plan to show up everywhere.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/billing">View billing</Link>
        </Button>
      </div>
    </div>
  );
}
