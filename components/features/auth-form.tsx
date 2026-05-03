"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES, validatePassword } from "@/lib/password";

/**
 * Email + password auth form.
 *
 * Google OAuth flow:
 *   1. signInWithOAuth redirects to Google with redirectTo=/auth/callback
 *   2. Google sends user back to /auth/callback?code=…
 *   3. The callback route swaps the code for a session and routes onward.
 *
 * Set NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true once the provider is configured
 * in Google Cloud Console + Supabase to surface the button.
 */
const GOOGLE_ENABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // After signup, Supabase returns even though email isn't confirmed yet.
  // Track that so we can show the "check your email" + Resend state.
  const [signupPendingEmail, setSignupPendingEmail] = useState<string | null>(null);

  // Surface OAuth callback errors from the URL on mount.
  useEffect(() => {
    const callbackErr = search.get("authError");
    if (callbackErr) setError(callbackErr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passwordCheck = useMemo(() => validatePassword(password), [password]);
  const passwordValidForSignup = mode !== "signup" || passwordCheck.ok;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && !passwordCheck.ok) {
      setError("Password doesn't meet the requirements below.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    // Signup branch
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email-confirm links are stateless OTP — handled at /auth/confirm,
        // not the OAuth-style /auth/callback (which requires PKCE cookie).
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
          next
        )}`,
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // If email confirmation is OFF, Supabase returns a session immediately.
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    // Otherwise we wait — show pending state so the user can resend if needed.
    setSignupPendingEmail(email);
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  if (signupPendingEmail) {
    return (
      <SignupPendingState
        email={signupPendingEmail}
        onUseDifferentEmail={() => {
          setSignupPendingEmail(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {GOOGLE_ENABLED && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoogle}
            disabled={loading}
          >
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
        </>
      )}

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "signup" ? 8 : undefined}
            required
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
          />
          {mode === "signup" && (
            <PasswordRulesList password={password} />
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !passwordValidForSignup}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : mode === "signin" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </div>
  );
}

/**
 * "Check your email" state shown after a successful signup with email
 * confirmation enabled. Includes a resend button with a 30-second cooldown
 * so users can request a fresh link if the first never arrived (or the link
 * expired during the 15-minute window).
 *
 * Resending invalidates the previous link — Supabase rotates the token on
 * each `auth.resend({ type: 'signup' })` call.
 */
function SignupPendingState({
  email,
  onUseDifferentEmail,
}: {
  email: string;
  onUseDifferentEmail: () => void;
}) {
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resentAt, setResentAt] = useState<number | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    setResending(true);
    setResendError(null);
    const supabase = createClient();
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setResending(false);
    if (resendErr) {
      setResendError(resendErr.message);
      return;
    }
    setResentAt(Date.now());
    setCooldown(30); // throttle to keep Supabase happy and reduce abuse
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">Check your inbox</p>
        <p className="mt-1 text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>. The link expires in
          15 minutes — click it to finish creating your account.
        </p>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={resend}
          disabled={resending || cooldown > 0}
        >
          {resending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : resentAt ? (
            "Send another link"
          ) : (
            "Didn't get it? Resend"
          )}
        </Button>
        {resentAt && cooldown > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            New link sent — the previous one no longer works.
          </p>
        )}
        {resendError && (
          <p className="text-xs text-destructive" role="alert">
            {resendError}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onUseDifferentEmail}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Use a different email
      </button>
    </div>
  );
}

/**
 * Live checklist showing which password rules pass / fail as the user types.
 * Stays muted-grey until the user starts typing so it doesn't shout red on first paint.
 */
function PasswordRulesList({ password }: { password: string }) {
  const touched = password.length > 0;
  return (
    <ul className="mt-1 space-y-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        const Icon = passed ? Check : X;
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5",
              !touched
                ? "text-muted-foreground"
                : passed
                  ? "text-primary"
                  : "text-muted-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-3.5 shrink-0",
                touched && !passed && "text-muted-foreground/60"
              )}
            />
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Password field with a visibility toggle. Built inline to avoid pulling in
 * another shadcn component for one use site.
 */
function PasswordInput({
  visible,
  onToggleVisible,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
