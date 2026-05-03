import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email + password sign-in.
 *
 * **Why a Route Handler instead of a Server Action:** Server Actions sometimes
 * race the cookie write against the client's RSC navigation, leaving the
 * dashboard's server component without a session on the first attempt. A
 * native form POST to this handler is bulletproof — Supabase's setAll writes
 * cookies to the response, the 303 redirect ships in the same HTTP response,
 * and the browser follows the redirect with the new cookies attached. No
 * client JS, no race, no two-click bug.
 *
 * Errors are surfaced via `?authError=...` on /login. The auth-form's
 * useEffect picks them up on mount and displays them inline.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const nextRaw = (formData.get("next") as string | null) ?? "/dashboard";
  // Same-origin paths only — guard against open-redirect via ?next=
  const next = nextRaw.startsWith("/") ? nextRaw : "/dashboard";

  if (!email || !password) {
    return redirectWithError(request, "Email and password are required.", next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirectWithError(request, error.message, next);
  }

  // 303 forces the browser to follow with GET (canonical for "POST → redirect").
  // Set-Cookie headers persisted by Supabase's cookie adapter ride along on
  // this response, so the GET to /dashboard is authenticated.
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}

function redirectWithError(request: NextRequest, message: string, next: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("authError", message);
  if (next !== "/dashboard") url.searchParams.set("next", next);
  return NextResponse.redirect(url, { status: 303 });
}
