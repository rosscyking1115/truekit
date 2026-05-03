"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Passwordless one-time-link sign-in.
 *
 * `signInWithOtp` sends an email with a token_hash link. The link routes
 * through /auth/confirm (type=magiclink) which uses verifyOtp — stateless,
 * works across browsers/devices.
 *
 * `shouldCreateUser: false` so the form doesn't silently create a brand-new
 * user from a typo'd address; signup goes through /signup instead.
 *
 * As with /forgot-password, we always show the same success state to avoid
 * leaking whether an email is registered.
 */
export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    setLoading(false);
    if (otpError && otpError.status && otpError.status >= 500) {
      setError("Something went wrong. Try again in a moment.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
        If <strong>{email}</strong> is on TrueKit, a sign-in link is on its way. Check
        your inbox (and spam folder). The link expires in 15 minutes.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading || !email}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Email me a link"}
      </Button>
    </form>
  );
}
