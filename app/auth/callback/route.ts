import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler.
 *
 * Supabase social-login flow:
 *   1. signInWithOAuth on the client redirects the user to Google
 *   2. Google sends them back here with `?code=...` once they consent
 *   3. We swap that code for a session cookie via exchangeCodeForSession
 *   4. Redirect to `?next=` or /dashboard
 *
 * Errors come back as `?error=` and `?error_description=` — bounce to /login
 * with a query param so the form can show a useful message.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";
  const error = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  if (error) {
    const redirect = new URL("/login", url.origin);
    redirect.searchParams.set("authError", errorDesc || error);
    return NextResponse.redirect(redirect);
  }

  if (!code) {
    const redirect = new URL("/login", url.origin);
    redirect.searchParams.set("authError", "Missing authorization code from provider.");
    return NextResponse.redirect(redirect);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const redirect = new URL("/login", url.origin);
    redirect.searchParams.set("authError", exchangeError.message);
    return NextResponse.redirect(redirect);
  }

  // next must be a same-origin path to avoid open-redirect bugs.
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
