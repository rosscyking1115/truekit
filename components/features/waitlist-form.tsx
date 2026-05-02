"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { Loader2 } from "lucide-react";

/**
 * Pre-launch email capture. Uses the public `waitlist.join` tRPC mutation.
 * Treats the duplicate-email case as success (don't reveal who's already on the list).
 */
export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const join = trpc.waitlist.join.useMutation({
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
        You&apos;re on the list. We&apos;ll be in touch when there&apos;s something
        worth showing you.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email) return;
        join.mutate({ email, source: typeof window !== "undefined" ? window.location.pathname : undefined });
      }}
      className="flex gap-2"
    >
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@somewhere.com"
        aria-label="Email address"
        className="h-11"
      />
      <Button type="submit" size="lg" disabled={join.isPending}>
        {join.isPending ? <Loader2 className="size-4 animate-spin" /> : "Join waitlist"}
      </Button>
    </form>
  );
}
