"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
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
 * **Sign-in:** uses a NATIVE form POST to /api/auth/signin. Browser submits,
 * Route Handler does signInWithPassword + 303 redirect with Set-Cookie in the
 * same response. No client JS in the critical path → no cookie/redirect race.
 * Errors come back via ?authError=… in the URL.
 *
 * **Sign-up:** stays client-side. Different flow shape (resend confirmation,
 * "check your email" pending state) and there's no cookie race because
 * email confirmation is handled stateless via /auth/confirm.
 *
 * **Google OAuth:** client-side signInWithOAuth → /auth/callback (PKCE).
 */
const GOOGLE_ENABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Initial error comes from ?authError=… in the URL (set by /auth/callback,
  // /auth/confirm, or /api/auth/signin on a failed attempt). Using a lazy
  // initializer instead of useEffect+setState avoids the cascading-render
  // pattern that React 19 lints against.
  const [error, setError] = useState<string | null>(() => search.get("authError"));
  // After signup, Supabase returns even though email isn't confirmed yet.
  // Track that so we can show the "check your email" + Resend state.
  const [signupPendingEmail, setSignupPendingEmail] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (authError) setError(authError.message);
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

      {mode === "signin" ? (
        <SignInForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          next={next}
          error={error}
        />
      ) : (
        <SignUpForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          next={next}
          error={error}
          setError={setError}
          onSignupSent={() => setSignupPendingEmail(email)}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sign-in: native form POST to /api/auth/signin                             */
/* ────────────────────────────────────────────────────────────────────────── */

function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  next,
  error,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (fn: (v: boolean) => boolean) => void;
  next: string;
  error: string | null;
}) {
  return (
    <form action="/api/auth/signin" method="POST" className="space-y-3">
      {/* The Route Handler reads `next` from the form body, not the URL,
          so it survives client-side state. */}
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
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
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          visible={showPassword}
          onToggleVisible={() => setShowPassword((v) => !v)}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <SubmitButton label="Sign in" />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  // useFormStatus reads the parent <form>'s pending state — no JS state
  // duplicated, no race against navigation.
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : label}
    </Button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sign-up: client-side (different flow shape, no cookie race)               */
/* ────────────────────────────────────────────────────────────────────────── */

function SignUpForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  next,
  error,
  setError,
  onSignupSent,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (fn: (v: boolean) => boolean) => void;
  next: string;
  error: string | null;
  setError: (v: string | null) => void;
  onSignupSent: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const passwordCheck = useMemo(() => validatePassword(password), [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordCheck.ok) {
      setError("Password doesn't meet the requirements below.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
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
      window.location.href = next;
      return;
    }
    onSignupSent();
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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          visible={showPassword}
          onToggleVisible={() => setShowPassword((v) => !v)}
        />
        <PasswordRulesList password={password} />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !passwordCheck.ok}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Shared subcomponents                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * "Check your email" state shown after a successful signup with email
 * confirmation enabled. Resend button has a 30-second cooldown.
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
    setCooldown(30);
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
