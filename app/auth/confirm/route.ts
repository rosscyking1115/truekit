import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Email-link verification handler (token_hash flow).
 *
 * Used for: signup confirmation, magic links, password recovery, email change.
 * This flow is **stateless** — no PKCE code_verifier cookie needed — so it
 * works even when the user clicks the email link in a different browser,
 * device, or via Gmail's redirect wrapper.
 *
 * Email templates point here with `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...&next=/wherever`.
 *
 * `next` defaults are sensible per type (e.g. recovery → /reset-password).
 *
 * Note: /auth/callback (PKCE code flow) is still used for OAuth (Google) since
 * those require the verifier round-trip.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const explicitNext = url.searchParams.get("next");

  // Default destination per email OTP type. SMS/phone types live in
  // PhoneOtpType (a sibling union) and aren't handled by this email-only route.
  const defaultsByType: Record<EmailOtpType | "default", string> = {
    signup: "/dashboard",
    invite: "/dashboard",
    magiclink: "/dashboard",
    recovery: "/reset-password",
    email_change: "/dashboard",
    email: "/dashboard",
    default: "/dashboard",
  };
  const next = explicitNext || defaultsByType[type ?? "default"] || "/dashboard";

  if (!token_hash || !type) {
    const fail = new URL("/login", url.origin);
    fail.searchParams.set("authError", "Invalid or incomplete confirmation link.");
    return NextResponse.redirect(fail);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    const fail = new URL("/login", url.origin);
    fail.searchParams.set(
      "authError",
      // Most common: "Email link is invalid or has expired"
      error.message
    );
    return NextResponse.redirect(fail);
  }

  // next must be a same-origin path to avoid open-redirect bugs.
  const safe = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safe, url.origin));
}
