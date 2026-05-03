"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server Action sign-in.
 *
 * Why this exists: signing in from a Client Component races the cookie write
 * against the navigation. The browser navigates before the cookie is fully
 * persisted; the destination's server component reads no session and bounces
 * back to /login, requiring a second click. Server Actions sidestep this by
 * doing auth + redirect in a single HTTP response — the Set-Cookie and the
 * 302 ship together, so when the browser follows the redirect the cookie is
 * already there.
 *
 * Returns `{ error }` on auth failure. On success it doesn't return — the
 * `redirect()` call throws a special Next.js error that Next handles by
 * issuing a 302 with the cookies set during this request.
 */
export async function signInAction(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Same-origin path only — defence against open-redirect via the `next` param.
  const dest =
    input.next && input.next.startsWith("/") ? input.next : "/dashboard";
  redirect(dest);
}
