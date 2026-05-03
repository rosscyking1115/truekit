import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Auth gate for the (dashboard) route group + any other private surface.
 * Anything matched by `config.matcher` runs through here.
 *
 * - Refreshes the Supabase session on every request (`updateSession` is what
 *   actually keeps users signed in across page loads).
 * - Redirects unauthenticated users away from protected routes.
 * - Redirects already-signed-in users away from /login + /signup.
 *
 * Next 16 renamed `middleware.ts` to `proxy.ts`. The API surface is identical
 * to the old middleware (NextRequest in, response out, matcher config). The
 * difference is purely the file/function name and the runtime (Node, not Edge).
 */
const PROTECTED_PREFIXES = ["/dashboard", "/gear-locker", "/advisor", "/compare", "/community", "/billing", "/account"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPage = AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Skip Next internals + static assets. Run on everything else.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
