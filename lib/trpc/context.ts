import "server-only";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * tRPC request context. One instance per request. Holds:
 *  - Supabase client (for auth)
 *  - the current user (if signed in)
 *  - Prisma db handle
 *
 * Procedures should pull data via `ctx.db` and gate via `ctx.user`.
 */
export async function createContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    db,
    supabase,
    user, // null when unauthenticated
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
