"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { Loader2 } from "lucide-react";
import type { Tier } from "@/lib/subscription";

/**
 * Subscribe / Manage buttons.
 *
 * - tier = "pro":              "Manage subscription" → Stripe Billing Portal
 * - tier = "free":             "Subscribe to Pro"   → Stripe Checkout
 *   `compact` shrinks the button so the upgrade CTA can be soft instead of
 *   hero-sized. Used on the free /billing card and the dashboard nudge.
 *
 * All redirects use window.location.href because Stripe-hosted pages need
 * a full navigation, not a client-side route push.
 */
export function BillingActions({
  tier,
  hasCustomer,
  compact = false,
}: {
  tier: Tier;
  hasCustomer: boolean;
  compact?: boolean;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = trpc.billing.startCheckout.useMutation({
    onSuccess: ({ url }) => {
      setRedirecting(true);
      window.location.href = url;
    },
    onError: (err) => setError(err.message),
  });
  const openPortal = trpc.billing.openPortal.useMutation({
    onSuccess: ({ url }) => {
      setRedirecting(true);
      window.location.href = url;
    },
    onError: (err) => setError(err.message),
  });

  const busy = redirecting || startCheckout.isPending || openPortal.isPending;
  const size = compact ? "sm" : "default";

  if (tier === "pro") {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button onClick={() => openPortal.mutate()} disabled={busy} size={size}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Manage subscription"}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button onClick={() => startCheckout.mutate()} disabled={busy} size={size}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : hasCustomer ? (
            "Resubscribe"
          ) : (
            "Subscribe to Pro"
          )}
        </Button>
        {hasCustomer && !compact && (
          <Button
            variant="outline"
            onClick={() => openPortal.mutate()}
            disabled={busy}
            size={size}
          >
            View past invoices
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
