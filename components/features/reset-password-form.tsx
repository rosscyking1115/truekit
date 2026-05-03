"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES, validatePassword } from "@/lib/password";

/**
 * Step 2 of password reset. Assumes a temporary session from the recovery
 * link callback. If there's no session, send the user back to /forgot-password
 * — they probably hit an expired or already-used link.
 */
export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Verify the recovery-link session arrived.
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setHasSession(!!data.session);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const check = useMemo(() => validatePassword(password), [password]);
  const matches = password.length > 0 && password === confirm;
  const valid = check.ok && matches;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }
    // Hard navigation: ensures the post-update session cookie is fully written
    // before the dashboard server component reads it.
    window.location.href = "/dashboard";
  }

  if (hasSession === false) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          This reset link has expired or already been used. Request a new one.
        </div>
        <Button asChild className="w-full">
          <a href="/forgot-password">Request a new link</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <ul className="mt-1 space-y-1 text-xs">
          {PASSWORD_RULES.map((r) => {
            const passed = r.test(password);
            const Icon = passed ? Check : X;
            return (
              <li
                key={r.id}
                className={cn(
                  "flex items-center gap-1.5",
                  password.length === 0
                    ? "text-muted-foreground"
                    : passed
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{r.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {confirm.length > 0 && !matches && (
          <p className="text-xs text-destructive">Passwords don&apos;t match.</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!valid || loading || hasSession === null}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
      </Button>
    </form>
  );
}
