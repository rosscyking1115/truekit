"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Email change request.
 *
 * supabase.auth.updateUser({ email }) starts the flow. Supabase sends a
 * confirmation link to the *new* address (and, with Secure Email Change
 * enabled, also to the current address). Each link routes through
 * /auth/confirm with type=email_change.
 *
 * The user stays signed in throughout; the email field on the user record
 * doesn't change until both confirmations land.
 */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [next, setNext] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSame = next.trim().toLowerCase() === currentEmail.toLowerCase();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSame) {
      setError("That's already your email.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser(
      { email: next },
      {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/account`,
      }
    );

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
        Confirmation links sent. To finish the change, click the link in
        <strong> {next}</strong>
        {" "}— and (if Secure Email Change is on) the link sent to <strong>{currentEmail}</strong>.
        Both links expire in 15 minutes.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="new-email">New email</Label>
        <Input
          id="new-email"
          type="email"
          autoComplete="email"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading || !next || isSame}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Send confirmation link"}
      </Button>
    </form>
  );
}
