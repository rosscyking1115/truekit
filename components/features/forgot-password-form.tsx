"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Step 1 of password reset. Sends a recovery email via Supabase.
 *
 * The email template is configured to point at /auth/confirm via
 * {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
 * — that route uses Supabase's verifyOtp (stateless) so the link works
 * even if the user opens it in a different browser, device, or via Gmail's
 * link wrapper.
 *
 * Always shows the same "check your email" success state — even on errors —
 * to avoid leaking whether an email is registered.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // `redirectTo` is only used as a fallback if the email template hasn't
    // been updated to use the explicit token_hash URL. Once you've updated
    // the Supabase "Reset password" template body to point at /auth/confirm,
    // this URL is effectively ignored.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });

    setLoading(false);
    if (resetError && resetError.status && resetError.status >= 500) {
      setError("Something went wrong. Try again in a moment.");
      return;
    }
    // Always show success — don't leak which addresses are registered.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
        If <strong>{email}</strong> is on TrueKit, a reset link is on its way. Check
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
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
      </Button>
    </form>
  );
}
